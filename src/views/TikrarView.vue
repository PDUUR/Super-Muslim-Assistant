<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useApiDataStore } from '@/stores/apiDataStore.js';

const router = useRouter();
const { state: apiState } = useApiDataStore();

// ─── Surah Selection ───────────────────────────────────────────
const selectedSurahId = ref(null);
const surahData = ref(null);
const isLoadingSurah = ref(false);
const errorMessage = ref('');

// ─── Tikrar Game State ─────────────────────────────────────────
const ayahQueue = ref([]);           // Antrean ayat yang sudah diacak
const currentQueueIndex = ref(0);    // Posisi saat ini di antrean
const currentAyah = ref(null);       // Data ayat yang sedang ditampilkan
const currentLevel = ref(1);         // Level saat ini (1-3)
const correctStreak = ref(0);        // Jumlah benar berturut-turut
const totalCorrect = ref(0);         // Total jawaban benar
const totalAttempts = ref(0);        // Total percobaan
const isGameStarted = ref(false);    // Status game sudah dimulai
const isGameFinished = ref(false);   // Semua ayat sudah selesai
const isSpinning = ref(false);       // Animasi spin aktif
const showResult = ref(false);       // Tampilkan hasil jawaban
const lastResult = ref(null);        // 'correct' atau 'wrong'
const roundNumber = ref(0);          // Nomor ronde (siklus antrean ke-N)

// ─── Speech Recognition (Hugging Face API) ────────────────────
const isListening = ref(false);
const isRecording = ref(false);
const isTranscribing = ref(false);
const speechText = ref('');
const speechAccuracy = ref(null);
const recordingDuration = ref(0); // Durasi rekaman dalam detik
let mediaRecorder = null;
let audioChunks = [];
let currentStream = null;        // Referensi stream mikrofon
let recordingTimer = null;       // Timer hitung durasi rekaman

// Model khusus bacaan Al-Qur'an (diproses di serverless proxy)
const HF_MODEL = 'tarteel-ai/whisper-base-ar-quran';
const HF_MODEL_FALLBACK = 'openai/whisper-large-v3';
// Token tersimpan aman di server (process.env.HUGGINGFACE_TOKEN)

// Deteksi MIME type yang didukung browser
function getSupportedMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
    'audio/wav',
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return ''; // Biarkan browser memilih default
}

// ─── Hint System ───────────────────────────────────────────────
const showHint = ref(false);

// ─── Computed ──────────────────────────────────────────────────
const levelLabel = computed(() => {
  switch (currentLevel.value) {
    case 1: return 'Pemula';
    case 2: return 'Menengah';
    case 3: return 'Mahir';
    default: return 'Pemula';
  }
});

const levelColor = computed(() => {
  switch (currentLevel.value) {
    case 1: return 'from-emerald-500 to-green-600';
    case 2: return 'from-amber-500 to-orange-600';
    case 3: return 'from-purple-500 to-pink-600';
    default: return 'from-emerald-500 to-green-600';
  }
});

const levelBadgeColor = computed(() => {
  switch (currentLevel.value) {
    case 1: return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    case 2: return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    case 3: return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
    default: return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
  }
});

const progressPercent = computed(() => {
  if (!surahData.value) return 0;
  return Math.round((currentQueueIndex.value / ayahQueue.value.length) * 100);
});

const maskedAyahText = computed(() => {
  if (!currentAyah.value) return '';
  const fullText = currentAyah.value.teksArab;
  const words = fullText.split(' ');

  if (currentLevel.value === 1) {
    // Level 1: Sembunyikan ~30% kata terakhir
    const hideCount = Math.max(1, Math.ceil(words.length * 0.3));
    const visibleWords = words.slice(0, words.length - hideCount);
    const hiddenWords = words.slice(words.length - hideCount);
    return {
      visible: visibleWords.join(' '),
      hidden: hiddenWords.map(() => '‎●●●').join(' '),
      hiddenActual: hiddenWords.join(' ')
    };
  } else if (currentLevel.value === 2) {
    // Level 2: Sembunyikan ~60% kata
    const hideCount = Math.max(1, Math.ceil(words.length * 0.6));
    const visibleWords = words.slice(0, words.length - hideCount);
    const hiddenWords = words.slice(words.length - hideCount);
    return {
      visible: visibleWords.join(' '),
      hidden: hiddenWords.map(() => '‎●●●').join(' '),
      hiddenActual: hiddenWords.join(' ')
    };
  } else {
    // Level 3: Sembunyikan seluruh teks
    return {
      visible: '',
      hidden: words.map(() => '‎●●●').join(' '),
      hiddenActual: fullText
    };
  }
});

// ─── Fungsi Acak Antrean (Fisher-Yates Shuffle) ────────────────
function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateQueue(jumlahAyat) {
  const numbers = Array.from({ length: jumlahAyat }, (_, i) => i + 1);
  return shuffleArray(numbers);
}

// ─── Fetch Surah Data ──────────────────────────────────────────
async function fetchSurahData(id) {
  isLoadingSurah.value = true;
  errorMessage.value = '';
  try {
    const response = await axios.get(`https://equran.id/api/v2/surat/${id}`);
    surahData.value = response.data.data;
  } catch (error) {
    console.error('[Tikrar] Gagal fetch surah:', error);
    errorMessage.value = 'Gagal mengambil data surah. Pastikan koneksi internet aktif.';
    surahData.value = null;
  } finally {
    isLoadingSurah.value = false;
  }
}

// ─── Start Game ────────────────────────────────────────────────
function startGame() {
  if (!surahData.value) return;

  const jumlahAyat = surahData.value.jumlahAyat;
  ayahQueue.value = generateQueue(jumlahAyat);
  currentQueueIndex.value = 0;
  currentLevel.value = 1;
  correctStreak.value = 0;
  totalCorrect.value = 0;
  totalAttempts.value = 0;
  isGameStarted.value = true;
  isGameFinished.value = false;
  showResult.value = false;
  lastResult.value = null;
  roundNumber.value = 1;

  loadCurrentAyah();
}

// ─── Load Current Ayah ──────────────────────────────────────────
function loadCurrentAyah() {
  if (currentQueueIndex.value >= ayahQueue.value.length) {
    // Semua ayat sudah selesai dalam satu ronde
    isGameFinished.value = true;
    return;
  }

  const ayahNumber = ayahQueue.value[currentQueueIndex.value];
  const ayahData = surahData.value.ayat.find(a => a.nomorAyat === ayahNumber);

  if (ayahData) {
    currentAyah.value = ayahData;
  }

  showResult.value = false;
  lastResult.value = null;
  speechText.value = '';
  speechAccuracy.value = null;
  showHint.value = false;
}

// ─── Advance to Next Ayah with Spin ─────────────────────────────
function nextAyah() {
  isSpinning.value = true;
  showResult.value = false;

  setTimeout(() => {
    currentQueueIndex.value++;
    loadCurrentAyah();

    setTimeout(() => {
      isSpinning.value = false;
    }, 400);
  }, 500);
}

// ─── Continue to New Round ──────────────────────────────────────
function continueNewRound() {
  roundNumber.value++;
  ayahQueue.value = generateQueue(surahData.value.jumlahAyat);
  currentQueueIndex.value = 0;
  isGameFinished.value = false;
  loadCurrentAyah();
}

// ─── Check Answer ───────────────────────────────────────────────
function checkAnswer(isCorrect) {
  totalAttempts.value++;
  showResult.value = true;

  if (isCorrect) {
    lastResult.value = 'correct';
    correctStreak.value++;
    totalCorrect.value++;

    // Level up logic: 3x benar berturut-turut → naik level
    if (correctStreak.value >= 3 && currentLevel.value < 3) {
      currentLevel.value++;
      correctStreak.value = 0; // Reset streak setelah naik level
    }
  } else {
    lastResult.value = 'wrong';
    correctStreak.value = 0; // Reset streak jika salah

    // Level down logic: salah di level > 1 bisa turun level
    if (currentLevel.value > 1) {
      currentLevel.value--;
    }
  }
}

// ─── Manual Answer Buttons ──────────────────────────────────────
function answerCorrect() {
  checkAnswer(true);
}

function answerWrong() {
  checkAnswer(false);
}

// ─── Kirim Audio ke Vercel Serverless Proxy (/api/huggingface) ──
async function transcribeAudio(audioBlob, model) {
  const selectedModel = model || HF_MODEL;
  // Kirim ke proxy serverless (same-origin, tidak ada CORS!)
  const proxyUrl = `/api/huggingface?model=${encodeURIComponent(selectedModel)}`;

  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': audioBlob.type || 'audio/webm',
      },
      body: audioBlob, // Kirim blob langsung sebagai binary body
      signal: AbortSignal.timeout(60000), // Timeout 60 detik (termasuk cold start)
    });

    const result = await response.json().catch(() => ({}));

    // Model sedang loading (cold start) — HTTP 503
    if (response.status === 503) {
      const wait = result.estimated_time || 30;
      errorMessage.value = `⏳ Model AI sedang dipersiapkan (~${wait} detik). Tunggu sebentar lalu coba lagi.`;
      setTimeout(() => errorMessage.value = '', 8000);
      return '';
    }

    // Error dari proxy atau HuggingFace
    if (!response.ok || result.error) {
      console.error('[Proxy] Error:', response.status, result);

      // Fallback ke Whisper umum jika model Qur'an gagal
      if (selectedModel !== HF_MODEL_FALLBACK) {
        console.warn('[Proxy] Model Qur\'an gagal, mencoba fallback...');
        return await transcribeAudio(audioBlob, HF_MODEL_FALLBACK);
      }

      errorMessage.value = `Error: ${result.error || 'Gagal memproses'}. Coba lagi.`;
      setTimeout(() => errorMessage.value = '', 5000);
      return '';
    }

    console.log('[Proxy] Transkripsi berhasil:', result.text);
    return result.text || '';
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      errorMessage.value = 'Waktu habis. Periksa koneksi internet.';
    } else {
      errorMessage.value = 'Gagal menghubungi server. Pastikan koneksi internet aktif.';
    }
    console.error('[Proxy] Fetch Error:', error);
    setTimeout(() => errorMessage.value = '', 5000);
    return '';
  }
}

// ─── Mulai Rekam (Klik/Tekan Tombol) ─────────────────────────
async function startListening() {
  if (isListening.value || isTranscribing.value) return;

  // Reset state
  speechText.value = '';
  speechAccuracy.value = null;
  errorMessage.value = '';
  audioChunks = [];
  recordingDuration.value = 0;

  // Step 1: Minta izin mikrofon
  try {
    currentStream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        channelCount: 1,        // Mono (lebih kecil ukurannya)
        sampleRate: 16000,      // 16kHz cukup untuk speech
        echoCancellation: true,
        noiseSuppression: true,
      }
    });
  } catch (error) {
    console.error('[Mic] Gagal akses mikrofon:', error);
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage.value = '🎙️ Izin mikrofon ditolak. Klik ikon gembok di address bar browser untuk mengizinkan.';
    } else if (error.name === 'NotFoundError') {
      errorMessage.value = '🎙️ Mikrofon tidak ditemukan. Pastikan perangkat memiliki mikrofon.';
    } else {
      errorMessage.value = '🎙️ Tidak dapat mengakses mikrofon. Coba lagi.';
    }
    setTimeout(() => errorMessage.value = '', 6000);
    return;
  }

  // Step 2: Setup MediaRecorder dengan MIME type yang didukung
  try {
    const mimeType = getSupportedMimeType();
    const options = mimeType ? { mimeType } : {};
    console.log('[Recorder] MIME type:', mimeType || 'browser default');

    mediaRecorder = new MediaRecorder(currentStream, options);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    // Step 3: Saat rekaman dihentikan → kirim ke API 
    mediaRecorder.onstop = async () => {
      // Bersihkan timer durasi
      if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
      }

      // Hentikan semua track mikrofon (ikon merah di browser hilang)
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
      }

      isRecording.value = false;

      // Cek apakah ada data yang terekam
      if (audioChunks.length === 0) {
        errorMessage.value = 'Tidak ada audio yang terekam. Coba lagi.';
        setTimeout(() => errorMessage.value = '', 4000);
        isListening.value = false;
        return;
      }

      // Step 4: Buat Blob dari chunks
      const recordedMime = mediaRecorder.mimeType || mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunks, { type: recordedMime });
      console.log('[Recorder] Audio blob:', audioBlob.size, 'bytes,', recordedMime);

      // Cek ukuran minimun (terlalu kecil = tidak ada suara)
      if (audioBlob.size < 1000) {
        errorMessage.value = 'Rekaman terlalu pendek. Tahan tombol lebih lama saat membaca.';
        setTimeout(() => errorMessage.value = '', 4000);
        isListening.value = false;
        return;
      }

      // Step 5: Kirim ke Hugging Face & tampilkan status loading
      isTranscribing.value = true;
      try {
        const transcription = await transcribeAudio(audioBlob);

        if (transcription && transcription.trim()) {
          speechText.value = transcription.trim();
          const accuracy = compareSpeechToText(transcription, currentAyah.value.teksArab);
          speechAccuracy.value = Math.round(accuracy);

          if (accuracy >= 80) {
            checkAnswer(true);
          } else {
            checkAnswer(false);
          }
        } else if (!errorMessage.value) {
          errorMessage.value = 'Suara tidak terdeteksi. Pastikan membaca dengan jelas.';
          setTimeout(() => errorMessage.value = '', 4000);
        }
      } finally {
        isTranscribing.value = false;
        isListening.value = false;
      }
    };

    // Mulai merekam! (timeslice 250ms agar data terus mengalir)
    mediaRecorder.start(250);
    isRecording.value = true;
    isListening.value = true;

    // Hitung durasi rekaman
    recordingTimer = setInterval(() => {
      recordingDuration.value++;
    }, 1000);

    console.log('[Recorder] Mulai merekam...');
  } catch (error) {
    console.error('[Recorder] Setup error:', error);
    errorMessage.value = 'Gagal memulai perekaman. Coba refresh halaman.';
    setTimeout(() => errorMessage.value = '', 5000);
    // Bersihkan stream jika ada
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;
    }
    isListening.value = false;
    isRecording.value = false;
  }
}

// ─── Berhenti Rekam ─────────────────────────────────────────
function stopListening() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    try {
      mediaRecorder.stop(); // Akan memicu onstop → proses API
    } catch (e) {
      console.error('[Recorder] Stop error:', e);
      // Bersihkan semuanya secara manual
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
      }
      if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
      }
      isListening.value = false;
      isRecording.value = false;
      isTranscribing.value = false;
    }
  }
}

// ─── Bersihkan resource saat komponen dihancurkan ────────────
function cleanupRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
  if (recordingTimer) {
    clearInterval(recordingTimer);
    recordingTimer = null;
  }
}

// ─── Compare Speech to Text (Levenshtein-based similarity) ─────
function compareSpeechToText(inputTeks, originalTeks) {
  // Normalisasi: hapus diacritics/harakat Arab dan whitespace ekstra
  const normalize = (str) => {
    return str
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g, '') // Hapus harakat
      .replace(/\s+/g, ' ')
      .trim();
  };

  const a = normalize(inputTeks);
  const b = normalize(originalTeks);

  if (a === b) return 100;
  if (a.length === 0 || b.length === 0) return 0;

  // Levenshtein distance
  const matrix = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const maxLen = Math.max(a.length, b.length);
  const distance = matrix[a.length][b.length];
  const similarity = ((maxLen - distance) / maxLen) * 100;

  return similarity;
}

// ─── Reset Game ─────────────────────────────────────────────────
function resetGame() {
  isGameStarted.value = false;
  isGameFinished.value = false;
  currentAyah.value = null;
  ayahQueue.value = [];
  currentQueueIndex.value = 0;
  currentLevel.value = 1;
  correctStreak.value = 0;
  totalCorrect.value = 0;
  totalAttempts.value = 0;
  showResult.value = false;
  lastResult.value = null;
  roundNumber.value = 0;
}

// ─── Lifecycle ──────────────────────────────────────────────────
onMounted(() => {
  // Cek apakah browser mendukung MediaRecorder
  if (!window.MediaRecorder) {
    console.warn('[Tikrar] MediaRecorder tidak didukung di browser ini.');
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.warn('[Tikrar] getUserMedia tidak didukung.');
  }
});

onUnmounted(() => {
  cleanupRecording();
});

// Watch surah selection
watch(selectedSurahId, async (newId) => {
  if (newId) {
    resetGame();
    await fetchSurahData(newId);
  }
});
</script>

<template>
  <div class="w-full pb-32 transition-colors duration-500">
    <!-- ─── Header ─────────────────────────────────────────────── -->
    <div class="text-center mb-8 px-4">
      <div class="inline-flex items-center justify-center w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 mb-4 relative overflow-hidden">
        <i class="fas fa-brain text-3xl text-white relative z-10"></i>
        <div class="absolute inset-0 bg-white/10 animate-pulse"></div>
      </div>
      <h1 class="text-3xl md:text-4xl font-black text-slate-950 dark:text-white transition-colors">
        Tikrar Leveling
      </h1>
      <p class="text-sm text-slate-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
        Uji hafalan Al-Qur'an dengan sistem level. Semakin mahir, semakin banyak teks yang disembunyikan!
      </p>
    </div>

    <!-- ─── Surah Selector ─────────────────────────────────────── -->
    <div class="px-4 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-[2rem] shadow-[0_15px_30px_rgba(0,0,0,0.04)] dark:shadow-none dark:border dark:border-white/10 p-6">
        <label class="block text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-3">
          <i class="fas fa-book-quran mr-1"></i> Pilih Surah
        </label>
        <select
          v-model="selectedSurahId"
          class="w-full bg-slate-50 dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-700 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-purple-500 transition-all cursor-pointer appearance-none"
          :disabled="isGameStarted"
        >
          <option :value="null" disabled>— Pilih surah untuk mulai tikrar —</option>
          <option
            v-for="item in apiState.surah"
            :key="item.nomor"
            :value="item.nomor"
          >
            {{ item.nomor }}. {{ item.namaLatin }} ({{ item.jumlahAyat }} Ayat)
          </option>
        </select>
      </div>
    </div>

    <!-- ─── Loading Surah ──────────────────────────────────────── -->
    <div v-if="isLoadingSurah" class="px-4">
      <div class="bg-white dark:bg-gray-800 rounded-[2rem] p-8 text-center shadow-lg dark:border dark:border-white/10">
        <div class="inline-block w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
        <p class="mt-4 text-sm font-bold text-slate-500 dark:text-gray-400">Memuat data surah...</p>
      </div>
    </div>

    <!-- ─── Error Message ──────────────────────────────────────── -->
    <div v-if="errorMessage" class="px-4 mb-4">
      <div class="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-4 text-center">
        <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>
        <span class="text-sm font-bold text-red-600 dark:text-red-400">{{ errorMessage }}</span>
      </div>
    </div>

    <!-- ─── Start Button ───────────────────────────────────────── -->
    <div v-if="surahData && !isGameStarted && !isLoadingSurah" class="px-4 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-[2rem] shadow-lg dark:border dark:border-white/10 p-6 text-center">
        <div class="mb-4">
          <h3 class="text-lg font-black text-slate-900 dark:text-white">
            {{ surahData.namaLatin }}
          </h3>
          <p class="text-2xl font-scheherazade-regular text-purple-600 dark:text-purple-400 mt-1">
            {{ surahData.nama }}
          </p>
          <p class="text-xs text-slate-500 dark:text-gray-400 mt-2">
            {{ surahData.jumlahAyat }} Ayat • {{ surahData.tempatTurun }}
          </p>
        </div>

        <button
          @click="startGame"
          class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-4 px-8 rounded-2xl shadow-lg shadow-purple-500/30 active:scale-95 transition-all duration-300 text-sm uppercase tracking-widest hover:shadow-xl hover:shadow-purple-500/40"
        >
          <i class="fas fa-play mr-2"></i> Mulai Tikrar
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- ─── GAME AREA ─────────────────────────────────────────── -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div v-if="isGameStarted && !isGameFinished" class="px-4 space-y-4">

      <!-- ─── Stats Bar ──────────────────────────────────────── -->
      <div class="bg-white dark:bg-gray-800 rounded-[2rem] shadow-lg dark:border dark:border-white/10 p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span :class="levelBadgeColor" class="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border">
              <i class="fas fa-layer-group mr-1"></i> Level {{ currentLevel }} — {{ levelLabel }}
            </span>
          </div>
          <span class="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">
            Ronde {{ roundNumber }}
          </span>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-slate-100 dark:bg-gray-700 rounded-full h-2 mb-3 overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out"
            :class="levelColor"
            :style="{ width: progressPercent + '%' }"
          ></div>
        </div>

        <div class="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-gray-500">
          <span>Ayat {{ currentQueueIndex + 1 }} / {{ ayahQueue.length }}</span>
          <div class="flex items-center gap-3">
            <span>
              <i class="fas fa-fire text-orange-500 mr-1"></i> Streak: {{ correctStreak }}
            </span>
            <span>
              <i class="fas fa-check text-green-500 mr-1"></i> {{ totalCorrect }}/{{ totalAttempts }}
            </span>
          </div>
        </div>
      </div>

      <!-- ─── Streak to Level Up Indicator ────────────────────── -->
      <div v-if="currentLevel < 3" class="flex justify-center gap-1">
        <div
          v-for="i in 3"
          :key="i"
          class="w-8 h-2 rounded-full transition-all duration-500"
          :class="i <= correctStreak
            ? 'bg-gradient-to-r ' + levelColor + ' shadow-sm shadow-green-500/30 scale-110'
            : 'bg-slate-200 dark:bg-gray-700'"
        ></div>
        <span class="text-[9px] font-black text-slate-400 dark:text-gray-500 ml-2 self-center">→ Level {{ currentLevel + 1 }}</span>
      </div>

      <!-- ─── Ayah Card with Spin Animation ──────────────────── -->
      <div class="relative overflow-hidden rounded-[2rem]">
        <div
          class="bg-white dark:bg-gray-800 rounded-[2rem] shadow-lg dark:border dark:border-white/10 p-6 transition-all duration-500"
          :class="{
            'tikrar-spin': isSpinning,
            'ring-4 ring-green-500/30': showResult && lastResult === 'correct',
            'ring-4 ring-red-500/30': showResult && lastResult === 'wrong'
          }"
        >
          <!-- Surah & Ayah Info -->
          <div class="flex items-center justify-between mb-4">
            <span class="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">
              {{ surahData.namaLatin }}
            </span>
            <span class="bg-slate-100 dark:bg-gray-700 px-3 py-1 rounded-xl text-[10px] font-black text-slate-600 dark:text-gray-300">
              Ayat {{ currentAyah?.nomorAyat }}
            </span>
          </div>

          <!-- Arabic Text Display -->
          <div class="text-center py-6 min-h-[120px] flex items-center justify-center">
            <div class="text-right w-full leading-[2.8] font-scheherazade-regular">
              <span v-if="maskedAyahText.visible" class="text-2xl md:text-3xl text-slate-900 dark:text-white">
                {{ maskedAyahText.visible }}
              </span>
              <span class="text-2xl md:text-3xl text-purple-400/60 dark:text-purple-500/40 mx-1"
                    v-if="maskedAyahText.hidden && !showHint">
                {{ maskedAyahText.hidden }}
              </span>
              <!-- Hint: tampilkan teks asli yang disembunyikan -->
              <span class="text-2xl md:text-3xl text-amber-500 dark:text-amber-400 mx-1"
                    v-if="showHint">
                {{ maskedAyahText.hiddenActual }}
              </span>
            </div>
          </div>

          <!-- Result Feedback -->
          <transition name="slide-up">
            <div v-if="showResult" class="mt-4">
              <div
                v-if="lastResult === 'correct'"
                class="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-2xl p-4 text-center"
              >
                <div class="text-2xl mb-1">🎉</div>
                <p class="text-sm font-black text-green-600 dark:text-green-400">Benar! Alhamdulillah</p>
                <p v-if="speechAccuracy !== null" class="text-[10px] font-bold text-green-500/70 mt-1">
                  Akurasi suara: {{ speechAccuracy }}%
                </p>
              </div>
              <div
                v-else
                class="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-4 text-center"
              >
                <div class="text-2xl mb-1">📖</div>
                <p class="text-sm font-black text-red-600 dark:text-red-400">Belum tepat, coba lagi!</p>
                <p v-if="speechAccuracy !== null" class="text-[10px] font-bold text-red-500/70 mt-1">
                  Akurasi suara: {{ speechAccuracy }}%
                </p>
                <!-- Show correct text on wrong answer -->
                <div class="mt-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl">
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Teks Lengkap:</p>
                  <p class="text-lg font-scheherazade-regular text-slate-800 dark:text-gray-200 text-right leading-[2.5]">
                    {{ currentAyah?.teksArab }}
                  </p>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- ─── Action Buttons ─────────────────────────────────── -->
      <div v-if="!showResult" class="space-y-3">
        <!-- Hint Button -->
        <button
          @click="showHint = !showHint"
          class="w-full bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 font-black py-3 px-6 rounded-2xl transition-all active:scale-95 text-xs uppercase tracking-widest"
        >
          <i class="fas fa-eye mr-2"></i>
          {{ showHint ? 'Sembunyikan Petunjuk' : 'Lihat Petunjuk' }}
        </button>

        <!-- Speech Recognition Button: Tekan & Tahan untuk merekam -->
        <button
          @mousedown.prevent="startListening"
          @mouseup.prevent="stopListening"
          @mouseleave="isRecording ? stopListening() : null"
          @touchstart.prevent="startListening"
          @touchend.prevent="stopListening"
          :disabled="isTranscribing"
          :class="[
            isTranscribing 
              ? 'bg-amber-500 shadow-amber-500/30 cursor-wait'
              : isRecording
                ? 'bg-red-500 shadow-red-500/30 ring-4 ring-red-500/20 animate-pulse'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-500/30 hover:shadow-xl'
          ]"
          class="w-full text-white font-black py-4 px-6 rounded-2xl shadow-lg transition-all active:scale-95 text-sm uppercase tracking-widest select-none"
        >
          <i :class="[
            isTranscribing ? 'fas fa-spinner animate-spin'
              : isRecording ? 'fas fa-circle text-red-200 animate-pulse'
              : 'fas fa-microphone'
          ]" class="mr-2"></i>
          <template v-if="isTranscribing">
            Memproses suara...
          </template>
          <template v-else-if="isRecording">
            🔴 Merekam... ({{ recordingDuration }}s) — Lepas untuk kirim
          </template>
          <template v-else>
            🎙️ Tekan & Tahan untuk Merekam
          </template>
        </button>
        <p v-if="!isListening && !isTranscribing" class="text-[10px] text-center text-slate-400 dark:text-gray-500 mt-1">
          Tahan tombol selama membaca ayat, lalu lepaskan.
        </p>

        <!-- Manual Check Buttons -->
        <div class="flex gap-3">
          <button
            @click="answerCorrect"
            class="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black py-4 px-4 rounded-2xl shadow-lg shadow-green-500/20 active:scale-95 transition-all text-xs uppercase tracking-widest"
          >
            <i class="fas fa-check mr-1"></i> Saya Hafal
          </button>
          <button
            @click="answerWrong"
            class="flex-1 bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 font-black py-4 px-4 rounded-2xl active:scale-95 transition-all text-xs uppercase tracking-widest"
          >
            <i class="fas fa-times mr-1"></i> Belum Hafal
          </button>
        </div>
      </div>

      <!-- ─── Next Button (After Result) ─────────────────────── -->
      <div v-if="showResult" class="mt-4">
        <button
          @click="nextAyah"
          class="w-full bg-gradient-to-r text-white font-black py-4 px-8 rounded-2xl shadow-lg active:scale-95 transition-all text-sm uppercase tracking-widest"
          :class="levelColor + ' shadow-purple-500/20'"
        >
          <i class="fas fa-forward mr-2"></i> Ayat Berikutnya
        </button>
      </div>

      <!-- ─── Reset Button ───────────────────────────────────── -->
      <div class="text-center mt-2">
        <button @click="resetGame" class="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest hover:text-red-500 transition-colors">
          <i class="fas fa-redo mr-1"></i> Reset Tikrar
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- ─── GAME FINISHED ─────────────────────────────────────── -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div v-if="isGameFinished" class="px-4">
      <div class="bg-white dark:bg-gray-800 rounded-[2rem] shadow-lg dark:border dark:border-white/10 p-8 text-center">
        <div class="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
          <i class="fas fa-trophy text-3xl text-white"></i>
        </div>
        <h3 class="text-xl font-black text-slate-900 dark:text-white mb-2">Ronde {{ roundNumber }} Selesai!</h3>
        <p class="text-sm text-slate-500 dark:text-gray-400 mb-6">
          Semua ayat dalam surah {{ surahData.namaLatin }} telah selesai ditikrar.
        </p>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-3 mb-6">
          <div class="bg-slate-50 dark:bg-gray-700/50 rounded-2xl p-3">
            <p class="text-xl font-black text-green-600 dark:text-green-400">{{ totalCorrect }}</p>
            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Benar</p>
          </div>
          <div class="bg-slate-50 dark:bg-gray-700/50 rounded-2xl p-3">
            <p class="text-xl font-black text-red-500 dark:text-red-400">{{ totalAttempts - totalCorrect }}</p>
            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Salah</p>
          </div>
          <div class="bg-slate-50 dark:bg-gray-700/50 rounded-2xl p-3">
            <p class="text-xl font-black text-purple-600 dark:text-purple-400">{{ currentLevel }}</p>
            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Level</p>
          </div>
        </div>

        <!-- Accuracy -->
        <div class="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/5 dark:to-pink-500/5 border border-purple-500/20 rounded-2xl p-4 mb-6">
          <p class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            {{ totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0 }}%
          </p>
          <p class="text-[10px] font-black text-purple-500/70 uppercase tracking-widest mt-1">Akurasi Keseluruhan</p>
        </div>

        <div class="flex gap-3">
          <button @click="continueNewRound" class="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-purple-500/30 active:scale-95 transition-all text-xs uppercase tracking-widest">
            <i class="fas fa-redo mr-1"></i> Ronde Baru
          </button>
          <button @click="resetGame" class="flex-1 bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 font-black py-4 px-6 rounded-2xl active:scale-95 transition-all text-xs uppercase tracking-widest">
            <i class="fas fa-home mr-1"></i> Ganti Surah
          </button>
        </div>
      </div>
    </div>

    <!-- ─── How To Play (shown when no surah selected) ─────────── -->
    <div v-if="!selectedSurahId && !isLoadingSurah" class="px-4 mt-2">
      <div class="bg-white dark:bg-gray-800 rounded-[2rem] shadow-lg dark:border dark:border-white/10 p-6">
        <h3 class="text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-4">
          <i class="fas fa-info-circle mr-1"></i> Cara Bermain
        </h3>
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0 text-xs font-black">1</div>
            <div>
              <p class="text-xs font-bold text-slate-700 dark:text-gray-300">Pilih surah yang ingin ditikrar</p>
              <p class="text-[10px] text-slate-400">Ayat akan diacak sehingga tidak berurutan</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0 text-xs font-black">2</div>
            <div>
              <p class="text-xs font-bold text-slate-700 dark:text-gray-300">Baca bagian yang tersembunyi</p>
              <p class="text-[10px] text-slate-400">Atau gunakan fitur suara untuk verifikasi otomatis</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center shrink-0 text-xs font-black">3</div>
            <div>
              <p class="text-xs font-bold text-slate-700 dark:text-gray-300">Naik level dengan 3x benar berturut-turut</p>
              <p class="text-[10px] text-slate-400">Level naik → teks lebih banyak disembunyikan</p>
            </div>
          </div>
        </div>

        <!-- Level Explanation -->
        <div class="mt-6 space-y-2">
          <h4 class="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2">
            Tingkat Kesulitan
          </h4>
          <div class="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20">
            <i class="fas fa-seedling text-emerald-500"></i>
            <div>
              <p class="text-xs font-black text-emerald-700 dark:text-emerald-400">Level 1 — Pemula</p>
              <p class="text-[10px] text-slate-400">30% teks disembunyikan</p>
            </div>
          </div>
          <div class="flex items-center gap-3 bg-amber-50 dark:bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
            <i class="fas fa-fire text-amber-500"></i>
            <div>
              <p class="text-xs font-black text-amber-700 dark:text-amber-400">Level 2 — Menengah</p>
              <p class="text-[10px] text-slate-400">60% teks disembunyikan</p>
            </div>
          </div>
          <div class="flex items-center gap-3 bg-purple-50 dark:bg-purple-500/5 p-3 rounded-xl border border-purple-500/20">
            <i class="fas fa-star text-purple-500"></i>
            <div>
              <p class="text-xs font-black text-purple-700 dark:text-purple-400">Level 3 — Mahir</p>
              <p class="text-[10px] text-slate-400">100% teks disembunyikan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ─── Spin Animation ───────────────────────────────────────────── */
.tikrar-spin {
  animation: tikrar-spin-anim 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes tikrar-spin-anim {
  0% {
    transform: rotateY(0deg) scale(1);
    opacity: 1;
  }
  40% {
    transform: rotateY(90deg) scale(0.85);
    opacity: 0;
  }
  60% {
    transform: rotateY(-90deg) scale(0.85);
    opacity: 0;
  }
  100% {
    transform: rotateY(0deg) scale(1);
    opacity: 1;
  }
}

/* ─── Slide Up Transition ──────────────────────────────────────── */
.slide-up-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-leave-active {
  transition: all 0.2s ease-in;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ─── Smooth perspective for 3D spin ──────────────────────────── */
.relative {
  perspective: 1200px;
}
</style>
