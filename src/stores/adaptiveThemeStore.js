import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAdaptiveThemeStore = defineStore('adaptiveTheme', () => {
    const prayerTimes = ref(null);
    const currentPeriod = ref('default');

    /**
     * Prayer periods and their color themes:
     * - Subuh (Fajr ~ Sunrise):  Deep blue / dawn
     * - Dhuha (Sunrise ~ Dhuhr): Warm gold / morning
     * - Dzuhur (Dhuhr ~ Asr):    Bright green / midday
     * - Ashar (Asr ~ Maghrib):   Warm orange / afternoon
     * - Maghrib (Maghrib ~ Isha): Purple sunset
     * - Isya (Isha ~ Fajr):      Deep night navy
     */
    const themes = {
        subuh: {
            name: 'Subuh',
            accent: '#3b82f6',       // Blue
            accentLight: '#93c5fd',
            gradientFrom: '#1e3a5f',
            gradientTo: '#3b82f6',
            navBg: 'from-blue-900/90 to-blue-800/90',
            heroClass: 'theme-subuh',
        },
        dhuha: {
            name: 'Dhuha',
            accent: '#f59e0b',       // Amber
            accentLight: '#fcd34d',
            gradientFrom: '#92400e',
            gradientTo: '#f59e0b',
            navBg: 'from-amber-900/90 to-amber-800/90',
            heroClass: 'theme-dhuha',
        },
        dzuhur: {
            name: 'Dzuhur',
            accent: '#22c55e',       // Green (default)
            accentLight: '#86efac',
            gradientFrom: '#14532d',
            gradientTo: '#22c55e',
            navBg: 'from-green-900/90 to-green-800/90',
            heroClass: 'theme-dzuhur',
        },
        ashar: {
            name: 'Ashar',
            accent: '#f97316',       // Orange
            accentLight: '#fdba74',
            gradientFrom: '#7c2d12',
            gradientTo: '#f97316',
            navBg: 'from-orange-900/90 to-orange-800/90',
            heroClass: 'theme-ashar',
        },
        maghrib: {
            name: 'Maghrib',
            accent: '#a855f7',       // Purple
            accentLight: '#d8b4fe',
            gradientFrom: '#581c87',
            gradientTo: '#a855f7',
            navBg: 'from-purple-900/90 to-purple-800/90',
            heroClass: 'theme-maghrib',
        },
        isya: {
            name: 'Isya',
            accent: '#6366f1',       // Indigo
            accentLight: '#a5b4fc',
            gradientFrom: '#1e1b4b',
            gradientTo: '#6366f1',
            navBg: 'from-indigo-900/90 to-indigo-800/90',
            heroClass: 'theme-isya',
        },
    };

    const currentTheme = computed(() => themes[currentPeriod.value] || themes.dzuhur);

    const setPrayerTimes = (times) => {
        prayerTimes.value = times;
        updatePeriod();
    };

    const timeToMinutes = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };

    const updatePeriod = () => {
        if (!prayerTimes.value) {
            currentPeriod.value = 'dzuhur';
            return;
        }

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const t = prayerTimes.value;

        const fajr = timeToMinutes(t.Fajr);
        const sunrise = timeToMinutes(t.Sunrise);
        // Use Dhuha time from KEMENAG if available, else fallback
        const dhuha = t.Dhuha ? timeToMinutes(t.Dhuha) : sunrise + 15;
        const dhuhr = timeToMinutes(t.Dhuhr);
        const asr = timeToMinutes(t.Asr);
        const maghrib = timeToMinutes(t.Maghrib);
        const isha = timeToMinutes(t.Isha);

        if (currentMinutes >= fajr && currentMinutes < sunrise) {
            currentPeriod.value = 'subuh';
        } else if (currentMinutes >= sunrise && currentMinutes < dhuhr) {
            currentPeriod.value = 'dhuha';
        } else if (currentMinutes >= dhuhr && currentMinutes < asr) {
            currentPeriod.value = 'dzuhur';
        } else if (currentMinutes >= asr && currentMinutes < maghrib) {
            currentPeriod.value = 'ashar';
        } else if (currentMinutes >= maghrib && currentMinutes < isha) {
            currentPeriod.value = 'maghrib';
        } else {
            currentPeriod.value = 'isya';
        }

        // Apply CSS variables
        applyThemeVariables();
    };

    const applyThemeVariables = () => {
        const theme = currentTheme.value;
        document.documentElement.style.setProperty('--accent-color', theme.accent);
        document.documentElement.style.setProperty('--accent-light', theme.accentLight);
        document.documentElement.style.setProperty('--gradient-from', theme.gradientFrom);
        document.documentElement.style.setProperty('--gradient-to', theme.gradientTo);
    };

    return {
        prayerTimes,
        currentPeriod,
        themes,
        currentTheme,
        setPrayerTimes,
        updatePeriod,
    };
});
