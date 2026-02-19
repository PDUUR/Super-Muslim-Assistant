<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useGardenStore } from '@/stores/gardenStore'
import { useIbadahStore } from '@/stores/ibadahStore'

const gardenStore = useGardenStore()
const ibadahStore = useIbadahStore()

const showMessage = ref(false)
const messageText = ref('')

onMounted(async () => {
    await gardenStore.initialize()
})

// Visual Assets Mapping (Placeholder URLs or Local Assets)
// Untuk produksi, ganti dengan path aset/lottie yang sesuai
const getTreeAsset = () => {
    const level = gardenStore.gardenData.treeLevel
    const health = gardenStore.gardenData.treeHealth
    const type = gardenStore.gardenData.treeType
    
    // Logic sederhana: jika kesehatan < 20, tampilkan versi layu
    const state = health < 20 ? 'withered' : 'healthy'
    
    // Return path or class based on state
    // Disini kita pakai emoji/div CSS sementara jika belum ada gambar
    if (level === 1) return '🌱' // Seed
    if (level === 2) return '🌿' // Sprout
    if (level === 3) return '🌳' // Sapling (small tree)
    if (level === 4) return '🌲' // Mature
    return '🌱'
}

const envEffects = computed(() => gardenStore.gardenData.environment)

// Helper: Feedback text
const feedbackText = computed(() => {
    if (gardenStore.gardenData.treeHealth < 30) return "Sepertinya kebunmu sedang kering, yuk siram dengan sholat tepat waktu!"
    if (envEffects.value.fireflies) return "Malam yang indah ditemani cahaya kebaikanmu..."
    if (envEffects.value.butterflies) return "Lebah-lebah datang karena kedermawananmu hari ini!"
    if (gardenStore.gardenData.treeHealth >= 90) return "Maa Shaa Allah! Kebunmu sangat subur."
    return "Terus sirami kebunmu dengan ibadah ya!"
})

</script>

<template>
    <div class="garden-container relative w-full h-full min-h-[400px] rounded-3xl overflow-hidden bg-gradient-to-b from-sky-300 via-sky-100 to-green-100 dark:from-slate-800 dark:via-slate-900 dark:to-green-900 transition-all duration-700">
        
        <!-- Sky Layer (Dynamic based on time could be added) -->
        <div class="absolute inset-0 pointer-events-none">
            <!-- Sun/Moon represented by CSS shapes or icons could go here -->
            <div class="absolute top-4 right-4 text-4xl animate-pulse text-yellow-400">
                <i class="fas fa-sun"></i>
            </div>
        </div>

        <!-- Environmental Effects -->
        <div v-if="envEffects.rain" class="rain-effect absolute inset-0 pointer-events-none z-10"></div>
        <div v-if="envEffects.fireflies" class="fireflies-effect absolute inset-0 pointer-events-none z-10"></div>
        
        <!-- Main Content Area -->
        <div class="relative z-20 flex flex-col items-center justify-end h-full w-full pb-8">
            
            <!-- Message Bubble -->
            <div class="mb-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-lg border border-white/20 max-w-[80%] text-center animate-bounce-slow">
                <p class="text-xs font-bold text-slate-700 dark:text-gray-200">
                    {{ feedbackText }}
                </p>
            </div>

            <!-- The Tree -->
            <div class="tree-stage relative transition-all duration-500 transform hover:scale-105 cursor-pointer">
                <!-- Visual Representation -->
                <div class="text-[8rem] lg:text-[10rem] filter drop-shadow-2xl transition-all duration-1000"
                     :class="{'grayscale brightness-50': gardenStore.gardenData.treeHealth < 20}">
                    {{ getTreeAsset() }}
                </div>
                
                <!-- Fruits / Add-ons -->
                <div v-if="envEffects.goldenFruit" class="absolute top-10 left-10 text-4xl animate-bounce">🍎</div>
                <div v-if="envEffects.butterflies" class="absolute top-1/2 -right-8 text-2xl animate-pulse">🦋</div>
            </div>

            <!-- Ground -->
            <div class="w-full h-12 bg-gradient-to-t from-green-600 to-green-400 dark:from-green-900 dark:to-green-700 mt-[-1rem] rounded-b-3xl relative overflow-hidden">
                <!-- Grass blades decoration can be CSS -->
                <div class="absolute bottom-0 w-full h-4 bg-black/10"></div>
            </div>
        </div>

        <!-- HUD / Stats Overlay -->
        <div class="absolute top-4 left-4 z-30 flex flex-col gap-2">
            <!-- Health Bar -->
            <div class="bg-white/80 dark:bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-sm w-32">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-[10px] font-black uppercase text-slate-500 dark:text-gray-400">Kesehatan</span>
                    <span class="text-[10px] font-bold" :class="gardenStore.gardenData.treeHealth < 30 ? 'text-red-500' : 'text-green-600'">
                        {{ Math.round(gardenStore.gardenData.treeHealth) }}%
                    </span>
                </div>
                <div class="w-full bg-slate-200 dark:bg-gray-600 h-1.5 rounded-full overflow-hidden">
                    <div class="h-full bg-green-500 transition-all duration-1000 ease-out"
                         :style="{ width: `${gardenStore.gardenData.treeHealth}%`, backgroundColor: gardenStore.gardenData.treeHealth < 30 ? '#ef4444' : '#22c55e' }"></div>
                </div>
            </div>

            <!-- Level Badge -->
            <div class="bg-white/80 dark:bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-sm self-start">
                <span class="text-[10px] font-black text-slate-600 dark:text-gray-300">
                    Lv. {{ gardenStore.gardenData.treeLevel }} — {{ gardenStore.currentTreeName }}
                </span>
            </div>
        </div>

    </div>
</template>

<style scoped>
/* Simple CSS Animations for Environment */
.animate-bounce-slow {
    animation: bounce 3s infinite;
}

/* Rain Effect */
.rain-effect {
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='); /* Simple placeholder */
    /* Real implementation would use multiple divs or canvas */
    opacity: 0.3;
}

/* Fireflies (CSS Only) */
.fireflies-effect::before,
.fireflies-effect::after {
    content: '';
    position: absolute;
    width: 4px;
    height: 4px;
    background: #fbbf24;
    border-radius: 50%;
    box-shadow: 0 0 10px #fbbf24;
    animation: firefly-move 4s infinite alternate;
}
.fireflies-effect::after {
    left: 70%;
    top: 60%;
    animation-delay: 1s;
    animation-duration: 6s;
}

@keyframes firefly-move {
    0% { transform: translate(0, 0); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translate(20px, -20px); opacity: 0; }
}
</style>
