<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router';
import axios from 'axios';
import { useAudioStore } from '@/stores/audioStore';

const route = useRoute();
const router = useRouter();
const audioStore = useAudioStore();

const surah = ref({});
const tafsir = ref(null);
const isLatin = ref(false);
const isAudio = ref(false);
const isLoadingTafsir = ref(false);

const fetchSurah = async (id, autoPlayFirst = false) => {
    try {
        const response = await axios.get(`https://equran.id/api/v2/surat/${id}`);
        surah.value = response.data.data;
        
        // Reset tafsir when surah changes
        tafsir.value = null;

        // Scroll to top when surah changes
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (autoPlayFirst) {
            audioStore.playSurah(surah.value, 0);
        }
    } catch (error) {
        router.push('/error');
    }
};

const fetchTafsir = async () => {
    if (tafsir.value) return;
    isLoadingTafsir.value = true;
    try {
        const response = await axios.get(`https://equran.id/api/v2/tafsir/${surah.value.nomor}`);
        tafsir.value = response.data.data;
    } catch (error) {
        console.error("Gagal mengambil tafsir", error);
    } finally {
        isLoadingTafsir.value = false;
    }
};

const showAyatTafsir = async (nomorAyat) => {
    await fetchTafsir();
    if (!tafsir.value) {
        Swal.fire('Maaf', 'Gagal memuat tafsir', 'error');
        return;
    }

    const ayatTafsir = tafsir.value.tafsir.find(t => t.ayat === nomorAyat);
    
    Swal.fire({
        title: `<div class="flex items-center gap-3 text-start"><i class="fas fa-arrow-left cursor-pointer hover:text-green-500 transition-colors" onclick="Swal.close()"></i> Tafsir Ayat ${nomorAyat}</div>`,
        html: `<div class="text-start leading-relaxed max-h-[65vh] overflow-y-auto px-1 custom-scrollbar text-sm font-medium text-slate-700 dark:text-gray-300">
                <p class="mb-4 pb-2 border-b border-slate-100 dark:border-white/5 font-black text-green-600">Surah ${surah.value.namaLatin}</p>
                ${ayatTafsir ? ayatTafsir.teks : 'Tafsir tidak ditemukan.'}
               </div>`,
        width: '95%',
        padding: '1.5rem',
        showConfirmButton: false,
        showCloseButton: false,
        background: document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#1f2937',
        customClass: {
            container: 'tafsir-modal-mobile',
            popup: 'rounded-[1.5rem] border-none shadow-2xl overflow-hidden'
        }
    });
};

const showSurahDeskripsi = (namaSurah, deskripsi) => {
    Swal.fire({
        title: `<div class="flex items-center gap-3 text-start"><i class="fas fa-arrow-left cursor-pointer hover:text-green-500 transition-colors" onclick="Swal.close()"></i> Deskripsi</div>`,
        html: `<div class="text-start leading-relaxed max-h-[65vh] overflow-y-auto px-1 custom-scrollbar text-sm font-medium text-slate-700 dark:text-gray-300">
                <p class="mb-4 pb-2 border-b border-slate-100 dark:border-white/5 font-black text-green-600">Surah ${namaSurah}</p>
                ${deskripsi}
               </div>`,
        width: '95%',
        padding: '1.5rem',
        showConfirmButton: false,
        background: document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#1f2937',
        customClass: {
            popup: 'rounded-[1.5rem] shadow-2xl overflow-hidden'
        }
    });
};

const handleAyatChanged = (event) => {
    const nextEl = document.getElementById(surah.value.ayat[event.detail.index].nomorAyat);
    if (nextEl) nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

const handleSurahChanged = (event) => {
    router.push(`/baca-al-quran/surah/${event.detail.nomor}`);
};

const bookmarkAyat = (nomorSurah, surahName, ayat) => {
    Swal.fire({
        title: 'Pilih Jenis Penanda',
        text: `Menandai Surah ${surahName} ayat ${ayat}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Tilawah',
        denyButtonText: 'Murajaah',
        showDenyButton: true,
        showCancelButton: true,
        cancelButtonText: 'Hafalan',
        customClass: {
            confirmButton: 'bg-green-600 !text-white border-none',
            denyButton: 'bg-blue-600 !text-white border-none',
            cancelButton: 'bg-amber-500 !text-white border-none'
        }
    }).then((result) => {
        let category = '';
        let color = '';
        
        if (result.isConfirmed) {
            category = 'Tilawah';
            color = 'green';
        } else if (result.isDenied) {
            category = 'Murajaah';
            color = 'blue';
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            category = 'Hafalan';
            color = 'amber';
        } else {
            return;
        }

        const bookmarkData = {
            surah: surahName,
            nomorSurah: nomorSurah,
            ayat: ayat,
            category: category,
            color: color,
            timestamp: new Date().getTime()
        };

        localStorage.setItem('terakhir-baca', `${surahName} ayat ${ayat} (${category})`);
        localStorage.setItem('anchor-ayat', `${nomorSurah}#${ayat}`);
        localStorage.setItem('bookmark-detail', JSON.stringify(bookmarkData));

        Swal.fire({
            title: 'Berhasil!',
            text: `Ditambahkan ke penanda ${category}`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
    });
};

const handleScrollToAnchor = () => {
    const hash = window.location.hash || (localStorage.getItem('anchor-ayat') && window.location.href.includes('surah/') ? '#' + localStorage.getItem('anchor-ayat').split('#')[1] : null);
    if (hash) {
        const id = hash.replace('#', '');
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 800);
    }
};

onMounted(() => {
    fetchSurah(route.params.id).then(() => {
        handleScrollToAnchor();
    });
    window.addEventListener('ayat-changed', handleAyatChanged);
    window.addEventListener('surah-changed', handleSurahChanged);
});

onUnmounted(() => {
    window.removeEventListener('ayat-changed', handleAyatChanged);
    window.removeEventListener('surah-changed', handleSurahChanged);
});

onBeforeRouteUpdate((to, from) => {
    if (to.params.id !== from.params.id) {
        const shouldAutoPlay = (audioStore.state.audioMode === 'continuous' || audioStore.state.audioMode === 'surah') && audioStore.state.isPlaying;
        fetchSurah(to.params.id, shouldAutoPlay);
    }
});

const navigateSurah = (targetNomor) => {
    router.push(`/baca-al-quran/surah/${targetNomor}`);
};

const playAyat = (index) => {
    if (audioStore.state.currentSurah?.nomor !== surah.value.nomor) {
        audioStore.playSurah(surah.value, index);
    } else {
        audioStore.playAyat(index);
    }
};
</script>

<template>
    <div v-if="surah.nomor" class="w-full transition-colors duration-500 pb-32 px-1">
        <div class="mb-8 text-center">
            <h2 class="text-3xl font-black my-1 font-scheherazade-regular text-green-600 dark:text-green-500">{{ surah.nama }}</h2>
            <h1 class="mb-1 text-4xl font-black text-slate-950 dark:text-white">{{ surah.namaLatin }}</h1>
            <p class="font-bold text-xs text-slate-500 dark:text-gray-400 uppercase tracking-tighter">
                {{ surah.arti }} • Surah ke-{{ surah.nomor }} • {{ surah.jumlahAyat }} Ayat
            </p>
        </div>

        <!-- Basmalah Section -->
        <div v-if="surah.nomor !== 1 && surah.nomor !== 9" class="my-8 text-center py-4 bg-slate-50/50 dark:bg-white/5 rounded-3xl">
            <h2 class="text-3xl font-scheherazade-bold text-slate-900 dark:text-white leading-relaxed">
                بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
            </h2>
        </div>
        
        <div class="flex flex-col gap-4 items-center">
            <!-- Main Display Controls -->
            <div class="flex justify-around items-center w-full font-black bg-white dark:bg-gray-800 shadow-lg p-3 rounded-2xl border border-slate-100 dark:border-white/5 backdrop-blur-md">
                <div @click="isAudio = !isAudio" class="flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-90 flex-1"
                    :class="{ 'text-green-600 dark:text-green-400': isAudio, 'text-slate-400 dark:text-gray-500': !isAudio }">
                    <i class="fas fa-volume-up text-lg"></i>
                    <span class="text-[8px] uppercase tracking-widest">Audio</span>
                </div>
                <div @click="isLatin = !isLatin" class="flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-90 flex-1"
                    :class="{ 'text-green-600 dark:text-green-400': isLatin, 'text-slate-400 dark:text-gray-500': !isLatin }">
                    <i class="fas fa-spell-check text-lg"></i>
                    <span class="text-[8px] uppercase tracking-widest">Latin</span>
                </div>
                <div @click="showSurahDeskripsi(surah.namaLatin, surah.deskripsi)"
                    class="flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-90 flex-1 text-slate-400 dark:text-gray-500">
                    <i class="fas fa-info-circle text-lg"></i>
                    <span class="text-[8px] uppercase tracking-widest">Info</span>
                </div>
                <div @click="fetchTafsir().then(() => Swal.fire('Tafsir Siap', 'Silakan klik ikon buku di setiap ayat untuk melihat tafsir detail.', 'success'))"
                    class="flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-90 flex-1 text-slate-400 dark:text-gray-500"
                    :class="{ 'text-green-600': tafsir }">
                    <i class="fas fa-book-open text-lg"></i>
                    <span class="text-[8px] uppercase tracking-widest">Tafsir</span>
                </div>
            </div>

            <!-- Enhanced Audio Playback Settings -->
            <transition name="fade">
                <div v-if="isAudio" class="w-full bg-slate-50 dark:bg-green-500/5 border border-green-500/20 p-5 rounded-[2rem] shadow-md transition-colors duration-500">
                    <div class="flex flex-col gap-4">
                        <!-- Qari Selection -->
                        <div class="flex flex-col gap-2">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-microphone-alt text-green-600 text-[10px]"></i>
                                <span class="text-[9px] font-black text-green-800 dark:text-green-400 uppercase tracking-widest">Pilih Qari</span>
                            </div>
                            <select 
                                :value="audioStore.state.selectedQari"
                                @change="e => audioStore.setQari(e.target.value)"
                                class="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 dark:text-gray-300 outline-none">
                                <option v-for="qari in audioStore.state.qaris" :key="qari.id" :value="qari.id">
                                    {{ qari.name }}
                                </option>
                            </select>
                        </div>

                        <!-- Audio Mode Selection -->
                        <div class="flex flex-col gap-2">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-cog text-green-600 text-[10px]"></i>
                                <span class="text-[9px] font-black text-green-800 dark:text-green-400 uppercase tracking-widest">Mode Putar</span>
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <button v-for="mode in [
                                    { id: 'single', icon: 'play', label: 'Sekali' },
                                    { id: 'continuous', icon: 'forward', label: 'Terus' },
                                    { id: 'surah', icon: 'redo', label: 'Surah' },
                                    { id: 'ayat', icon: 'sync-alt', label: 'Ayat' }
                                ]" 
                                :key="mode.id"
                                @click="audioStore.state.audioMode = mode.id"
                                class="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all border"
                                :class="audioStore.state.audioMode === mode.id ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-800 text-slate-500 border-slate-200 dark:border-white/5'">
                                    <i :class="`fas fa-${mode.icon} text-[8px]`"></i>
                                    {{ mode.label }}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="flex justify-center gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-white/5">
                        <button 
                            @click="audioStore.state.currentAyatIndex === -1 ? audioStore.playSurah(surah, 0) : audioStore.toggle()" 
                            class="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                            :class="audioStore.state.isPlaying ? 'bg-amber-500 text-white' : 'bg-green-600 text-white'"
                        >
                            <i class="fas" :class="audioStore.state.isPlaying ? 'fa-pause' : 'fa-play'"></i>
                            {{ audioStore.state.isPlaying ? 'Jeda' : 'Putar' }}
                        </button>
                        <button @click="audioStore.stop()" class="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center bg-red-500 text-white active:scale-95">
                            <i class="fas fa-stop"></i>
                        </button>
                    </div>
                </div>
            </transition>
        </div>

        <div class="flex justify-between mt-8 gap-2">
            <button v-if="surah.nomor > 1" @click="navigateSurah(surah.nomor - 1)"
                class="flex-1 flex items-center gap-3 p-3 rounded-2xl text-[10px] font-black uppercase border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white bg-white dark:bg-gray-800/20 active:bg-green-50 dark:active:bg-green-950 transition-all text-left">
                <i class="fas fa-chevron-left text-green-500"></i> 
                <div class="truncate">
                    <span class="block text-[7px] opacity-60">Kembali</span>
                    <span class="truncate">{{ surah.suratSebelumnya?.namaLatin || 'Sebelumnya' }}</span>
                </div>
            </button>
            <div v-else class="flex-1"></div>
            
            <button v-if="surah.nomor < 114" @click="navigateSurah(surah.nomor + 1)"
                class="flex-1 flex items-center justify-end gap-3 p-3 rounded-2xl text-[10px] font-black uppercase border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white bg-white dark:bg-gray-800/20 active:bg-green-50 dark:active:bg-green-950 transition-all text-right">
                <div class="truncate">
                    <span class="block text-[7px] opacity-60">Lanjut</span>
                    <span class="truncate">{{ surah.suratSelanjutnya?.namaLatin || 'Selanjutnya' }}</span>
                </div>
                <i class="fas fa-chevron-right text-green-500"></i>
            </button>
        </div>

        <div class="mt-8 space-y-6">
            <div v-for="(ayat, index) in surah.ayat" :key="ayat.nomorAyat" 
                 class="group relative p-6 bg-white dark:bg-gray-900/40 rounded-[2rem] border border-slate-100 dark:border-white/5 transition-all shadow-sm"
                 :id="ayat.nomorAyat"
                 :class="{'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-900': audioStore.state.currentAyatIndex === index && audioStore.state.isPlaying}">
                
                <div class="flex flex-col gap-6">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2">
                            <div class="rounded-lg bg-green-500 text-white w-8 h-8 text-xs font-black flex items-center justify-center shadow-md">
                                {{ ayat.nomorAyat }}
                            </div>
                            <div class="flex gap-1">
                                <button @click="playAyat(index)" 
                                    class="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 active:scale-90 transition-all"
                                    :class="{'text-green-600 bg-green-100 dark:bg-green-900/40': audioStore.state.currentAyatIndex === index && audioStore.state.isPlaying}">
                                    <i class="fas" :class="audioStore.state.currentAyatIndex === index && audioStore.state.isPlaying ? 'fa-pause' : 'fa-play'"></i>
                                </button>
                                <button @click="bookmarkAyat(surah.nomor, surah.namaLatin, ayat.nomorAyat)"
                                    class="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 active:scale-90 transition-all">
                                    <i class="far fa-bookmark"></i>
                                </button>
                                <button @click="showAyatTafsir(ayat.nomorAyat)"
                                    class="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 active:scale-90 transition-all">
                                    <i class="fas fa-book-open"></i>
                                </button>
                            </div>
                        </div>
                        <div v-if="audioStore.state.currentAyatIndex === index && audioStore.state.isPlaying" class="flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                            <span class="text-[8px] font-black text-green-600 uppercase">Diputar</span>
                        </div>
                    </div>

                    <div class="text-right">
                        <h2 class="text-3xl font-scheherazade-bold leading-[2.2] text-slate-900 dark:text-white">
                            {{ ayat.teksArab }}
                        </h2>
                    </div>
                    
                    <div class="border-t border-slate-50 dark:border-white/5 pt-4">
                        <p v-if="isLatin" class="text-right italic text-green-700 dark:text-green-400 font-bold text-xs mb-3 leading-relaxed">
                            {{ ayat.teksLatin }}
                        </p>
                        
                        <p class="text-left text-slate-700 dark:text-gray-300 text-sm leading-relaxed font-medium">
                            <span class="text-[10px] text-green-600 font-black block mb-1">TERJEMAH:</span>
                            {{ ayat.teksIndonesia }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.font-scheherazade-regular {
    font-family: 'Scheherazade New', serif;
}

.animate-spin-slow {
    animation: spin 6s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.fade-enter-active, .fade-leave-active {
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
    transform: translateY(-15px);
}

.custom-audio::-webkit-media-controls-enclosure {
    background-color: transparent;
}

.dropdown-shadow-md {
    text-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.dark .dropdown-shadow-md {
    text-shadow: 0 4px 12px rgba(0,0,0,0.5);
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #00DC82;
    border-radius: 10px;
}

audio {
    filter: sepia(20%) saturate(70%) grayscale(1) contrast(1.1) invert(0%);
}

.dark audio {
    filter: invert(100%) hue-rotate(180deg) brightness(1.5);
}
</style>