<script setup>
import { ref, onMounted } from 'vue';

const isDark = ref(true);

const toggleTheme = () => {
    isDark.value = !isDark.value;
    updateTheme();
};

const updateTheme = () => {
    if (isDark.value) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
};

onMounted(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        isDark.value = savedTheme === 'dark';
    } else {
        isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    updateTheme();
});
</script>

<template>
    <button @click="toggleTheme" 
            class="fixed top-6 right-6 z-50 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl overflow-hidden group"
            :class="isDark ? 'bg-gray-800 text-yellow-400 border border-white/10' : 'bg-white text-indigo-600 border border-indigo-100'">
        
        <div class="relative w-6 h-6 flex flex-col transition-transform duration-500"
             :style="{ transform: isDark ? 'translateY(0)' : 'translateY(-100%)' }">
            <div class="w-6 h-6 flex items-center justify-center shrink-0">
                <i class="fas fa-moon text-xl"></i>
            </div>
            <div class="w-6 h-6 flex items-center justify-center shrink-0">
                <i class="fas fa-sun text-xl"></i>
            </div>
        </div>

        <!-- Ripple Effect Decoration -->
        <span class="absolute inset-0 bg-white/5 scale-0 group-hover:scale-150 transition-transform duration-700 rounded-full"></span>
    </button>
</template>

<style scoped>
button {
    backdrop-filter: blur(8px);
}
</style>
