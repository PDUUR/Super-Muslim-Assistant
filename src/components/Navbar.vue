<template>
    <header id="header">
        <nav class="fixed z-40 py-3 md:py-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl w-full border-t border-[var(--accent-color,#22c55e)]/30 bottom-0 right-0 left-0 px-0 container mx-auto transition-all duration-500 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
            <div class="flex justify-between items-end text-base px-2 md:px-6 font-black max-w-xl mx-auto relative pb-1">
                <!-- HOME -->
                <router-link to="/" :class="{ 'active-tab': $route.path === '/' }"
                    class="nav-item text-center text-slate-400 dark:text-gray-500 hover:text-[var(--accent-color,#22c55e)] duration-300 flex flex-col items-center gap-0.5 flex-1 py-1">
                    <i class="fas fa-home text-lg"></i>
                    <p class="text-[8px] uppercase font-black tracking-wider">Home</p>
                </router-link>

                <!-- QURAN -->
                <router-link to="/baca-al-quran"
                    :class="{ 'active-tab': $route.path.match('/baca-al-quran') }"
                    class="nav-item text-center text-slate-400 dark:text-gray-500 hover:text-[var(--accent-color,#22c55e)] duration-300 flex flex-col items-center gap-0.5 flex-1 py-1">
                    <i class="fas fa-quran text-lg"></i>
                    <p class="text-[8px] uppercase font-black tracking-wider">Quran</p>
                </router-link>

                <!-- Floating SUPER Button -->
                <div class="flex-1 flex justify-center -translate-y-5">
                    <router-link to="/super" 
                        :class="{ 'active-super': $route.path === '/super' }"
                        class="super-btn w-16 h-16 bg-gradient-to-tr from-green-600 to-emerald-400 text-white rounded-full flex flex-col items-center justify-center shadow-[0_10px_25px_rgba(16,185,129,0.5)] transition-all duration-300 active:scale-95 border-4 border-white dark:border-gray-900">
                        <i class="fas fa-bolt text-2xl mb-0.5"></i>
                        <p class="text-[7px] uppercase font-black tracking-widest">Super</p>
                    </router-link>
                </div>

                <!-- KOMUNITAS -->
                <router-link to="/komunitas"
                    :class="{ 'active-tab': $route.path.match('/komunitas') }"
                    class="nav-item text-center text-slate-400 dark:text-gray-500 hover:text-[var(--accent-color,#22c55e)] duration-300 flex flex-col items-center gap-0.5 flex-1 py-1">
                    <i class="fas fa-users text-lg"></i>
                    <p class="text-[8px] uppercase font-black tracking-wider">Komunitas</p>
                </router-link>

                <!-- PROFILE -->
                <router-link :to="authStore.isAuthenticated ? '/profile' : '/auth'"
                    :class="{ 'active-tab': $route.path === '/profile' || $route.path === '/auth' }"
                    class="nav-item text-center text-slate-400 dark:text-gray-500 hover:text-[var(--accent-color,#22c55e)] duration-300 flex flex-col items-center gap-0.5 flex-1 py-1">
                    <div v-if="authStore.isAuthenticated && authStore.user?.avatar_url" class="w-5 h-5 rounded-full overflow-hidden mb-0.5 border border-slate-200">
                        <img :src="authStore.user.avatar_url" class="w-full h-full object-cover">
                    </div>
                    <i v-else class="fas fa-user text-lg"></i>
                    <p class="text-[8px] uppercase font-black tracking-wider">Profil</p>
                </router-link>
            </div>
        </nav>
    </header>
</template>

<script setup>
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();
</script>

<style scoped>
.active-tab {
    color: var(--accent-color, #22c55e) !important;
}

.active-super {
    background: #059669 !important; /* Emerald 600 */
    box-shadow: 0 0 30px rgba(16, 185, 129, 0.6) !important;
    transform: scale(1.1);
}

.super-btn {
    z-index: 50;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Base styles for router-link pseudo-classes if needed */
</style>
