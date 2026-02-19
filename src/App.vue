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

const handleEnter = () => {
    isLanding.value = false;
    if (!authStore.isAuthenticated) {
        router.push('/auth');
    }
    setTimeout(() => {
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
