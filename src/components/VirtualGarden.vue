<template>
  <div class="garden-wrapper relative w-full h-[540px] rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-1000" :class="bgClass">
    
    <!-- Sky & Background (Image reference: Blue-to-Green gradient) -->
    <div class="absolute inset-0 bg-gradient-to-b from-[#7CE2FE] via-[#A8F1FF] to-[#99E198]"></div>

    <!-- Background clouds -->
    <div class="absolute inset-0 opacity-40 pointer-events-none">
      <div v-for="n in 3" :key="n" class="cloud-cluster absolute" :style="cloudStyle(n)">
        <div class="w-32 h-12 bg-white rounded-full blur-xl"></div>
      </div>
    </div>

    <!-- Header: Health Card -->
    <div class="relative z-20 pt-12 px-6 flex flex-col items-center">
      <div class="bg-white/95 backdrop-blur-md px-6 py-4 rounded-3xl shadow-[0_15px_30px_rgba(0,0,0,0.1)] border border-white/20 w-64 flex flex-col gap-3 animate-float-slow">
        <div class="flex items-center gap-3">
          <div class="w-6 h-6 bg-green-500/10 rounded-lg flex items-center justify-center">
            <span class="text-sm">🌳</span>
          </div>
          <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Kesehatan</span>
          
          <!-- Request Permission Button (iOS) -->
          <button v-if="permissionNeeded && !permissionGranted" @click="requestMotionPermission" class="ml-auto text-[10px] px-2 py-1 bg-blue-500 text-white rounded-lg font-bold">
            Aktifkan Goyang
          </button>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex-grow h-3 bg-slate-100 rounded-full overflow-hidden p-[2px]">
            <div class="h-full bg-gradient-to-r from-[#81D87E] to-[#4CAF50] rounded-full transition-all duration-1000 ease-out" 
                 :style="{ width: `${displayHealth}%` }"></div>
          </div>
          <span class="text-[11px] font-black text-slate-400 whitespace-nowrap">{{ displayHealth }}%</span>
        </div>
      </div>
    </div>

    <!-- Tree Scene -->
    <div class="absolute inset-0 flex items-end justify-center pb-24">
      
      <!-- Grass -->
      <div class="absolute bottom-0 w-full h-24 bg-gradient-to-t from-[#4CA84C]/50 to-transparent"></div>
      
      <!-- The Tree System -->
      <div class="tree-container relative" :style="treeContainerStyle">
        
        <!-- Achievement Effect: New Sapling (Scholar) -->
        <div v-if="ibadahStore.unlockedEffects.newSeeds" 
             class="absolute -left-20 bottom-0 w-12 h-16 animate-float-slow"
             title="Pohon Zaitun (Scholar)">
           <svg viewBox="0 0 50 80" class="w-full h-full drop-shadow-lg">
             <path d="M25 80 L25 50" stroke="#5D4037" stroke-width="4" stroke-linecap="round"/>
             <circle cx="25" cy="40" r="15" fill="#84A98C"/>
             <circle cx="15" cy="50" r="8" fill="#52796F"/>
             <circle cx="35" cy="50" r="8" fill="#52796F"/>
           </svg>
           <span class="absolute -bottom-4 left-0 w-full text-[6px] font-black uppercase text-slate-400 text-center">Zaitun</span>
        </div>

        <!-- Achievement Effect: Golden Aura (Pecinta Kebun - 100 Mins) -->
        <div v-if="ibadahStore.unlockedEffects.aura"
             class="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/30 blur-[60px] rounded-full animate-pulse pointer-events-none mix-blend-screen"></div>

        <!-- SVG Tree -->
        <svg viewBox="0 0 200 250" class="w-[280px] h-[350px] drop-shadow-[0_25px_35px_rgba(0,0,0,0.15)] overflow-visible">
          <defs>
            <radialGradient id="leafGradient" cx="40%" cy="30%" r="70%">
              <stop offset="0%" :stop-color="leafColors.light" />
              <stop offset="100%" :stop-color="leafColors.dark" />
            </radialGradient>
            <linearGradient id="trunkGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" :stop-color="ibadahStore.unlockedEffects.strongTrunk ? '#5D4037' : '#8B5E3C'" />
              <stop offset="100%" :stop-color="ibadahStore.unlockedEffects.strongTrunk ? '#3E2723' : '#5D4037'" />
            </linearGradient>
            
            <filter id="dewDrop">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
              <feOffset dx="1" dy="1" result="offsetblur" />
              <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
              <feMerge> 
                <feMergeNode />
                <feMergeNode in="SourceGraphic" /> 
              </feMerge>
            </filter>
          </defs>

          <g class="trunk-system" :style="{ transform: `rotate(${shakeAngle * 0.5}deg)`, transformOrigin: '100px 250px', transition: 'transform 0.1s' }">
             <path :d="ibadahStore.unlockedEffects.strongTrunk ? 'M90 250 L110 250 L105 140 L95 140 Z' : 'M94 250 L106 250 L103 140 L97 140 Z'" fill="url(#trunkGradient)" />
             <path d="M100 180 L80 160" stroke="#8B5E3C" :stroke-width="ibadahStore.unlockedEffects.strongTrunk ? 8 : 6" stroke-linecap="round" />
             <path d="M100 200 L125 175" stroke="#8B5E3C" :stroke-width="ibadahStore.unlockedEffects.strongTrunk ? 8 : 6" stroke-linecap="round" />
          </g>
          
          <g class="crown-system" :class="{ swaying: !isShaking }" :style="crownShakeStyle">
            <g v-for="(c, i) in crownCircles" :key="i">
                <circle :cx="c.x" :cy="c.y" :r="c.r" fill="url(#leafGradient)" class="leaf shadow-inner-3d" />
                <circle v-if="ibadahStore.unlockedEffects.dew && i % 2 === 0" 
                        :cx="c.x - (c.r/3)" :cy="c.y - (c.r/3)" :r="c.r/8" 
                        fill="white" opacity="0.6" filter="url(#dewDrop)" class="animate-pulse" />
            </g>
          </g>
        </svg>

        <!-- Dynamic Fruits (Inside tree container) -->
        <div v-if="displayHealth >= 90">
             <div v-for="f in fruits" :key="f.id" 
                  class="absolute w-3 h-3 bg-amber-400 rounded-full shadow-md z-10 transition-transform"
                  :class="{'animate-pulse': !f.dropped}"
                  :style="fruitStyle(f)">
             </div>
        </div>

        <!-- Dynamic Bees (Inside tree container) -->
        <div v-if="hasBees" class="absolute inset-0 z-20">
          <div v-for="b in bees" :key="b.id" 
               class="bee-wrapper absolute transition-all cursor-pointer" 
               :style="beeStyle(b)"
               @click.stop="killBee(b.id)">
             <div class="text-2xl select-none" 
                  :class="[b.isDead ? 'grayscale' : 'animate-buzz', ibadahStore.unlockedEffects.rareButterflies ? 'text-amber-400' : '']">
                  {{ ibadahStore.unlockedEffects.rareButterflies ? '✨' : '🐝' }}
             </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Message Card -->
    <div class="absolute bottom-10 inset-x-8 z-30">
      <transition name="pop-up">
        <div class="bg-white/95 p-6 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.12)] border border-white/20 flex items-center gap-5">
          <div class="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center text-3xl">🌱</div>
          <div class="flex-grow">
             <p class="text-[14px] font-black text-slate-800 leading-tight">{{ statusMessage }}</p>
          </div>
        </div>
      </transition>
    </div>

    <!-- Rain Overlay -->
    <div v-if="isRaining" class="absolute inset-0 z-10 pointer-events-none rain-container">
      <div v-for="n in 30" :key="n" class="raindrop" :style="rainDropStyle(n)"></div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useIbadahStore } from '@/stores/ibadahStore'

const props = defineProps({
  userId: { type: String, default: null },
  externalHealth: { type: Number, default: null }
})

const ibadahStore = useIbadahStore()

// --- CORE STATS ---
const crownCircles = [
    { x: 75, y: 160, r: 30 },
    { x: 125, y: 160, r: 30 },
    { x: 70, y: 115, r: 28 },
    { x: 130, y: 115, r: 28 },
    { x: 100, y: 95, r: 45 }
]
const displayHealth = computed(() => {
  if (props.externalHealth !== null) return props.externalHealth
  const todayLog = ibadahStore.todayLog || []
  const prayers = ['subuh','dzuhur','ashar','maghrib','isya']
  const count = todayLog.filter(id => prayers.includes(id)).length
  return Math.round((count / 5) * 100)
})

const statusMessage = computed(() => {
  if (displayHealth.value === 100) return 'Kebunmu segar bugar karena sholatmu lengkap!'
  if (displayHealth.value >= 80) return 'Masya Allah, kebunmu tumbuh subur!'
  if (displayHealth.value >= 60) return 'Kebunmu haus, ayo segera siram dengan sholat!'
  if (displayHealth.value > 0) return 'Kebunmu mulai layu... Yuk gerak cepat!'
  return 'Mari hidupkan kembali kebunmu dengan sholat tepat waktu.'
})

const leafColors = computed(() => {
  if (displayHealth.value >= 80) return { light: '#86EFAC', dark: '#22C55E' }
  if (displayHealth.value >= 40) return { light: '#FDE047', dark: '#EAB308' }
  return { light: '#FCA5A5', dark: '#EF4444' }
})

// --- PHYSICS ENGINE: SHAKE & FRUITS ---
const shakeAngle = ref(0)
const isShaking = ref(false)
const permissionGranted = ref(false)
const permissionNeeded = ref(false)
// Initial positions relative to tree container center (roughly)
const initialFruitPos = [
    {id:1, x: 80, y: 130}, {id:2, x: 125, y: 145}, 
    {id:3, x: 95, y: 100}, {id:4, x: 140, y: 120}
]
const fruits = ref(initialFruitPos.map(f => ({...f, dropped: false, dy: 0})))

const requestMotionPermission = async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
            const response = await DeviceMotionEvent.requestPermission()
            if (response === 'granted') {
                permissionGranted.value = true
                window.addEventListener('devicemotion', handleMotion)
            }
        } catch (e) { console.error(e) }
    }
}

const handleMotion = (event) => {
    const acc = event.accelerationIncludingGravity
    if (!acc) return

    // Calculate intensity (ignoring Z mostly for 2D shake)
    // Simple X-axis sway logic
    const x = acc.x || 0
    shakeAngle.value = x * 2 // Multiplier for visual effect

    const intensity = Math.abs(x)
    
    if (intensity > 2) {
        isShaking.value = true
        // Debounce shake reset
        clearTimeout(shakeTimeout)
        shakeTimeout = setTimeout(() => {
            isShaking.value = false
            shakeAngle.value = 0
        }, 300)
    }

    // Fruit Drop Threshold
    if (intensity > 15) { // Hard shake
        dropFruits()
    }
}
let shakeTimeout

const dropFruits = () => {
    fruits.value.forEach(f => {
        if (!f.dropped) {
            f.dropped = true
            // Simple gravity simulation via CSS transition or JS interval?
            // CSS transition is smoother and easier for "one-off" drop
        }
    })
}

const fruitStyle = (f) => {
    // Convert SVG coords to CSS absolute position (roughly)
    // SVG is 200x250, Rendered wide.
    // Let's map roughly: SVG coord (x,y) -> CSS px
    // Container is scaled.
    // Simplifying: Render fruits based on % or px relative to container center
    // Tree is anchored bottom center.
    // Fruit X in SVG: f.x. SVG Center X=100. Diff = f.x - 100.
    // Let's rely on standard offset
    const offsetX = (f.x - 100) * 1.5 // Scale factor approximation
    const offsetY = (f.y - 250) * 1.5 // From bottom
    
    let transform = `translate(${offsetX}px, ${offsetY}px)`
    let opacity = 1

    if (f.dropped) {
        // Drop to ground (y=0 relative to tree bottom anchor?)
        // Container PB-24 means tree bottom is at bottom-24px.
        // Let's just drop them simply by 150px
        transform = `translate(${offsetX}px, ${offsetY + 180}px) rotate(${Math.random()*360}deg)`
    } else {
         // Sync with shake
         transform = `translate(${offsetX}px, ${offsetY}px) rotate(${shakeAngle.value}deg)`
    }

    return {
        left: '50%',
        bottom: '0', 
        transform: transform,
        transition: f.dropped ? 'transform 0.6s cubic-bezier(0.5, 0, 0.75, 0)' : 'transform 0.1s linear' // Bounce effect hard to do with simple cubic
    }
}


// --- TREE STYLES ---
const treeContainerStyle = computed(() => {
  const level = ibadahStore.level || 1
  const scale = 0.9 + (level * 0.04)
  return { 
      transform: `scale(${Math.min(scale, 1.4)})`, 
      transformOrigin: 'bottom center' 
  }
})

const crownShakeStyle = computed(() => ({
    transform: `rotate(${shakeAngle.value}deg)`,
    transformOrigin: '100px 250px',
    transition: 'transform 0.1s linear'
}))


// --- INTERACTIVE BEES ---
const bees = ref([
  { id: 1, x: 0, y: 0, flip: false, duration: 3, isDead: false, hide: false },
  { id: 2, x: 0, y: 0, flip: false, duration: 4, isDead: false, hide: false }
])
const hasBees = computed(() => ibadahStore.todayLog.includes('sedekah'))
let beeTimeouts = {}

const moveBee = (id) => {
  const bee = bees.value.find(b => b.id === id)
  if (!bee || bee.isDead) return

  const newX = Math.random() * 300 - 150
  const newY = Math.random() * 200 - 150
  bee.flip = newX < bee.x
  bee.x = newX
  bee.y = newY
  bee.duration = 2 + Math.random() * 3

  beeTimeouts[id] = setTimeout(() => moveBee(id), bee.duration * 1000)
}

const killBee = (id) => {
    const bee = bees.value.find(b => b.id === id)
    if (!bee || bee.isDead) return
    
    // Stop movement
    clearTimeout(beeTimeouts[id])
    
    // Set Dead State (triggers CSS drop transition)
    bee.isDead = true
    
    // Allow drop animation to finish (e.g., 0.6s)
    setTimeout(() => {
        bee.hide = true // Disappear
        
        // Wait 3 seconds before respawning
        setTimeout(() => {
            bee.isDead = false
            bee.hide = false
            bee.x = 0 
            bee.y = 0
            
            // Wait a tick to ensure it renders at trunk before flying
            setTimeout(() => moveBee(id), 50)
        }, 3000)
    }, 600) 
}

const beeStyle = (b) => {
  if (b.hide) return { opacity: 0 } 
  
  if (b.isDead) {
      // Drop to bottom
      return {
          transform: `translate(${b.x}px, 200px) rotate(180deg)`, // 200px down = ground roughly
          left: '50%',
          top: '40%',
          transition: 'transform 0.5s ease-in',
          filter: 'grayscale(100%)'
      }
  }

  return {
    transform: `translate(${b.x}px, ${b.y}px) scaleX(${b.flip ? -1 : 1})`,
    transition: `transform ${b.duration}s ease-in-out`,
    left: '50%',
    top: '40%'
  }
}


// --- LIFECYCLE ---
watch(hasBees, (val) => {
  if (val) {
    bees.value.forEach(bee => moveBee(bee.id))
  }
})

onMounted(() => {
  if (hasBees.value) {
    bees.value.forEach(bee => moveBee(bee.id))
  }

  // Check iOS permission requirement
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      permissionNeeded.value = true
  } else {
      window.addEventListener('devicemotion', handleMotion)
  }
})

onUnmounted(() => {
    window.removeEventListener('devicemotion', handleMotion)
    Object.values(beeTimeouts).forEach(clearTimeout)
})


// --- HELPERS (Clouds, Rain, etc) ---
const isRaining = computed(() => ibadahStore.currentStreak >= 3)
const cloudStyle = (n) => ({
  top: `${10 + (n * 12)}%`,
  left: `${(n * 30) - 10}%`,
  animation: `float ${12 + n}s infinite ease-in-out`
})
const windStyle = (n) => ({
  top: `${50 + (n * 20)}px`,
  left: n % 2 === 0 ? '-40px' : '280px',
  width: `${20 + (n * 10)}px`,
  animationDelay: `${n * 0.4}s`,
  opacity: displayHealth.value > 30 ? 0.4 : 0
})
const rainDropStyle = (n) => ({
  left: `${n * 3.3}%`,
  top: `-${Math.random() * 100}px`,
  animationDuration: `${0.6 + Math.random()}s`,
  animationDelay: `${Math.random() * 2}s`
})
</script>

<style scoped>
.swaying {
  transform-origin: 100px 250px;
  animation: tree-sway 8s infinite ease-in-out;
}

@keyframes tree-sway {
  0%, 100% { transform: rotate(-1.5deg); }
  50% { transform: rotate(1.5deg); }
}
/* ... existing animations ... */
@keyframes float {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(30px); }
}
@keyframes float-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes wind {
  0% { transform: translateX(-30px); opacity: 0; }
  20% { opacity: 0.4; }
  80% { opacity: 0.4; }
  100% { transform: translateX(80px); opacity: 0; }
}
@keyframes raindrop-anim {
  0% { transform: translateY(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(600px); opacity: 0; }
}
@keyframes buzz {
  0%, 100% { transform: translate(0, 0); }
  20% { transform: translate(-1px, 1px); }
  40% { transform: translate(1px, -1px); }
  60% { transform: translate(-1px, -1px); }
  80% { transform: translate(1px, 1px); }
}

.animate-buzz { display: inline-block; animation: buzz 0.1s infinite; }
.animate-float-slow { animation: float-slow 4s infinite ease-in-out; }
.animate-wind { animation: wind 4s infinite ease-in; }
.raindrop {
  position: absolute; width: 2px; height: 12px; background: rgba(255,255,255,0.3); border-radius: 99px;
  animation: raindrop-anim linear infinite;
}

.pop-up-enter-active, .pop-up-leave-active { transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.pop-up-enter-from, .pop-up-leave-to { opacity: 0; transform: translateY(30px) scale(0.9); }
</style>
