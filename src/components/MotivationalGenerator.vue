<script setup>
import { ref, reactive } from 'vue';
import versesData from '@/assets/motivational-verses.json';

const nameInput = ref('');
const result = reactive({
  show: false,
  name: '',
  verse: null,
  motivation: ''
});

const motivations = [
  "Semangat puasanya ya! Semoga Allah melipatgandakan pahalamu.",
  "Jaga kesehatan dan niatnya, semoga hari ini penuh berkah.",
  "Jangan lupa untuk selalu tersenyum dan berbuat baik hari ini.",
  "Ramadhan adalah waktu terbaik untuk memperbaiki diri, kamu pasti bisa!",
  "Semoga setiap tetes keringatmu dalam ibadah menjadi penghapus dosa.",
  "Tetap sabar dan semangat, keberkahan sedang menantimu di setiap waktu."
];

let lastVerseIndex = -1;

const generateQuote = () => {
  if (!nameInput.value.trim()) return;

  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * versesData.length);
  } while (randomIndex === lastVerseIndex && versesData.length > 1);

  lastVerseIndex = randomIndex;
  
  result.name = nameInput.value;
  result.verse = versesData[randomIndex];
  result.motivation = motivations[Math.floor(Math.random() * motivations.length)];
  result.show = true;
  
  // Reset input after generate
  nameInput.value = '';
};
</script>

<template>
  <div class="mt-12 max-w-2xl mx-auto">
    <div class="glass p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 transition-colors duration-500">
      <h2 class="text-2xl font-black text-emerald-700 dark:text-emerald-400 mb-6 uppercase tracking-widest">
        <i class="fas fa-magic mr-2"></i> Motivasi Ramadhan
      </h2>
      
      <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 mb-8">
        <input 
          v-model="nameInput" 
          @keyup.enter="generateQuote"
          type="text" 
          placeholder="Masukkan namamu..." 
          class="w-full bg-slate-50 dark:bg-gray-900/50 border border-emerald-500/30 rounded-2xl p-4 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner placeholder:text-slate-400 dark:placeholder:text-gray-500 text-sm font-bold"
        >
        <button 
          @click="generateQuote"
          class="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs min-w-[120px]"
        >
          <i class="fas fa-paper-plane"></i> Gass
        </button>
      </div>

      <!-- Result Section -->
      <transition name="fade-up">
        <div v-if="result.show" class="result-card bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 p-8 rounded-3xl relative overflow-hidden transition-colors duration-500">
          <div class="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
            <i class="fas fa-quote-right text-6xl text-emerald-950 dark:text-white"></i>
          </div>
          
          <div class="relative z-10 text-start">
            <p class="text-emerald-800 dark:text-emerald-400 font-bold text-lg mb-2">Halo, {{ result.name }}! ✨</p>
            <p class="text-slate-950 dark:text-white text-xl font-medium mb-6 leading-relaxed">
              "{{ result.motivation }}"
            </p>
            
            <div class="divider border-t border-emerald-500/20 dark:border-emerald-500/10 my-6"></div>
            
            <div class="quran-verse">
              <p class="text-emerald-600 dark:text-emerald-500 font-black text-xs uppercase tracking-[0.3em] mb-3">Terjemahan Ayat Suci</p>
              <p class="text-slate-800 dark:text-gray-200 italic text-lg leading-relaxed mb-4">
                "{{ result.verse.translation }}"
              </p>
              <p class="text-emerald-800 dark:text-emerald-400 font-bold text-sm">
                — QS. {{ result.verse.surah }}: {{ result.verse.ayah }}
              </p>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.glass {
  @apply bg-white dark:bg-white/5 backdrop-blur-2xl;
}

.fade-up-enter-active, .fade-up-leave-active {
  transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.result-card {
  animation: pulse-glow 3s infinite alternate;
}

@keyframes pulse-glow {
  0% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.05); }
  100% { box-shadow: 0 0 35px rgba(16, 185, 129, 0.15); }
}
</style>
