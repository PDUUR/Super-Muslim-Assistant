import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useAuthStore } from './authStore';
import { useNotificationStore } from './notificationStore';

// FIREBASE IMPORTS
import { db } from '@/firebase/config'
import {
    doc,
    getDoc,
    updateDoc,
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    setDoc
} from 'firebase/firestore'

export const useIbadahStore = defineStore('ibadah', () => {
    const authStore = useAuthStore();
    const notificationStore = useNotificationStore();

    // ===== IBADAH DEFINITIONS =====
    const ibadahItems = [
        { id: 'subuh', name: 'Shalat Subuh', icon: 'fas fa-cloud-sun', xp: 20, category: 'shalat' },
        { id: 'dzuhur', name: 'Shalat Dzuhur', icon: 'fas fa-sun', xp: 20, category: 'shalat' },
        { id: 'ashar', name: 'Shalat Ashar', icon: 'fas fa-cloud', xp: 20, category: 'shalat' },
        { id: 'maghrib', name: 'Shalat Maghrib', icon: 'fas fa-moon', xp: 20, category: 'shalat' },
        { id: 'isya', name: 'Shalat Isya', icon: 'fas fa-star', xp: 20, category: 'shalat' },
        { id: 'tahajjud', name: 'Shalat Tahajud', icon: 'fas fa-star-and-crescent', xp: 30, category: 'sunnah' },
        { id: 'dhuha', name: 'Shalat Dhuha', icon: 'fas fa-sun', xp: 15, category: 'sunnah' },
        { id: 'rawatib', name: 'Shalat Rawatib', icon: 'fas fa-hands-praying', xp: 15, category: 'sunnah' },
        { id: 'tilawah', name: 'Tilawah Al-Quran', icon: 'fas fa-book-quran', xp: 25, category: 'quran' },
        { id: 'dzikir_pagi', name: 'Dzikir Pagi', icon: 'fas fa-spa', xp: 10, category: 'dzikir' },
        { id: 'dzikir_sore', name: 'Dzikir Sore', icon: 'fas fa-spa', xp: 10, category: 'dzikir' },
        { id: 'sedekah', name: 'Sedekah', icon: 'fas fa-hand-holding-heart', xp: 20, category: 'amal' },
        { id: 'puasa_sunnah', name: 'Puasa Sunnah', icon: 'fas fa-utensils', xp: 30, category: 'puasa' },
        { id: 'istighfar', name: 'Istighfar 100x', icon: 'fas fa-praying-hands', xp: 10, category: 'dzikir' },
    ];

    // ===== STATE =====
    const dailyLogs = ref(JSON.parse(localStorage.getItem('ibadah_daily_logs') || '{}'));
    const unlockedBadges = ref(JSON.parse(localStorage.getItem('ibadah_badges') || '[]'));
    const totalXP = ref(parseInt(localStorage.getItem('ibadah_total_xp') || '0'));
    const level = ref(parseInt(localStorage.getItem('ibadah_level') || '1'));
    const currentStreak = ref(parseInt(localStorage.getItem('ibadah_streak') || '0'));
    const totalMinutesActive = ref(parseInt(localStorage.getItem('ibadah_total_minutes') || '0'));
    const listenedSurahIds = ref(JSON.parse(localStorage.getItem('ibadah_listened_surahs') || '[]'));
    const totalLoginDays = ref(parseInt(localStorage.getItem('ibadah_total_login_days') || '1'));
    const lastLoginDate = ref(localStorage.getItem('ibadah_last_login_date') || '');

    const isLoading = ref(false);
    const isSyncing = ref(false);
    const syncError = ref(null);
    const leaderboard = ref([]);

    // ===== BADGE DEFINITIONS (Categorized) =====
    const badgeDefinitions = [
        // Category 1: Al-Hafiz (Qur'an)
        { id: 'al_hafiz_bronze', name: 'Cahaya Pagi', desc: 'Membaca Al-Qur\'an sebelum pukul 07.00', category: 'al_hafiz', tier: 'bronze', icon: '🌅' },
        { id: 'al_hafiz_silver', name: 'Khatam Explorer', desc: 'Selesaikan satu juz dalam seminggu', category: 'al_hafiz', tier: 'silver', icon: '📖' },
        { id: 'al_hafiz_gold', name: 'Istiqomah Tilawah', desc: '30 hari tanpa absen membaca Al-Qur\'an', category: 'al_hafiz', tier: 'gold', icon: '👑' },

        // ... (Existing categories) ...
        { id: 'guardian_bronze', name: 'First Responder', desc: '5x Sholat tepat waktu berturut-turut', category: 'guardian', tier: 'bronze', icon: '🛡️' },
        { id: 'guardian_silver', name: 'Midnight Warrior', desc: '3x Tahajjud dalam seminggu', category: 'guardian', tier: 'silver', icon: '⚔️' },
        { id: 'guardian_gold', name: 'Jumat Barokah', desc: 'Lengkapi semua amalan sunnah Jumat', category: 'guardian', tier: 'gold', icon: '🕌' },

        { id: 'philanthropist_bronze', name: 'Helping Hand', desc: '5x mencatat sedekah dalam sebulan', category: 'philanthropist', tier: 'bronze', icon: '🤝' },
        { id: 'philanthropist_silver', name: 'Secret Donor', desc: 'Sedekah subuh selama 7 hari', category: 'philanthropist', tier: 'silver', icon: '🤫' },
        { id: 'philanthropist_gold', name: 'Golden Heart', desc: 'Menjadi donatur aktif komunitas', category: 'philanthropist', tier: 'gold', icon: '💛' },

        { id: 'scholar_bronze', name: 'Qibla Master', desc: 'Kalibrasi kiblat di 3 lokasi berbeda', category: 'scholar', tier: 'bronze', icon: '🧭' },
        { id: 'scholar_silver', name: 'Dzikir Master', desc: '10 hari Dzikir Pagi & Petang tanpa terlewat', category: 'scholar', tier: 'silver', icon: '📿' },
        { id: 'scholar_gold', name: 'Al-Hakim', desc: 'Mencapai Level 20', category: 'scholar', tier: 'gold', icon: '🎓' },

        // NEW: Engagement Badges (Categorized under 'Scholar' or 'Guardian' or New Category? 
        // Let's fit them into existing categories or add a 'Special' one. 
        // User didn't specify category, but these fit 'Scholar' (Knowledge/Consistency) and 'Al-Hafiz' (Quran) well.
        // Let's create a 'Special' internal mapping or just attach to best fit.
        // "Pecinta Kebun" (100 mins) -> Guardian (Consitency) or Scholar? Let's put in Scholar as 'Focus'.
        // "Pendengar Setia" (Audio) -> Al-Hafiz.

        // Let's add them as 'hidden' or 'special' if logic allows, or simply extend existing categories.
        // For simplicity in UI, I will map them to the existing tabs. 

        { id: 'pecinta_kebun', name: 'Pecinta Kebun', desc: 'Aktif di aplikasi selama 100 menit', category: 'scholar', tier: 'bronze', icon: '⏱️' },

        { id: 'pendengar_setia', name: 'Pendengar Setia', desc: 'Dengarkan 10 Surah hingga selesai', category: 'al_hafiz', tier: 'bronze', icon: '🎧' },
        { id: 'pecinta_quran', name: 'Pecinta Al-Qur\'an', desc: 'Dengarkan 35 Surah hingga selesai', category: 'al_hafiz', tier: 'silver', icon: '🔉' },
        { id: 'khatam_sami', name: 'Khatam Sam\'i', desc: 'Dengarkan 114 Surah (Khatam)', category: 'al_hafiz', tier: 'gold', icon: '🏆' },
    ];

    // ===== HELPERS =====
    const getTodayKey = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const getDateKey = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const calculateLevel = (xp) => Math.floor(xp / 100) + 1;
    const totalLogCount = (ibadahId) => {
        return Object.values(dailyLogs.value).flat().filter(id => id === ibadahId).length;
    };

    // ===== COMPUTED =====
    const xpForNextLevel = computed(() => 100);
    const xpProgress = computed(() => totalXP.value % 100);
    const todayLog = computed(() => dailyLogs.value[getTodayKey()] || []);
    const todayXP = computed(() => todayLog.value.reduce((sum, id) => sum + (ibadahItems.find(i => i.id === id)?.xp || 0), 0));
    const todayProgress = computed(() => Math.round((todayLog.value.length / ibadahItems.length) * 100));

    const unlockedEffects = computed(() => {
        return {
            dew: unlockedBadges.value.some(b => b.badge_id.startsWith('al_hafiz')),
            strongTrunk: unlockedBadges.value.some(b => b.badge_id.startsWith('guardian')),
            rareButterflies: unlockedBadges.value.some(b => b.badge_id.startsWith('philanthropist')),
            newSeeds: unlockedBadges.value.some(b => b.badge_id.startsWith('scholar')),
            aura: unlockedBadges.value.some(b => b.badge_id === 'pecinta_kebun')
        };
    });

    // ===== ACTIONS =====
    const fetchLeaderboard = async () => {
        try {
            const usersRef = collection(db, "users")
            const q = query(usersRef, orderBy("total_points", "desc"), limit(20))
            const querySnapshot = await getDocs(q)
            const fetchedLeaderboard = []
            let rank = 1
            querySnapshot.forEach((doc) => {
                const p = doc.data()
                fetchedLeaderboard.push({
                    rank: rank++, id: doc.id, username: p.username, display_name: p.display_name || p.username,
                    total_xp: p.total_points || 0, level: p.level || 1, current_streak: p.current_streak || 0,
                    garden_health: p.garden_health || 0
                })
            })
            leaderboard.value = fetchedLeaderboard;
        } catch (err) { console.error(err); }
    };

    // Internal Helper for unlocking
    const unlockBadge = (badgeId) => {
        if (!unlockedBadges.value.some(b => b.badge_id === badgeId)) {
            unlockedBadges.value.push({ badge_id: badgeId, unlocked_at: new Date().toISOString() });

            const def = badgeDefinitions.find(d => d.id === badgeId);
            if (def) {
                notificationStore.showNotification('reminder', null, {
                    title: `Maa Shaa Allah! Gelar '${def.name}' Terbuka!`,
                    body: `Selamat! Kamu telah mencapai '${def.name}'!`
                });
            }
        }
    };

    // 1. TIME ACCUMULATION LOGIC
    const trackSessionTime = async () => {
        totalMinutesActive.value += 1;

        // Check Badge: Pecinta Kebun
        if (totalMinutesActive.value >= 100 && !unlockedBadges.value.some(b => b.badge_id === 'pecinta_kebun')) {
            unlockBadge('pecinta_kebun');
        }

        // Sync to DB (Optimization: could be debounced or done periodically)
        // Since this is called every minute (implied by name/usage), syncing every min is okay-ish to ensure data safety.
        if (authStore.isAuthenticated) {
            try {
                const userRef = doc(db, "users", authStore.user.uid);
                await updateDoc(userRef, { total_minutes_active: totalMinutesActive.value });
            } catch (e) { console.error("Time sync fail", e); }
        }
    };

    // 2. AUDIO TRACKING LOGIC
    const markSurahListened = async (surahId) => {
        // Ensure unique
        if (!listenedSurahIds.value.includes(surahId)) {
            listenedSurahIds.value.push(surahId);

            // Check Badges
            const count = listenedSurahIds.value.length;
            if (count >= 10) unlockBadge('pendengar_setia');
            if (count >= 35) unlockBadge('pecinta_quran');
            if (count >= 114) unlockBadge('khatam_sami');

            // Sync
            if (authStore.isAuthenticated) {
                try {
                    const logsRef = doc(db, "users", authStore.user.uid, "private_data", "logs");
                    await setDoc(logsRef, { listened_surah_ids: listenedSurahIds.value }, { merge: true });
                } catch (e) { console.error("Audio sync fail", e); }
            }
        }
    };

    // 3. STREAK & LOGIN LOGIC
    const checkLoginStreak = async () => {
        const today = getTodayKey();
        if (lastLoginDate.value === today) return; // Already logged in today

        const last = lastLoginDate.value ? new Date(lastLoginDate.value) : null;
        const now = new Date();

        // Calculate difference in days
        let diffDays = 1;
        if (last) {
            const oneDay = 24 * 60 * 60 * 1000;
            diffDays = Math.round(Math.abs((now - last) / oneDay));
        }

        if (lastLoginDate.value) {
            if (diffDays === 1 || (diffDays === 0 && lastLoginDate.value !== today)) {
                // Consecutive day (or sometime logic might count same day differently, but here 1 day diff is ideal)
                // Note: 'diffDays' acts roughly. Better check date string diffs.
                // Simple logic based on dates:
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayKey = getDateKey(yesterday);

                if (lastLoginDate.value === yesterdayKey) {
                    currentStreak.value += 1;
                } else if (lastLoginDate.value !== today) {
                    currentStreak.value = 1; // Reset streak
                }
            } else {
                if (diffDays > 1) currentStreak.value = 1; // Reset if gap > 1 day
            }
        } else {
            currentStreak.value = 1; // First Login
        }

        lastLoginDate.value = today;
        totalLoginDays.value += 1;

        // Sync
        if (authStore.isAuthenticated) {
            try {
                const userRef = doc(db, "users", authStore.user.uid);
                await updateDoc(userRef, {
                    current_streak: currentStreak.value,
                    total_login_days: totalLoginDays.value,
                    last_login_date: today
                });
            } catch (e) { console.error("Login sync fail", e); }
        }
    };

    const syncWithBackend = async () => {
        if (isLoading.value || !authStore.isAuthenticated) return;
        isLoading.value = true;
        isSyncing.value = true;
        try {
            const docRef = doc(db, "users", authStore.user.uid)
            const [docSnap, _] = await Promise.all([getDoc(docRef), fetchLeaderboard()])
            if (docSnap.exists()) {
                const p = docSnap.data()
                totalXP.value = p.total_points || 0;
                level.value = p.level || 1;
                currentStreak.value = p.current_streak || 0;
                totalMinutesActive.value = p.total_minutes_active || 0;
                totalLoginDays.value = p.total_login_days || 1;
                lastLoginDate.value = p.last_login_date || '';

                const logsRef = doc(db, "users", authStore.user.uid, "private_data", "logs");
                const logsSnap = await getDoc(logsRef);
                if (logsSnap.exists()) {
                    const data = logsSnap.data();
                    dailyLogs.value = data.history || {};
                    listenedSurahIds.value = data.listened_surah_ids || [];
                }
            }
            // calculateStreak(); // We use checkLoginStreak now for stricter logic
            checkLoginStreak(); // Run streak logic on sync/startup
            checkAndUnlockBadges();
        } catch (err) { console.error(err); } finally {
            isLoading.value = false;
            isSyncing.value = false;
        }
    };

    const checkAndUnlockBadges = () => {
        const shouldUnlock = [];
        const isUnlocked = (id) => unlockedBadges.value.some(b => b.badge_id === id);

        // --- Logic Checks ---
        if (totalLogCount('tilawah') >= 3 && !isUnlocked('al_hafiz_bronze')) shouldUnlock.push({ badge_id: 'al_hafiz_bronze', unlocked_at: new Date().toISOString() });
        if (totalLogCount('tilawah') >= 15 && !isUnlocked('al_hafiz_silver')) shouldUnlock.push({ badge_id: 'al_hafiz_silver', unlocked_at: new Date().toISOString() });
        if (currentStreak.value >= 30 && !isUnlocked('al_hafiz_gold')) shouldUnlock.push({ badge_id: 'al_hafiz_gold', unlocked_at: new Date().toISOString() });

        if (totalLogCount('subuh') + totalLogCount('dzuhur') >= 10 && !isUnlocked('guardian_bronze')) shouldUnlock.push({ badge_id: 'guardian_bronze', unlocked_at: new Date().toISOString() });
        if (totalLogCount('tahajjud') >= 3 && !isUnlocked('guardian_silver')) shouldUnlock.push({ badge_id: 'guardian_silver', unlocked_at: new Date().toISOString() });

        if (totalLogCount('sedekah') >= 5 && !isUnlocked('philanthropist_bronze')) shouldUnlock.push({ badge_id: 'philanthropist_bronze', unlocked_at: new Date().toISOString() });

        if (level.value >= 10 && !isUnlocked('scholar_silver')) shouldUnlock.push({ badge_id: 'scholar_silver', unlocked_at: new Date().toISOString() });
        if (level.value >= 20 && !isUnlocked('scholar_gold')) shouldUnlock.push({ badge_id: 'scholar_gold', unlocked_at: new Date().toISOString() });

        if (shouldUnlock.length > 0) {
            unlockedBadges.value = [...unlockedBadges.value, ...shouldUnlock];
            shouldUnlock.forEach(unlock => {
                const def = badgeDefinitions.find(d => d.id === unlock.badge_id);
                if (def) {
                    notificationStore.showNotification('reminder', null, {
                        title: `Maa Shaa Allah! Gelar '${def.name}' Terbuka!`,
                        body: `Kamu baru saja mendapatkan gelar '${def.name}', kebunmu kini tumbuh lebih spesial!`
                    });
                }
            });
        }
    };

    const toggleIbadah = async (ibadahId) => {
        const key = getTodayKey();
        if (!dailyLogs.value[key]) dailyLogs.value[key] = [];
        const index = dailyLogs.value[key].indexOf(ibadahId);
        const item = ibadahItems.find(i => i.id === ibadahId);
        const xpAmount = item?.xp || 0;

        const oldXP = totalXP.value;

        if (index >= 0) {
            dailyLogs.value[key].splice(index, 1);
            totalXP.value = Math.max(0, totalXP.value - xpAmount);
        } else {
            dailyLogs.value[key].push(ibadahId);
            totalXP.value += xpAmount;
        }

        // XP MILESTONE CHECK
        if (oldXP < 100 && totalXP.value >= 100) {
            notificationStore.showNotification('reminder', null, { title: 'Milestone XP!', body: 'Masya Allah, kamu sudah mencapai 100 XP!' });
        }
        if (oldXP < 250 && totalXP.value >= 250) {
            notificationStore.showNotification('reminder', null, { title: 'Milestone XP!', body: 'Luar biasa! 250 XP tercapai!' });
        }

        dailyLogs.value = { ...dailyLogs.value };
        level.value = calculateLevel(totalXP.value);
        // calculateStreak(); // Handled by checkLoginStreak
        checkAndUnlockBadges();

        if (authStore.isAuthenticated) {
            try {
                const userRef = doc(db, "users", authStore.user.uid);
                const todayLogData = dailyLogs.value[key] || [];
                const prayers = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
                const prayerCount = todayLogData.filter(id => prayers.includes(id)).length;
                const gardenHealth = Math.round((prayerCount / 5) * 100);

                await updateDoc(userRef, {
                    total_points: totalXP.value, level: level.value,
                    current_streak: currentStreak.value, garden_health: gardenHealth
                });
                const logsRef = doc(db, "users", authStore.user.uid, "private_data", "logs");
                await setDoc(logsRef, { history: dailyLogs.value }, { merge: true });
            } catch (err) { console.error(err); }
        }
    };

    const claimBadge = async (badgeId) => {
        if (!authStore.isAuthenticated) return;
        const badge = unlockedBadges.value.find(b => b.badge_id === badgeId);
        if (!badge || badge.claimed_at) return;
        try {
            isLoading.value = true;
            badge.claimed_at = new Date().toISOString();
            unlockedBadges.value = [...unlockedBadges.value];
            const oldXP = totalXP.value;
            totalXP.value += 50;
            level.value = calculateLevel(totalXP.value);
            const userRef = doc(db, "users", authStore.user.uid);
            await updateDoc(userRef, { total_points: totalXP.value, level: level.value });

            if (oldXP < 100 && totalXP.value >= 100) notificationStore.showNotification('reminder', null, { title: 'Milestone XP!', body: 'Masya Allah, kamu sudah mencapai 100 XP!' });
            if (oldXP < 250 && totalXP.value >= 250) notificationStore.showNotification('reminder', null, { title: 'Milestone XP!', body: 'Luar biasa! 250 XP tercapai!' });

            return { status: 'success' };
        } catch (err) { throw err; } finally { isLoading.value = false; }
    };

    const isChecked = (ibadahId) => (dailyLogs.value[getTodayKey()] || []).includes(ibadahId);
    const getBadgeStatus = (badgeId) => {
        const badge = unlockedBadges.value.find(b => b.badge_id === badgeId);
        return { unlocked: !!badge, claimed: !!(badge && badge.claimed_at) };
    };

    const getWeeklyData = () => {
        const data = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = getDateKey(d);
            const log = dailyLogs.value[key] || [];
            data.push({
                day: d.toLocaleDateString('id-ID', { weekday: 'short' }),
                date: key,
                count: log.length,
                percentage: Math.round((log.length / ibadahItems.length) * 100),
            });
        }
        return data;
    };

    watch(dailyLogs, (val) => localStorage.setItem('ibadah_daily_logs', JSON.stringify(val)), { deep: true });
    watch(totalXP, (val) => localStorage.setItem('ibadah_total_xp', String(val)));
    watch(level, (val) => localStorage.setItem('ibadah_level', String(val)));
    watch(currentStreak, (val) => localStorage.setItem('ibadah_streak', String(val)));
    watch(unlockedBadges, (val) => localStorage.setItem('ibadah_badges', JSON.stringify(val)), { deep: true });
    watch(totalMinutesActive, (val) => localStorage.setItem('ibadah_total_minutes', String(val)));
    watch(listenedSurahIds, (val) => localStorage.setItem('ibadah_listened_surahs', JSON.stringify(val)), { deep: true });
    watch(totalLoginDays, (val) => localStorage.setItem('ibadah_total_login_days', String(val)));
    watch(lastLoginDate, (val) => localStorage.setItem('ibadah_last_login_date', val));

    return {
        ibadahItems, dailyLogs, unlockedBadges, totalXP, level, currentStreak,
        todayLog, todayXP, todayProgress, isLoading, isSyncing, syncError,
        leaderboard, badgeDefinitions, xpForNextLevel, xpProgress, unlockedEffects,
        totalMinutesActive, listenedSurahIds, totalLoginDays, lastLoginDate,
        syncWithBackend, toggleIbadah, claimBadge, isChecked, getBadgeStatus,
        getWeeklyData, fetchLeaderboard, trackSessionTime, markSurahListened, checkLoginStreak
    };
});
