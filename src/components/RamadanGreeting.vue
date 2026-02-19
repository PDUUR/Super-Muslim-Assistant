<script setup>
import { computed, onMounted, ref } from 'vue';
import { calculatePrayerTimes } from '@/utils/prayerTimes.js';

const props = defineProps({
  fontSize: {
    type: String,
    default: 'text-4xl md:text-6xl'
  }
});

const prayerTimes = ref(null);
const hours = ref(new Date().getHours());
const minutes = ref(new Date().getMinutes());

const updateTime = () => {
  const now = new Date();
  hours.value = now.getHours();
  minutes.value = now.getMinutes();
};

const strFormat = (val) => String(val).padStart(2, '0');

const fetchPrayerTimes = async () => {
  try {
    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        prayerTimes.value = calculatePrayerTimes(latitude, longitude);
      }, () => {
        // Fallback Jakarta
        prayerTimes.value = calculatePrayerTimes(-6.2088, 106.8456);
      });
    } else {
        prayerTimes.value = calculatePrayerTimes(-6.2088, 106.8456);
    }
  } catch (e) {
    console.error(e);
  }
};

const dynamicGreeting = computed(() => {
  if (!prayerTimes.value) return "Menunaikan Puasa";
  
  const nowStr = `${strFormat(hours.value)}:${strFormat(minutes.value)}`;
  const fajr = prayerTimes.value.Fajr;
  const maghrib = prayerTimes.value.Maghrib;

  // Between Fajr and Maghrib -> Menunaikan Puasa
  if (nowStr >= fajr && nowStr < maghrib) {
    return "Menunaikan Puasa";
  } else {
    // Other times -> Berbuka Puasa
    return "Berbuka Puasa";
  }
});

onMounted(() => {
  fetchPrayerTimes();
  setInterval(updateTime, 1000);
});
</script>

<template>
  <div class="greeting-project-container text-center py-2 md:py-4">
    <h1 :class="['font-black transition-all duration-700 leading-[1] tracking-tighter break-words', fontSize]" class="text-slate-950 dark:text-white drop-shadow-sm dark:drop-shadow-xl">
      Selamat
      <span class="block bg-gradient-to-r from-green-700 to-emerald-700 dark:from-green-400 dark:to-emerald-500 bg-clip-text text-transparent mt-2">
        {{ dynamicGreeting }}
      </span>
    </h1>
    
    <div v-if="prayerTimes" class="mt-6 flex justify-center items-center gap-3 text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500 dark:text-gray-400 transition-colors">
      <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm">
        <i class="fas fa-sun text-amber-500"></i> <span class="opacity-60">Imsak:</span> <span>{{ prayerTimes.Imsak }}</span>
      </div>
      <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm">
        <i class="fas fa-moon text-indigo-500"></i> <span class="opacity-60">Maghrib:</span> <span>{{ prayerTimes.Maghrib }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.greeting-project-container {
  animation: fadeIn 1s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}
</style>
