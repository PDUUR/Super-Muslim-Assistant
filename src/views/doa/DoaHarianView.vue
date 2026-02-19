<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import HeaderContent from '@/components/HeaderContent.vue';
import { useApiDataStore } from '@/stores/apiDataStore.js';

const { state } = useApiDataStore();

const listItem = state.doaHarian;
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
    <div class="transition-colors duration-500 text-start pb-20 px-4">
        <HeaderContent img="doa-harian" text-title="Do'a Harian">
            <p class="mb-2 text-slate-500 dark:text-gray-400 transition-colors text-[10px] italic px-4 text-center">"Berdoalah kepada Allah dan yakinlah bahwa doa kalian akan dikabulkan."</p>
            <div class="flex justify-center gap-x-3 mt-6">
                <input type="text" placeholder="Cari doa..." name="" id="search"
                    class="border-2 border-slate-200 dark:border-gray-700 focus:outline-none focus:border-green-600 rounded-2xl p-3 text-slate-900 dark:text-white bg-white dark:bg-gray-800 w-full font-bold placeholder:font-medium text-sm transition-all shadow-sm"
                    ref="textInput" autocomplete="off">
            </div>
        </HeaderContent>

        <div class="mt-8 mb-10" id="list">
            <div v-for="item in listItem" :key="item.urutan"
                class="p-6 border border-slate-100 dark:border-white/5 rounded-[2rem] w-full bg-white dark:bg-gray-800/40 active:bg-green-50 dark:active:bg-green-500/10 duration-300 mb-4 item shadow-sm transition-all">
                <div class="flex items-center gap-2 mb-4">
                    <span class="text-xs font-black text-slate-300 dark:text-gray-600">{{ item.urutan }}.</span>
                    <span class="text-[13px] font-black text-slate-900 dark:text-white">{{ item.namaDoa }}</span>
                </div>
                <h5 class="text-end text-2xl md:text-3xl font-scheherazade-bold block mb-4 leading-loose text-green-700 dark:text-green-500">{{ item.arab }}</h5>
                <div class="text-[11px] pt-4 border-t border-slate-50 dark:border-white/5 font-bold text-slate-500 dark:text-gray-400 leading-relaxed italic">
                    {{ item.arti }}
                </div>
            </div>
        </div>
    </div>
</template>


<style scoped></style>