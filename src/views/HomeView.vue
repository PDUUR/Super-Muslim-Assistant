<script setup>
import { reactive, computed, onMounted, onUnmounted } from 'vue';
import { formattedDate } from '@/assets/indonesia-time.js';
import { useIbadahStore } from '@/stores/ibadahStore';
import { useAdaptiveThemeStore } from '@/stores/adaptiveThemeStore';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';
import RamadanGreeting from '@/components/RamadanGreeting.vue';
import MotivationalGenerator from '@/components/MotivationalGenerator.vue';
import { calculatePrayerTimes, getTimezoneLabel } from '@/utils/prayerTimes.js';

const ibadahStore = useIbadahStore();
const themeStore = useAdaptiveThemeStore();
const authStore = useAuthStore();

const state = reactive({
    hours: 0,
    minutes: 0,
    seconds: 0,
    prayerTimes: null,
    locationName: 'Mencari lokasi...',
    locationError: null,
    nextPrayer: null,
    countdown: '',
    timezoneLabel: 'WIB',
    longitude: 106.8456,
});

let timerInterval;

function updateTime() {
    const now = new Date();
    state.hours = now.getHours();
    state.minutes = now.getMinutes();
    state.seconds = now.getSeconds();
    
    if (state.prayerTimes) {
        calculateNextPrayer();
        themeStore.updatePeriod();
    }
}

const strFormat = (time) => {
    return String(time).length < 2 ? "0" + time : time
}

const realtime = computed(() => {
    return `${strFormat(state.hours)}:${strFormat(state.minutes)}:${strFormat(state.seconds)}`;
});

const calculateNextPrayer = () => {
    const nowStr = `${strFormat(state.hours)}:${strFormat(state.minutes)}:${strFormat(state.seconds)}`;
    const times = [
        { name: 'Subuh', time: state.prayerTimes.Fajr },
        { name: 'Dzuhur', time: state.prayerTimes.Dhuhr },
        { name: 'Ashar', time: state.prayerTimes.Asr },
        { name: 'Maghrib', time: state.prayerTimes.Maghrib },
        { name: 'Isya', time: state.prayerTimes.Isha }
    ];

    let next = times.find(p => p.time + ':00' > nowStr);
    
    if (!next) {
        next = { ...times[0], isNextDay: true };
    }

    state.nextPrayer = next;

    // Hitung Mundur
    const now = new Date();
    const target = new Date();
    const [h, m] = next.time.split(':');
    target.setHours(h, m, 0);
    
    if (next.isNextDay) {
        target.setDate(target.getDate() + 1);
    }

    const diff = target - now;
    const hh = Math.floor(diff / 3600000);
    const mm = Math.floor((diff % 3600000) / 60000);
    const ss = Math.floor((diff % 60000) / 1000);
    
    state.countdown = `${hh}j ${mm}m ${ss}d`;
};

const fetchPrayerTimes = async (lat, lon) => {
    try {
        state.locationName = 'Mendeteksi...';
        state.longitude = lon;
        state.timezoneLabel = getTimezoneLabel(lon);
        
        // Detect location via Nominatim (OpenStreetMap)
        try {
            const geoResp = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            state.locationName = geoResp.data.address.city || geoResp.data.address.town || geoResp.data.address.city_district || geoResp.data.address.county || 'Lokasi Terdeteksi';
        } catch (geoErr) {
            state.locationName = 'Indonesia';
        }

        // MENGGUNAKAN ADHAN-JS via utilitas (Lokal) sesuai standar KEMENAG RI
        state.prayerTimes = calculatePrayerTimes(lat, lon);

        themeStore.setPrayerTimes(state.prayerTimes);
        calculateNextPrayer();
        state.locationError = null;
    } catch (error) {
        console.error("Gagal menghitung waktu salat", error);
        state.locationName = "Jakarta (Default)";
        state.timezoneLabel = 'WIB';
        // Only retry with default if we weren't already using default
        if (lat !== -6.2088 || lon !== 106.8456) {
            fetchPrayerTimes(-6.2088, 106.8456);
        }
    }
};

const getLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchPrayerTimes(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                let msg = 'Gagal mengakses lokasi.';
                if (error.code === 1) msg = "Izin lokasi ditolak. Silakan aktifkan di pengaturan browser.";
                else if (error.code === 2) msg = "Lokasi tidak tersedia.";
                else if (error.code === 3) msg = "Waktu permintaan habis.";
                
                state.locationError = msg;
                fetchPrayerTimes(-6.2088, 106.8456);
            },
            { 
                enableHighAccuracy: true, 
                timeout: 10000, 
                maximumAge: 0 
            }
        );
    } else {
        fetchPrayerTimes(-6.2088, 106.8456);
    }
};

// Quick access features moved to SuperFeaturesView.vue

// Data jadwal shalat lengkap untuk grid
const prayerSchedule = computed(() => {
    if (!state.prayerTimes) return [];
    return [
        { name: 'Imsak', time: state.prayerTimes.Imsak, icon: 'fas fa-cloud-moon', tag: 'Mulai Puasa', tagColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' },
        { name: 'Subuh', time: state.prayerTimes.Fajr, icon: 'fas fa-cloud-sun', tag: 'Shalat Wajib', tagColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
        { name: 'Terbit', time: state.prayerTimes.Sunrise, icon: 'fas fa-sun', tag: 'Syuruq', tagColor: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-500' },
        { name: 'Dhuha', time: state.prayerTimes.Dhuha, icon: 'fas fa-sun', tag: 'Sunnah', tagColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
        { name: 'Dzuhur', time: state.prayerTimes.Dhuhr, icon: 'fas fa-sun', tag: 'Shalat Wajib', tagColor: 'bg-green-500/10 text-green-700 dark:text-green-400' },
        { name: 'Ashar', time: state.prayerTimes.Asr, icon: 'fas fa-cloud', tag: 'Shalat Wajib', tagColor: 'bg-orange-500/10 text-orange-700 dark:text-orange-400' },
        { name: 'Maghrib', time: state.prayerTimes.Maghrib, icon: 'fas fa-moon', tag: 'Berbuka', tagColor: 'bg-red-500/10 text-red-700 dark:text-red-400' },
        { name: 'Isya', time: state.prayerTimes.Isha, icon: 'fas fa-star', tag: 'Shalat Wajib', tagColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-400' },
    ];
});

onMounted(() => {
    updateTime();
    timerInterval = setInterval(updateTime, 1000);
    getLocation();
});

onUnmounted(() => {
    clearInterval(timerInterval);
});
</script>

<template>
    <div class="w-full mx-auto pb-8">
        <div class="text-center">
            <!-- Header Section -->
            <div class="mb-6 p-6 glass rounded-[2.5rem] transition-all duration-500 relative overflow-hidden">
                <!-- Adaptive Color Pulse -->
                <div class="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-[60px] opacity-20 transition-colors duration-[2000ms]"
                     :style="{ backgroundColor: themeStore.currentTheme.accent }"></div>
                <div class="absolute -left-10 -bottom-10 w-48 h-48 rounded-full blur-[60px] opacity-10 transition-colors duration-[2000ms]"
                     :style="{ backgroundColor: themeStore.currentTheme.accentLight }"></div>

                <img src="/img/masjid.png" class="w-20 inline-block mb-4 transition-transform hover:scale-110 duration-500" alt="Masjid">
                
                <div class="flex flex-col items-center gap-2 mb-4">
                    <p class="font-bold tracking-widest uppercase text-[10px] transition-colors duration-1000"
                       :style="{ color: themeStore.currentTheme.accent }">
                        <i class="fas fa-map-marker-alt mr-2"></i> {{ state.locationName }}
                    </p>
                    <!-- Prayer Period Indicator -->
                    <div class="flex items-center gap-2 text-[9px] font-bold px-3 py-1 rounded-full transition-all duration-1000"
                         :style="{ backgroundColor: themeStore.currentTheme.accent + '15', color: themeStore.currentTheme.accent }">
                        <div class="w-1.5 h-1.5 rounded-full animate-pulse" :style="{ backgroundColor: themeStore.currentTheme.accent }"></div>
                        Waktu {{ themeStore.currentTheme.name }}
                    </div>
                    <button @click="getLocation" class="text-[9px] bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 px-3 py-1 rounded-full border border-green-500/30 transition-all flex items-center gap-1">
                        <i class="fas fa-sync-alt" :class="{'animate-spin': state.locationName === 'Mendeteksi...'}"></i> Perbarui Lokasi
                    </button>
                </div>

                <!-- Epic Greeting Component -->
                <RamadanGreeting font-size="text-5xl" />
                
                <!-- Fitur Baru: Generator Motivasi dengan Ayat Al-Quran -->
                <MotivationalGenerator />

                <p class="text-slate-700 dark:text-gray-400 text-sm italic max-w-full mx-auto mt-6 leading-relaxed">
                    "Maka, ingatlah kepada-Ku, Aku pun akan ingat kepadamu. Bersyukurlah kepada-Ku dan janganlah kamu ingkar kepada-Ku."
                </p>
            </div>

            <!-- Time and Countdown Section -->
            <div class="flex flex-col gap-4 mb-6">
                <div class="bg-slate-50 dark:bg-gray-800/40 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg transition-colors duration-500">
                    <p class="text-green-700 dark:text-green-500 font-bold mb-1 uppercase text-[10px] tracking-tight">{{ formattedDate }}</p>
                    <div class="text-5xl font-black text-slate-950 dark:text-white font-mono leading-none py-2">{{ realtime }}</div>
                    <p class="text-[9px] font-bold text-slate-400 mt-1">{{ state.timezoneLabel }}</p>
                </div>
                
                <div v-if="state.nextPrayer" class="p-6 rounded-3xl shadow-xl flex flex-col justify-center transform active:scale-95 transition-all duration-300"
                     :style="{ backgroundColor: themeStore.currentTheme.accent }">
                    <p class="text-white/80 font-bold uppercase text-[10px] mb-1">Mendekati Azan {{ state.nextPrayer.name }}</p>
                    <div class="text-4xl font-black text-white leading-none mb-1">{{ state.countdown }}</div>
                    <p class="text-white/90 text-[11px] font-semibold">Pukul {{ state.nextPrayer.time }} {{ state.timezoneLabel }}</p>
                </div>
            </div>

            <!-- EPIC GREETING & MOTIVATION (Cleaned up from old super feature grid) -->
            <div class="mb-4"></div>

            <!-- Ibadah Quick Stats (if user has data) -->
            <div v-if="ibadahStore.totalDays > 0" class="glass rounded-2xl p-5 mb-8 text-left border-l-4 border-green-500">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">
                        <i class="fas fa-chart-bar mr-1"></i> Ringkasan Ibadah
                    </h3>
                    <router-link to="/ibadah-tracker" class="text-[9px] font-bold text-green-600 dark:text-green-400 hover:underline">
                        Detail →
                    </router-link>
                </div>
                <div class="grid grid-cols-4 gap-2">
                    <div class="text-center">
                        <p class="text-xl font-black text-slate-900 dark:text-white">{{ ibadahStore.level }}</p>
                        <p class="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Level</p>
                    </div>
                    <div class="text-center">
                        <p class="text-xl font-black text-amber-600 dark:text-amber-400">{{ ibadahStore.currentStreak }}</p>
                        <p class="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Streak</p>
                    </div>
                    <div class="text-center">
                        <p class="text-xl font-black text-green-600 dark:text-green-400">{{ ibadahStore.todayProgress }}%</p>
                        <p class="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Hari Ini</p>
                    </div>
                    <div class="text-center">
                        <p class="text-xl font-black text-purple-600 dark:text-purple-400">{{ ibadahStore.unlockedBadges.length }}</p>
                        <p class="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Badge</p>
                    </div>
                </div>
            </div>

            <!-- KEMENAG Badge -->
            <div v-if="state.prayerTimes" class="flex items-center justify-center gap-2 mb-4">
                <div class="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full">
                    <i class="fas fa-check-circle text-[10px]"></i>
                    <span class="text-[9px] font-black uppercase tracking-widest">Standar KEMENAG RI</span>
                </div>
                <div class="flex items-center gap-1 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 px-2.5 py-1.5 rounded-full">
                    <span class="text-[8px] font-bold">Fajr 20° · Isya 18° · Ihtiyati +2m</span>
                </div>
            </div>

            <!-- Grid Jadwal Shalat Lengkap KEMENAG RI -->
            <div v-if="state.prayerTimes" class="mb-6">
                <h3 class="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-3 flex items-center gap-2 px-1">
                    <i class="fas fa-clock"></i> Jadwal Shalat Hari Ini
                </h3>
                <div class="grid grid-cols-4 gap-2 text-start">
                    <div v-for="prayer in prayerSchedule" :key="prayer.name"
                         class="group bg-slate-50 dark:bg-gray-900/50 backdrop-blur-sm p-3 rounded-xl border-b-2 transition-all duration-300 border-slate-200 dark:border-white/5"
                         :class="[
                            prayer.name === state.nextPrayer?.name ? 'border-[var(--accent-color,#22c55e)] bg-white dark:bg-gray-800 shadow-md scale-105 z-10' : 'opacity-80'
                         ]">
                        <i :class="[prayer.icon, prayer.name === state.nextPrayer?.name ? 'text-[var(--accent-color,#22c55e)]' : 'text-slate-400 dark:text-gray-500']" class="text-[10px] mb-1 block"></i>
                        <p class="text-slate-600 dark:text-gray-400 font-bold uppercase text-[8px] tracking-widest leading-none">{{ prayer.name }}</p>
                        <p class="text-lg font-black text-slate-950 dark:text-white mt-0.5 leading-none">{{ prayer.time }}</p>
                        
                        <div class="mt-1.5 text-[7px] py-0.5 px-1.5 rounded-full font-bold uppercase inline-block" :class="prayer.tagColor">
                            {{ prayer.tag }}
                        </div>
                    </div>
                </div>
            </div>

            <p v-if="state.locationError" class="mt-6 text-[10px] text-red-600 dark:text-yellow-500/80 italic animate-pulse px-4 leading-snug">
                <i class="fas fa-exclamation-triangle mr-1"></i> {{ state.locationError }}
            </p>

            <!-- Developer Signature -->
            <div class="mt-12 pb-6 flex flex-col items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
                <div class="h-[1px] w-12 bg-gradient-to-r from-transparent via-slate-400 to-transparent"></div>
                <p class="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                    Developed by <span class="text-green-600 dark:text-green-400">ArtDur</span>
                </p>
                <p class="text-[7px] font-bold text-slate-400">© 2026 Super Muslim Assistant</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@700;800&display=swap');

.font-mono {
    font-family: 'JetBrains Mono', monospace;
}
</style>
