<template>
  <Transition name="notification-slide">
    <div v-if="notificationStore.isVisible && notificationStore.currentMessage" 
         class="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-sm touch-none"
         @touchstart="handleTouchStart"
         @touchmove="handleTouchMove"
         @touchend="handleTouchEnd"
         :style="cardStyle">
      
      <!-- Notification Card -->
      <div class="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden relative active:scale-95 transition-transform duration-200">
        
        <!-- Header: App Icon & Name -->
        <div class="bg-slate-50/50 dark:bg-slate-800/30 px-5 py-3 flex items-center justify-between border-b border-white/10 dark:border-white/5">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 bg-gradient-to-br from-emerald-400 to-green-600 rounded-lg flex items-center justify-center text-white text-[10px] shadow-sm">
              <i class="fas" :class="iconMap[notificationStore.currentMessage.type] || 'fa-bell'"></i>
            </div>
            <span class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Super Muslim • Baru Saja
            </span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
            <span class="text-[8px] font-bold text-slate-400 uppercase">Live</span>
          </div>
        </div>

        <!-- Body -->
        <div class="p-6">
          <h3 class="text-sm font-black text-slate-900 dark:text-white mb-1.5 leading-tight tracking-tight">
            {{ notificationStore.currentMessage.title }}
          </h3>
          <p class="text-[11px] text-slate-600 dark:text-gray-400 leading-relaxed font-semibold italic">
            "{{ notificationStore.currentMessage.body }}"
          </p>
        </div>

        <!-- Actions -->
        <div class="flex border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/5">
          <button 
            @click="notificationStore.closeNotification(true)"
            class="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors border-r border-slate-100 dark:border-white/5">
            Na'am
          </button>
          <button 
            @click="notificationStore.snooze"
            class="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            Nanti Deh
          </button>
        </div>
      </div>

      <!-- Swipe Indicator -->
      <div class="mt-2 flex justify-center opacity-30">
        <div class="w-12 h-1 bg-slate-400 dark:bg-slate-600 rounded-full"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNotificationStore } from '@/stores/notificationStore';

const notificationStore = useNotificationStore();

const iconMap = {
    azan: 'fa-mosque',
    zikir: 'fa-pray',
    dhuha: 'fa-sun',
    sedekah: 'fa-heart'
};

const touchStartX = ref(0);
const touchCurrentX = ref(0);
const isSwiping = ref(false);

const handleTouchStart = (e) => {
    touchStartX.value = e.touches[0].clientX;
    isSwiping.value = true;
};

const handleTouchMove = (e) => {
    if (!isSwiping.value) return;
    touchCurrentX.value = e.touches[0].clientX;
};

const handleTouchEnd = () => {
    const diff = touchCurrentX.value - touchStartX.value;
    const threshold = 100;

    if (Math.abs(diff) > threshold) {
        notificationStore.closeNotification();
    }

    touchStartX.value = 0;
    touchCurrentX.value = 0;
    isSwiping.value = false;
};

const cardStyle = computed(() => {
    if (!isSwiping.value || touchCurrentX.value === 0) return {};
    const diff = touchCurrentX.value - touchStartX.value;
    return {
        transform: `translate(calc(-50% + ${diff}px), 0)`,
        opacity: Math.max(0, 1 - Math.abs(diff) / 300),
        transition: isSwiping.value ? 'none' : 'all 0.3s ease'
    };
});

onMounted(() => {
    // Sedekah reminder disabled by user request
});
</script>

<style scoped>
.notification-slide-enter-active,
.notification-slide-leave-active {
  transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1);
}

.notification-slide-enter-from,
.notification-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -40px) scale(0.9);
}
</style>
