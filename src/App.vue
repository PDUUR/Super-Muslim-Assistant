<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import MainLayout from '@/layout/MainLayout.vue';
import AdminLayout from '@/layout/AdminLayout.vue';
import LandingPage from '@/components/LandingPage.vue';
import ThemeSwitcher from '@/components/ThemeSwitcher.vue';
import GlobalAudioPlayer from '@/components/GlobalAudioPlayer.vue';
import SmartNotification from '@/components/SmartNotification.vue';
import { useApiDataStore } from '@/stores/apiDataStore.js';
import { useAuthStore } from '@/stores/authStore';
import { useCommunityStore } from '@/stores/communityStore';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAdaptiveThemeStore } from '@/stores/adaptiveThemeStore';
import { useIbadahStore } from '@/stores/ibadahStore';

const { callAPIs, state } = useApiDataStore();
const authStore = useAuthStore();
const communityStore = useCommunityStore();
const notificationStore = useNotificationStore();
const themeStore = useAdaptiveThemeStore();
const router = useRouter();
const route = useRoute();

const layout = computed(() => {
  if (route.meta.layout === 'admin') return AdminLayout;
  return MainLayout;
});

const isLanding = ref(true);
const ibadahStore = useIbadahStore();
let sessionTimer;
let notificationTimer;

const checkSmartNotifications = () => {
    // ... (logic remains same, calling internally)
    // For brevity in this diff, assuming this function body is unchanged or we just call the store if logic moved there.
    // Use existing logic from original file.
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    if (themeStore.prayerTimes) {
        const prayers = {
            subuh: themeStore.prayerTimes.Fajr,
            dzuhur: themeStore.prayerTimes.Dhuhr,
            ashar: themeStore.prayerTimes.Asr,
            maghrib: themeStore.prayerTimes.Maghrib,
            isya: themeStore.prayerTimes.Isha
        };

        for (const [key, time] of Object.entries(prayers)) {
            if (time === timeString) {
                notificationStore.showNotification('shalat', key);
                return;
            }
        }
    }

    if (timeString === '08:30') notificationStore.showNotification('sunnah', 'duha');
    if (timeString === '03:00') notificationStore.showNotification('sunnah', 'tahajud');
    
    if (currentMinute === 0 && Math.random() > 0.7) notificationStore.showNotification('reminder');
};

const showChangelog = () => {
    const lastVersion = localStorage.getItem('app-changelog-version');
    const currentVersion = '2.1.0'; // Updated version for these features

    if (lastVersion !== currentVersion) {
        Swal.fire({
            title: '<div class="text-2xl font-black text-green-600 dark:text-green-500 mb-2">✨ Update Terbaru!</div>',
            html: `
                <div class="text-left space-y-4 px-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div class="p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-headphones-alt text-green-600"></i>
                            <h4 class="font-black text-sm text-slate-800 dark:text-white uppercase tracking-tight">Audio Latar Belakang</h4>
                        </div>
                        <p class="text-[11px] text-slate-600 dark:text-gray-400 leading-relaxed font-medium">Dengarkan Al-Qur'an tanpa terputus meski layar terkunci atau saat membuka aplikasi lain. Kontrol penuh langsung dari bar notifikasi.</p>
                    </div>

                    <div class="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-bookmark text-blue-600"></i>
                            <h4 class="font-black text-sm text-slate-800 dark:text-white uppercase tracking-tight">Penanda per Ayat</h4>
                        </div>
                        <p class="text-[11px] text-slate-600 dark:text-gray-400 leading-relaxed font-medium">Simpan progres Tilawah, Murajaah, atau Hafalan Anda lebih presisi per ayat dengan navigasi otomatis saat melanjutkan.</p>
                    </div>

                    <div class="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-bell text-amber-600"></i>
                            <h4 class="font-black text-sm text-slate-800 dark:text-white uppercase tracking-tight">Smart Notification</h4>
                        </div>
                        <p class="text-[11px] text-slate-600 dark:text-gray-400 leading-relaxed font-medium">Geser (swipe) untuk hapus notifikasi. Dilengkapi pengingat Sedekah berkala untuk hari-hari penuh berkah Anda.</p>
                    </div>

                    <div class="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-globe-asia text-purple-600"></i>
                            <h4 class="font-black text-sm text-slate-800 dark:text-white uppercase tracking-tight">Terminologi Lokal</h4>
                        </div>
                        <p class="text-[11px] text-slate-600 dark:text-gray-400 leading-relaxed font-medium">Penyebutan lokasi turun surah kini lebih familiar: Makkiyah & Madaniyah, beserta detail surah yang lebih lengkap.</p>
                    </div>
                </div>
            `,
            confirmButtonText: 'MANTAP!',
            customClass: {
                confirmButton: 'bg-green-600 px-8 py-3 rounded-xl font-black text-xs tracking-widest uppercase border-none',
                popup: 'rounded-[2.5rem] p-6 dark:bg-slate-900 border-none shadow-2xl overflow-hidden'
            }
        });
        localStorage.setItem('app-changelog-version', currentVersion);
    }
};

const handleEnter = () => {
    isLanding.value = false;
    if (!authStore.isAuthenticated) {
        router.push('/auth');
    }
    setTimeout(() => {
        showChangelog();
        notificationStore.showNotification('reminder');
    }, 2000);
};

onMounted(async () => {
  await authStore.initialize();
  callAPIs();
  
  if (authStore.isAuthenticated) {
    isLanding.value = false;
    communityStore.initialize();
    
    // Check Streak
    ibadahStore.checkLoginStreak();

    setTimeout(() => {
        showChangelog();
        notificationStore.showNotification('reminder');
    }, 3000);
  }

  notificationTimer = setInterval(checkSmartNotifications, 60000);
  
  // Start Session Tracker (1 minute interval)
  sessionTimer = setInterval(() => {
      ibadahStore.trackSessionTime();
  }, 60000);

  window.addEventListener('go-to-landing', () => {
    isLanding.value = true;
    communityStore.cleanup();
  });
});

onUnmounted(() => {
  communityStore.cleanup();
  if (notificationTimer) clearInterval(notificationTimer);
  if (sessionTimer) clearInterval(sessionTimer);
});
</script>

<template>
  <Transition name="fade">
    <LandingPage v-if="isLanding" @enter="handleEnter" />
  </Transition>

  <template v-if="!isLanding">
    <div v-if="state.isLoading">
      Sedang memuat data...
    </div>

    <!-- Global Smart Notification -->
    <SmartNotification />

    <div v-if="state.isError">
      Error pak
    </div>

    <component :is="layout">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </RouterView>
    </component>
  </template>

  <template v-if="route.meta.layout !== 'admin'">
    <GlobalAudioPlayer />
    <ThemeSwitcher v-if="!isLanding" />
  </template>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style scoped></style>
