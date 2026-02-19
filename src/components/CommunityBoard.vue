<template>
  <div class="w-full space-y-5 pb-6">
    
    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- 1. MY STATS CARD (XP, Level, Streak)                   -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <div v-if="authStore.isAuthenticated" class="relative overflow-hidden rounded-[2rem] p-6 border border-white/10"
         :style="{ 
           background: `linear-gradient(135deg, ${levelColor}15 0%, ${levelColor}08 50%, transparent 100%)`,
         }">
      <!-- Decorative orbs -->
      <div class="absolute -right-12 -top-12 w-40 h-40 rounded-full blur-3xl opacity-30 animate-pulse"
           :style="{ background: levelColor }"></div>

      <div class="relative z-10 flex items-center gap-4">
        <!-- Level Badge -->
        <div class="relative">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-lg"
               :style="{ background: `linear-gradient(135deg, ${levelColor}, ${levelColor}cc)`, boxShadow: `0 8px 24px ${levelColor}40` }">
            {{ ibadahStore.level }}
          </div>
          <!-- Streak flame -->
          <div v-if="ibadahStore.currentStreak > 0" 
               class="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-[8px] text-white font-black shadow-md border-2 border-white dark:border-gray-900 animate-bounce">
            🔥
          </div>
        </div>

        <div class="flex-grow min-w-0">
          <h3 class="text-xs font-black uppercase tracking-widest mb-0.5"
              :style="{ color: levelColor }">
            {{ levelTitle }}
          </h3>
          <p class="text-[10px] text-slate-500 dark:text-gray-400 font-medium">
            {{ ibadahStore.totalXP.toLocaleString() }} XP Total
          </p>

          <!-- XP Progress Bar -->
          <div class="mt-2 h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-1000 ease-out"
                 :style="{ 
                   width: `${ibadahStore.xpProgress}%`,
                   background: `linear-gradient(90deg, ${levelColor}, ${levelColor}99)`,
                 }"></div>
          </div>
          <div class="flex justify-between mt-1">
            <span class="text-[8px] text-slate-400 font-bold">
              {{ ibadahStore.xpProgress }} / {{ ibadahStore.xpForNextLevel }} XP
            </span>
            <span v-if="ibadahStore.currentStreak > 0" class="text-[8px] text-orange-500 font-black">
              🔥 {{ ibadahStore.currentStreak }} hari berturut-turut
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- 2. LEADERBOARD                                         -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <div class="glass rounded-[2rem] p-5 border border-white/10">
      <!-- Tab switcher -->
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
          🏆 Papan Peringkat
        </h2>
        <button @click="refreshLeaderboard" class="text-[9px] font-black text-green-600 bg-green-100 dark:bg-green-500/10 px-3 py-1 rounded-full uppercase tracking-widest hover:bg-green-200 transition-all">
          <i class="fas fa-sync-alt mr-1" :class="{'animate-spin': loadingLeaderboard}"></i>
          Refresh
        </button>
      </div>

      <!-- Leaderboard List -->
      <div v-if="loadingLeaderboard" class="space-y-3 animate-pulse">
        <div v-for="i in 5" :key="i" class="h-14 bg-slate-100 dark:bg-white/5 rounded-2xl"></div>
      </div>

      <div v-else-if="ibadahStore.leaderboard.length > 0" class="space-y-2">
        <div v-for="(user, index) in ibadahStore.leaderboard" :key="user.id"
             class="flex items-center gap-3 p-3 rounded-2xl transition-all"
             :class="[
               index < 3 ? podiumClass(index) : 'hover:bg-slate-50 dark:hover:bg-white/5',
               user.id === authStore.user?.id ? 'ring-2 ring-green-500/30' : ''
             ]">
          
          <!-- Rank Badge -->
          <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black"
               :class="rankClass(index)">
            <span v-if="index < 3">{{ ['🥇', '🥈', '🥉'][index] }}</span>
            <span v-else class="text-slate-400 text-xs">#{{ index + 1 }}</span>
          </div>

          <!-- Avatar -->
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-sm"
               :class="getAvatarBg(user.display_name || user.username)">
            {{ (user.display_name || user.username)?.charAt(0)?.toUpperCase() || '?' }}
          </div>

          <!-- Info -->
          <div class="flex-grow min-w-0">
            <p class="text-xs font-bold text-slate-800 dark:text-white truncate flex items-center gap-1">
              {{ user.display_name || user.username }}
              <span v-if="user.id === authStore.user?.id" class="text-[7px] bg-green-500/20 text-green-500 px-1 py-0.5 rounded-full uppercase">Anda</span>
            </p>
            <div class="flex items-center gap-2">
              <span class="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-lg"
                    :style="{ background: getLevelColor(user.level) + '15', color: getLevelColor(user.level) }">
                Lv.{{ user.level || 1 }}
              </span>
              <span v-if="user.current_streak > 0" class="text-[8px] text-orange-500 font-black">🔥{{ user.current_streak }}</span>
            </div>
          </div>

          <!-- XP -->
          <div class="text-right shrink-0">
            <p class="text-sm font-black" :class="index < 3 ? 'text-green-600' : 'text-slate-600 dark:text-gray-300'">
              {{ formatXp(user.total_xp) }}
            </p>
            <p class="text-[7px] text-slate-400 uppercase tracking-widest font-bold">XP</p>
          </div>
        </div>
      </div>

      <!-- Empty leaderboard -->
      <div v-else class="text-center py-10">
        <div class="w-16 h-16 mx-auto bg-yellow-50 dark:bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-3">
          <span class="text-2xl">🏅</span>
        </div>
        <h3 class="text-sm font-black text-slate-600 dark:text-gray-300 mb-1">Belum Ada Data</h3>
        <p class="text-[10px] text-slate-400 max-w-[200px] mx-auto">
          Mulailah mencatat ibadah untuk muncul di leaderboard!
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useIbadahStore } from '@/stores/ibadahStore';
import { useAuthStore } from '@/stores/authStore';

const ibadahStore = useIbadahStore();
const authStore = useAuthStore();
const loadingLeaderboard = ref(false);

// ===== COMPUTED =====
const levelColor = computed(() => {
  const lvl = ibadahStore.level;
  if (lvl >= 15) return '#f59e0b';
  if (lvl >= 10) return '#7c3aed';
  if (lvl >= 5) return '#0284c7';
  return '#10b981';
});

const levelTitle = computed(() => {
  const lvl = ibadahStore.level;
  if (lvl >= 15) return 'Mursyid';
  if (lvl >= 10) return 'Ahlul Ibadah';
  if (lvl >= 7) return 'Penuntut Ilmu';
  if (lvl >= 5) return 'Pejuang Sunnah';
  if (lvl >= 3) return 'Muhsin';
  return 'Pemula';
});

// ===== HELPERS =====
const avatarColors = [
  'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 
  'bg-indigo-500', 'bg-teal-500', 'bg-pink-500',
];
const getAvatarBg = (name) => {
  if (!name) return 'bg-slate-400';
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length];
};

const getLevelColor = (level) => {
  const colors = {
    1: '#94a3b8', 2: '#10b981', 3: '#059669', 4: '#047857',
    5: '#0d9488', 6: '#0891b2', 7: '#0284c7', 8: '#2563eb',
    9: '#4f46e5', 10: '#7c3aed', 11: '#9333ea', 12: '#c026d3',
  };
  return colors[level] || '#10b981';
};

const rankClass = (index) => {
  if (index === 0) return 'bg-yellow-100 dark:bg-yellow-500/10';
  if (index === 1) return 'bg-slate-100 dark:bg-white/5';
  if (index === 2) return 'bg-orange-50 dark:bg-orange-500/10';
  return 'bg-transparent';
};

const podiumClass = (index) => {
  if (index === 0) return 'bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-500/5 dark:to-transparent border border-yellow-100 dark:border-yellow-500/10';
  if (index === 1) return 'bg-gradient-to-r from-slate-50 to-transparent dark:from-white/3 dark:to-transparent border border-slate-100 dark:border-white/5';
  if (index === 2) return 'bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-500/5 dark:to-transparent border border-orange-100 dark:border-orange-500/10';
  return '';
};

const formatXp = (xp) => {
  if (!xp) return '0';
  if (xp >= 1000) return (xp / 1000).toFixed(1) + 'k';
  return xp.toLocaleString();
};

const refreshLeaderboard = async () => {
  loadingLeaderboard.value = true;
  await ibadahStore.fetchLeaderboard();
  loadingLeaderboard.value = false;
};

// ===== LIFECYCLE =====
onMounted(async () => {
  loadingLeaderboard.value = true;
  await ibadahStore.fetchLeaderboard();
  loadingLeaderboard.value = false;
});
</script>

<style scoped>
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
.dark .glass {
  background: rgba(15, 23, 42, 0.6);
}
</style>
