<template>
  <div class="admin-system min-h-screen bg-slate-50 relative overflow-x-hidden">
    <!-- Desktop Sidebar -->
    <aside class="hidden lg:flex flex-col fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50">
      <div class="p-8">
        <div class="flex items-center gap-3 text-emerald-600 mb-8">
          <div class="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-xl">
            <i class="fas fa-user-shield"></i>
          </div>
          <span class="text-xl font-black tracking-tight text-slate-900">AdminPanel</span>
        </div>
        
        <nav class="space-y-2">
          <router-link v-for="item in navItems" :key="item.path" :to="item.path" 
            class="flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group"
            :class="[route.path === item.path ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900']">
            <i :class="[item.icon, route.path === item.path ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600']"></i>
            {{ item.label }}
          </router-link>
        </nav>
      </div>

      <div class="mt-auto p-8 border-t border-slate-100">
        <div class="flex items-center gap-4 p-4 rounded-3xl bg-slate-50">
          <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
            {{ userInitial }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-slate-900 truncate">{{ authStore.user?.display_name }}</p>
            <p class="text-xs text-slate-500 truncate">Administrator</p>
          </div>
          <button @click="logout" class="text-slate-400 hover:text-red-500 transition-colors">
            <i class="fas fa-power-off"></i>
          </button>
        </div>
      </div>
    </aside>

    <!-- Content Area -->
    <main class="lg:pl-72 flex-1 min-h-screen">
      <!-- Top Bar (Mobile/Tablet) -->
      <header class="lg:hidden sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center">
            <i class="fas fa-user-shield text-xs"></i>
          </div>
          <span class="font-bold text-slate-900">{{ currentLabel }}</span>
        </div>
        <button @click="isMobileMenuOpen = true" class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
          <i class="fas fa-bars"></i>
        </button>
      </header>

      <div class="p-6 md:p-10">
        <slot></slot>
      </div>
    </main>

    <!-- Mobile Drawer -->
    <Transition name="slide">
      <div v-if="isMobileMenuOpen" class="fixed inset-0 z-[100] lg:hidden">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="isMobileMenuOpen = false"></div>
        <div class="absolute right-0 inset-y-0 w-80 bg-white shadow-2xl p-8 flex flex-col">
          <div class="flex items-center justify-between mb-10">
            <span class="text-xl font-black text-slate-900">Menu Admin</span>
            <button @click="isMobileMenuOpen = false" class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <nav class="space-y-4">
            <router-link v-for="item in navItems" :key="item.path" :to="item.path" 
              @click="isMobileMenuOpen = false"
              class="flex items-center gap-4 px-6 py-4 rounded-2xl transition-all"
              :class="[route.path === item.path ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 font-bold' : 'bg-slate-50 text-slate-600']">
              <i :class="item.icon"></i>
              {{ item.label }}
            </router-link>
          </nav>

          <div class="mt-auto pt-8 border-t border-slate-100">
            <button @click="goHome" class="w-full px-6 py-4 rounded-2xl bg-slate-900 text-white flex items-center justify-center gap-3 mb-4">
              <i class="fas fa-home"></i> Ke Server User
            </button>
            <button @click="logout" class="w-full px-6 py-4 rounded-2xl bg-red-50 text-red-600 font-bold flex items-center justify-center gap-3">
              <i class="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Floating Back to Home Button (Desktop) -->
    <router-link to="/" class="hidden lg:flex fixed bottom-8 right-8 w-14 h-14 bg-slate-900 text-white rounded-2xl items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group z-50">
      <i class="fas fa-home"></i>
      <span class="absolute right-full mr-4 bg-slate-900 text-white px-3 py-1 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Ke Server User</span>
    </router-link>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const isMobileMenuOpen = ref(false);

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: 'fas fa-chart-pie' },
  { path: '/admin/users', label: 'Manajemen User', icon: 'fas fa-users-cog' },
  { path: '/komunitas', label: 'Laporan Komunitas', icon: 'fas fa-flag' },
  { path: '/profile', label: 'Pengaturan Admin', icon: 'fas fa-cog' },
];

const currentLabel = computed(() => {
  return navItems.find(item => item.path === route.path)?.label || 'Admin Panel';
});

const userInitial = computed(() => {
  return authStore.user?.username?.[0]?.toUpperCase() || 'A';
});

const logout = async () => {
    if(confirm('Apakah Anda yakin ingin keluar dari Admin Panel?')) {
        await authStore.logout();
        router.push('/auth');
    }
};

const goHome = () => {
  isMobileMenuOpen.value = false;
  router.push('/');
}
</script>

<style scoped>
.slide-enter-active, .slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(100%);
}

.admin-system {
    font-family: 'Inter', sans-serif;
}
</style>
