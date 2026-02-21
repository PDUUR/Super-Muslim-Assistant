/**
 * ============================================================
 * AUTH STORE - Firebase Edition
 * ============================================================
 * Menggantikan authStore lama yang menggunakan Supabase.
 * Sekarang menggunakan Firebase Auth & Firestore.
 * 
 * Fitur:
 * - Login / Register / Logout via Firebase Auth
 * - Profile sync dengan collection 'users' di Firestore
 * - Offline Persistence otomatis
 * ============================================================
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// FIREBASE IMPORTS
import { auth, db } from '@/firebase/config'
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged
} from 'firebase/auth'
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    onSnapshot,
    serverTimestamp
} from 'firebase/firestore'



export const useAuthStore = defineStore('auth', () => {
    // ===== STATE =====
    const user = ref(null)         // Firebase User object
    const profile = ref(null)      // Firestore 'users' document
    const isLoading = ref(false)
    const error = ref(null)
    const isInitialized = ref(false)

    // Listener unsubscribe function
    let unsubscribeProfile = null

    // ===== COMPUTED =====
    const isAuthenticated = computed(() => !!user.value)
    const userProfile = computed(() => profile.value)
    const isAdmin = computed(() => profile.value?.role === 'admin')
    const userId = computed(() => user.value?.uid || null)

    // ===== INTERNAL: Fetch Profile (Firestore) =====
    const fetchProfile = async (uid) => {
        // console.log('[Auth] 📡 Fetching profile for uid:', uid)

        try {
            const docRef = doc(db, "users", uid)
            const docSnap = await getDoc(docRef)

            if (docSnap.exists()) {
                // console.log('[Auth] ✅ Profile loaded:', docSnap.data())
                return docSnap.data()
            } else {
                console.log('[Auth] ❌ No such profile!')
                return null
            }
        } catch (err) {
            console.error('[Auth] Error fetching profile:', err)
            return null
        }


    }

    // ===== ACTIONS =====

    /**
     * Initialize Store with Firebase
     */
    const initialize = () => {
        if (isInitialized.value) return
        isLoading.value = true

        // Listen for Auth State Changes
        onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                user.value = currentUser

                // Realtime Listener untuk Profile (Firestore)
                // Ini menggantikan fetch manual & polling
                if (unsubscribeProfile) unsubscribeProfile()

                const docRef = doc(db, "users", currentUser.uid)
                unsubscribeProfile = onSnapshot(docRef, (doc) => {
                    if (doc.exists()) {
                        const data = doc.data()

                        // CEK STATUS BLOKIR / HAPUS
                        if (data.is_blocked || data.deleted_at) {
                            console.warn('[Auth] 🚫 Akses ditolak: User diblokir atau dihapus.')
                            error.value = data.is_blocked ? 'Akun Anda telah ditangguhkan.' : 'Akun Anda telah dihapus.'
                            logout() // Tendang keluar jika status berubah jadi blocked/deleted
                            return
                        }

                        profile.value = data

                        // SELF-HEALING SYNC: Jika Profile di Firestore belum punya kota, 
                        // tapi di LocalStorage ada, lakukan sinkronisasi otomatis.
                        const localCityId = localStorage.getItem('sm_city_id')
                        const localCityName = localStorage.getItem('sm_city_name')

                        if (!data.city_id && localCityId) {
                            console.log('[Auth] 🔄 Auto-syncing local city to Firestore profile...')
                            updateProfile({
                                city_id: localCityId,
                                city_name: localCityName
                            })
                        }

                        // Cache handling
                        localStorage.setItem('auth_profile_cache', JSON.stringify(profile.value))
                    }
                })

            } else {
                user.value = null
                profile.value = null
                if (unsubscribeProfile) unsubscribeProfile()
                localStorage.removeItem('auth_profile_cache')
            }

            isLoading.value = false
            isInitialized.value = true
        })


    }

    /**
     * Login dengan Email + Password (Firebase)
     */
    const login = async (credentials) => {
        isLoading.value = true
        error.value = null

        try {
            const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password)
            const firebaseUser = userCredential.user

            // Fetch profile sekali untuk cek status sebelum membiarkan masuk
            const profileData = await fetchProfile(firebaseUser.uid)

            if (profileData && (profileData.is_blocked || profileData.deleted_at)) {
                await signOut(auth) // Segera sign out jika status tidak valid
                error.value = profileData.is_blocked ? 'Akun Anda ditangguhkan oleh Admin.' : 'Akun ini tidak lagi aktif.'
                throw new Error(error.value)
            }

            user.value = firebaseUser
            return { status: 'success', user: user.value }

        } catch (err) {
            console.error('[Auth] Login error:', err)
            error.value = err.message || 'Gagal login.'
            throw err
        } finally {
            isLoading.value = false
        }


    }

    /**
     * Register User Baru (Firebase)
     */
    const register = async (userData) => {
        isLoading.value = true
        error.value = null

        try {
            // 1. Create User di Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)
            const newUser = userCredential.user
            user.value = newUser

            // 2. Buat Dokumen User di Firestore (Collection 'users')
            // Kita pakai UID sebagai ID Dokumen agar mudah dicari
            const newProfile = {
                uid: newUser.uid,
                username: userData.username,
                display_name: userData.display_name || userData.username,
                email: userData.email,
                role: 'user', // Default role
                total_points: 0,
                level: 1,
                stats: {
                    messages_sent: 0,
                    login_count: 1
                },
                isOnline: true,
                lastActive: serverTimestamp(),
                createdAt: new Date().toISOString()
            }

            // Simpan ke Firestore
            await setDoc(doc(db, "users", newUser.uid), newProfile)

            profile.value = newProfile

            // Auto Admin Check
            if (userData.email === 'admin@supermuslim.com') {
                await updateProfile({ role: 'admin' })
            }

            return { status: 'success', data: newProfile }

        } catch (err) {
            console.error('[Auth] Register error:', err)
            error.value = err.message || 'Gagal registrasi.'
            throw err
        } finally {
            isLoading.value = false
        }


    }

    /**
     * Logout (Firebase)
     */
    const logout = async () => {
        try {
            await signOut(auth)
            // State reset handled by onAuthStateChanged
        } catch (err) {
            console.error('[Auth] Logout error:', err)
        }


    }

    /**
     * Update Profile (Firestore)
     */
    const updateProfile = async (newData) => {
        isLoading.value = true
        try {
            if (!user.value) throw new Error("No user logged in")

            const docRef = doc(db, "users", user.value.uid)
            await updateDoc(docRef, newData) // updateDoc hanya mengubah field yg dikirim

            // Update local state (meskipun onSnapshot akan handle ini juga)
            profile.value = { ...profile.value, ...newData }
            return profile.value

        } catch (err) {
            console.error('[Auth] Update profile gagal:', err)
            throw err
        } finally {
            isLoading.value = false
        }


    }

    /**
     * Reset Password (Firebase)
     */
    const resetPassword = async (email) => {
        isLoading.value = true
        error.value = null
        try {
            await sendPasswordResetEmail(auth, email)
            return { status: 'success' }
        } catch (err) {
            console.error('[Auth] Reset password error:', err)
            error.value = err.message || 'Gagal mengirim email reset.'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Update Online Status (Firestore)
     */
    const updateOnlineStatus = async (status) => {
        if (!user.value) return
        try {
            const docRef = doc(db, "users", user.value.uid)
            await updateDoc(docRef, {
                isOnline: status,
                lastActive: serverTimestamp()
            })
        } catch (err) {
            console.warn('[Auth] Gagal update status online:', err.message)
        }
    }

    /**
     * Refresh Profile (Manual fetch jika perlu)
     */
    const refreshProfile = async () => {
        if (!user.value) return
        profile.value = await fetchProfile(user.value.uid)
    }

    return {
        // State
        user,
        profile,
        isLoading,
        error,
        isInitialized,
        // Computed
        isAuthenticated,
        userProfile,
        isAdmin,
        userId,
        // Actions
        initialize,
        login,
        register,
        logout,
        updateProfile,
        refreshProfile,
        resetPassword,
        updateOnlineStatus,
    }
})
