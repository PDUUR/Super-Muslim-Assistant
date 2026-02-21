<template>
  <div class="w-full mx-auto pb-24 text-left">
    <!-- Header -->
    <div class="mb-8 pt-8 px-4 text-center">
      <h2 class="text-3xl font-black text-slate-800 dark:text-white mb-2">Arah Kiblat</h2>
      <p class="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed px-10">
        Temukan arah sholatmu dimanapun kamu berada.
      </p>
    </div>

    <!-- Compass Area (Exact Image Match Aesthetic) -->
    <div class="relative w-[340px] h-[340px] mx-auto mb-10 group">
      <!-- Outer Ring (Image Ref: Mint/Sage green theme) -->
      <div class="absolute inset-0 rounded-full bg-[#A3C7B6]/20 border-[8px] border-white/40 shadow-2xl backdrop-blur-sm"></div>
      
      <!-- Compass Scale/Ticks (Image Ref) -->
      <div class="absolute inset-4 rounded-full border-2 border-white/20">
         <!-- Compass Markers (N, S, W, E) -->
         <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span class="absolute top-4 text-sm font-black text-slate-700">0</span>
            <span class="absolute bottom-4 text-sm font-black text-slate-700">S</span>
            <span class="absolute left-4 text-sm font-black text-slate-700">W</span>
            <span class="absolute right-4 text-sm font-black text-slate-700">15</span> <!-- Based on image markers -->
            
            <!-- Degree Ticks -->
            <div v-for="i in 36" :key="i" class="absolute h-full w-[1px]" :style="`transform: rotate(${i * 10}deg)`">
                <div class="w-full h-2 bg-slate-400 opacity-30 mt-1"></div>
            </div>
         </div>
      </div>

      <!-- Arrow Container (The rotating part) -->
      <div class="absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-linear"
           :style="{ transform: `rotate(${qiblaDirection - heading}deg)` }">
        
        <!-- The Qibla Arrow (Image Ref: Gold color, sharp point) -->
        <div class="relative w-16 h-40">
           <!-- Main Arrow Shape -->
           <svg viewBox="0 0 100 200" class="w-full h-full drop-shadow-2xl">
              <!-- Shadow Body -->
              <path d="M50 0 L100 180 L50 160 L0 180 Z" fill="#D4AF37" />
              <!-- Highlight -->
              <path d="M50 0 L50 160 L0 180 Z" fill="#F0C850" />
              <!-- Bottom Ring/Grip -->
              <rect x="35" y="150" width="30" height="10" rx="5" fill="#B8860B" />
           </svg>
           
           <!-- Center Dot -->
           <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-md border-2 border-amber-400"></div>
        </div>

        <!-- Ka'ba Mini Icon (Image Ref: Positioned near the arrow when pointing) -->
        <div class="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 transform -rotate-45 translate-x-10">
           <div class="bg-black w-6 h-6 rounded shadow-lg flex items-center justify-center text-[10px] text-white border-t-2 border-amber-300">🕋</div>
        </div>
      </div>
    </div>

    <!-- Status Card (Image Ref: Exact Match Overlay) -->
    <div class="px-6 space-y-4">
      <div class="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md p-8 rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-white/20 relative overflow-hidden">
        <div class="flex items-center justify-between mb-4">
           <h3 class="text-xl font-black text-slate-800 dark:text-white">Kiblat: {{ qiblaDirection.toFixed(1) }}° {{ getCardDirection }}</h3>
           <div class="w-10 h-10 bg-green-500/10 rounded-2xl flex items-center justify-center text-xl">🍃</div>
        </div>
        <p class="text-[14px] text-slate-500 dark:text-gray-400 font-bold mb-0">Pastikan ponselmu rata dengan tanah</p>
        <p v-if="error" class="text-[10px] text-red-500 mt-2 font-bold">{{ error }}</p>
      </div>

      <!-- Action Button (Image Ref: "Mulai Kompas") -->
      <button @click="initCompass" class="w-full bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-xl border border-white/20 flex items-center justify-center gap-4 active:scale-95 transition-all text-slate-800 dark:text-white font-black uppercase tracking-widest text-sm">
        <div class="w-10 h-10 bg-[#A3C7B6]/30 rounded-xl flex items-center justify-center text-xl">🕌</div>
        Mulai Kompas
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';

const heading = ref(0);
const qiblaDirection = ref(0);
const userCoords = ref(null);
const error = ref(null);
const isInitialized = ref(false);

const KAABA_COORDS = { lat: 21.4225, lng: 39.8262 };

const getCardDirection = computed(() => {
  const directions = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];
  const index = Math.round(qiblaDirection.value / 45) % 8;
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
  
  // 1. Request Location
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
      error.value = "Izin lokasi ditolak. Aktifkan GPS untuk akurasi.";
    },
    { enableHighAccuracy: true }
  );
};

const startOrientationTracking = async () => {
  // DeviceOrientation Logic
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS 13+
    try {
      const response = await DeviceOrientationEvent.requestPermission();
      if (response === 'granted') {
        window.addEventListener('deviceorientation', handleOrientation, true);
      } else {
        error.value = "Izin sensor ditolak.";
      }
    } catch (e) {
      error.value = "Gagal mengakses sensor.";
    }
  } else {
    // Android/Non-iOS: Prioritize deviceorientationabsolute
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

  // webkitCompassHeading is specific to iOS and very accurate
  if (event.webkitCompassHeading) {
    newData = event.webkitCompassHeading;
  } else if (event.alpha !== null) {
    // Android logic: alpha is rotation around Z axis
    // 360 - event.alpha ensures the zero point is the top of the phone
    newData = 360 - event.alpha;
  }

  // Smoothing Filter (Low-pass)
  // Handle wrap-around (0/360) transitions
  let diff = newData - heading.value;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  // Apply smoothing factor (0.3 as requested)
  heading.value = (heading.value + diff * 0.3 + 360) % 360;
};

onUnmounted(() => {
  window.removeEventListener('deviceorientation', handleOrientation);
  window.removeEventListener('deviceorientationabsolute', handleOrientation);
});
</script>

<style scoped>
.animate-float {
  animation: float 4s infinite ease-in-out;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Ensure smooth rotation transition */
.transition-transform {
  transition-property: transform;
  transition-duration: 300ms;
}
</style>
