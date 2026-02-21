<template>
  <div class="w-full min-h-screen mx-auto pb-24 text-left bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 transition-colors duration-500">
    <!-- Header Hero -->
    <div class="mb-6 p-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-b-[3rem] shadow-xl border-b border-white/40 dark:border-white/5 relative overflow-hidden text-center">
        <div class="absolute -right-16 -top-16 w-48 h-48 bg-green-500/10 rounded-full blur-3xl"></div>
        <div class="absolute -left-10 bottom-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
        
        <h1 class="text-3xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">Cari Masjid</h1>
        
        <div class="flex flex-col gap-4 items-center">
            <!-- Status Badge -->
            <div class="flex items-center gap-2 px-4 py-2 bg-[#A3C7B6]/10 rounded-full border border-[#A3C7B6]/20">
                <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-[#A3C7B6]"></span>
                </span>
                <span class="text-green-700 dark:text-[#A3C7B6] text-[10px] font-black uppercase tracking-[0.15em]">{{ locationName }}</span>
            </div>

            <!-- Main Search Controls -->
            <div class="flex w-full gap-3">
                <button @click="findNearbyMosques" :disabled="loading"
                        class="flex-[2] relative overflow-hidden bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-2xl font-black text-xs shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 group">
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-mosque'"></i>
                    {{ loading ? 'Sinkronisasi...' : 'Cari Terdekat' }}
                </button>
                
                <div class="flex-1 relative">
                    <select v-model="searchRadius" @change="findNearbyMosques"
                            class="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white pl-5 pr-10 py-4 rounded-2xl text-[12px] font-black shadow-lg outline-none focus:ring-2 focus:ring-[#A3C7B6]/50">
                        <option :value="1000">1 KM</option>
                        <option :value="3000">3 KM</option>
                        <option :value="5000">5 KM</option>
                        <option :value="10000">10 KM</option>
                    </select>
                    <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <i class="fas fa-chevron-down text-[10px]"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Map Container -->
    <div class="px-6 mb-8 relative">
        <div class="relative w-full h-[340px] rounded-[2.5rem] shadow-2xl border-4 border-white dark:border-slate-800 overflow-hidden group">
            <div ref="mapContainer" id="map-container" class="w-full h-full bg-slate-100 dark:bg-slate-900 z-0"></div>
            
            <!-- Dynamic Search Button (Visible when map moved) -->
            <Transition name="slide-up">
              <button v-if="mapMoved && !loading" @click="searchInThisArea" 
                      class="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-green-600 dark:bg-[#A3C7B6] text-white dark:text-slate-900 px-6 py-2.5 rounded-full shadow-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border-2 border-white dark:border-slate-800 hover:scale-105 active:scale-95 transition-all">
                <i class="fas fa-sync-alt"></i> Cari Di Area Ini
              </button>
            </Transition>

            <!-- Map Initialization Overlay -->
            <div v-if="!mapLoaded" class="absolute inset-0 z-[1001] bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center text-center p-10">
                <div class="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center text-3xl mb-4 animate-bounce-slow">
                    🗺️
                </div>
                <h3 class="font-black text-slate-800 dark:text-white text-lg mb-1 tracking-tight">Inisialisasi Peta</h3>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 max-w-[200px]">Aktifkan GPS untuk akurasi presisi tinggi.</p>
            </div>
        </div>
    </div>

    <!-- Mosque List / Results -->
    <div class="px-6 pb-12">
        <div v-if="mosques.length > 0" class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-black text-slate-800 dark:text-white tracking-tight">Hasil Pencarian</h3>
            <span class="text-[10px] font-black text-[#A3C7B6] bg-[#A3C7B6]/10 px-3 py-1 rounded-full uppercase tracking-widest border border-[#A3C7B6]/20">
                {{ mosques.length }} Lokasi
            </span>
        </div>

        <!-- Error Alert -->
        <Transition name="fade">
            <div v-if="error" class="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 p-5 rounded-3xl mb-6 flex items-center gap-4">
                <span class="text-2xl outline-none">⚠️</span>
                <p class="text-rose-600 dark:text-rose-400 text-xs font-black leading-tight">{{ error }}</p>
            </div>
        </Transition>

        <!-- Skeleton Screens -->
        <div v-if="loading" class="space-y-4">
            <div v-for="i in 3" :key="i" class="bg-white/40 dark:bg-slate-900/40 p-5 rounded-[2.2rem] border border-white/20 dark:border-white/5 animate-pulse flex items-center gap-4">
                <div class="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                <div class="flex-1 space-y-3">
                    <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                    <div class="h-2 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                </div>
            </div>
        </div>

        <!-- Real Results -->
        <div v-else class="space-y-4">
            <div v-for="(mosque, idx) in mosques" :key="idx" 
                 @click="focusMosque(mosque)"
                 class="group bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-[2.5rem] border border-transparent hover:border-[#A3C7B6]/40 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer active:scale-[0.98]">
                <div class="flex items-center gap-5">
                    <!-- Icon Box -->
                    <div class="w-16 h-16 bg-gradient-to-br from-[#A3C7B6] to-green-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-green-500/20 group-hover:rotate-6 transition-transform">
                        <i class="fas fa-mosque"></i>
                    </div>

                    <!-- Details -->
                    <div class="flex-1 min-w-0 pr-2">
                        <h4 class="font-black text-[13px] text-slate-800 dark:text-white truncate mb-1">{{ mosque.name || 'Masjid / Musholla' }}</h4>
                        <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1 mb-2">{{ mosque.address || 'Alamat terdeteksi via OSM' }}</p>
                        
                        <div class="flex items-center gap-3">
                            <span class="text-[11px] font-black text-green-600 dark:text-[#A3C7B6]">{{ formatDistance(mosque.distance) }}</span>
                            <div class="h-1 w-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                            <button @click.stop="openNavigation(mosque)" class="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-[0.1em] hover:underline flex items-center gap-1">
                                <i class="fas fa-directions"></i> Navigasi
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-if="searched && mosques.length === 0" class="bg-white/40 dark:bg-slate-900/40 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                <div class="text-5xl mb-4 group-hover:scale-110 transition-transform">🕌</div>
                <h3 class="font-black text-slate-800 dark:text-white text-lg">Tidak Ada Hasil</h3>
                <p class="text-[11px] text-slate-500 max-w-[200px] mx-auto mt-2 italic leading-relaxed">Coba perbesar radius pencarian atau geser peta ke area lain.</p>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

const mapContainer = ref(null);
const mosques = ref([]);
const loading = ref(false);
const error = ref('');
const searched = ref(false);
const mapLoaded = ref(false);
const mapMoved = ref(false);
const searchRadius = ref(3000);
const locationName = ref('Mencari GPS...');

let map = null;
let markersLayer = null;
let userMarker = null;
let userLat = null;
let userLon = null;
let leafletLoaded = false;

// Load Leaflet dynamically to avoid SSR/NPM issues
const loadLeaflet = () => {
    return new Promise((resolve, reject) => {
        if (leafletLoaded) return resolve();
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => { leafletLoaded = true; resolve(); };
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

const initMap = (lat, lon) => {
    if (!window.L || !mapContainer.value) return;
    
    if (map) map.remove();
    
    map = window.L.map(mapContainer.value, {
        zoomControl: false,
        attributionControl: false
    }).setView([lat, lon], 15);
    
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    // User Position Marker (Blue Pulse)
    const userIcon = window.L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-6 h-6 bg-blue-500 opacity-25 rounded-full animate-ping"></div>
            <div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
          </div>
        `,
        iconSize: [24, 24],
        className: ''
    });
    userMarker = window.L.marker([lat, lon], { icon: userIcon }).addTo(map);
    
    // Layer for mosque markers
    markersLayer = window.L.layerGroup().addTo(map);

    // Detect Map Move
    map.on('moveend', () => {
      const center = map.getCenter();
      const dist = calculateDistance(lat, lon, center.lat, center.lng);
      if (dist > 500) mapMoved.value = true;
    });

    mapLoaded.value = true;
};

const findNearbyMosques = async () => {
    loading.value = true;
    error.value = '';
    searched.value = true;
    mapMoved.value = false;
    
    try {
        // 1. Get High Accuracy GPS
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            });
        });
        
        userLat = position.coords.latitude;
        userLon = position.coords.longitude;

        // 2. Load Tools
        await loadLeaflet();
        initMap(userLat, userLon);

        // 3. Reverse Geocode (Nominatim - Free)
        try {
            const geo = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLon}`);
            locationName.value = geo.data.address.city || geo.data.address.town || geo.data.address.suburb || 'Lokasi Aktif';
        } catch { locationName.value = 'Lokasi Aktif'; }

        // 4. Fetch from Overpass API (Free)
        await performSearch(userLat, userLon);

    } catch (err) {
        console.error(err);
        error.value = (err.code === 1) ? 'Izin lokasi ditolak. Silakan aktifkan GPS Anda.' : 'Gagal memuat peta atau lokasi. Periksa koneksi Anda.';
    } finally {
        loading.value = false;
    }
};

const performSearch = async (lat, lon) => {
    const radius = searchRadius.value;
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});
        way["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});
        node["building"="mosque"](around:${radius},${lat},${lon});
        way["building"="mosque"](around:${radius},${lat},${lon});
      );
      out center body;
    `;

    const response = await axios.post(
        'https://overpass-api.de/api/interpreter',
        `data=${encodeURIComponent(query)}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const results = response.data.elements.map(el => {
        const mLat = el.lat || el.center?.lat;
        const mLon = el.lon || el.center?.lon;
        return {
            id: el.id,
            name: el.tags?.name || el.tags?.['name:id'] || 'Masjid Tanpa Nama',
            address: el.tags?.['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}` : (el.tags?.['addr:full'] || 'Alamat tidak terdata'),
            lat: mLat,
            lon: mLon,
            distance: calculateDistance(userLat, userLon, mLat, mLon)
        };
    }).sort((a, b) => a.distance - b.distance);

    mosques.value = results;
    updateMarkers();
};

const searchInThisArea = async () => {
    if (!map) return;
    loading.value = true;
    mapMoved.value = false;
    const center = map.getCenter();
    try {
        await performSearch(center.lat, center.lng);
    } catch (err) {
        error.value = "Gagal mencari di area ini.";
    } finally {
        loading.value = false;
    }
};

const updateMarkers = () => {
    if (!markersLayer || !window.L) return;
    markersLayer.clearLayers();

    const mosqueIcon = window.L.divIcon({
        html: `
          <div class="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center shadow-lg border-2 border-white">
            <i class="fas fa-mosque text-xs"></i>
          </div>
        `,
        iconSize: [32, 32],
        className: ''
    });

    mosques.value.forEach(m => {
        window.L.marker([m.lat, m.lon], { icon: mosqueIcon })
            .addTo(markersLayer)
            .bindPopup(`
                <div style="font-family: sans-serif; padding: 5px;">
                  <b style="font-size: 13px; color: #1e293b;">${m.name}</b><br>
                  <p style="font-size: 10px; color: #64748b; margin: 4px 0;">${m.address}</p>
                  <a href="https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lon}" target="_blank" 
                     style="display: inline-block; background: #22c55e; color: white; padding: 4px 10px; border-radius: 6px; text-decoration: none; font-size: 10px; font-weight: 800; margin-top: 5px;">
                     NAVIGASI
                  </a>
                </div>
            `);
    });

    if (mosques.value.length > 0) {
        const points = mosques.value.map(m => [m.lat, m.lon]);
        points.push([userLat, userLon]);
        map.fitBounds(points, { padding: [50, 50] });
    }
};

const focusMosque = (mosque) => {
    if (map) {
        map.setView([mosque.lat, mosque.lon], 17);
    }
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const formatDistance = (meters) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
};

const openNavigation = (mosque) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${mosque.lat},${mosque.lon}`, '_blank');
};

onUnmounted(() => {
    if (map) map.remove();
});
</script>

<style scoped>
/* Leaflet Popup Customization */
:deep(.leaflet-popup-content-wrapper) {
  border-radius: 1.5rem;
  padding: 5px;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}
:deep(.leaflet-popup-tip) {
  display: none;
}

.animate-bounce-slow {
  animation: bounce-slow 3s infinite ease-in-out;
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.4s ease-out;
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translate(-50%, 20px);
  opacity: 0;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Glass Effect */
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
</style>
