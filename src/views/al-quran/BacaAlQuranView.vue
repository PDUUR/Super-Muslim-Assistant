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

        <div class="px-4 mt-6" v-if="terakhirBaca">
            <div @click="navigateToBookmark" 
                 class="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl shadow-lg shadow-green-500/20 cursor-pointer active:scale-95 transition-all group overflow-hidden relative">
                <div class="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                
                <div class="flex items-center gap-4 relative z-10">
                    <div class="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white">
                        <i class="fas fa-book-open"></i>
                    </div>
                    <div class="text-left">
                        <p class="text-[9px] font-black text-white/70 uppercase tracking-widest mb-0.5">Lanjutkan Membaca</p>
                        <h4 class="text-xs font-black text-white leading-tight truncate max-w-[180px]">
                            {{ terakhirBaca }}
                        </h4>
                    </div>
                </div>
                
                <div class="flex flex-col items-end gap-2 relative z-10">
                    <button @click.stop="clearBookmark" 
                            class="w-6 h-6 rounded-lg bg-red-400/20 hover:bg-red-400/40 text-white flex items-center justify-center transition-colors">
                        <i class="fas fa-times text-[10px]"></i>
                    </button>
                    <i class="fas fa-chevron-right text-white/40 group-hover:translate-x-1 transition-transform"></i>
                </div>
            </div>
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
