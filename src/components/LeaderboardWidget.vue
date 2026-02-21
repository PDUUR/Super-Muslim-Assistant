<template>
  <div class="bg-white/10 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 dark:border-white/5 overflow-hidden shadow-2xl flex flex-col h-full min-h-[500px]">
    
    <!-- Header: Premium Glass Style -->
    <div class="p-6 pb-2">
      <div class="flex items-center justify-between mb-6">
        <div>
            <h3 class="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <span class="text-2xl">🏆</span>
                Leaderboard
            </h3>
            <p class="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-black tracking-[0.2em]">Klasemen Umat Terbaik</p>
        </div>
        <div class="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span class="text-[9px] font-black text-green-600 dark:text-green-400 uppercase">Live Update</span>
        </div>
      </div>

      <!-- Tabs / Toggle -->
      <div class="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/5">
        <button 
            @click="communityStore.subscribeLeaderboard('all-time')"
            class="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300"
            :class="communityStore.leaderboardType === 'all-time' 
                ? 'bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 shadow-md scale-[1.02]' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-gray-300'">
            Top Selamanya
        </button>
        <button 
            @click="communityStore.subscribeLeaderboard('weekly')"
            class="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300"
            :class="communityStore.leaderboardType === 'weekly' 
                ? 'bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 shadow-md scale-[1.02]' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-gray-300'">
            Top Mingguan
        </button>
      </div>
    </div>

    <!-- My Position (Sticky/Featured) -->
    <div v-if="communityStore.myStats" class="px-6 py-4">
        <div class="bg-gradient-to-r from-green-600 to-emerald-700 p-4 rounded-3xl shadow-lg shadow-green-500/20 flex items-center justify-between border border-white/20 text-white">
            <div class="flex items-center gap-3">
                <div class="relative">
                    <img :src="communityStore.myStats.avatar_url || defaultAvatar" class="w-12 h-12 rounded-2xl object-cover border-2 border-white/30" />
                    <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-green-700 shadow-sm border border-green-100">
                        {{ getMyRank }}
                    </div>
                </div>
                <div>
                    <h4 class="text-xs font-black uppercase tracking-tight">{{ communityStore.myStats.display_name || 'Hamba Allah' }}</h4>
                    <p class="text-[10px] font-bold opacity-80 uppercase">Level {{ currentLevel(communityStore.myStats) }}</p>
                </div>
            </div>
            <div class="text-right">
                <span class="block text-lg font-black leading-none">{{ formatNumber(currentXP(communityStore.myStats)) }}</span>
                <span class="text-[9px] font-black uppercase opacity-70">Poin</span>
            </div>
        </div>
    </div>

    <!-- Leaderboard List -->
    <div class="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar space-y-3 pt-2">
        <transition-group name="list">
            <div v-for="(user, index) in communityStore.leaderboard" :key="user.id" 
                class="group flex items-center gap-4 p-4 rounded-[1.8rem] border border-slate-50 dark:border-white/5 transition-all duration-500 hover:bg-white dark:hover:bg-white/5 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none hover:-translate-y-1"
                :class="{'bg-green-500/5 border-green-500/10': user.id === authStore.userId}">
                
                <!-- Rank Visual -->
                <div class="w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <div v-if="index === 0" class="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-amber-200/50">🥇</div>
                    <div v-else-if="index === 1" class="w-10 h-10 bg-slate-100 dark:bg-slate-400/20 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-slate-200/50">🥈</div>
                    <div v-else-if="index === 2" class="w-10 h-10 bg-orange-100 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-orange-200/50">🥉</div>
                    <span v-else class="text-sm font-black text-slate-300 dark:text-gray-600 italic">#{{ index + 1 }}</span>
                </div>

                <!-- User Data -->
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <div class="relative">
                        <img :src="user.avatar_url || defaultAvatar" class="w-11 h-11 rounded-2xl object-cover shadow-md group-hover:scale-110 transition-transform duration-500" />
                        <span v-if="user.isOnline" class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-pulse"></span>
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-1.5">
                            <span class="text-[13px] font-black text-slate-800 dark:text-white truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                                {{ user.display_name || user.username }}
                            </span>
                            <i v-if="user.role === 'admin'" class="fas fa-check-circle text-blue-500 text-[10px]" title="Admin Verified"></i>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-[9px] font-black text-slate-400 bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded-md uppercase tracking-widest">
                                Level {{ currentLevel(user) }}
                            </span>
                            <span v-if="user.city_name" class="text-[8px] text-slate-400 font-bold truncate">📍 {{ user.city_name }}</span>
                        </div>
                    </div>
                </div>

                <!-- Points info -->
                <div class="text-right flex-shrink-0">
                    <div class="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1 justify-end">
                        {{ formatNumber(currentXP(user)) }}
                        <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                    </div>
                    <span class="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{{ communityStore.leaderboardType === 'all-time' ? 'XP Selamanya' : 'XP Mingguan' }}</span>
                </div>
            </div>
        </transition-group>

        <!-- Empty State -->
        <div v-if="!communityStore.leaderboard.length && !communityStore.isLoading" class="text-center py-20">
            <div class="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200 dark:text-gray-700">
                <i class="fas fa-trophy text-3xl"></i>
            </div>
            <p class="text-sm font-bold text-slate-400">Belum ada pejuang di kriteria ini.</p>
        </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useCommunityStore } from '@/stores/communityStore'
import { useAuthStore } from '@/stores/authStore'

const communityStore = useCommunityStore()
const authStore = useAuthStore()

const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky&backgroundColor=b6e3f4'

const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString('id-ID')
}

// Helpers untuk mengambil field yang sesuai dengan tipe leaderboard aktif
const currentXP = (user) => {
    return communityStore.leaderboardType === 'all-time' 
        ? (user.total_points || 0) 
        : (user.weeklyXp || 0)
}

const currentLevel = (user) => {
    return communityStore.leaderboardType === 'all-time' 
        ? (user.level || 1) 
        : (user.weeklyLevel || 1)
}

const getMyRank = computed(() => {
    const index = communityStore.leaderboard.findIndex(u => u.id === authStore.userId)
    if (index === -1) return '-'
    return index + 1
})

onMounted(() => {
  // Masih menggunakan type default 'all-time' saat dimuat
  communityStore.subscribeLeaderboard('all-time')
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(16, 185, 129, 0.2);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(16, 185, 129, 0.4);
}

/* Animations */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
.list-leave-active {
  position: absolute;
}
</style>
