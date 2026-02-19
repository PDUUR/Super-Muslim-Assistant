<template>
  <div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
    <!-- Background Decor -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <div class="absolute -top-24 -left-24 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 -right-32 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
    </div>

    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-green-600 text-white shadow-xl shadow-green-500/20 mb-4 animate-bounce-subtle">
          <i class="fas fa-moon text-2xl"></i>
        </div>
        <h2 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {{ isLogin ? 'Ahlan wa Sahlan' : 'Gabung Kebaikan' }}
        </h2>
        <p class="mt-2 text-sm text-slate-500 dark:text-gray-400 font-medium">
          {{ isLogin ? 'Masuk untuk memantau progres ibadahmu' : 'Mulai perjalanan hijrah dan berbagi inspirasi' }}
        </p>
      </div>

      <div class="glass rounded-[2.5rem] p-8 shadow-2xl border border-white/20 dark:border-white/5 relative">
        <!-- Tab Switcher -->
        <div class="flex p-1 bg-slate-100 dark:bg-white/5 rounded-2xl mb-8">
          <button @click="isLogin = true" 
                  class="flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                  :class="isLogin ? 'bg-white dark:bg-gray-800 text-green-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'">
            Masuk
          </button>
          <button @click="isLogin = false"
                  class="flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                  :class="!isLogin ? 'bg-white dark:bg-gray-800 text-green-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'">
            Daftar
          </button>
        </div>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div v-if="!isLogin" class="space-y-5 animate-slide-up">
             <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Username</label>
              <div class="relative">
                <i class="fas fa-at absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input v-model="form.username" type="text" required
                       placeholder="ahmad_hijrah"
                       class="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm font-bold text-slate-900 dark:text-white">
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Nama Tampilan</label>
              <div class="relative">
                <i class="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input v-model="form.display_name" type="text" required
                       placeholder="Ahmad"
                       class="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm font-bold text-slate-900 dark:text-white">
              </div>
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Email</label>
            <div class="relative">
              <i class="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input v-model="form.email" type="email" required
                     placeholder="contoh@gmail.com"
                     class="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm font-bold text-slate-900 dark:text-white">
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Password</label>
            <div class="relative">
              <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input v-model="form.password" :type="showPass ? 'text' : 'password'" required
                     placeholder="••••••••"
                     class="w-full pl-11 pr-12 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm font-bold text-slate-900 dark:text-white">
              <button @click.prevent="showPass = !showPass" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <i :class="showPass ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-xs"></i>
              </button>
            </div>
          </div>

          <div v-if="error" class="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-2xl text-[10px] font-bold uppercase leading-relaxed border border-red-100 dark:border-red-500/20 flex items-start gap-3">
             <i class="fas fa-exclamation-circle mt-0.5"></i>
             <span>{{ error }}</span>
          </div>

          <button type="submit" :disabled="loading"
                  class="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-green-500/20 transition-all active:scale-95 flex items-center justify-center gap-3">
            <template v-if="loading">
              <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Sedang Memproses...
            </template>
            <template v-else>
              {{ isLogin ? 'Masuk Sekarang' : 'Daftar Akun' }}
              <i class="fas fa-arrow-right text-[10px]"></i>
            </template>
          </button>
        </form>

        <div v-if="isLogin" class="mt-6 text-center">
          <button @click="handleForgotPassword" class="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-green-600 transition-colors">Lupa Password?</button>
        </div>

        <!-- Social Login Divider -->
        <div class="relative my-8">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-100 dark:border-white/5"></div>
          </div>
          <div class="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
            <span class="px-4 bg-white dark:bg-[#111827] text-slate-400">Atau</span>
          </div>
        </div>

        <!-- Google Login Button -->
        <button @click="handleGoogleLogin" 
                class="w-full bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 text-slate-700 dark:text-gray-300 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-3">
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" class="w-4 h-4" alt="Google">
          Lanjutkan dengan Google
        </button>
      </div>
      
      <!-- Footer Info -->
      <div class="mt-8 text-center space-y-4">
        <p class="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">Super Muslim Assistant • Versi 1.0</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useIbadahStore } from '@/stores/ibadahStore';

const router = useRouter();
const authStore = useAuthStore();
const ibadahStore = useIbadahStore();

const isLogin = ref(true);
const loading = ref(false);
const showPass = ref(false);
const error = ref(null);

const form = reactive({
  email: '',
  username: '',
  password: '',
  display_name: '',
});

const handleSubmit = async () => {
    loading.value = true;
    error.value = null;
    
    // Safety check: Jika loading > 8 detik, paksa stop
    const timeout = setTimeout(() => {
        if (loading.value) {
            console.warn('[AuthView] Timeout reached, forcing reload...');
            loading.value = false;
            // Cek apakah user sebenarnya sudah login di background
            if (authStore.isAuthenticated) {
                router.push(authStore.isAdmin ? '/admin' : '/');
            } else {
                error.value = 'Koneksi lambat. Silakan coba lagi.';
            }
        }
    }, 8000);

    try {
        if (isLogin.value) {
            await authStore.login({
                email: form.email,
                password: form.password
            });
        } else {
            await authStore.register({
                email: form.email,
                username: form.username,
                password: form.password,
                display_name: form.display_name
            });
        }
        
        // Sync data di background (jangan await)
        ibadahStore.syncWithBackend().catch(console.error);
        
        // Clear timeout karena sukses
        clearTimeout(timeout);

        if (authStore.isAdmin) {
            router.push('/admin');
        } else {
            router.push('/');
        }
    } catch (err) {
        clearTimeout(timeout);
        // Error handling khusus untuk 'timeout' buatan kita di store
        if (err === 'timeout' && authStore.isAuthenticated) {
            router.push('/'); 
        } else {
            error.value = err.message || 'Terjadi kesalahan. Silakan coba lagi.';
        }
    } finally {
        loading.value = false;
    }
};
const handleGoogleLogin = () => {
    alert("Fitur Login Google membutuhkan Konfigurasi Google Cloud Console (Client ID).\n\nUntuk tahap pengembangan ini, silakan gunakan form pendaftaran manual di atas.");
};

const handleForgotPassword = async () => {
    const email = prompt('Masukkan email Anda untuk reset password:');
    if (!email) return;

    loading.value = true;
    try {
        await authStore.resetPassword(email);
        alert('Email reset password telah dikirim ke ' + email + '. Silakan cek inbox (dan folder spam) Anda.');
    } catch (err) {
        alert('Gagal mengirim email reset: ' + err.message);
    } finally {
        loading.value = false;
    }
};
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

@keyframes bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.animate-bounce-subtle {
  animation: bounce-subtle 3s ease-in-out infinite;
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-slide-up {
  animation: slide-up 0.4s ease-out forwards;
}
</style>
