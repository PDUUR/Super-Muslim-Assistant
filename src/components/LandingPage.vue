<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import RamadanGreeting from '@/components/RamadanGreeting.vue';

const emit = defineEmits(['enter']);
const starsContainer = ref(null);
const container = ref(null);

let intervalId;

function createStars() {
  if (!starsContainer.value) return;
  const starCount = Math.floor(window.innerWidth / 3);
  starsContainer.value.innerHTML = '';

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const size = Math.random() * 0.3 + 0.1;
    const delay = Math.random() * 5;

    star.style.cssText = `
      position: absolute;
      top: ${y}%;
      left: ${x}%;
      width: ${size}vh;
      height: ${size}vh;
      background-color: #fff;
      border-radius: 50%;
      opacity: ${Math.random() * 0.5 + 0.3};
      animation: twinkle ${Math.random() * 3 + 2}s infinite ease-in-out ${delay}s;
    `;
    starsContainer.value.appendChild(star);
  }
}

function animateBackground() {
  if (!container.value) return;
  let hue = 220;
  intervalId = setInterval(() => {
    hue = (hue + 0.1) % 240;
    const color1 = `hsl(${hue}, 60%, 12%)`;
    const color2 = `hsl(${hue + 10}, 50%, 25%)`;
    container.value.style.background = `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
  }, 100);
}

const handleResize = () => {
  createStars();
};

onMounted(() => {
  createStars();
  animateBackground();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  clearInterval(intervalId);
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div ref="container" class="landing-container dark">
    <div class="bg-pattern"></div>
    <div class="mosque-silhouette"></div>
    <div ref="starsContainer" class="stars-container"></div>
    <div class="moon"></div>

    <div class="lanterns-container">
      <div class="lantern lantern-1"></div>
      <div class="lantern lantern-2"></div>
      <div class="lantern lantern-3"></div>
    </div>

    <div class="content w-full max-w-[420px] px-4 md:px-6">
      <div class="glass-card p-8 md:p-14 relative overflow-hidden">
        <div class="greeting-arabic text-5xl md:text-7xl mb-6">رمضان مبارک</div>
      
      <!-- Integrated Greeting Project Feature -->
      <RamadanGreeting font-size="text-xl md:text-4xl" />
      
      <div class="divider"></div>
      <div class="quote px-2 italic">"May the spirit of Ramadan illuminate the world and show us the way to peace and harmony"</div>
      
      <button class="enter-btn group" @click="emit('enter')">
        <span class="relative z-10 flex items-center justify-center gap-2">
          Masuk Aplikasi <i class="fas fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
        </span>
      </button>
      </div>
    </div>

    <div class="geometric-pattern top-left"></div>
    <div class="geometric-pattern top-right"></div>
    <div class="geometric-pattern bottom-left"></div>
    <div class="geometric-pattern bottom-right"></div>
  </div>
</template>

<style scoped>
.landing-container {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  color: #fff;
}

.glass-card {
  background: rgba(10, 26, 47, 0.4);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 3.5rem;
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.6);
  position: relative;
}

.bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(circle at 10% 20%, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.03) 10%, transparent 10.1%),
    radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.03) 8%, transparent 8.1%);
  background-size: 100px 100px;
  opacity: 0.5;
  z-index: 0;
}

.mosque-silhouette {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 20vh;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="%23001220" fill-opacity="0.5" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>');
  background-size: cover;
  background-position: center bottom;
  z-index: 1;
}

.stars-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.moon {
  position: absolute;
  top: 10vh;
  right: 10vw;
  width: 10vh;
  height: 10vh;
  background: radial-gradient(circle at 70% 70%, #fff9db, #f9f3d7);
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(255, 249, 219, 0.8);
  z-index: 2;
  animation: glow 4s infinite alternate;
}

.moon::before {
  content: '';
  position: absolute;
  top: 1vh;
  right: 1vh;
  width: 9vh;
  height: 9vh;
  background-color: #0a101f;
  border-radius: 50%;
  transform: translate(1vh, -1vh);
}

.lanterns-container {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 3;
}

.lantern {
  position: absolute;
  width: 6vh;
  height: 10vh;
  background: radial-gradient(ellipse at center, rgba(255, 215, 0, 0.8) 0%, rgba(255, 165, 0, 0.8) 100%);
  border-radius: 50% 50% 5% 5% / 60% 60% 40% 40%;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
  z-index: 3;
}

.lantern-1 { top: 30vh; left: 20vw; animation: float 6s infinite ease-in-out; }
.lantern-2 { top: 20vh; left: 50vw; animation: float 8s infinite ease-in-out 1s; }
.lantern-3 { top: 35vh; right: 20vw; animation: float 7s infinite ease-in-out 2s; }

.content {
  position: relative;
  z-index: 10;
  text-align: center;
}

.greeting-arabic {
  color: #fbbf24;
  text-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
  font-weight: bold;
}

.divider {
  width: 40%;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(251, 191, 36, 0.5), transparent);
  margin: 1.5rem auto;
}

.quote {
  font-size: 0.75rem;
  color: #cad1d9;
  line-height: 1.8;
  margin: 1.5rem auto 2rem;
  opacity: 0.8;
  font-style: italic;
  font-weight: 500;
}

.enter-btn {
  margin-top: 0.5rem;
  padding: 1.4rem 2rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 1.5rem;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  cursor: pointer;
  box-shadow: 0 15px 35px -5px rgba(16, 185, 129, 0.4);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  width: 100%;
  position: relative;
  overflow: hidden;
}

.enter-btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px -5px rgba(16, 185, 129, 0.5);
}

.enter-btn:active {
  transform: scale(0.98);
}

@keyframes glow { 0% { box-shadow: 0 0 20px rgba(255, 249, 219, 0.6); } 100% { box-shadow: 0 0 30px rgba(255, 249, 219, 0.9); } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
@keyframes twinkle { 0%, 100% { opacity: 0.1; } 50% { opacity: 1; } }

@media (max-width: 768px) {
  .glass-card {
    padding: 3rem 1.5rem;
    border-radius: 3rem;
  }
  .greeting-arabic {
    font-size: 4rem;
  }
}
</style>
