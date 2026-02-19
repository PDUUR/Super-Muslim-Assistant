<script setup>
defineProps({
    img: String,
    textTitle: String,
})
</script>

<template>
    <img :src="`/img/${img}.png`" class="w-24 inline-block transition-transform hover:rotate-6 duration-300 mb-2" alt="" srcset="">
    <h1 class="text-4xl md:text-5xl font-black my-4 text-slate-950 dark:text-white transition-colors">{{ textTitle }}</h1>
    <slot></slot>
    <div class="flex justify-center items-center gap-2 mt-8">
        <div class="py-1 px-3 text-[10px] uppercase bg-green-500/10 dark:bg-green-500/30 border border-green-500/50 text-green-800 dark:text-green-400 font-black rounded-lg transition-colors shadow-sm">
            Ctrl</div>
        <i class="fas fa-plus text-[10px] text-slate-400"></i>
        <div class="py-1 px-3 text-[10px] uppercase bg-green-500/10 dark:bg-green-500/30 border border-green-500/50 text-green-800 dark:text-green-400 font-black rounded-lg transition-colors shadow-sm">
            K</div>
    </div>
</template>

<style scoped></style>