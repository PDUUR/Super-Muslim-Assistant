<script setup>
import { useAudioStore } from '@/stores/audioStore';
import { useRouter } from 'vue-router';
import { ref, reactive, onMounted, onUnmounted } from 'vue';

const audioStore = useAudioStore();
const router = useRouter();

const isMinimized = ref(false);
const wakeLock = ref(null);
const playerPos = reactive({
  x: window.innerWidth - 380, // Default position
  y: window.innerHeight - 150
});

// For dragging
const isDragging = ref(false);
const dragOffset = reactive({ x: 0, y: 0 });

const startDrag = (e) => {
  isDragging.value = true;
  const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
  const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
  dragOffset.x = clientX - playerPos.x;
  dragOffset.y = clientY - playerPos.y;
  
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchmove', onDrag, { passive: false });
  window.addEventListener('touchend', stopDrag);
};

const onDrag = (e) => {
  if (!isDragging.value) return;
  if (e.type === 'touchmove') e.preventDefault(); // Prevent scroll while dragging
  
  const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
  const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
  
  playerPos.x = clientX - dragOffset.x;
  playerPos.y = clientY - dragOffset.y;
  
  // Boundary checks
  const margin = 10;
  playerPos.x = Math.max(margin, Math.min(playerPos.x, window.innerWidth - (isMinimized.value ? 70 : 350)));
  playerPos.y = Math.max(margin, Math.min(playerPos.y, window.innerHeight - (isMinimized.value ? 70 : 100)));
};

const stopDrag = () => {
  isDragging.value = false;
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('touchmove', onDrag);
  window.removeEventListener('touchend', stopDrag);
};

const navigateToSurah = () => {
  if (isDragging.value) return;
  if (audioStore.state.surahInfo) {
    router.push(`/baca-al-quran/surah/${audioStore.state.surahInfo.nomor}`);
  }
};

const toggleMinimize = (e) => {
  e.stopPropagation();
  isMinimized.value = !isMinimized.value;
};

// Wake Lock Management
const requestWakeLock = async () => {
  if ('wakeLock' in navigator && !wakeLock.value) {
    try {
      wakeLock.value = await navigator.wakeLock.request('screen');
      wakeLock.value.onrelease = () => {
        wakeLock.value = null;
      };
    } catch (err) {
      console.warn('Wake Lock request failed:', err.message);
    }
  }
};

const releaseWakeLock = () => {
  if (wakeLock.value) {
    wakeLock.value.release();
    wakeLock.value = null;
  }
};

// Sync Wake Lock with IsPlaying State
onMounted(() => {
  audioStore.init(); // Initialize last session

  window.addEventListener('resize', () => {
    playerPos.x = Math.min(playerPos.x, window.innerWidth - 350);
    playerPos.y = Math.min(playerPos.y, window.innerHeight - 100);
  });

  // Handle visibility change to re-request wake lock if needed
  document.addEventListener('visibilitychange', async () => {
    if (wakeLock.value !== null && document.visibilityState === 'visible') {
      await requestWakeLock();
    }
  });
});

// Watch for playback changes to manage Wake Lock
import { watch } from 'vue';
watch(() => audioStore.state.isPlaying, (playing) => {
  if (playing) requestWakeLock();
  else releaseWakeLock();
});
</script>

<template>
  <Transition name="fade">
    <div v-if="audioStore.state.isPlaying || audioStore.state.currentAyatIndex !== -1" 
         class="fixed z-[9999] select-none touch-none touch-pan-y"
         :style="{ 
            left: playerPos.x + 'px', 
            top: playerPos.y + 'px',
            cursor: isDragging ? 'grabbing' : 'grab'
         }"
         @mousedown="startDrag"
         @touchstart="startDrag">
      
      <!-- Minimized View -->
      <div v-if="isMinimized" 
           @click="toggleMinimize"
           class="w-14 h-14 bg-green-600 rounded-full shadow-2xl flex items-center justify-center text-white border-2 border-white/20 hover:scale-110 transition-transform animate-bounce-subtle">
        <i class="fas fa-quran text-xl"></i>
        <div v-if="audioStore.state.isPlaying" class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
      </div>

      <!-- Full View -->
      <div v-else 
           class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl border border-green-500/30 p-3 rounded-[2.5rem] shadow-2xl flex items-center gap-3 w-[21rem] md:w-[23rem] relative overflow-hidden group">
        
        <!-- Drag Handle Area Overlay -->
        <div class="absolute inset-0 z-0 bg-transparent"></div>

        <div @click="navigateToSurah" class="flex items-center gap-3 cursor-pointer group flex-1 min-w-0 z-10">
          <div class="w-11 h-11 bg-green-600 rounded-2xl flex items-center justify-center text-white relative overflow-hidden shrink-0 shadow-lg">
            <i class="fas fa-quran text-lg relative z-10"></i>
            <div v-if="audioStore.state.isPlaying" class="absolute inset-0 bg-white/20 animate-ping opacity-20"></div>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-[9px] font-black uppercase text-green-700 dark:text-green-400 tracking-widest leading-none mb-1">
              Sedang Memutar
            </span>
            <h4 class="text-[13px] font-black text-slate-900 dark:text-white truncate leading-tight">
              {{ audioStore.state.surahInfo?.namaLatin }} • {{ audioStore.state.currentAyatIndex + 1 }}
            </h4>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0 z-10">
          <button @click.stop="audioStore.toggle()" 
            class="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-green-500 hover:bg-green-600 text-white shadow-md active:scale-90">
            <i class="fas" :class="audioStore.state.isPlaying ? 'fa-pause' : 'fa-play'"></i>
          </button>
          <button @click.stop="toggleMinimize" 
            class="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-white/5 active:scale-90">
            <i class="fas fa-compress-alt"></i>
          </button>
          <button @click.stop="audioStore.stop()" 
            class="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 active:scale-90">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

@keyframes bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.animate-bounce-subtle {
  animation: bounce-subtle 2s infinite ease-in-out;
}
</style>
