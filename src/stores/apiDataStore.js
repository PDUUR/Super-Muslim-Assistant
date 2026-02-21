import { defineStore } from "pinia";
import axios from "axios";
import { reactive } from "vue";

export const useApiDataStore = defineStore("apiDataStore", () => {
  const state = reactive({
    surah: null,
    asmaulHusna: null,
    doaHarian: null,
    sholatWajib: null,
    sholatSunnah: null,
    isLoading: false,
    isError: false,
  });

  async function callAPIs() {
    state.isLoading = true;

    // Jalankan semua API secara paralel. Jika satu gagal, yang lain tetap jalan.
    const results = await Promise.allSettled([
      // Ganti equran.id (CORS blocked) -> api.alquran.cloud (CORS OK)
      axios.get('https://api.alquran.cloud/v1/surah'),
      axios.get('https://islami-api.vercel.app/api/asmaul-husna/all'),
      axios.get('https://islami-api.vercel.app/api/doa-harian'),
      axios.get('https://islami-api.vercel.app/api/niat-sholat-wajib/all'),
      axios.get('https://islami-api.vercel.app/api/niat-sholat-sunnah/all'),
    ]);

    // Proses hasil satu per satu
    const [surahRes, asmaulRes, doaRes, wajibRes, sunnahRes] = results;

    if (surahRes.status === 'fulfilled') {
      // api.alquran.cloud mengembalikan format berbeda dari equran.id
      // Kita petakan ke format yang dipakai komponen agar tidak perlu ubah template
      state.surah = surahRes.value.data.data.map(s => ({
        nomor: s.number,
        nama: s.name,                          // Nama Arab
        namaLatin: s.englishName,              // Nama Latin
        arti: s.englishNameTranslation,        // Tetap English jika API tidak sedia ID di endpoint ini
        jumlahAyat: s.numberOfAyahs,           // Jumlah Ayat
        tempatTurun: s.revelationType === 'Meccan' ? 'Makkiyah' : 'Madaniyah',
      }));
    } else {
      console.warn('[API] Gagal ambil daftar surah:', surahRes.reason?.message);
    }

    if (asmaulRes.status === 'fulfilled') {
      state.asmaulHusna = asmaulRes.value.data.data;
    } else {
      console.warn('[API] Gagal ambil asmaul husna:', asmaulRes.reason?.message);
    }

    if (doaRes.status === 'fulfilled') {
      state.doaHarian = doaRes.value.data.data
        .filter(item => item.namaDoa !== 'Doa niat mandi junub')
        .map((item, index) => ({ ...item, urutan: index + 1 }));
    } else {
      console.warn('[API] Gagal ambil doa harian:', doaRes.reason?.message);
    }

    if (wajibRes.status === 'fulfilled') {
      state.sholatWajib = wajibRes.value.data.data;
    } else {
      console.warn('[API] Gagal ambil sholat wajib:', wajibRes.reason?.message);
    }

    if (sunnahRes.status === 'fulfilled') {
      state.sholatSunnah = sunnahRes.value.data.data;
    } else {
      console.warn('[API] Gagal ambil sholat sunnah:', sunnahRes.reason?.message);
    }

    state.isLoading = false;
  }

  return { state, callAPIs };
});
