<template>
  <div class="w-full min-h-screen mx-auto pb-24 text-left bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 transition-colors duration-500">
    <!-- Header -->
    <div class="mb-4 pt-10 px-6 text-center">
      <h2 class="text-4xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Kiblat Finder</h2>
      <p class="text-[13px] text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto italic">
        Akurasi presisi untuk panduan ibadah harianmu.
      </p>
    </div>

    <!-- Compass Section -->
    <div class="relative w-[360px] h-[360px] mx-auto my-8 flex items-center justify-center">
      <!-- Outer Glow Decoration -->
      <div :class="['absolute inset-0 rounded-full blur-3xl transition-colors duration-700 opacity-20', isAtQibla ? 'bg-amber-400' : 'bg-[#A3C7B6]']"></div>

      <!-- Main Rotating Compass Disk -->
      <div 
        class="relative w-[320px] h-[320px] rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-white/80 dark:bg-slate-800/40 backdrop-blur-xl border-[6px] border-white dark:border-slate-700/50 transition-transform duration-150 ease-linear flex items-center justify-center p-4 ring-1 ring-black/5"
        :style="{ transform: `rotate(${-heading}deg)` }"
      >
        <!-- Degree Ticks -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
          <div v-for="i in 72" :key="i" 
            class="absolute top-0 left-1/2 -translate-x-1/2 h-full w-[1.5px]" 
            :style="`transform: rotate(${i * 5}deg)`"
          >
            <div :class="['w-full transition-all duration-300', i % 18 === 0 ? 'h-5 bg-slate-800 dark:bg-white' : (i % 2 === 0 ? 'h-3 bg-slate-400 opacity-40' : 'h-1.5 bg-slate-300 opacity-20'), 'mt-2']"></div>
          </div>
        </div>

        <!-- Cardinal Directions Icons/Typography -->
        <div class="absolute inset-4 rounded-full pointer-events-none flex items-center justify-center font-serif">
          <span class="absolute top-2 text-2xl font-black text-slate-800 dark:text-white tracking-tighter">N</span>
          <span class="absolute bottom-2 text-xl font-bold text-slate-400 dark:text-slate-500">S</span>
          <span class="absolute left-2 text-xl font-bold text-slate-400 dark:text-slate-500">W</span>
          <span class="absolute right-2 text-xl font-bold text-slate-400 dark:text-slate-500">E</span>
        </div>

        <!-- Central Decorative Ring -->
        <div class="absolute inset-16 rounded-full border border-[#A3C7B6]/20 bg-[#A3C7B6]/5 backdrop-blur-sm"></div>

        <!-- Qibla Arrow (Relative to Disk's North) -->
        <div 
          class="absolute inset-0 flex items-center justify-center transition-all duration-500"
          :style="{ transform: `rotate(${qiblaDirection}deg)` }"
        >
          <!-- Elegant Gold Needle -->
          <div class="relative w-12 h-44 -translate-y-8 flex flex-col items-center">
            <!-- Needle Tip -->
            <svg viewBox="0 0 100 200" class="w-full drop-shadow-[0_10px_15px_rgba(212,175,55,0.4)]">
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#D4AF37;stop-opacity:1" />
                  <stop offset="50%" style="stop-color:#F0C850;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
                </linearGradient>
              </defs>
              <!-- Main Body -->
              <path d="M50 0 L100 200 L50 180 L0 200 Z" fill="url(#goldGradient)" />
              <!-- Highlight Edge -->
              <path d="M50 0 L50 180 L0 200 Z" fill="rgba(255,255,255,0.2)" />
            </svg>
            
            <!-- Kaaba Icon -->
            <div 
              :class="['absolute -top-10 flex flex-col items-center gap-2 transition-all duration-300', isAtQibla ? 'scale-110' : 'scale-90 opacity-70']"
              :style="{ transform: `rotate(${-qiblaDirection}deg)` }"
            >
              <div class="w-10 h-10 bg-black dark:bg-slate-900 rounded-lg shadow-xl border-t-2 border-amber-400 flex items-center justify-center text-lg animate-bounce-slow">🕋</div>
              <Transition name="fade">
                <span v-if="isAtQibla" class="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest whitespace-nowrap">Kailin Kiblat!</span>
              </Transition>
            </div>
          </div>
        </div>

        <!-- Center Pivot -->
        <div class="absolute w-6 h-6 rounded-full bg-white dark:bg-slate-700 shadow-md border-2 border-[#A3C7B6] z-10">
          <div :class="['w-full h-full rounded-full transition-all duration-500', isAtQibla ? 'bg-amber-400 animate-pulse' : 'bg-transparent']"></div>
        </div>
      </div>
      
      <!-- Fixed Outer Guide Marks -->
      <div class="absolute inset-0 border-[2px] border-dashed border-slate-300 dark:border-slate-700 rounded-full opacity-30 pointer-events-none scale-105"></div>
      <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-2xl">▼</div>
    </div>

    <!-- Info Cards -->
    <div class="px-6 space-y-4">
      <!-- Modern Glassmorphism Card -->
      <div class="group relative overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[2.5rem] shadow-xl border border-white/40 dark:border-white/5 transition-all duration-500 hover:shadow-2xl">
        <!-- Decoration -->
        <div :class="['absolute -right-10 -bottom-10 w-32 h-32 rounded-full transition-colors duration-700 opacity-10', isAtQibla ? 'bg-amber-400' : 'bg-[#A3C7B6]']"></div>

        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-[#A3C7B6] mb-1">Sudut Presisi</p>
            <h3 class="text-3xl font-black text-slate-800 dark:text-white flex items-baseline gap-1">
              {{ qiblaDirection.toFixed(1) }}<span class="text-lg font-bold text-slate-400">°</span>
            </h3>
          </div>
          <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500', isAtQibla ? 'bg-amber-100 text-amber-600 scale-110 rotate-12 shadow-lg shadow-amber-200/50' : 'bg-[#A3C7B6]/10 text-[#A3C7B6]']">
            {{ isAtQibla ? '✨' : '🧭' }}
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mb-4">
          <span class="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">Direction: {{ getCardDirection }}</span>
          <span class="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">Offset: {{ Math.abs(heading - qiblaDirection).toFixed(1) }}°</span>
        </div>

        <p class="text-[12px] text-slate-500 dark:text-gray-400 font-medium italic border-l-2 border-[#A3C7B6] pl-3 py-1 leading-relaxed">
          {{ isAtQibla ? 'Lurus ke depan! Anda sudah menghadap Ka\'bah.' : 'Putar perangkat perlahan hingga jarum sejajar dengan penanda atas.' }}
        </p>
        
        <p v-if="error" class="text-[11px] text-rose-500 mt-4 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30 flex items-center gap-2">
          <span>⚠️</span> {{ error }}
        </p>
      </div>

      <!-- Sophisticated Action Button -->
      <button 
        @click="initCompass" 
        :class="[
          'relative w-full overflow-hidden p-6 rounded-[2.2rem] shadow-lg active:scale-[0.98] transition-all duration-500 flex items-center justify-center gap-4 group',
          isInitialized ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-white/20'
        ]"
      >
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        <div class="w-10 h-10 bg-[#A3C7B6]/20 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:rotate-12">
          {{ isInitialized ? '🔄' : '🕌' }}
        </div>
        <div class="text-left">
          <p class="text-[10px] font-black uppercase tracking-widest opacity-60 m-0 leading-none mb-1">Navigation System</p>
          <p class="text-sm font-black uppercase tracking-tight m-0">{{ isInitialized ? 'Kalibrasi Ulang' : 'Mulai Navigasi Kiblat' }}</p>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, watch } from 'vue';

const heading = ref(0);
const qiblaDirection = ref(0);
const userCoords = ref(null);
const error = ref(null);
const isInitialized = ref(false);

const KAABA_COORDS = { lat: 21.4225, lng: 39.8262 };

// Logic to check if user is pointing at Qibla (tolerance ±2 degrees)
const isAtQibla = computed(() => {
  if (!isInitialized.value) return false;
  let diff = Math.abs(heading.value - qiblaDirection.value);
  if (diff > 180) diff = 360 - diff;
  return diff < 2.5;
});

// Watch for Qibla alignment to trigger haptic feedback
watch(isAtQibla, (newVal) => {
  if (newVal && navigator.vibrate) {
    navigator.vibrate(80);
  }
});

const getCardDirection = computed(() => {
  const directions = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];
  const index = Math.round(heading.value / 45) % 8;
  return directions[index];
});

// Qibla Calculation Logic
const calculateQibla = (lat, lng) => {
  const phiK = KAABA_COORDS.lat * (Math.PI / 180);
  const lambdaK = KAABA_COORDS.lng * (Math.PI / 180);
  const phi = lat * (Math.PI / 180);
  const lambda = lng * (Math.PI / 180);
  
  const y = Math.sin(lambdaK - lambda);
  const x = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda);
  let qibla = Math.atan2(y, x) * (180 / Math.PI);
  return (qibla + 360) % 360;
};

// Initialize Permissions & Start Tracking
const initCompass = async () => {
  error.value = null;
  
  if (!navigator.geolocation) {
    error.value = "Geolocation tidak didukung browser ini.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userCoords.value = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      qiblaDirection.value = calculateQibla(userCoords.value.lat, userCoords.value.lng);
      startOrientationTracking();
    },
    (err) => {
      error.value = "Izin lokasi ditolak. Aktifkan GPS untuk akurasi presisi.";
    },
    { enableHighAccuracy: true }
  );
};

const startOrientationTracking = async () => {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const response = await DeviceOrientationEvent.requestPermission();
      if (response === 'granted') {
        window.addEventListener('deviceorientation', handleOrientation, true);
      } else {
        error.value = "Izin sensor ditolak. Mohon aktifkan di pengaturan browser.";
      }
    } catch (e) {
      error.value = "Sensor tidak dapat diakses pada perangkat ini.";
    }
  } else {
    // Prioritize deviceorientationabsolute for Android for better stability
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    } else {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
  }
  isInitialized.value = true;
};

const handleOrientation = (event) => {
  let newData = 0;

  if (event.webkitCompassHeading) {
    newData = event.webkitCompassHeading;
  } else if (event.alpha !== null) {
    // Android normalization
    newData = 360 - event.alpha;
  }

  // Low-pass Filter for Smooth Motion
  let diff = newData - heading.value;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  // 0.25 smoothing factor for ultra-smooth professional feel
  heading.value = (heading.value + diff * 0.25 + 360) % 360;
};

onUnmounted(() => {
  window.removeEventListener('deviceorientation', handleOrientation);
  window.removeEventListener('deviceorientationabsolute', handleOrientation);
});
</script>

<style scoped>
.animate-bounce-slow {
  animation: bounce-slow 3s infinite ease-in-out;
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Ensure ultra-smooth transitions between frames */
.transition-transform {
  transition-property: transform;
  will-change: transform;
}
</style>
