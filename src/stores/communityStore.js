/**
 * ============================================================
 * COMMUNITY STORE - Firebase Realtime Edition
 * ============================================================
 * Menggunakan Firebase Firestore untuk:
 * - Leaderboard Realtime
 * - Chat (Sub-collection 'messages' in 'communities')
 * - Presence (Online Users via Firestore field / Online status)
 * ============================================================
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useAuthStore } from './authStore'

// FIREBASE IMPORTS
import { db } from '@/firebase/config'
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    doc,
    getDoc,
    addDoc,
    deleteDoc,
    serverTimestamp,
    setDoc,
    updateDoc,
    getDocs,
    deleteField
} from 'firebase/firestore'

export const useCommunityStore = defineStore('community', () => {
    const authStore = useAuthStore()

    // ===== STATE =====
    const onlineUsers = ref([])
    const onlineCount = ref(0)
    const leaderboard = ref(
        JSON.parse(localStorage.getItem('sm_leaderboard') || '[]')
    )
    const leaderboardType = ref('all-time') // 'all-time' atau 'weekly'
    const myStats = ref(
        JSON.parse(localStorage.getItem('sm_my_stats') || 'null')
    )
    const isLoading = ref(false)
    const isOnline = ref(navigator.onLine)
    const serverTime = ref(null)

    // Chat & Communities
    const messages = ref([])
    const communities = ref([])
    const communityMembers = ref([]) // New state for members of active community

    // Realtime listeners
    let unsubscribeLeaderboard = null
    let unsubscribeChat = null
    let unsubscribePresence = null

    // ===== COMPUTED =====
    const myXp = computed(() => myStats.value?.total_points || 0)
    const myLevel = computed(() => myStats.value?.level || 1)
    const myStreak = computed(() => myStats.value?.current_streak || 0)
    const top10 = computed(() => leaderboard.value.slice(0, 10))

    // ===== LEADERBOARD =====

    /**
     * Subscribe ke Leaderboard (Firebase onSnapshot)
     * Mendukung 'all-time' dan 'weekly'
     */
    const subscribeLeaderboard = (type = 'all-time') => {
        if (unsubscribeLeaderboard) {
            unsubscribeLeaderboard()
            unsubscribeLeaderboard = null
        }

        leaderboardType.value = type
        console.log(`[Community] 📡 Subscribing to ${type} Leaderboard...`)

        // Konfigurasi field berdasarkan tipe
        // All-Time: total_points & level
        // Weekly: weeklyXp & weeklyLevel
        const pointsField = type === 'all-time' ? 'total_points' : 'weeklyXp'
        const levelField = type === 'all-time' ? 'level' : 'weeklyLevel'

        /**
         * PENTING: Firestore memerlukan 'Composite Index' untuk orderBy multi-field.
         * Filter: poin > 0
         * Urutan: Level DESC, Poin DESC
         * Catatan: Karena kita menggunakan filter '>' pada pointsField, 
         * maka pointsField HARUS menjadi orderBy pertama secara teknis jika menggunakan range filter.
         * Namun, jika kita ingin Level dulu, kita gunakan orderBy Level dulu tanpa range filter pada poin,
         * lalu filter poin > 0 di sisi klien untuk fleksibilitas maksimal dan menghindari error index.
         * 
         * Tapi untuk efisiensi, kita gunakan query yang paling sering diminta: Level DESC, then XP DESC.
         */

        const q = query(
            collection(db, "users"),
            orderBy(levelField, "desc"),
            orderBy(pointsField, "desc"),
            limit(50)
        )

        unsubscribeLeaderboard = onSnapshot(q, (snapshot) => {
            const fetched = []
            snapshot.forEach((doc) => {
                const data = doc.data()
                // Filter client-side: Jangan tampilkan yang 0 XP
                if ((data[pointsField] || 0) > 0) {
                    fetched.push({ id: doc.id, ...data })
                }
            })
            leaderboard.value = fetched
            localStorage.setItem('sm_leaderboard', JSON.stringify(fetched))

            // Update myStats jika saya ada di list
            const me = fetched.find(u => u.id === authStore.userId)
            if (me) {
                myStats.value = me
                localStorage.setItem('sm_my_stats', JSON.stringify(me))
            }
        }, (error) => {
            console.error('[Leaderboard] Error:', error)
        })
    }

    /**
     * Fetch statistik user sendiri (Firebase)
     */
    const fetchMyStats = async () => {
        if (!authStore.userId) return

        try {
            const docRef = doc(db, "users", authStore.userId)
            const docSnap = await getDoc(docRef)

            if (docSnap.exists()) {
                myStats.value = { id: docSnap.id, ...docSnap.data() }
                localStorage.setItem('sm_my_stats', JSON.stringify(myStats.value))
            }
        } catch (err) {
            console.error('[MyStats] Error:', err.message)
        }
    }

    // ===== ADD XP =====
    const addXp = async (reason, points = 10, metadata = {}) => {
        if (!authStore.userId) return

        try {
            const userRef = doc(db, "users", authStore.userId)
            const currentPoints = myStats.value?.total_points || 0
            const newPoints = currentPoints + points

            await updateDoc(userRef, {
                total_points: newPoints,
                last_xp_reason: reason,
                last_xp_at: serverTimestamp()
            })

            // Local update
            if (myStats.value) myStats.value.total_points = newPoints

            return { status: 'success' }
        } catch (err) {
            console.error('[AddXP] Error:', err.message)
            throw err
        }
    }

    // ===== COMMUNITIES (NEW) =====

    /**
     * Fetch List Komunitas
     */
    const fetchCommunities = async () => {
        try {
            let q;
            if (authStore.isAdmin) {
                // Admin sees everything
                q = query(collection(db, "communities"), orderBy("created_at", "desc"))
            } else {
                // Users see public communities
                q = query(collection(db, "communities"), orderBy("member_count", "desc"))
            }

            const snapshot = await getDocs(q)
            let list = []
            snapshot.forEach((doc) => {
                const data = doc.data()
                // Filtering private communities for non-admins (client-side fallback if rules are complex)
                if (!data.is_private || (authStore.userId && data.member_ids?.includes(authStore.userId)) || authStore.isAdmin) {
                    list.push({ id: doc.id, ...data })
                }
            })

            // Jika kosong, buat default community
            if (list.length === 0) {
                await createCommunity('General', 'Tempat ngobrol umum', true)
                await createCommunity('Ramadhan', 'Diskusi seputar Ramadhan', true)
                return fetchCommunities() // Recurse once
            }

            communities.value = list
        } catch (err) {
            console.error('[Community] Fetch error:', err)
        }
    }

    /**
     * Fetch Community Members Profile
     */
    const fetchCommunityMembers = async (memberIds) => {
        if (!memberIds || memberIds.length === 0) {
            communityMembers.value = []
            return
        }

        try {
            isLoading.value = true
            const members = []

            // Firebase limits 'in' queries to 10-30 items depending on version. 
            // For a small project, fetching one by one or using 'where in' is fine if limited.
            // Let's use getDoc for each for simplicity and to avoid 'in' limits for now.
            for (const id of memberIds) {
                if (id === 'system') continue
                const docRef = doc(db, "users", id)
                const docSnap = await getDoc(docRef)
                if (docSnap.exists()) {
                    members.push({ id: docSnap.id, ...docSnap.data() })
                }
            }

            communityMembers.value = members
        } catch (err) {
            console.error('[Community] Fetch members error:', err)
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Request Create Community (New System)
     */
    const requestCreateCommunity = async (name, description) => {
        if (!authStore.userId) return

        try {
            const requestId = `req-${Date.now()}`
            await setDoc(doc(db, "community_requests", requestId), {
                name: name,
                description: description,
                requester_id: authStore.userId,
                requester_name: authStore.profile?.display_name || authStore.profile?.username,
                status: 'pending',
                created_at: serverTimestamp()
            })

            // Notif for Admin (Simple: store in a shared collection or just leave for admin dashboard)
            return requestId
        } catch (err) {
            console.error('[Community] Request error:', err)
            throw err
        }
    }

    /**
     * Create Community (Enhanced for Private)
     */
    const createCommunity = async (name, description, isSystem = false, isPrivate = false) => {
        if (!authStore.userId && !isSystem) return

        try {
            const communityId = name.toLowerCase().replace(/\s+/g, '-')
            const creatorId = isSystem ? 'system' : authStore.userId

            await setDoc(doc(db, "communities", communityId), {
                name: name,
                description: description,
                created_by: creatorId,
                member_count: 1,
                member_ids: [creatorId], // Add creator to members
                message_count: 1,
                is_private: isPrivate,
                created_at: serverTimestamp()
            })

            // Auto kirim pesan pertama (sebagai thread starter)
            const messagesRef = collection(db, "communities", communityId, "messages")
            await addDoc(messagesRef, {
                content: `Selamat datang di komunitas ${name}!`,
                sender_id: 'system',
                sender_name: 'System',
                sender_avatar: '',
                createdAt: serverTimestamp()
            })

            // Refresh list
            if (!isSystem) await fetchCommunities()

            return communityId
        } catch (err) {
            console.error('[Community] Create error:', err)
            throw err
        }
    }

    // ===== CHAT REALTIME =====

    /**
     * Subscribe Chat (Firebase Subcollection)
     */
    const subscribeChat = (channel = 'general') => {
        if (unsubscribeChat) unsubscribeChat()

        // Normalize ID
        const communityId = channel.toLowerCase().replace(/\s+/g, '-')
        console.log(`[Chat] 📡 Subscribing to channel: ${communityId}`)

        // Riset state
        messages.value = []

        const messagesRef = collection(db, "communities", communityId, "messages")
        // Note: Firestore order by timestamp requires index sometimes if combined with where.
        // Simple collection query is fine.
        const q = query(messagesRef, orderBy("createdAt", "asc"), limit(50))

        unsubscribeChat = onSnapshot(q, (snapshot) => {
            const logs = []
            snapshot.forEach((doc) => {
                const d = doc.data()
                logs.push({
                    id: doc.id,
                    content: d.content,
                    sender_id: d.sender_id,
                    sender_name: d.sender_name,
                    sender_avatar: d.sender_avatar,
                    created_at: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date().toISOString()
                })
            })
            messages.value = logs
        }, (error) => {
            console.warn('[Chat] Listen error:', error)
            // Fallback if collection doesn't exist? (Not needed for onSnapshot, it just returns empty)
        })
    }

    /**
     * Delete Community (Admin or Creator)
     */
    const deleteCommunity = async (communityId) => {
        if (!authStore.userId) return

        try {
            const communityRef = doc(db, "communities", communityId)
            const snap = await getDoc(communityRef)

            if (!snap.exists()) return

            // Permission check: Admin or Creator
            const isCreator = snap.data().created_by === authStore.userId
            if (!authStore.isAdmin && !isCreator) {
                alert('Hanya pembuat atau Admin yang bisa menghapus komunitas ini.')
                return false
            }

            if (!confirm('Peringatan: Menghapus komunitas akan menghapus SEMUA pesan di dalamnya. Lanjutkan?')) return false

            // 1. Delete all messages first (Firestore requirement for subcollections)
            const messagesRef = collection(db, "communities", communityId, "messages")
            const msgSnap = await getDocs(messagesRef)

            const { writeBatch } = await import('firebase/firestore')
            const batch = writeBatch(db)
            msgSnap.forEach((doc) => batch.delete(doc.ref))
            await batch.commit()

            // 2. Delete the community document
            await deleteDoc(communityRef)

            alert('Komunitas berhasil dihapus.')
            await fetchCommunities()
            return true
        } catch (err) {
            console.error('[Community] Delete error:', err)
            throw err
        }
    }

    /**
     * Kirim pesan (Firebase Subcollection)
     */
    const sendMessage = async (content, channel = 'general') => {
        if (!authStore.userId || !content.trim()) return

        try {
            // Normalize ID
            const communityId = channel.toLowerCase().replace(/\s+/g, '-')
            const communityRef = doc(db, "communities", communityId)
            const messagesRef = collection(db, "communities", communityId, "messages")

            // 1. Send Message
            await addDoc(messagesRef, {
                content: content.trim(),
                sender_id: authStore.userId,
                sender_name: authStore.profile?.display_name || authStore.profile?.username || 'Hamba Allah',
                sender_avatar: authStore.profile?.avatar_url || '',
                createdAt: serverTimestamp()
            })

            // 2. Increment Global Count in Community Doc for Admin
            const { increment } = await import('firebase/firestore')
            await updateDoc(communityRef, {
                message_count: increment(1),
                last_message_at: serverTimestamp()
            })

        } catch (err) {
            console.error('[Chat] Send message error:', err.message)
            throw err
        }
    }

    /**
     * Invite User to Community (Admin Only)
     */
    const inviteUser = async (communityId, targetUserId) => {
        if (!authStore.isAdmin) return

        try {
            const communityRef = doc(db, "communities", communityId)
            const snap = await getDoc(communityRef)
            if (!snap.exists()) return

            const data = snap.data()
            const members = data.member_ids || []

            if (members.includes(targetUserId)) {
                alert('User sudah menjadi anggota.')
                return
            }

            const { arrayUnion, increment } = await import('firebase/firestore')
            await updateDoc(communityRef, {
                member_ids: arrayUnion(targetUserId),
                member_count: increment(1)
            })

            alert('User berhasil diundang dan ditambahkan ke grup!')
            await fetchCommunities()
        } catch (err) {
            console.error('[Community] Invite error:', err)
            throw err
        }
    }

    /**
     * Delete Single Message (Admin Only)
     */
    const deleteMessage = async (communityId, messageId) => {
        if (!authStore.isAdmin) return

        try {
            const msgRef = doc(db, "communities", communityId, "messages", messageId)
            await deleteDoc(msgRef)

            // Decrement count
            const communityRef = doc(db, "communities", communityId)
            const { increment } = await import('firebase/firestore')
            await updateDoc(communityRef, {
                message_count: increment(-1)
            })
        } catch (err) {
            console.error('[Chat] Delete error:', err)
        }
    }

    /**
     * Clear All Messages (Admin Only)
     */
    const clearAllMessages = async (communityId) => {
        if (!authStore.isAdmin) return
        if (!confirm('Yakin ingin menghapus SEMUA pesan di komunitas ini?')) return

        try {
            const messagesRef = collection(db, "communities", communityId, "messages")
            const snapshot = await getDocs(messagesRef)

            // Delete one by one (Firestore limit)
            const { writeBatch } = await import('firebase/firestore')
            const batch = writeBatch(db)
            snapshot.forEach((doc) => batch.delete(doc.ref))
            await batch.commit()

            // Reset count
            const communityRef = doc(db, "communities", communityId)
            await updateDoc(communityRef, {
                message_count: 0
            })

            alert('Semua pesan telah dihapus.')
        } catch (err) {
            console.error('[Chat] Clear error:', err)
        }
    }

    // ===== PRESENCE (Simple Version for Firebase) =====
    const startPresence = async () => {
        if (!authStore.userId) return

        const userRef = doc(db, "users", authStore.userId)
        await updateDoc(userRef, {
            isOnline: true,
            lastSeen: serverTimestamp()
        })
        onlineCount.value = 1
    }

    const stopPresence = async () => {
        if (authStore.userId) {
            const userRef = doc(db, "users", authStore.userId)
            await updateDoc(userRef, {
                isOnline: false,
                lastSeen: serverTimestamp()
            })
        }
        if (unsubscribePresence) unsubscribePresence()
    }

    // ===== LIFECYCLE =====

    const initialize = async () => {
        if (!authStore.isAuthenticated) return

        await fetchMyStats()
        await fetchCommunities()
        subscribeLeaderboard()
        startPresence()
    }

    const cleanup = () => {
        if (unsubscribeLeaderboard) unsubscribeLeaderboard()
        if (unsubscribeChat) unsubscribeChat()
        stopPresence()
    }

    // ===== PERSISTENCE =====
    watch(leaderboard, (v) => localStorage.setItem('sm_leaderboard', JSON.stringify(v)), { deep: true })
    watch(myStats, (v) => localStorage.setItem('sm_my_stats', JSON.stringify(v)), { deep: true })

    // ===== HELPERS =====
    const formatLastSeen = (timestamp) => {
        if (!timestamp) return 'Belum pernah online'
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
        const diff = Date.now() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        if (minutes < 1) return 'Baru saja'
        if (minutes < 60) return `${minutes} menit lalu`
        return 'Lama yang lalu'
    }

    // Debug: log members to verify availability
    console.log('[CommunityStore] Returning members, includes requestCreateCommunity:', !!requestCreateCommunity);

    return {
        onlineUsers,
        onlineCount,
        leaderboard,
        leaderboardType,
        myStats,
        communityMembers,
        isLoading,
        isOnline,
        serverTime,
        messages,
        communities,
        myXp,
        myLevel,
        myStreak,
        top10,
        initialize,
        cleanup,
        fetchLeaderboard: subscribeLeaderboard,
        subscribeLeaderboard,
        fetchMyStats,
        addXp,
        subscribeChat,
        sendMessage,
        fetchMessages: () => { },
        fetchCommunities,
        fetchCommunityMembers,
        createCommunity,
        deleteCommunity,
        inviteUser,
        startPresence,
        stopPresence,
        formatLastSeen,
        requestCreateCommunity,
        deleteMessage,
        clearAllMessages,
    }
})
