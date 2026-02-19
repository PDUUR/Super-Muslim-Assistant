<template>
  <div class="achievement-gallery py-6">
    <!-- Category Tabs -->
    <div class="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar px-2">
      <button 
        v-for="cat in categories" 
        :key="cat.id"
        @click="activeCategory = cat.id"
        class="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2"
        :class="activeCategory === cat.id 
          ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30' 
          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'"
      >
        {{ cat.name }}
      </button>
    </div>

    <!-- Achievement Grid -->
    <div class="grid grid-cols-3 gap-4 px-2">
      <div 
        v-for="badge in filteredBadges" 
        :key="badge.id"
        @click="selectBadge(badge)"
        class="relative group cursor-pointer"
      >
        <!-- Badge Card -->
        <div 
          class="aspect-square rounded-3xl flex flex-col items-center justify-center p-4 transition-all duration-500 border-4"
          :class="[
            isUnlocked(badge.id) 
              ? 'bg-white dark:bg-slate-800 shadow-xl border-white dark:border-slate-700 animate-glow' 
              : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800/50 opacity-60 grayscale'
          ]"
        >
          <!-- Badge Icon -->
          <div class="text-3xl mb-2 transition-transform duration-500 group-hover:scale-110">
            {{ badge.icon }}
          </div>
          
          <!-- Tier Dot -->
          <div class="flex gap-1">
             <div v-for="i in 3" :key="i" 
                  class="w-1 h-1 rounded-full"
                  :class="getTierColor(badge.tier, i)"></div>
          </div>
        </div>

        <!-- Unlocked Indicator -->
        <div v-if="isUnlocked(badge.id)" class="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center text-[8px] text-white">
          <i class="fas fa-check"></i>
        </div>
      </div>
    </div>

    <!-- Badge Info Popup -->
    <Transition name="fade">
      <div v-if="selectedBadge" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md" @click="selectedBadge = null">
        <div class="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl relative overflow-hidden" @click.stop>
          <!-- Background Glow -->
          <div class="absolute -top-20 -right-20 w-40 h-40 bg-green-500/20 blur-[80px]"></div>
          
          <div class="relative z-10 text-center">
            <div class="text-6xl mb-6 transform scale-125">{{ selectedBadge.icon }}</div>
            <h3 class="text-xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">{{ selectedBadge.name }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed px-4">{{ selectedBadge.desc }}</p>
            
            <div class="flex flex-col gap-3">
              <div class="bg-slate-50 dark:bg-slate-900/50 py-3 px-4 rounded-2xl flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                <span :class="isUnlocked(selectedBadge.id) ? 'text-green-500' : 'text-slate-400'" class="text-[10px] font-black uppercase">
                  {{ isUnlocked(selectedBadge.id) ? 'Sudah Tercapai' : 'Terkunci' }}
                </span>
              </div>
              
              <button 
                @click="selectedBadge = null"
                class="w-full py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useIbadahStore } from '@/stores/ibadahStore';

const ibadahStore = useIbadahStore();
const activeCategory = ref('al_hafiz');
const selectedBadge = ref(null);

const categories = [
    { id: 'al_hafiz', name: 'Al-Hafiz' },
    { id: 'guardian', name: 'The Guardian' },
    { id: 'philanthropist', name: 'Philanthropist' },
    { id: 'scholar', name: 'Scholar' }
];

const filteredBadges = computed(() => {
    return ibadahStore.badgeDefinitions.filter(b => b.category === activeCategory.value);
});

const isUnlocked = (id) => {
    return ibadahStore.unlockedBadges.some(b => b.badge_id === id);
};

const selectBadge = (badge) => {
    selectedBadge.value = badge;
};

const getTierColor = (tier, index) => {
    const isGold = tier === 'gold';
    const isSilver = tier === 'silver' || isGold;
    const isBronze = tier === 'bronze' || isSilver;
    
    if (index === 1 && isBronze) return 'bg-amber-600'; // Bronze
    if (index === 2 && isSilver) return 'bg-slate-400'; // Silver
    if (index === 3 && isGold) return 'bg-yellow-400'; // Gold
    return 'bg-slate-200 dark:bg-slate-700'; // Locked
};
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

@keyframes glow {
  0%, 100% { border-color: rgba(34, 197, 94, 0.2); }
  50% { border-color: rgba(34, 197, 94, 0.6); box-shadow: 0 0 20px rgba(34, 197, 94, 0.2); }
}

.animate-glow {
  animation: glow 3s infinite ease-in-out;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
