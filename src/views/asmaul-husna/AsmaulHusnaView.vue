<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import HeaderContent from '@/components/HeaderContent.vue';
import { useApiDataStore } from '@/stores/apiDataStore.js';

const { state } = useApiDataStore();

const listItem = state.asmaulHusna;
const textInput = ref(null);

onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
});

const handleKeyDown = (event => {
    if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        textInput.value.focus();
    }
});

const setupSearch = () => {
    const inputElement = document.getElementById("search");
    const list = document.getElementById("list");
    const itemLists = list.getElementsByClassName("item");

    inputElement.addEventListener("input", function () {
        const searchText = inputElement.value.toLowerCase();
        for (const item of itemLists) {
            const listItemText = item.textContent.toLowerCase();
            if (listItemText.includes(searchText)) {
                item.style.display = "block";
            } else {
                item.style.display = "none";
            }
        }
    });
};

onMounted(() => {
    setupSearch();
});
</script>

<template>
    <div class="transition-colors duration-500 pb-20">
        <HeaderContent img="asmaul-husna" text-title="Asma'ul Husna">
            <p class="mb-2 text-slate-500 dark:text-gray-400 transition-colors text-xs italic px-4">"Allah memiliki 99 nama, siapa yang menjaganya maka dia masuk surga."
            </p>
            <div class="flex justify-center gap-x-3 mt-6 px-4">
                <input type="text" placeholder="Cari nama..." name="" id="search"
                    class="border-2 border-slate-200 dark:border-gray-700 focus:outline-none focus:border-green-600 rounded-2xl p-3 text-slate-900 dark:text-white bg-white dark:bg-gray-800 w-full font-bold placeholder:font-medium text-sm transition-all shadow-sm"
                    ref="textInput" autocomplete="off">
            </div>
        </HeaderContent>

        <div class="mt-8 mb-10 px-4">
            <div class="grid grid-cols-1 gap-4" id="list">
                <div v-for="item in listItem" :key="item.urutan"
                    class="p-5 border border-slate-100 dark:border-white/5 rounded-2xl w-full bg-white dark:bg-gray-800/40 active:bg-green-50 dark:active:bg-green-500/10 duration-300 item cursor-default shadow-sm transition-all flex items-center gap-4">
                    <span class="text-sm font-black text-slate-300 dark:text-gray-600 shrink-0">{{ item.urutan }}.</span>
                    <div class="flex-grow min-w-0">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-sm font-black text-slate-900 dark:text-white">{{ item.latin }}</span>
                            <h5 class="text-2xl font-scheherazade-bold text-green-700 dark:text-green-500">{{ item.arab }}</h5>
                        </div>
                        <p class="text-[10px] font-bold text-slate-500 dark:text-gray-400 leading-tight">{{ item.artinya }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>