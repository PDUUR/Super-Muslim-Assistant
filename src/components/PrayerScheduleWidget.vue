<template>
  <div class="prayer-widget">
    <!-- Header: Pilihan Kota -->
    <div class="pw-header">
      <div class="pw-title-row">
        <h3 class="pw-title">
          <span class="pw-icon">🕌</span>
          Jadwal Salat
        </h3>
        <button class="pw-city-btn" @click="showCityPicker = !showCityPicker">
          {{ prayerStore.cityName || 'Pilih Kota' }}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>

      <!-- City Picker -->
      <transition name="slide-down">
        <div v-if="showCityPicker" class="city-picker">
          <div class="city-search">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari kota... (contoh: Jakarta)"
              class="city-search-input"
              @input="onSearchCity"
            />
          </div>

          <div class="city-list">
            <!-- Search Results -->
            <template v-if="searchResults.length > 0">
              <button
                v-for="city in searchResults"
                :key="city.id"
                class="city-item"
                @click="onSelectCity(city)"
              >
                📍 {{ city.name }}
              </button>
            </template>

            <!-- Popular Cities -->
            <template v-else-if="!searchQuery">
              <p class="city-list-label">Kota Populer:</p>
              <button
                v-for="city in prayerStore.popularCities"
                :key="city.id"
                class="city-item"
                @click="onSelectCity(city)"
              >
                📍 {{ city.name }}
              </button>
            </template>

            <p v-else class="city-empty">Tidak ditemukan. Coba kata kunci lain.</p>
          </div>
        </div>
      </transition>
    </div>

    <!-- Countdown ke Salat Berikutnya -->
    <div v-if="prayerStore.hasCity && prayerStore.nextPrayer" class="pw-countdown-card">
      <div class="pw-countdown-label">Menuju</div>
      <div class="pw-countdown-prayer">
        <span class="pw-countdown-icon">{{ prayerStore.nextPrayer.icon }}</span>
        {{ prayerStore.nextPrayer.name }}
      </div>
      <div class="pw-countdown-time">{{ prayerStore.countdown }}</div>
      <div class="pw-countdown-target">
        Pukul {{ prayerStore.nextPrayer.time }} WIB
      </div>
    </div>

    <!-- Tabel Jadwal Salat Hari Ini -->
    <div v-if="prayerStore.allPrayers.length > 0" class="pw-schedule">
      <div
        v-for="prayer in prayerStore.allPrayers"
        :key="prayer.name"
        class="pw-prayer-row"
        :class="{ 
          'pw-prayer-row--active': prayerStore.nextPrayer?.name === prayer.name,
          'pw-prayer-row--passed': isPassed(prayer.time) 
        }"
      >
        <div class="pw-prayer-left">
          <span class="pw-prayer-icon">{{ prayer.icon }}</span>
          <span class="pw-prayer-name">{{ prayer.name }}</span>
        </div>
        <span class="pw-prayer-time">{{ prayer.time }}</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!prayerStore.hasCity" class="pw-empty">
      <span class="pw-empty-icon">🌙</span>
      <p>Pilih kota terlebih dahulu untuk melihat jadwal salat.</p>
    </div>

    <!-- Loading -->
    <div v-if="prayerStore.isLoading" class="pw-loading">
      <div class="pw-spinner"></div>
      Memuat jadwal...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { usePrayerStore } from '@/stores/prayerStore'

const prayerStore = usePrayerStore()
const showCityPicker = ref(false)
const searchQuery = ref('')
const searchResults = ref([])

let searchTimeout = null

const onSearchCity = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!searchQuery.value || searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }

  searchTimeout = setTimeout(async () => {
    searchResults.value = await prayerStore.searchCities(searchQuery.value)
  }, 400)
}

const onSelectCity = async (city) => {
  await prayerStore.selectCity(city)
  showCityPicker.value = false
  searchQuery.value = ''
  searchResults.value = []
}

const isPassed = (timeStr) => {
  if (!timeStr) return false
  const [h, m] = timeStr.split(':').map(Number)
  const now = new Date()
  return (now.getHours() * 60 + now.getMinutes()) > (h * 60 + m)
}

onMounted(() => {
  prayerStore.initialize()
})

onUnmounted(() => {
  prayerStore.stopCountdown()
})
</script>

<style scoped>
.prayer-widget {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 20px;
  backdrop-filter: blur(20px);
}

.pw-header {
  margin-bottom: 16px;
}

.pw-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pw-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.pw-icon { font-size: 20px; }

.pw-city-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.pw-city-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* City Picker */
.city-picker {
  margin-top: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 12px;
}

.city-search-input {
  width: 100%;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  color: #fff;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}

.city-search-input::placeholder {
  color: rgba(255,255,255,0.4);
}

.city-search-input:focus {
  border-color: rgba(99, 102, 241, 0.5);
}

.city-list {
  max-height: 200px;
  overflow-y: auto;
  margin-top: 8px;
}

.city-list-label {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  margin: 8px 0 4px 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.city-item {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  color: #fff;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.city-item:hover {
  background: rgba(99, 102, 241, 0.2);
}

.city-empty {
  text-align: center;
  color: rgba(255,255,255,0.4);
  font-size: 12px;
  padding: 16px;
}

/* Countdown */
.pw-countdown-card {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 95, 70, 0.2));
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  margin-bottom: 16px;
}

.pw-countdown-label {
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.pw-countdown-prayer {
  font-size: 18px;
  font-weight: 700;
  color: #10b981;
  margin: 4px 0;
}

.pw-countdown-icon { margin-right: 4px; }

.pw-countdown-time {
  font-size: 36px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  color: #fff;
  letter-spacing: 2px;
  margin: 8px 0;
}

.pw-countdown-target {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
}

/* Schedule Table */
.pw-schedule {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pw-prayer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-radius: 12px;
  transition: all 0.2s;
}

.pw-prayer-row--active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1));
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.pw-prayer-row--passed {
  opacity: 0.4;
}

.pw-prayer-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pw-prayer-icon { font-size: 16px; }

.pw-prayer-name {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.pw-prayer-time {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255,255,255,0.8);
  font-family: 'JetBrains Mono', monospace;
}

/* Empty State */
.pw-empty {
  text-align: center;
  padding: 32px 16px;
}

.pw-empty-icon { font-size: 40px; display: block; margin-bottom: 8px; }
.pw-empty p { color: rgba(255,255,255,0.4); font-size: 13px; }

/* Loading */
.pw-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: rgba(255,255,255,0.5);
  font-size: 13px;
}

.pw-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transitions */
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}
</style>
