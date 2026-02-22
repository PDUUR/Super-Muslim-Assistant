<template>
  <div class="w-full mx-auto pb-24 text-left">
    <!-- Profile Header -->
    <div class="mb-8 p-8 glass rounded-[3rem] text-center relative overflow-hidden bg-gradient-to-br from-green-600/10 to-emerald-600/5 border border-white/20">
      <div class="absolute -right-20 -top-20 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
      
      <div class="relative z-10">
        <div class="w-24 h-24 mx-auto rounded-[2.5rem] bg-gradient-to-br from-green-500 to-emerald-600 p-1 shadow-2xl mb-4 group relative">
          <div class="w-full h-full rounded-[2.2rem] bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-900">
            <img v-if="authStore.profile?.avatar_url" :src="authStore.profile.avatar_url" class="w-full h-full object-cover">
            <i v-else class="fas fa-user text-3xl text-slate-300"></i>
          </div>
        </div>

        <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-1">{{ authStore.profile?.display_name || authStore.profile?.username || 'User' }}</h2>
        <p class="text-slate-500 dark:text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] mb-4">Level {{ authStore.profile?.level || 1 }} Muslim</p>
        
        <div class="flex justify-center gap-6">
          <div class="text-center">
            <p class="text-lg font-black text-green-600">{{ authStore.profile?.total_points || 0 }}</p>
            <p class="text-[8px] font-black uppercase text-slate-400">Total XP</p>
          </div>
          <div class="w-[1px] h-8 bg-slate-200 dark:bg-white/10"></div>
          <div class="text-center">
            <p class="text-lg font-black text-amber-500">🔥 {{ authStore.profile?.current_streak || 0 }}</p>
            <p class="text-[8px] font-black uppercase text-slate-400">Streak</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Profile Form -->
    <div class="space-y-6 px-2">
      <div class="glass rounded-3xl p-6 border border-white/20">
        <h3 class="font-black text-sm text-slate-800 dark:text-white mb-6 flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <i class="fas fa-user-edit text-xs"></i>
          </div>
          Informasi Profil
        </h3>

        <div class="space-y-4">
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Nama Tampilan</label>
            <input v-model="form.display_name" class="w-full glass px-4 py-3 rounded-2xl text-xs border border-slate-100 dark:border-white/5 focus:ring-2 focus:ring-green-500/20 outline-none transition-all">
          </div>
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Bio Singkat</label>
            <textarea v-model="form.bio" rows="3" class="w-full glass px-4 py-3 rounded-2xl text-xs border border-slate-100 dark:border-white/5 focus:ring-2 focus:ring-green-500/20 outline-none transition-all" placeholder="Tuliskan bio singkatmu..."></textarea>
          </div>
          
          <button @click="updateProfile" :disabled="updating" class="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50">
            {{ updating ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </div>

      <!-- Admin Access Button (Only for Admins) -->
      <div v-if="authStore.isAdmin" class="glass rounded-3xl p-6 border border-purple-500/30 relative overflow-hidden group cursor-pointer" @click="router.push('/admin')">
        <div class="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-all"></div>
        <div class="relative z-10 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
              <i class="fas fa-user-shield text-xl"></i>
            </div>
            <div>
              <h3 class="font-black text-sm text-slate-900 dark:text-white">Admin Dashboard</h3>
              <p class="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider">Akses penuh sistem</p>
            </div>
          </div>
          <div class="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <i class="fas fa-arrow-right text-xs"></i>
          </div>
        </div>
      </div>

      <div class="glass rounded-3xl p-6 border border-white/20">
        <h3 class="font-black text-sm text-slate-800 dark:text-white mb-6 flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
            <i class="fas fa-info-circle text-xs"></i>
          </div>
          Informasi Aplikasi
        </h3>
        
        <div class="space-y-3">
          <button @click="router.push('/changelog')" class="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 active:scale-[0.98] transition-all">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <i class="fas fa-history text-xs"></i>
              </div>
              <div class="text-left">
                <p class="text-xs font-black text-slate-800 dark:text-white">Catatan Pembaruan</p>
                <p class="text-[9px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider">Apa yang baru?</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[9px] px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full font-black">v{{ authStore.CURRENT_APP_VERSION }}</span>
              <i class="fas fa-chevron-right text-slate-300 text-[10px]"></i>
            </div>
          </button>
        </div>
      </div>

      <div class="glass rounded-3xl p-6 border border-white/20">
        <h3 class="font-black text-sm text-red-500 mb-6 flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <i class="fas fa-sign-out-alt text-xs"></i>
          </div>
          Akun
        </h3>
        <button @click="handleLogout" class="w-full bg-red-500/10 text-red-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-red-500/20 active:scale-95 transition-all">
          Keluar dari Aplikasi
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const updating = ref(false);

const form = reactive({
  display_name: authStore.profile?.display_name || '',
  bio: authStore.profile?.bio || '',
});

// Sync form when profile loads
onMounted(() => {
  if (authStore.profile) {
    form.display_name = authStore.profile.display_name || '';
    form.bio = authStore.profile.bio || '';
  }
});

const updateProfile = async () => {
  if (updating.value) return;
  updating.value = true;
  try {
    await authStore.updateProfile({
      display_name: form.display_name,
      bio: form.bio,
    });
    alert('Profil berhasil diperbarui! ✨');
  } catch (err) {
    alert('Gagal memperbarui profil: ' + (err.message || 'Unknown error'));
  } finally {
    updating.value = false;
  }
};

const handleLogout = async () => {
  if (confirm('Apakah Anda yakin ingin keluar?')) {
    await authStore.logout();
    router.push('/auth');
  }
};
</script>
