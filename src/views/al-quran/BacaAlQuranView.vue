<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import HeaderContent from '@/components/HeaderContent.vue';
import { useApiDataStore } from '@/stores/apiDataStore.js';

const router = useRouter();
const { state } = useApiDataStore();

const terakhirBaca = ref(localStorage.getItem('terakhir-baca'));
const anchorAyat = ref(localStorage.getItem('anchor-ayat'));

const listSurah = state.surah;
const textInput = ref(null);

onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
    setupSearch();
});

const handleKeyDown = (event) => {
    if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        textInput.value.focus();
    }
};

const navigateToSurah = (nomorSurah) => {
    router.push(`/baca-al-quran/surah/${nomorSurah}`);
};

const navigateToBookmark = () => {
    router.push(`/baca-al-quran/surah/${anchorAyat.value}`);
};

const setupSearch = () => {
    const inputElement = document.getElementById("search");
    const list = document.getElementById("list-surah");
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

const clearBookmark = () => {
    localStorage.setItem('terakhir-baca', '');
    localStorage.setItem('anchor-ayat', '');
    terakhirBaca.value = '';
    anchorAyat.value = '';
};
</script>

<template>
    <div class="transition-colors duration-500">
        <HeaderContent img="al-quran" text-title="Baca Al-Qur'an">
            <p class="mb-2 text-slate-700 dark:text-gray-300 text-sm italic transition-colors">"Sesungguhnya Allah tidak melihat fisik dan harta kalian tetapi ia melihat hati dan amal kalian."</p>
            <div class="flex justify-center mt-6">
                <div class="relative w-full">
                    <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input type="text" placeholder="Cari surah..." name="" id="search"
                        class="border-2 border-slate-200 dark:border-gray-700 focus:outline-none focus:border-green-500 rounded-2xl py-3 pl-11 pr-4 text-slate-950 dark:text-white bg-slate-50 dark:bg-gray-800 w-full font-bold placeholder:font-medium transition-all shadow-inner"
                        ref="textInput" autocomplete="off">
                </div>
            </div>
        </HeaderContent>

        <div class="flex justify-center flex-col items-center gap-2 mt-6" v-if="terakhirBaca">
            <div class="text-[10px] text-slate-600 dark:text-gray-400 font-black uppercase tracking-widest">
                Terakhir dibaca: <button @click="navigateToBookmark"
                    class="text-green-600 dark:text-green-400 hover:underline">{{ terakhirBaca
                    }}</button>
            </div>
            <button @click="clearBookmark"
                class="py-1 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-500 duration-300 rounded-lg text-[9px] border border-red-500/30 font-black uppercase tracking-wider">
                <i class="fas fa-trash mr-1"></i> Hapus Jejak
            </button>
        </div>

        <div class="mt-10 mb-20 px-1">
            <div class="grid grid-cols-1 gap-4" id="list-surah">
                <div @click="navigateToSurah(item.nomor)"
                    class="p-4 border border-slate-100 dark:border-white/5 rounded-2xl w-full bg-white dark:bg-gray-800/40 active:scale-[0.98] duration-200 item cursor-pointer transition-all shadow-sm hover:shadow-md flex items-center gap-4"
                    v-for="item in listSurah" :key="item.nomor">
                    <div class="w-10 h-10 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                        {{ item.nomor }}
                    </div>
                    <div class="flex-1 text-left">
                        <h5 class="text-sm font-black text-slate-900 dark:text-white">{{ item.namaLatin }}</h5>
                        <p class="text-[9px] font-bold text-slate-500 dark:text-gray-500 uppercase tracking-tight">{{ item.arti }} • {{ item.jumlahAyat }} Ayat</p>
                    </div>
                    <div class="text-right">
                        <span class="text-2xl font-scheherazade-regular text-green-600 dark:text-green-500">{{ item.nama }}</span>
                        <span class="block text-[8px] text-slate-400 dark:text-gray-600 uppercase font-bold">{{ item.tempatTurun }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
