<template>
  <div class="w-full mx-auto pb-24 text-left">
    <!-- Hero -->
    <div class="mb-6 p-6 glass rounded-[2.5rem] text-center relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
        <h1 class="text-2xl font-black text-slate-900 dark:text-white mb-1">Cari Masjid Terdekat</h1>
        <p class="text-slate-500 dark:text-gray-400 text-[11px] italic mb-4">Temukan masjid dan musholla di sekitarmu</p>
        
        <div class="flex flex-col items-center gap-3">
            <div class="flex items-center gap-2 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-widest">
                <i class="fas fa-map-marker-alt"></i>
                <span>{{ locationName }}</span>
            </div>
            <div class="flex w-full gap-2">
                <button @click="findNearbyMosques" :disabled="loading"
                        class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-4 py-3 rounded-2xl font-black text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                    <i :class="loading ? 'fas fa-spinner animate-spin' : 'fas fa-search'"></i>
                    {{ loading ? 'Mencari...' : 'Cari Masjid' }}
                </button>
                <select v-model="searchRadius" @change="findNearbyMosques"
                        class="bg-white dark:bg-gray-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 px-4 py-3 rounded-2xl text-[11px] font-bold outline-none">
                    <option :value="1000">1 km</option>
                    <option :value="2000">2 km</option>
                    <option :value="5000">5 km</option>
                    <option :value="10000">10 km</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Map Container -->
    <div class="glass rounded-2xl overflow-hidden mb-6 relative">
        <div ref="mapContainer" id="map-container" class="w-full h-[320px] bg-slate-100 dark:bg-gray-800"></div>
        <div v-if="!mapLoaded" class="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-gray-800">
            <div class="text-center text-slate-400 dark:text-gray-500 p-6">
                <i class="fas fa-map-marked-alt text-4xl mb-3 block"></i>
                <p class="font-bold text-sm">Klik "Cari Masjid" untuk memulai</p>
                <p class="text-[10px] mt-1">Izinkan akses lokasi pada browser Anda</p>
            </div>
        </div>
    </div>

    <!-- Results Counter -->
    <div v-if="mosques.length > 0" class="flex justify-between items-center mb-4 px-1">
        <h3 class="text-sm font-black text-slate-800 dark:text-gray-200">
            Ada <span class="text-green-600 dark:text-green-400">{{ mosques.length }}</span> lokasi
        </h3>
        <span class="text-[9px] font-bold uppercase tracking-widest text-slate-400">Radius {{ searchRadius / 1000 }} km</span>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="glass rounded-2xl p-5 mb-6 border-l-4 border-red-500">
        <p class="text-red-600 dark:text-red-400 font-bold text-xs">{{ error }}</p>
        <p class="text-[10px] text-slate-500 dark:text-gray-400 mt-1">Pastikan izin lokasi aktif.</p>
    </div>

    <!-- Mosque List -->
    <div class="space-y-3 px-1">
        <div v-for="(mosque, idx) in mosques" :key="idx"
             @click="focusMosque(mosque)"
             class="glass p-4 rounded-2xl flex items-center gap-3 cursor-pointer active:scale-95 transition-all group border-b border-slate-100 dark:border-white/5">
            <div class="w-10 h-10 bg-green-100 dark:bg-green-500/10 rounded-xl flex items-center justify-center shrink-0 text-green-600 dark:text-green-400 text-lg">
                <i class="fas fa-mosque"></i>
            </div>
            <div class="flex-grow min-w-0">
                <h4 class="font-bold text-xs text-slate-900 dark:text-white truncate">{{ mosque.name || 'Masjid / Musholla' }}</h4>
                <p class="text-[10px] text-slate-500 dark:text-gray-400 truncate leading-tight mt-0.5">{{ mosque.address || 'Alamat tidak tersedia' }}</p>
            </div>
            <div class="shrink-0 text-right">
                <p class="text-xs font-black text-green-600 dark:text-green-400">{{ formatDistance(mosque.distance) }}</p>
                <a :href="getGoogleMapsLink(mosque)" target="_blank" @click.stop
                   class="text-[9px] text-blue-500 hover:underline font-bold block mt-1">
                    <i class="fas fa-directions"></i> Rute
                </a>
            </div>
        </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && mosques.length === 0 && searched" class="glass rounded-[2rem] p-10 text-center">
        <div class="text-4xl mb-3">🕌</div>
        <h3 class="font-bold text-slate-700 dark:text-gray-300 text-sm">Tidak ditemukan masjid</h3>
        <p class="text-[10px] text-slate-500 dark:text-gray-400 mt-1">Coba perbesar radius pencarian Anda.</p>
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
const searchRadius = ref(2000);
const locationName = ref('Mencari lokasi...');
let userLat = null;
let userLon = null;
let map = null;
let markers = [];
let leafletLoaded = false;

// Load Leaflet dynamically
const loadLeaflet = () => {
    return new Promise((resolve, reject) => {
        if (leafletLoaded) return resolve();
        
        // CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        // JS
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
    
    map = window.L.map(mapContainer.value).setView([lat, lon], 14);
    
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // User marker
    const userIcon = window.L.divIcon({
        html: '<div style="background: #22c55e; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
        iconSize: [16, 16],
        className: ''
    });
    window.L.marker([lat, lon], { icon: userIcon }).addTo(map).bindPopup('<b>Posisi Anda</b>');
    
    mapLoaded.value = true;
};

const addMosqueMarkers = () => {
    if (!window.L || !map) return;
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    
    const mosqueIcon = window.L.divIcon({
        html: '<div style="background: #16a34a; color: white; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><i class="fas fa-mosque"></i></div>',
        iconSize: [28, 28],
        className: ''
    });
    
    mosques.value.forEach(mosque => {
        const marker = window.L.marker([mosque.lat, mosque.lon], { icon: mosqueIcon })
            .addTo(map)
            .bindPopup(`<b>${mosque.name || 'Masjid'}</b><br>${mosque.address || ''}<br><a href="${getGoogleMapsLink(mosque)}" target="_blank">Buka di Google Maps</a>`);
        markers.push(marker);
    });

    if (mosques.value.length > 0) {
        const allPoints = [[userLat, userLon], ...mosques.value.map(m => [m.lat, m.lon])];
        map.fitBounds(allPoints, { padding: [50, 50] });
    }
};

const findNearbyMosques = async () => {
    loading.value = true;
    error.value = '';
    searched.value = true;
    
    try {
        // Get user location
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000
            });
        });
        
        userLat = position.coords.latitude;
        userLon = position.coords.longitude;

        // Get location name
        try {
            const geoResp = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLon}`);
            locationName.value = geoResp.data.address.city || geoResp.data.address.town || geoResp.data.address.city_district || 'Lokasi Terdeteksi';
        } catch {
            locationName.value = 'Lokasi Terdeteksi';
        }

        // Load Leaflet and init map
        await loadLeaflet();
        initMap(userLat, userLon);

        // Query Overpass API for nearby mosques
        const overpassQuery = `
            [out:json][timeout:25];
            (
              node["amenity"="place_of_worship"]["religion"="muslim"](around:${searchRadius.value},${userLat},${userLon});
              way["amenity"="place_of_worship"]["religion"="muslim"](around:${searchRadius.value},${userLat},${userLon});
              node["building"="mosque"](around:${searchRadius.value},${userLat},${userLon});
              way["building"="mosque"](around:${searchRadius.value},${userLat},${userLon});
            );
            out center body;
        `;

        const response = await axios.post(
            'https://overpass-api.de/api/interpreter',
            `data=${encodeURIComponent(overpassQuery)}`,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        // Process results
        const results = response.data.elements.map(el => {
            const lat = el.lat || el.center?.lat;
            const lon = el.lon || el.center?.lon;
            const distance = calculateDistance(userLat, userLon, lat, lon);
            return {
                name: el.tags?.name || el.tags?.['name:id'] || el.tags?.['name:en'] || null,
                address: el.tags?.['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}`.trim() : el.tags?.['addr:full'] || null,
                lat,
                lon,
                distance,
            };
        });

        // Sort by distance
        mosques.value = results.sort((a, b) => a.distance - b.distance);
        addMosqueMarkers();
        
    } catch (err) {
        console.error(err);
        if (err.code === 1) {
            error.value = 'Izin lokasi ditolak. Silakan aktifkan di pengaturan browser Anda.';
        } else {
            error.value = 'Gagal mencari masjid. Periksa koneksi internet Anda.';
        }
    } finally {
        loading.value = false;
    }
};

const focusMosque = (mosque) => {
    if (map) {
        map.setView([mosque.lat, mosque.lon], 17);
    }
};

// Haversine formula
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

const getGoogleMapsLink = (mosque) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${mosque.lat},${mosque.lon}`;
};

onUnmounted(() => {
    if (map) map.remove();
});
</script>

<style scoped>
</style>
