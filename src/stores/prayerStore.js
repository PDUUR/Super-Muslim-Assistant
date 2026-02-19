/**
 * ============================================================
 * PRAYER SCHEDULE STORE - Jadwal Salat Kemenag
 * ============================================================
 * Pilar 2: Fitur Jadwal Salat Kemenag (Persistent & Accurate)
 * 
 * Fitur:
 * - Ambil jadwal dari API myquran.com berdasarkan city_id
 * - Simpan city_id & city_name ke Supabase (persistent)
 * - Realtime countdown ke waktu salat berikutnya
 * - Cache harian di localStorage untuk kecepatan
 * ============================================================
 */
import { defineStore } from 'pinia'
import { ref, computed, onUnmounted } from 'vue'
import { supabase } from '@/libs/supabase'
import { useAuthStore } from './authStore'
import { db } from '@/firebase/config'
import { doc, updateDoc } from 'firebase/firestore'

export const usePrayerStore = defineStore('prayer', () => {
    const authStore = useAuthStore()

    // ===== STATE =====
    const cityId = ref(localStorage.getItem('sm_city_id') || null)
    const cityName = ref(localStorage.getItem('sm_city_name') || null)
    const schedule = ref(null)        // Jadwal hari ini
    const isLoading = ref(false)
    const error = ref(null)
    const countdown = ref('')          // "02:15:30"
    const nextPrayer = ref(null)       // { name: 'Ashar', time: '15:30' }
    const allPrayers = ref([])         // Array semua waktu salat hari ini

    let countdownInterval = null

    // ===== DAFTAR KOTA =====
    // Beberapa kota populer dari API myquran.com
    const popularCities = [
        { id: '1301', name: 'KOTA JAKARTA' },
        { id: '1501', name: 'KOTA BANDUNG' },
        { id: '1201', name: 'KOTA SURABAYA' },
        { id: '2401', name: 'KOTA SEMARANG' },
        { id: '1101', name: 'KOTA MEDAN' },
        { id: '2101', name: 'KOTA MAKASSAR' },
        { id: '1801', name: 'KOTA YOGYAKARTA' },
        { id: '1601', name: 'KOTA PALEMBANG' },
        { id: '2501', name: 'KOTA DENPASAR' },
        { id: '1401', name: 'KOTA PADANG' },
        { id: '3201', name: 'KOTA MANADO' },
        { id: '3101', name: 'KOTA PONTIANAK' },
        { id: '3301', name: 'KOTA BANJARMASIN' },
        { id: '1901', name: 'KOTA LAMPUNG' },
        { id: '0101', name: 'KOTA BANDA ACEH' },
    ]

    // ===== COMPUTED =====
    const hasCity = computed(() => !!cityId.value)
    const formattedSchedule = computed(() => {
        if (!schedule.value) return []
        return allPrayers.value
    })

    // ===== ACTIONS =====

    /**
     * Cari kota dari API myquran.com
     */
    const searchCities = async (keyword) => {
        try {
            const response = await fetch(
                `https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(keyword)}`
            )
            const json = await response.json()
            if (json.status && json.data) {
                return json.data.map(city => ({
                    id: city.id,
                    name: city.lokasi,
                }))
            }
            return []
        } catch (err) {
            console.error('[Prayer] Error searching cities:', err)
            return []
        }
    }

    /**
     * Pilih Kota & Simpan ke Supabase
     * city_id dan city_name disimpan permanen di database.
     */
    const selectCity = async (city) => {
        cityId.value = city.id
        cityName.value = city.name

        // Persist ke localStorage (cache cepat)
        localStorage.setItem('sm_city_id', city.id)
        localStorage.setItem('sm_city_name', city.name)

        // Persist ke Firebase (permanent, survive device change)
        if (authStore.userId) {
            try {
                const userRef = doc(db, "users", authStore.userId)
                await updateDoc(userRef, {
                    city_id: city.id,
                    city_name: city.name,
                })

                console.log('[Prayer] City synced to Firebase');

                // Update local profile juga
                if (authStore.profile) {
                    authStore.profile.city_id = city.id
                    authStore.profile.city_name = city.name
                }
            } catch (err) {
                console.error('[Prayer] Gagal simpan kota ke Firebase:', err)
            }
        }

        // Langsung fetch jadwal untuk kota baru
        await fetchSchedule()
    }

    /**
     * Load kota yang tersimpan dari Supabase (saat init)
     */
    const loadSavedCity = async () => {
        if (authStore.profile?.city_id) {
            cityId.value = authStore.profile.city_id
            cityName.value = authStore.profile.city_name
            localStorage.setItem('sm_city_id', cityId.value)
            localStorage.setItem('sm_city_name', cityName.value)
        }
    }

    /**
     * Fetch Jadwal Salat dari API Kemenag
     * URL: https://api.myquran.com/v2/sholat/jadwal/{city_id}/{tahun}/{bulan}/{tanggal}
     */
    const fetchSchedule = async () => {
        if (!cityId.value) return

        isLoading.value = true
        error.value = null

        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1
        const day = now.getDate()

        // Cek cache dulu
        const cacheKey = `sm_jadwal_${cityId.value}_${year}_${month}_${day}`
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
            try {
                const parsed = JSON.parse(cached)
                schedule.value = parsed
                parsePrayers(parsed)
                updateCountdown()
                startCountdown()
                isLoading.value = false
                return
            } catch (_) { /* cache rusak, fetch ulang */ }
        }

        try {
            const url = `https://api.myquran.com/v2/sholat/jadwal/${cityId.value}/${year}/${month}/${day}`
            const response = await fetch(url)
            const json = await response.json()

            if (json.status && json.data?.jadwal) {
                schedule.value = json.data.jadwal
                // Cache jadwal hari ini
                localStorage.setItem(cacheKey, JSON.stringify(json.data.jadwal))
                parsePrayers(json.data.jadwal)
                updateCountdown()
                startCountdown()
            } else {
                error.value = 'Gagal mengambil jadwal salat'
            }
        } catch (err) {
            console.error('[Prayer] Fetch error:', err)
            error.value = 'Koneksi gagal. Periksa internet Anda.'
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Parse jadwal menjadi array yang terstruktur
     */
    const parsePrayers = (jadwal) => {
        if (!jadwal) return

        allPrayers.value = [
            { name: 'Imsak', time: jadwal.imsak, icon: '🌙' },
            { name: 'Subuh', time: jadwal.subuh, icon: '🌅' },
            { name: 'Terbit', time: jadwal.terbit, icon: '☀️' },
            { name: 'Dhuha', time: jadwal.dhuha, icon: '🌤️' },
            { name: 'Dzuhur', time: jadwal.dzuhur, icon: '☀️' },
            { name: 'Ashar', time: jadwal.ashar, icon: '🌇' },
            { name: 'Maghrib', time: jadwal.maghrib, icon: '🌆' },
            { name: 'Isya', time: jadwal.isya, icon: '🌃' },
        ]
    }

    /**
     * Hitung countdown ke waktu salat berikutnya
     */
    const updateCountdown = () => {
        if (!allPrayers.value.length) return

        const now = new Date()
        const currentMinutes = now.getHours() * 60 + now.getMinutes()

        // Cari salat berikutnya
        // Hanya salat wajib + imsak yang dihitung
        const prayerNames = ['Imsak', 'Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya']
        const mainPrayers = allPrayers.value.filter(p => prayerNames.includes(p.name))

        let found = null
        for (const prayer of mainPrayers) {
            const [hours, minutes] = prayer.time.split(':').map(Number)
            const prayerMinutes = hours * 60 + minutes

            if (prayerMinutes > currentMinutes) {
                found = prayer
                const diffMinutes = prayerMinutes - currentMinutes
                const h = Math.floor(diffMinutes / 60)
                const m = diffMinutes % 60
                const s = 60 - now.getSeconds()

                countdown.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
                break
            }
        }

        if (found) {
            nextPrayer.value = found
        } else {
            // Semua waktu salat hari ini sudah lewat
            nextPrayer.value = { name: 'Subuh (besok)', time: mainPrayers[1]?.time || '04:30', icon: '🌅' }
            countdown.value = '--:--:--'
        }
    }

    /**
     * Start countdown interval (setiap 1 detik)
     */
    const startCountdown = () => {
        stopCountdown()
        countdownInterval = setInterval(updateCountdown, 1000)
    }

    /**
     * Stop countdown interval
     */
    const stopCountdown = () => {
        if (countdownInterval) {
            clearInterval(countdownInterval)
            countdownInterval = null
        }
    }

    /**
     * Initialize: Load kota dan jadwal
     */
    const initialize = async () => {
        await loadSavedCity()

        // SELF-HEALING: Jika ada di localStorage tapi belum masuk ke Firebase Profile
        if (cityId.value && authStore.userId && !authStore.profile?.city_id) {
            console.log('[Prayer] Syncing local city to Firebase...')
            await selectCity({ id: cityId.value, name: cityName.value })
        }

        if (cityId.value) {
            await fetchSchedule()
        }
    }

    return {
        // State
        cityId,
        cityName,
        schedule,
        isLoading,
        error,
        countdown,
        nextPrayer,
        allPrayers,
        popularCities,
        // Computed
        hasCity,
        formattedSchedule,
        // Actions
        searchCities,
        selectCity,
        fetchSchedule,
        initialize,
        startCountdown,
        stopCountdown,
    }
})
