<template>
  <div class="space-y-6 p-4 max-w-6xl mx-auto">
    
    <!-- ═══════════════════════════════════════════ -->
    <!-- HEADER: Real-time Stats Cards              -->
    <!-- ═══════════════════════════════════════════ -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div v-for="s in statCards" :key="s.label"
           class="glass rounded-2xl p-4 border border-white/10 relative overflow-hidden">
        <div class="absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-20"
             :style="{ background: s.color }"></div>
        <p class="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">{{ s.label }}</p>
        <p class="text-2xl font-black" :style="{ color: s.color }">{{ s.value }}</p>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════ -->
    <!-- LIVE MONITORING TABLE                      -->
    <!-- ═══════════════════════════════════════════ -->
    <div class="glass rounded-[2rem] p-5 border border-white/10">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          Live Monitoring
        </h2>
        <div class="flex items-center gap-2">
          <span class="text-[8px] text-slate-400 font-mono">
            Refresh: {{ refreshCountdown }}s
          </span>
          <button @click="fetchLiveUsers" 
                  class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:bg-green-100 hover:text-green-600 transition-all active:scale-90">
            <i class="fas fa-sync-alt text-xs" :class="{ 'animate-spin': loading }"></i>
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto -mx-2">
        <table class="w-full text-xs">
          <thead>
            <tr class="text-[8px] font-black uppercase tracking-widest text-slate-400">
              <th class="text-left py-2 px-3">User</th>
              <th class="text-center py-2 px-3">Role</th>
              <th class="text-center py-2 px-3">Level</th>
              <th class="text-center py-2 px-3">XP</th>
              <th class="text-center py-2 px-3">Streak</th>
              <th class="text-center py-2 px-3">Aksi</th>
            </tr>
          </thead>
          <TransitionGroup tag="tbody" name="row">
            <tr v-for="user in liveUsers" :key="user.id"
                class="border-t border-slate-50 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/3 transition-all">
              
              <!-- User Info -->
              <td class="py-3 px-3">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white"
                       :class="getAvatarBg(user.display_name || user.username)">
                    {{ (user.display_name || user.username)?.charAt(0)?.toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-bold text-slate-800 dark:text-white text-[11px]">{{ user.display_name || user.username }}</p>
                    <p class="text-[8px] text-slate-400">@{{ user.username }}</p>
                  </div>
                </div>
              </td>

              <!-- Role -->
              <td class="text-center py-3 px-3">
                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black"
                      :class="user.role === 'admin' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600' : 'bg-slate-50 dark:bg-white/5 text-slate-400'">
                  {{ user.role === 'admin' ? '👑 Admin' : 'User' }}
                </span>
              </td>

              <!-- Level -->
              <td class="text-center py-3 px-3">
                <span class="font-black text-sm" :style="{ color: getLevelColor(user.level) }">
                  {{ user.level || 1 }}
                </span>
              </td>

              <!-- XP -->
              <td class="text-center py-3 px-3">
                <span class="font-bold text-slate-600 dark:text-gray-300">
                  {{ (user.total_points || 0).toLocaleString() }}
                </span>
              </td>

              <!-- Streak -->
              <td class="text-center py-3 px-3">
                <span v-if="user.current_streak > 0" class="text-orange-500 font-black">
                  🔥 {{ user.current_streak }}
                </span>
                <span v-else class="text-slate-300">—</span>
              </td>

              <!-- Actions -->
              <td class="text-center py-3 px-3">
                <div class="flex items-center justify-center gap-1">
                  <button @click="openEditXp(user)" title="Edit XP"
                          class="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 hover:bg-blue-100 transition-all flex items-center justify-center text-[10px]">
                    <i class="fas fa-edit"></i>
                  </button>
                </div>
              </td>
            </tr>
          </TransitionGroup>
        </table>
      </div>

      <div v-if="liveUsers.length === 0 && !loading" class="text-center py-10">
        <p class="text-xs text-slate-400">Tidak ada user saat ini.</p>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════ -->
    <!-- EDIT XP MODAL                              -->
    <!-- ═══════════════════════════════════════════ -->
    <div v-if="editModal.show" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="editModal.show = false"></div>
      <div class="glass w-full max-w-sm rounded-[2rem] p-6 relative z-10 border border-white/20 animate-zoom-in">
        <h3 class="text-lg font-black text-slate-800 dark:text-white mb-1">Edit XP</h3>
        <p class="text-[10px] text-slate-400 mb-4">{{ editModal.user?.display_name || editModal.user?.username }}</p>

        <div class="space-y-3">
          <div>
            <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Tambah/Kurangi XP</label>
            <input v-model.number="editModal.amount" type="number"
                   class="w-full p-3 bg-slate-50 dark:bg-white/5 rounded-xl text-sm font-bold border border-slate-100 dark:border-white/5 outline-none focus:ring-2 focus:ring-blue-500/20"
                   placeholder="Contoh: 100 atau -50">
          </div>
          <div>
            <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Alasan</label>
            <input v-model="editModal.reason" type="text" placeholder="Koreksi XP / Reward event"
                   class="w-full p-3 bg-slate-50 dark:bg-white/5 rounded-xl text-xs border border-slate-100 dark:border-white/5 outline-none focus:ring-2 focus:ring-blue-500/20">
          </div>
        </div>

        <div class="flex gap-2 mt-5">
          <button @click="editModal.show = false" 
                  class="flex-1 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600">Batal</button>
          <button @click="submitEditXp" :disabled="saving"
                  class="flex-[2] py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50">
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAdminStore } from '@/stores/adminStore';
import { useAuthStore } from '@/stores/authStore';

const adminStore = useAdminStore();
const authStore = useAuthStore();

const liveUsers = computed(() => adminStore.users);
const loading = computed(() => adminStore.isLoading);
const saving = ref(false);
const refreshCountdown = ref(15);
let countdownInterval = null;

const editModal = reactive({
  show: false,
  user: null,
  amount: 0,
  reason: '',
});

// ── Stats Cards ──
const statCards = computed(() => adminStore.statsCards);

// ── Fetch Functions ──
const fetchLiveUsers = async () => {
  await adminStore.fetchStats();
  refreshCountdown.value = 15;
};

// ── Edit XP ──
const openEditXp = (user) => {
  editModal.user = user;
  editModal.amount = user.total_points || 0; // Initialize with current points
  editModal.reason = '';
  editModal.show = true;
};

const submitEditXp = async () => {
  saving.value = true;
  try {
    // Note: adminStore.editUserPoints in this codebase seems to set absolute points
    await adminStore.editUserPoints(
      editModal.user.id, 
      editModal.amount, 
      editModal.reason || 'Admin Adjustment'
    );
    
    editModal.show = false;
    // Realtime listener in adminStore will update the list
  } catch (err) {
    alert(err.message || 'Gagal mengubah XP');
  } finally {
    saving.value = false;
  }
};

// ── Helpers ──
const avatarColors = ['bg-emerald-500','bg-blue-500','bg-purple-500','bg-amber-500','bg-rose-500','bg-cyan-500','bg-indigo-500'];
const getAvatarBg = (name) => {
  if (!name) return 'bg-slate-400';
  const h = name.split('').reduce((a,c) => a + c.charCodeAt(0), 0);
  return avatarColors[h % avatarColors.length];
};

const getLevelColor = (level) => {
  const c = { 1:'#94a3b8', 2:'#10b981', 3:'#059669', 4:'#047857', 5:'#0d9488', 6:'#0891b2', 7:'#0284c7', 8:'#2563eb', 9:'#4f46e5', 10:'#7c3aed' };
  return c[level] || '#10b981';
};

// ── Lifecycle ──
onMounted(async () => {
  if (authStore.isAdmin) {
    await adminStore.initialize();
    countdownInterval = setInterval(() => {
      refreshCountdown.value = Math.max(0, refreshCountdown.value - 1);
      if (refreshCountdown.value === 0) {
        fetchLiveUsers();
      }
    }, 1000);
  }
});

onUnmounted(() => {
  adminStore.cleanup();
  if (countdownInterval) clearInterval(countdownInterval);
});
</script>

<style scoped>
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
}
.dark .glass {
  background: rgba(15, 23, 42, 0.6);
}
.row-move { transition: transform 0.3s ease; }
.row-enter-active { transition: all 0.3s ease; }
.row-leave-active { transition: all 0.2s ease; position: absolute; }
.row-enter-from { opacity: 0; transform: translateY(-8px); }
.row-leave-to { opacity: 0; }
@keyframes zoom-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-zoom-in { animation: zoom-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
</style>
