<script setup>
import Navbar from '@/components/Navbar.vue';
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();
const router = useRouter();

const showBackButton = computed(() => true);

const goBack = () => {
    if (route.path === '/') {
        window.dispatchEvent(new CustomEvent('go-to-landing'));
    } else {
        router.back();
    }
};
</script>

<template>
  <div v-if="showBackButton" 
       @click="goBack"
       class="fixed top-5 left-5 z-[60] bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-slate-800 dark:text-white w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer shadow-sm border border-slate-200 dark:border-white/10 transition-all hover:scale-105 active:scale-95">
    <i class="fas fa-arrow-left text-sm"></i>
  </div>

  <section id="content" class="min-h-screen bg-slate-50 dark:bg-gray-950 flex justify-center">
    <div class="w-full max-w-[480px] min-h-screen bg-white dark:bg-gray-900 shadow-2xl relative overflow-x-hidden pb-24">
      <div class="px-4 py-6 text-center">
        <slot></slot>

      </div>
    </div>
  </section>
  <div class="hidden md:flex fixed inset-0 z-[-1] bg-slate-100 dark:bg-gray-950 items-center justify-center opacity-10">
    <i class="fas fa-mobile-alt text-[40vh] text-slate-400"></i>
  </div>
  <Navbar></Navbar>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>