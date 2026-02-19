<template>
  <Transition name="notification-slide">
    <div v-if="notificationStore.isVisible && notificationStore.currentMessage" 
         class="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm">
      
      <!-- Notification Card -->
      <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden relative backdrop-blur-md">
        
        <!-- Header: App Icon & Name -->
        <div class="bg-slate-50/50 dark:bg-slate-900/30 px-5 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-[10px]">
              <i class="fas fa-moon"></i>
            </div>
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Super Muslim • Sekarang
            </span>
          </div>
          <button @click="notificationStore.closeNotification" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="p-5">
          <h3 class="text-sm font-black text-slate-800 dark:text-white mb-2 leading-tight">
            {{ notificationStore.currentMessage.title }}
          </h3>
          <p class="text-xs text-slate-600 dark:text-gray-300 leading-relaxed font-medium">
            "{{ notificationStore.currentMessage.body }}"
          </p>
        </div>

        <!-- Actions -->
        <div class="flex border-t border-slate-100 dark:border-slate-700/50 divide-x divide-slate-100 dark:divide-slate-700/50">
          <button 
            @click="takeWudhu"
            class="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
            Ambil Wudhu
          </button>
          <button 
            @click="snooze"
            class="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
            Nanti
          </button>
        </div>

        <!-- Progress Bar (Auto dismiss visual cue - optional, removing for now to keep it persistent until action) -->
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { useNotificationStore } from '@/stores/notificationStore';
import { useIbadahStore } from '@/stores/ibadahStore';

const notificationStore = useNotificationStore();
const ibadahStore = useIbadahStore();

const takeWudhu = () => {
    // Logic: Maybe log wudhu streak or just close
    // In future, could open a "Wudhu Guide"
    notificationStore.closeNotification();
    // Optional: Add XP for responding
    // ibadahStore.addXP(5); 
};

const snooze = () => {
    notificationStore.snooze();
};
</script>

<style scoped>
.notification-slide-enter-active,
.notification-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}

.notification-slide-enter-from,
.notification-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px) scale(0.95);
}
</style>
