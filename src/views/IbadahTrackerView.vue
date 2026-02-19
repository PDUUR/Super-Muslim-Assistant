<template>
  <div class="w-full mx-auto pb-24 text-left">
    <!-- Tabs Navigation -->
    <div class="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl mb-6 glass">
        <button 
            v-for="tab in ['tracker', 'garden']" 
            :key="tab"
            @click="activeTab = tab"
            class="flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
            :class="activeTab === tab ? 'bg-white dark:bg-slate-800 shadow-sm text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-gray-500 hover:text-slate-600'"
        >
            {{ tab === 'tracker' ? '📝 LIST' : '🌳 Kebun' }}
        </button>
    </div>

    <!-- TAB: TRACKER -->
    <div v-show="activeTab === 'tracker'">
        <!-- Hero Level Card (Existing) -->
        <div class="mb-6 p-6 glass rounded-[2.5rem] text-center relative overflow-hidden">
        <!-- ... existing hero content ... -->
            <!-- XP Progress Bar -->
            <div class="mt-5 max-w-full mx-auto">
                <div class="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                    <span>{{ ibadahStore.xpProgress }} / {{ ibadahStore.xpForNextLevel }} XP</span>
                    <span>Lvl {{ ibadahStore.level + 1 }}</span>
                </div>
                <div class="h-2.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-700 ease-out" 
                         :class="levelGradient"
                         :style="{ width: `${(ibadahStore.xpProgress / ibadahStore.xpForNextLevel) * 100}%` }"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Stats Grid (Shared or Tab Specific? Let's keep common stats visible in tracker tab only for focus) -->
    <div v-show="activeTab === 'tracker'" class="grid grid-cols-2 gap-3 mb-6">
        <div class="glass rounded-2xl p-4 text-center active:scale-95 transition-all">
            <p class="text-2xl font-black text-green-600 dark:text-green-400">{{ ibadahStore.todayXP }}</p>
            <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">XP Hari Ini</p>
        </div>
        <div class="glass rounded-2xl p-4 text-center active:scale-95 transition-all">
            <p class="text-2xl font-black text-amber-600 dark:text-amber-400">🔥 {{ ibadahStore.currentStreak }}</p>
            <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Streak</p>
        </div>
    </div>

    <!-- Today's Progress Ring -->
    <div v-show="activeTab === 'tracker'" class="glass rounded-2xl p-5 mb-6 flex items-center gap-5 border-l-4 border-green-500">
        <div class="relative w-16 h-16 shrink-0">
            <svg class="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path class="text-slate-100 dark:text-white/5" stroke="currentColor" stroke-width="4" fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="text-green-500" stroke="currentColor" stroke-width="4" fill="none"
                      :stroke-dasharray="`${ibadahStore.todayProgress}, 100`"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <span class="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-900 dark:text-white">{{ ibadahStore.todayProgress }}%</span>
        </div>
        <div>
            <h4 class="font-black text-slate-800 dark:text-white text-sm leading-tight mb-0.5">
                {{ ibadahStore.todayProgress >= 100 ? 'Masya Allah! 🎉' : ibadahStore.todayProgress >= 70 ? 'Luar biasa! 💪' : 'Semangat! 🌙' }}
            </h4>
            <p class="text-[10px] text-slate-500">{{ ibadahStore.todayXP }} XP diraih hari ini</p>
        </div>
    </div>

    <!-- Ibadah Category Sections (Tracker Tab) -->
    <div v-show="activeTab === 'tracker'">
        <div v-for="category in categories" :key="category.id" class="mb-5">
            <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-2.5 flex items-center gap-2">
                <i :class="category.icon" class="text-xs"></i> {{ category.name }}
            </h4>
            <div class="space-y-2">
                <button v-for="item in itemsByCategory(category.id)" :key="item.id" @click="ibadahStore.toggleIbadah(item.id)"
                        class="w-full glass p-3.5 rounded-xl flex items-center gap-3.5 text-left active:scale-[0.98] transition-all"
                        :class="ibadahStore.isChecked(item.id) ? 'bg-green-50 dark:bg-green-500/10' : ''">
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-base"
                         :class="ibadahStore.isChecked(item.id) ? 'bg-green-500 text-white' : 'bg-slate-50 dark:bg-white/5 text-slate-400'">
                        <i :class="ibadahStore.isChecked(item.id) ? 'fas fa-check' : item.icon"></i>
                    </div>
                    <div class="flex-grow">
                        <p class="font-bold text-xs" :class="ibadahStore.isChecked(item.id) ? 'text-green-700 dark:text-green-400 line-through' : 'text-slate-700 dark:text-gray-300'">
                            {{ item.name }}
                        </p>
                    </div>
                    <div class="text-[8px] font-black bg-amber-500/10 text-amber-600 px-2 py-1 rounded-md">
                        +{{ item.xp }} XP
                    </div>
                </button>
            </div>
        </div>
    </div>

    <!-- TAB: GARDEN -->
    <div v-if="activeTab === 'garden'" class="animate-fade-in">
        <div class="mb-6">
            <VirtualGarden />
            
            <div class="mt-6 p-4 glass rounded-2xl">
                <h3 class="text-xs font-black uppercase tracking-widest mb-3 text-slate-400">Panduan Perawatan</h3>
                <ul class="space-y-2 text-[10px] text-slate-600 dark:text-slate-400">
                    <li class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-green-500"></span> Sholat 5 Waktu: Menambah kesuburan (+HP)</li>
                    <li class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-amber-500"></span> Dzikir/Sedekah: Memancing lebah (Bonus)</li>
                    <li class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-blue-500"></span> Tahajjud: Efek malam hari yang indah</li>
                </ul>
            </div>
        </div>
    </div>

    <!-- Level Up Overlay (Shared) -->
    <Transition name="bounce">
        <div v-if="showLevelUp" class="fixed inset-0 z-[100] flex items-center justify-center p-6 text-center">
            <div class="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" @click="showLevelUp = false"></div>
            
            <!-- Particle Effects -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <div v-for="i in 20" :key="i" class="particle" 
                     :style="{ 
                        left: Math.random() * 100 + '%', 
                        top: Math.random() * 100 + '%',
                        animationDelay: Math.random() * 2 + 's',
                        backgroundColor: ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6'][Math.floor(Math.random() * 4)]
                     }"></div>
            </div>

            <div class="relative glass-premium p-10 rounded-[3.5rem] border-2 border-amber-400/50 shadow-[0_0_80px_rgba(251,191,36,0.3)] max-w-[340px] animate-popup">
                <div class="absolute -top-12 left-1/2 -translate-x-1/2 text-7xl animate-bounce">🎊</div>
                <h2 class="text-4xl font-black text-white mb-2 tracking-tight">Level Up!</h2>
                <p class="text-amber-400 font-black text-xl mb-8">Mencapai Level {{ ibadahStore.level }}</p>
                
                <div class="relative mb-10">
                    <div class="absolute inset-0 bg-amber-400 blur-3xl opacity-20 rounded-full"></div>
                    <div class="relative text-7xl transform hover:scale-110 transition-transform duration-500">{{ currentLevelEmoji }}</div>
                </div>

                <button @click="showLevelUp = false" class="w-full py-5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 rounded-2xl text-slate-900 font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(245,158,11,0.4)] active:scale-95 transition-all hover:brightness-110">
                    Lanjutkan Perjuangan
                </button>
            </div>
        </div>
    </Transition>

    <!-- Achievements (Shared) -->
    <div v-show="activeTab === 'tracker'" class="mt-8 mb-6">
        <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 flex justify-between items-center">
            Galeri Pencapaian
            <span class="text-[9px] text-green-500 font-black">{{ ibadahStore.unlockedBadges.length }} / {{ ibadahStore.badgeDefinitions.length }}</span>
        </h3>
        
        <!-- Achievement Gallery Component -->
        <AchievementGallery />
    </div>
    
    <!-- Leaderboard (Tracker Tab) -->
    <div v-show="activeTab === 'tracker'" class="mt-8 mb-8">
        <h3 class="text-sm font-black text-slate-800 dark:text-gray-200 uppercase tracking-widest pl-1 mb-4">Papan Peringkat Global</h3>
        <div class="glass rounded-[2rem] overflow-hidden border border-white/20">
            <template v-if="ibadahStore.leaderboard.length">
                <div v-for="(entry, index) in ibadahStore.leaderboard" :key="entry.id" 
                    class="flex items-center gap-4 p-4 border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors"
                    :class="entry.id === authStore.user?.id ? 'bg-green-500/10' : ''">
                    <div class="w-8 text-center font-black text-xs" :class="index < 3 ? 'text-amber-500 text-sm' : 'text-slate-400'">
                        {{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1 }}
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center font-black text-slate-500 overflow-hidden shrink-0 border border-white/10">
                        <img v-if="entry.avatar_url" :src="entry.avatar_url" class="w-full h-full object-cover">
                        <span v-else>{{ (entry.display_name || entry.username || 'U').charAt(0).toUpperCase() }}</span>
                    </div>
                    <div class="flex-grow">
                        <h4 class="font-black text-xs text-slate-800 dark:text-white flex items-center gap-1.5">
                            {{ entry.display_name || entry.username }}
                            <span v-if="entry.id === authStore.user?.id" class="text-[8px] bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Anda</span>
                        </h4>
                        <div class="flex items-center gap-3">
                            <p class="text-[9px] text-slate-500 uppercase tracking-widest">Lvl {{ entry.level }}</p>
                            <!-- Mini Garden Health Indicator -->
                            <div class="flex items-center gap-1.5">
                                <div class="w-10 h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div class="h-full bg-green-500" :style="{ width: `${entry.garden_health || 0}%` }"></div>
                                </div>
                                <span class="text-[8px] font-bold text-slate-400">🌳 {{ entry.garden_health || 0 }}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-black text-xs text-green-600 dark:text-green-400">{{ entry.total_xp }}</p>
                        <p class="text-[8px] text-slate-400 uppercase">Total XP</p>
                    </div>
                </div>
            </template>
            <div v-else class="p-8 text-center text-slate-400 text-xs italic">
                Belum ada data peringkat...
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useIbadahStore } from '@/stores/ibadahStore';
import { useAuthStore } from '@/stores/authStore';
import VirtualGarden from '@/components/VirtualGarden.vue';
import AchievementGallery from '@/components/AchievementGallery.vue';

const ibadahStore = useIbadahStore();
const authStore = useAuthStore();
const showLevelUp = ref(false);
const activeTab = ref('tracker'); // NEW STATE: Default to 'tracker'

// Watch for level changes to trigger animation
watch(() => ibadahStore.level, (newVal, oldVal) => {
    if (oldVal && newVal > oldVal) {
        showLevelUp.value = true;
        // Optionally play sound
    }
});

const handleBadgeClick = async (badge) => {
    const status = ibadahStore.getBadgeStatus(badge.id);
    if (status.unlocked && !status.claimed) {
        try {
            await ibadahStore.claimBadge(badge.id);
            alert(`Selamat! Anda mendapatkan bonus XP dari pencapaian ${badge.name}`);
        } catch (e) {
            alert(e.message || 'Gagal mengambil bonus.');
        }
    }
};

onMounted(async () => {
    await ibadahStore.syncWithBackend();
});

const categories = [
    { id: 'shalat', name: 'Shalat Wajib', icon: 'fas fa-mosque' },
    { id: 'sunnah', name: 'Shalat Sunnah', icon: 'fas fa-hands-praying' },
    { id: 'quran', name: 'Al-Quran', icon: 'fas fa-book-quran' },
    { id: 'dzikir', name: 'Dzikir & Doa', icon: 'fas fa-spa' },
    { id: 'amal', name: 'Amal Kebaikan', icon: 'fas fa-hand-holding-heart' },
    { id: 'puasa', name: 'Puasa', icon: 'fas fa-utensils' },
];

const itemsByCategory = (catId) => ibadahStore.ibadahItems.filter(i => i.category === catId);
const weeklyData = computed(() => ibadahStore.getWeeklyData());

const currentLevelEmoji = computed(() => {
    const lvl = ibadahStore.level;
    if (lvl >= 20) return '👑';
    if (lvl >= 15) return '💎';
    if (lvl >= 10) return '🏆';
    if (lvl >= 7) return '⭐';
    if (lvl >= 5) return '🏅';
    if (lvl >= 3) return '🌙';
    return '🌟';
});

const levelGradient = computed(() => {
    const lvl = ibadahStore.level;
    if (lvl >= 15) return 'bg-gradient-to-r from-amber-500 to-yellow-400';
    if (lvl >= 10) return 'bg-gradient-to-r from-purple-500 to-pink-500';
    if (lvl >= 5) return 'bg-gradient-to-r from-blue-500 to-cyan-400';
    return 'bg-gradient-to-r from-green-500 to-emerald-400';
});

// History Logic
const last30Days = computed(() => {
    const data = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const log = ibadahStore.dailyLogs[key] || [];
        data.push({ date: key, count: log.length });
    }
    return data;
});

const getHeatmapColor = (count) => {
    if (count >= 10) return 'bg-green-600';
    if (count >= 5) return 'bg-green-500';
    if (count >= 1) return 'bg-green-300 dark:bg-green-700/50';
    return 'bg-slate-100 dark:bg-white/5';
};

const formatDateShort = (dateStr) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('id-ID', options);
};
</script>

<style scoped>
.bounce-enter-active {
  animation: bounce-in 0.5s;
}
.bounce-leave-active {
  animation: bounce-in 0.5s reverse;
}
@keyframes bounce-in {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.glass-premium {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.particle {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    animation: float-particle 4s infinite linear;
    opacity: 0.6;
}

@keyframes float-particle {
    0% { transform: translateY(0) rotate(0); opacity: 0; }
    50% { opacity: 0.8; }
    100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
}

.animate-popup {
    animation: popup 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes popup {
    from { transform: scale(0.8) translateY(20px); opacity: 0; }
    to { transform: scale(1) translateY(0); opacity: 1; }
}

.glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
