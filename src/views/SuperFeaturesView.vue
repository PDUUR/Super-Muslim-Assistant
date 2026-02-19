<template>
  <div class="w-full mx-auto pb-24 text-left">
    <!-- Header -->
    <div class="mb-8 flex items-center gap-2 px-2">
      <div class="w-8 h-8 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center justify-center text-slate-400">
        <i class="fas fa-th-large"></i>
      </div>
      <h2 class="text-sm font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mt-1">
        Fitur Super
      </h2>
    </div>

    <!-- Features Grid -->
    <div class="grid grid-cols-2 gap-4 px-2">
      <router-link v-for="feat in superFeatures" :key="feat.name" :to="feat.route"
                   class="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-[0_15px_30px_rgba(0,0,0,0.04)] dark:shadow-none dark:border dark:border-white/10 flex flex-col items-center text-center active:scale-95 transition-all duration-300 group">
        <div :class="feat.color" class="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl mb-4 shadow-lg transform group-hover:scale-110 transition-transform duration-500">
          <i :class="feat.icon"></i>
        </div>
        <h4 class="font-black text-sm text-slate-800 dark:text-gray-100 mb-1 leading-tight">{{ feat.name }}</h4>
        <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-tight">{{ feat.desc }}</p>
      </router-link>
    </div>

    <!-- Extra Menu Section -->
    <div class="mt-10 px-2">
        <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1">Lainnya</h3>
        <div class="space-y-3">
            <router-link to="/asmaul-husna" class="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl active:scale-[0.98] transition-all">
                <div class="w-10 h-10 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                    <i class="fas fa-list"></i>
                </div>
                <div>
                    <p class="text-xs font-black text-slate-800 dark:text-gray-200">Asmaul Husna</p>
                    <p class="text-[9px] text-slate-400">99 Nama Allah</p>
                </div>
                <i class="fas fa-chevron-right ml-auto text-[10px] text-slate-300"></i>
            </router-link>

            <router-link to="/doa-harian" class="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl active:scale-[0.98] transition-all">
                <div class="w-10 h-10 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                    <i class="fas fa-praying-hands"></i>
                </div>
                <div>
                    <p class="text-xs font-black text-slate-800 dark:text-gray-200">Do'a Harian</p>
                    <p class="text-[9px] text-slate-400">Kumpulan doa mustajab</p>
                </div>
                <i class="fas fa-chevron-right ml-auto text-[10px] text-slate-300"></i>
            </router-link>
        </div>
    </div>
  </div>
</template>

<script setup>
const superFeatures = [
    { name: 'Ibadah Tracker', icon: 'fas fa-chart-line', route: '/ibadah-tracker', color: 'bg-green-500', desc: 'Pantau ibadah harian' },
    { name: 'Arah Kiblat', icon: 'fas fa-compass', route: '/qibla', color: 'bg-[#A3C7B6]', desc: 'Temukan arah Ka\'bah' },
    { name: 'Cari Masjid', icon: 'fas fa-mosque', route: '/cari-masjid', color: 'bg-blue-500', desc: 'Temukan masjid terdekat' },
    { name: 'Catatan Puasa', icon: 'fas fa-calendar-check', route: '/catatan-puasa', color: 'bg-amber-500', desc: 'Catat puasa Ramadhan' },
    { name: 'Komunitas', icon: 'fas fa-users', route: '/komunitas', color: 'bg-purple-500', desc: 'Diskusi & inspirasi' },
];
</script>

<style scoped>
.glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
