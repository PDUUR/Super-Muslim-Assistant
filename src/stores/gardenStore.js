/**
 * ============================================================
 * GARDEN STORE - Gamification & Habit Tracker
 * ============================================================
 * Mengelola ekosistem kebun virtual yang dinamis.
 * 
 * Features:
 * - Tree Health (H) -> Sholat Tepat/Terlambat/Skip
 * - Growth Level (L) -> XP from Dzikir, Tilawah
 * - Species Unlock -> Streak & Specific Tasks
 * - Environmental Effects -> Rain, Butterflies, Fireflies
 * - Golden Fruit Logic
 * ============================================================
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useAuthStore } from './authStore'
import { useIbadahStore } from './ibadahStore'
import { useNotificationStore } from './notificationStore'
import { db } from '@/firebase/config'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

export const useGardenStore = defineStore('garden', () => {
    const authStore = useAuthStore()
    const ibadahStore = useIbadahStore()

    // ===== STATE =====
    const gardenData = ref({
        treeHealth: 100, // 0-100
        treeLevel: 1,    // 1: Seed, 2: Sprout, 3: Sapling, 4: Mature
        treeType: 'basic', // basic, kurma, melati, zaitun
        unlockedSpecies: ['basic'],
        environment: {
            rain: false,
            butterflies: false,
            fireflies: false,
            goldenFruit: false,
            weatherIntensity: 'clear' // heavy, light, clear
        },
        lastWatered: null, // Timestamp
        lastMaintenanceDate: null // Tanggal pemeliharaan terakhir (YYYY-MM-DD)
    })

    const isLoading = ref(false)
    const notificationStore = useNotificationStore()

    // ===== CONSTANTS =====
    const LEVELS = {
        1: { name: 'Benih', minXp: 0, image: 'seed.png' },
        2: { name: 'Tunas', minXp: 200, image: 'sprout.png' },
        3: { name: 'Pohon Muda', minXp: 500, image: 'sapling.png' },
        4: { name: 'Pohon Dewasa', minXp: 1000, image: 'mature.png' }
    }

    const SPECIES = {
        basic: { name: 'Tanaman Dasar', req: 'None' },
        kurma: { name: 'Pohon Kurma', req: '30 Hari Sholat 5 Waktu' },
        melati: { name: 'Bunga Melati', req: '7 Hari Dzikir Pagi Petang' },
        zaitun: { name: 'Pohon Zaitun', req: 'Rutin Tilawah' }
    }

    // ===== COMPUTED =====
    const currentTreeName = computed(() => {
        return LEVELS[gardenData.value.treeLevel]?.name || 'Tanaman Misterius'
    })

    const healthStatus = computed(() => {
        if (gardenData.value.treeHealth > 80) return 'Segar Bugar'
        if (gardenData.value.treeHealth > 50) return 'Sehat'
        if (gardenData.value.treeHealth > 20) return 'Dahaga'
        return 'Layu'
    })

    // ===== ACTIONS =====

    /**
     * Initialize Garden Data
     */
    const initialize = async () => {
        if (!authStore.userId) return
        isLoading.value = true

        try {
            const gardenRef = doc(db, "users", authStore.userId, "private_data", "garden")
            const snap = await getDoc(gardenRef)

            if (snap.exists()) {
                gardenData.value = { ...gardenData.value, ...snap.data() }
            } else {
                // Initialize new garden
                await saveGarden()
            }

            // Pantau Kesehatan Ibadah (Maintenance)
            await monitorHealthDiscipline()

            // Sinkronisasi Cuaca Berdasarkan Geolocation
            await syncWeatherSensor()

            // Evaluasi Environment Effects saat load
            evaluateEnvironment()
        } catch (err) {
            console.error('[Garden] Init error:', err)
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Update Health berdasarkan input sholat
     * @param {string} status 'ontime' | 'late' | 'missed'
     */
    const updateHealth = async (status) => {
        let delta = 0
        let message = ''

        if (status === 'ontime') {
            delta = 20
            message = 'Alhamdulillah! Pohonmu semakin segar.'
        } else if (status === 'late') {
            delta = 5
            message = 'Lebih baik terlambat daripada tidak, tapi pohonmu butuh lebih banyak air.'
        } else if (status === 'missed') {
            delta = -30
            message = 'Astaghfirullah, pohonmu mulai layu. Segera siram dengan sholat!'
        }

        // Clamp 0-100
        const newHealth = Math.min(100, Math.max(0, gardenData.value.treeHealth + delta))
        gardenData.value.treeHealth = newHealth

        await saveGarden()
        return message
    }

    /**
     * Cek Level Progression (dipanggil saat XP Ibadah bertambah)
     */
    const checkLevelUp = async (totalXp) => {
        let newLevel = 1
        if (totalXp >= LEVELS[4].minXp) newLevel = 4
        else if (totalXp >= LEVELS[3].minXp) newLevel = 3
        else if (totalXp >= LEVELS[2].minXp) newLevel = 2

        if (newLevel > gardenData.value.treeLevel) {
            gardenData.value.treeLevel = newLevel
            await saveGarden()
            return `Maa Shaa Allah! Tanamanmu tumbuh menjadi ${LEVELS[newLevel].name}!`
        }
        return null
    }

    /**
     * Memantau kedisiplinan ibadah (Maintenance Logic)
     * - Severe Dehydration: -80% per hari absen
     * - Nutrient Deficiency: -10% jika sholat tidak lengkap pada login terakhir
     */
    const monitorHealthDiscipline = async () => {
        // Pastikan dailyLogs sudah tersinkronisasi
        if (!ibadahStore.lastLoginDate) {
            await ibadahStore.syncWithBackend()
        }

        const todayKey = ibadahStore.getTodayKey()
        const lastDateKey = gardenData.value.lastMaintenanceDate

        // Kasus: User baru atau belum pernah ada maintenance record
        if (!lastDateKey) {
            gardenData.value.lastMaintenanceDate = todayKey
            await saveGarden()
            return
        }

        // Jika sudah diproses hari ini, lewati
        if (lastDateKey === todayKey) return

        let penalty = 0
        let isDehydrated = false
        let isNutrientDeficit = false

        // 1. ANALOGI DEHIDRASI BERAT (Absen Login)
        const lastDate = new Date(lastDateKey)
        const today = new Date()

        // Normalisasi jam ke 00:00 agar perbandingan tanggal murni
        lastDate.setHours(0, 0, 0, 0)
        today.setHours(0, 0, 0, 0)

        const diffTime = today - lastDate
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays > 1) {
            const missedDays = diffDays - 1
            penalty += missedDays * 80
            isDehydrated = true
        }

        // 2. ANALOGI DEFISIENSI NUTRISI (Sholat Tidak Lengkap di hari login terakhir)
        const prevLogs = ibadahStore.dailyLogs[lastDateKey] || []
        const mandatory = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya']
        const isComplete = mandatory.every(s => prevLogs.includes(s))

        if (!isComplete) {
            penalty += 10
            isNutrientDeficit = true
        }

        // Terapkan penalti jika ada
        if (penalty > 0) {
            const oldHealth = gardenData.value.treeHealth
            gardenData.value.treeHealth = Math.max(0, gardenData.value.treeHealth - penalty)

            // Kirim notifikasi jika penurunan drastis
            if (isDehydrated || (isNutrientDeficit && oldHealth > 20)) {
                // Trigger notifikasi jika mendukung format custom
                console.log(`[Garden] Health dropped by ${penalty}% due to discipline maintenance.`)
            }
        }

        // Update tanggal maintenance terakhir ke hari ini
        gardenData.value.lastMaintenanceDate = todayKey
        await saveGarden()
    }

    /**
     * Sinkronisasi Cuaca dari Geolocation & API (Stasiun Meteorologi Pribadi)
     */
    const syncWeatherSensor = async () => {
        if (!navigator.geolocation) {
            console.warn('[Garden] Geolocation tidak didukung');
            return;
        }

        // Gunakan timeout untuk koordinat agar tidak membeku jika diblokir
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;

            try {
                // Catatan: Disarankan menggunakan environment variable VITE_WEATHER_API_KEY
                // Untuk demo, kita asumsikan sensor terhubung ke OpenWeatherMap
                const apiKey = '85e0bf595449755b46e3989c670a59ed'; // Harap ganti dengan key valid
                const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`);
                const data = await res.json();

                if (data.weather && data.weather[0]) {
                    const code = data.weather[0].id;
                    let intensity = 'clear';

                    // MAPPING LOGIC (Sesuai Ketentuan)
                    if ([502, 503, 504, 522].includes(code)) {
                        intensity = 'heavy';
                    } else if ((code >= 500 && code <= 501) || (code >= 300 && code <= 321)) {
                        intensity = 'light';
                    } else if (code === 800) {
                        intensity = 'clear';
                    } else if (code > 800) {
                        // Fallback: Cloudy dll dianggap clear tapi bisa dikembangkan
                        intensity = 'clear';
                    }

                    gardenData.value.environment.weatherIntensity = intensity;

                    // Jika hujan (heavy/light), aktifkan efek rain dasar
                    gardenData.value.environment.rain = (intensity !== 'clear');

                    await saveGarden();
                    console.log(`[Garden] Weather Sync: ${intensity} (ID: ${code})`);
                }
            } catch (err) {
                console.error('[Garden] Weather fetch error:', err);
            }
        }, (err) => {
            console.warn('[Garden] Geolocation error:', err.message);
        }, { timeout: 10000 });
    }

    /**
     * Evaluasi Environment Effects
     * "Rainmaker", "Butterfly", "Night Owl", "Golden Fruit"
     */
    const evaluateEnvironment = () => {
        const streak = ibadahStore.currentStreak
        const hour = new Date().getHours()

        // 1. Rainmaker (Streak Sholat 3 hari)
        gardenData.value.environment.rain = streak >= 3

        // 2. Butterfly (Sedekah hari ini)
        const todayLog = ibadahStore.todayLog
        gardenData.value.environment.butterflies = todayLog.includes('sedekah')

        // 3. Night Owl (Tahajud & Malam)
        const isNight = hour >= 19 || hour <= 4
        const hasTahajud = todayLog.includes('tahajjud')
        gardenData.value.environment.fireflies = isNight && hasTahajud

        // 4. Golden Fruit (All tasks done)
        const progress = ibadahStore.todayProgress
        gardenData.value.environment.goldenFruit = progress >= 100
    }

    /**
     * Unlock Species Logic (Manual Check or Scheduled)
     */
    const checkSpeciesUnlock = async () => {
        // Contoh: Unlock Kurma jika streak 30
        if (ibadahStore.currentStreak >= 30 && !gardenData.value.unlockedSpecies.includes('kurma')) {
            gardenData.value.unlockedSpecies.push('kurma')
            await saveGarden()
            return 'Selamat! Anda membuka bibit Pohon Kurma!'
        }
        // Logika Melati & Zaitun butuh tracking history lebih detail (bisa dikembangkan)
        return null
    }

    /**
     * Save to Firestore
     */
    const saveGarden = async () => {
        if (!authStore.userId) return
        try {
            const gardenRef = doc(db, "users", authStore.userId, "private_data", "garden")
            await setDoc(gardenRef, gardenData.value, { merge: true })
        } catch (err) {
            console.error('[Garden] Save error:', err)
        }
    }

    // Watcher untuk perubahan di Ibadah Store yang berdampak ke Garden
    watch(() => ibadahStore.totalXP, (newXp) => {
        checkLevelUp(newXp)
    })

    watch(() => ibadahStore.todayLog, () => {
        evaluateEnvironment()
        saveGarden() // Auto save environment changes
    }, { deep: true })

    return {
        gardenData,
        isLoading,
        currentTreeName,
        healthStatus,
        LEVELS,
        initialize,
        updateHealth,
        checkLevelUp,
        checkSpeciesUnlock,
    }
})
