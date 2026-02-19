<template>
  <div class="w-full mx-auto pb-24 text-left">
    <!-- Hero Section -->
    <div class="mb-6 p-6 glass rounded-[2rem] text-center relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-32 h-32 bg-green-500/10 rounded-full blur-2xl"></div>
        <img src="/img/masjid.png" class="w-12 inline-block mb-3 hover:scale-110 transition-transform" alt="Icon">
        <h1 class="text-2xl font-black text-slate-900 dark:text-white mb-1">Kalender & Puasa</h1>
        <p class="text-slate-500 dark:text-gray-400 italic text-[10px]">Integrasi Masehi & Hijriah</p>
        
        <!-- Stats Summary -->
        <div class="flex justify-center gap-6 mt-4">
            <div class="text-center">
                <p class="text-[8px] uppercase font-black tracking-widest text-green-600 mb-0.5">Puasa</p>
                <p class="text-2xl font-black text-slate-900 dark:text-white">{{ totalPuasa }}</p>
            </div>
            <div class="w-[1px] bg-slate-100 dark:bg-white/5"></div>
            <div class="text-center">
                <p class="text-[8px] uppercase font-black tracking-widest text-amber-600 mb-0.5">Bolong</p>
                <p class="text-2xl font-black text-slate-900 dark:text-white">{{ totalBolong }}</p>
            </div>
        </div>
    </div>

    <!-- Calendar Controls -->
    <div class="flex items-center justify-between mb-4 gap-2">
        <div class="flex items-center gap-3">
            <button @click="prevMonth" class="bg-white dark:bg-white/5 w-8 h-8 rounded-full flex items-center justify-center shadow-sm active:scale-90 border border-slate-100 dark:border-white/5">
                <i class="fas fa-chevron-left text-[10px]"></i>
            </button>
            <div class="text-center min-w-[120px]">
                <h3 class="text-sm font-black text-slate-800 dark:text-gray-100">{{ monthNames[currentMonth] }} {{ currentYear }}</h3>
                <p class="text-[8px] font-bold text-green-600 dark:text-green-400 uppercase tracking-tighter">{{ hijriMonthSummary }}</p>
            </div>
            <button @click="nextMonth" class="bg-white dark:bg-white/5 w-8 h-8 rounded-full flex items-center justify-center shadow-sm active:scale-90 border border-slate-100 dark:border-white/5">
                <i class="fas fa-chevron-right text-[10px]"></i>
            </button>
        </div>
        <button @click="goToToday" class="bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider">
            Hari Ini
        </button>
    </div>

    <!-- Calendar Grid -->
    <div class="glass rounded-2xl overflow-hidden mb-6 relative border border-slate-100 dark:border-white/5">
        <!-- Weekday Headers -->
        <div class="grid grid-cols-7 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
            <div v-for="day in ['M', 'S', 'S', 'R', 'K', 'J', 'S']" :key="day" 
                 class="py-2 text-center text-[9px] font-black text-slate-400">
                {{ day }}
            </div>
        </div>

        <!-- Days Grid -->
        <div class="grid grid-cols-7">
            <!-- Blank days -->
            <div v-for="blank in firstDayOfMonth" :key="'blank-'+blank" class="h-16 border-b border-r border-slate-50 dark:border-white/5 bg-slate-50/30 dark:bg-black/10"></div>
            
            <!-- Calendar Day Cells -->
            <div v-for="day in daysInMonth" :key="day" 
                 @click="!isFuture(day) && handleDateClick(day)"
                 class="h-16 p-1 border-b border-r border-slate-50 dark:border-white/5 relative group transition-all"
                 :class="[
                    isToday(day) ? 'bg-green-500/10' : '',
                    getLogForDate(day) ? (getLogForDate(day).status === 'puasa' ? 'bg-green-500/5' : 'bg-amber-500/5') : '',
                    isFuture(day) ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer active:bg-slate-100 dark:active:bg-white/5'
                 ]">
                <!-- Gregorian Date -->
                <span class="text-xs font-black relative z-10" :class="isToday(day) ? 'text-green-600' : 'text-slate-600 dark:text-gray-400'">
                    {{ day }}
                </span>

                <!-- Status Dot -->
                <div v-if="getLogForDate(day)" 
                     class="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full"
                     :class="getLogForDate(day).status === 'puasa' ? 'bg-green-500' : 'bg-amber-500'">
                </div>

                <!-- Small Hijri -->
                <span class="absolute top-1 right-1 text-[7px] font-bold text-slate-300 dark:text-gray-600">
                    {{ getHijriDay(day) }}
                </span>
            </div>
        </div>
    </div>

    <!-- Legend -->
    <div class="flex flex-wrap gap-4 text-[9px] font-black uppercase text-slate-400 justify-center">
        <div class="flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div> Puasa
        </div>
        <div class="flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Bolong
        </div>
        <div class="flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Hari Ini
        </div>
    </div>

    <!-- History Tabs Section -->
    <div class="mt-8 mb-6">
        <h2 class="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <i class="fas fa-history text-green-600"></i>
            Riwayat Catatan
        </h2>

        <!-- Tab Switcher -->
        <div class="flex gap-1 bg-slate-100 dark:bg-white/5 rounded-2xl p-1 mb-5">
            <button 
                @click="historyTab = 'puasa'" 
                class="flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                :class="historyTab === 'puasa' ? 'bg-white dark:bg-gray-800 text-green-600 shadow-sm' : 'text-slate-400'">
                <i class="fas fa-check-circle mr-1"></i> Puasa ({{ totalPuasa }})
            </button>
            <button 
                @click="historyTab = 'bolong'" 
                class="flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                :class="historyTab === 'bolong' ? 'bg-white dark:bg-gray-800 text-amber-600 shadow-sm' : 'text-slate-400'">
                <i class="fas fa-times-circle mr-1"></i> Bolong ({{ totalBolong }})
            </button>
        </div>

        <!-- Puasa Tab Content -->
        <div v-if="historyTab === 'puasa'">
            <div v-if="puasaLogs.length === 0" class="text-center py-12 glass rounded-3xl border border-white/20">
                <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                    <i class="fas fa-moon text-2xl text-slate-400"></i>
                </div>
                <p class="text-sm text-slate-500 dark:text-gray-400">Belum ada catatan puasa</p>
                <p class="text-xs text-slate-400 dark:text-gray-500 mt-1">Klik tanggal di kalender untuk mencatat</p>
            </div>

            <div v-else class="space-y-3">
                <div 
                    v-for="log in puasaLogs" 
                    :key="log.date"
                    class="glass rounded-2xl p-4 border border-white/20 hover:border-green-500/50 transition-all group">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3 flex-1">
                            <div class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <i class="fas fa-check text-green-600 text-lg"></i>
                            </div>
                            <div class="flex-1">
                                <p class="font-black text-slate-900 dark:text-white">{{ formatFullDate(log.date) }}</p>
                                <p class="text-xs text-slate-500 dark:text-gray-400">{{ formatHijriDate(log.date) }}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="text-right mr-2">
                                <p class="text-xs font-black uppercase tracking-widest text-green-600">Puasa</p>
                                <p class="text-[10px] text-slate-400">{{ formatRelativeTime(log.date) }}</p>
                            </div>
                            <button 
                                @click="quickEditLog(log)"
                                class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-500/20 transition-all opacity-0 group-hover:opacity-100"
                                title="Edit">
                                <i class="fas fa-edit text-xs"></i>
                            </button>
                            <button 
                                @click="quickDeleteLog(log.date)"
                                class="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/10 text-red-600 hover:bg-red-200 dark:hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                                title="Hapus">
                                <i class="fas fa-trash text-xs"></i>
                            </button>
                        </div>
                    </div>
                    <div v-if="log.note" class="mt-3 pt-3 border-t border-slate-200 dark:border-white/10">
                        <p class="text-xs text-slate-600 dark:text-gray-400 italic">"{{ log.note }}"</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bolong Tab Content -->
        <div v-else-if="historyTab === 'bolong'">
            <div v-if="bolongLogs.length === 0" class="text-center py-12 glass rounded-3xl border border-white/20">
                <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                    <i class="fas fa-check-circle text-2xl text-green-500"></i>
                </div>
                <p class="text-sm text-green-600 dark:text-green-400 font-bold">Alhamdulillah! Tidak ada puasa yang bolong</p>
                <p class="text-xs text-slate-400 dark:text-gray-500 mt-1">Semua hari puasa terisi lengkap</p>
            </div>

            <div v-else class="space-y-3">
                <div 
                    v-for="log in bolongLogs" 
                    :key="log.date"
                    class="glass rounded-2xl p-4 border border-white/20 hover:border-amber-500/50 transition-all group">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3 flex-1">
                            <div class="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <i class="fas fa-times text-amber-600 text-lg"></i>
                            </div>
                            <div class="flex-1">
                                <p class="font-black text-slate-900 dark:text-white">{{ formatFullDate(log.date) }}</p>
                                <p class="text-xs text-slate-500 dark:text-gray-400">{{ formatHijriDate(log.date) }}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="text-right mr-2">
                                <p class="text-xs font-black uppercase tracking-widest text-amber-600">Bolong</p>
                                <p class="text-[10px] text-slate-400">{{ formatRelativeTime(log.date) }}</p>
                            </div>
                            <button 
                                @click="quickEditLog(log)"
                                class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-500/20 transition-all opacity-0 group-hover:opacity-100"
                                title="Edit">
                                <i class="fas fa-edit text-xs"></i>
                            </button>
                            <button 
                                @click="quickDeleteLog(log.date)"
                                class="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/10 text-red-600 hover:bg-red-200 dark:hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                                title="Hapus">
                                <i class="fas fa-trash text-xs"></i>
                            </button>
                        </div>
                    </div>
                    <div v-if="log.note" class="mt-3 pt-3 border-t border-slate-200 dark:border-white/10">
                        <p class="text-xs text-slate-600 dark:text-gray-400">Alasan: {{ log.note }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Summary Footer -->
        <div class="mt-6 p-4 glass rounded-2xl border border-white/20 text-center">
            <p class="text-xs text-slate-500 dark:text-gray-400">
                Total: <span class="font-black text-green-600">{{ totalPuasa }} hari puasa</span> • 
                <span class="font-black text-amber-600">{{ totalBolong }} hari bolong</span>
            </p>
            <p class="text-[10px] text-slate-400 mt-1">
                Persentase: {{ completionPercentage }}%
            </p>
        </div>
    </div>

    <!-- Modal Form -->
    <Teleport to="body">
        <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in">
            <div class="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up border border-white/50 dark:border-white/5">
                <div class="p-8 pb-3 flex justify-between items-center">
                    <div>
                        <h3 class="text-2xl font-black text-slate-900 dark:text-white">Catat Ibadah</h3>
                        <p class="text-[10px] font-bold text-green-600 dark:text-green-400 tracking-widest uppercase">
                            {{ formattedSelectedDate }}
                        </p>
                    </div>
                    <button @click="showModal = false" class="text-slate-400 hover:text-red-500 transition-colors">
                        <i class="fas fa-times-circle text-2xl"></i>
                    </button>
                </div>
                
                <form @submit.prevent="handleSubmit" class="p-8 pt-4 space-y-6">
                    <!-- Status Selection -->
                    <div class="space-y-2">
                        <label class="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-gray-400">Status</label>
                        <div class="flex gap-4">
                            <label class="flex-1 cursor-pointer">
                                <input type="radio" value="puasa" v-model="form.status" class="hidden peer">
                                <div class="p-4 text-center rounded-2xl border-2 border-slate-100 dark:border-white/5 peer-checked:border-green-500 peer-checked:bg-green-50 dark:peer-checked:bg-green-500/10 transition-all font-bold text-slate-500 dark:text-gray-400 peer-checked:text-green-600 dark:peer-checked:text-green-400">
                                    <i class="fas fa-moon mb-1"></i><br>Puasa
                                </div>
                            </label>
                            <label class="flex-1 cursor-pointer">
                                <input type="radio" value="bolong" v-model="form.status" class="hidden peer">
                                <div class="p-4 text-center rounded-2xl border-2 border-slate-100 dark:border-white/5 peer-checked:border-amber-500 peer-checked:bg-amber-50 dark:peer-checked:bg-amber-500/10 transition-all font-bold text-slate-500 dark:text-gray-400 peer-checked:text-amber-600 dark:peer-checked:text-amber-500">
                                    <i class="fas fa-exclamation-triangle mb-1"></i><br>Bolong
                                </div>
                            </label>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label class="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-gray-400">Keterangan / Alasan</label>
                        <textarea v-model="form.note" rows="3" placeholder="Tulis alasan atau catatan hari ini..."
                                  class="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none transition-all resize-none"></textarea>
                    </div>

                    <div class="flex gap-3">
                        <button v-if="getLogForDate(selectedDay)" type="button" @click="handleDelete"
                                class="w-1/3 bg-red-100 dark:bg-red-500/10 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-200 transition-all">
                            Hapus
                        </button>
                        <button type="submit" 
                                :class="getLogForDate(selectedDay) ? 'w-2/3' : 'w-full'"
                                class="bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-green-600/20 transition-all hover:translate-y-[-2px] active:scale-95 text-lg">
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { usePuasaStore } from '@/stores/puasaStore';

const puasaStore = usePuasaStore();

// Calendar State
const today = new Date();
const currentMonth = ref(today.getMonth());
const currentYear = ref(today.getFullYear());
const showModal = ref(false);
const selectedDay = ref(null);

const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const form = reactive({
    status: 'puasa',
    note: ''
});

// History Tab State
const historyTab = ref('puasa');

// Computed Properties for History
const puasaLogs = computed(() => {
    return puasaStore.logs
        .filter(l => l.status === 'puasa')
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
});

const bolongLogs = computed(() => {
    return puasaStore.logs
        .filter(l => l.status === 'bolong')
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
});

const completionPercentage = computed(() => {
    const total = totalPuasa.value + totalBolong.value;
    if (total === 0) return 100;
    return Math.round((totalPuasa.value / total) * 100);
});

// Helper Functions for History Display
const formatFullDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
};

const formatHijriDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        numberingSystem: 'latn'
    });
    
    const parts = hijriFormatter.formatToParts(date);
    const dayPart = parts.find(p => p.type === 'day')?.value || '';
    const monthPart = parts.find(p => p.type === 'month')?.value || '';
    const yearPart = parts.find(p => p.type === 'year')?.value || '';
    
    // Map Arabic month names to Indonesian
    const monthMap = {
        'Muharram': 'Muharram',
        'Safar': 'Safar',
        'Rabiʻ I': 'Rabiul Awal',
        'Rabiʻ II': 'Rabiul Akhir',
        'Jumada I': 'Jumadil Awal',
        'Jumada II': 'Jumadil Akhir',
        'Rajab': 'Rajab',
        'Shaʻban': 'Syakban',
        'Ramadan': 'Ramadhan',
        'Shawwal': 'Syawal',
        'Dhuʻl-Qiʻdah': 'Dzulkaidah',
        'Dhuʻl-Hijjah': 'Dzulhijjah'
    };
    
    const indonesianMonth = monthMap[monthPart] || monthPart;
    return `${dayPart} ${indonesianMonth} ${yearPart} H`;
};

const formatRelativeTime = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0); 
    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0);
    
    const diffMs = now - logDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan lalu`;
    return `${Math.floor(diffDays / 365)} tahun lalu`;
};

// Calendar Calculations
const daysInMonth = computed(() => {
    return new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
});

const firstDayOfMonth = computed(() => {
    return new Date(currentYear.value, currentMonth.value, 1).getDay();
});

// Hijri Integration - Using Intl API for accurate Islamic calendar
const getHijriDate = (day) => {
    const date = new Date(currentYear.value, currentMonth.value, day);
    
    const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        numberingSystem: 'latn'
    });
    
    const parts = hijriFormatter.formatToParts(date);
    const dayPart = parts.find(p => p.type === 'day')?.value || '';
    const monthPart = parts.find(p => p.type === 'month')?.value || '';
    const yearPart = parts.find(p => p.type === 'year')?.value || '';
    
    return { day: dayPart, month: monthPart, year: yearPart };
};

const getHijriDay = (day) => {
    return getHijriDate(day).day;
};

const getHijriMonth = (day) => {
    const monthMap = {
        'Muharram': 'Muharram',
        'Safar': 'Safar',
        'Rabiʻ I': 'Rabiul Awal',
        'Rabiʻ II': 'Rabiul Akhir',
        'Jumada I': 'Jumadil Awal',
        'Jumada II': 'Jumadil Akhir',
        'Rajab': 'Rajab',
        'Shaʻban': 'Syakban',
        'Ramadan': 'Ramadhan',
        'Shawwal': 'Syawal',
        'Dhuʻl-Qiʻdah': 'Dzulkaidah',
        'Dhuʻl-Hijjah': 'Dzulhijjah'
    };
    
    const arabicMonth = getHijriDate(day).month;
    return monthMap[arabicMonth] || arabicMonth;
};

const hijriMonthSummary = computed(() => {
    const first = getHijriMonth(1);
    const last = getHijriMonth(daysInMonth.value);
    if (first === last) return first;
    return `${first} - ${last}`;
});

// Events & Handlers
const handleDateClick = (day) => {
    selectedDay.value = day;
    const existing = getLogForDate(day);
    form.status = existing ? existing.status : 'puasa';
    form.note = existing ? existing.note : '';
    showModal.value = true;
};

const handleSubmit = () => {
    const dateStr = formatDateKey(selectedDay.value);
    puasaStore.addLog({
        date: dateStr,
        status: form.status,
        note: form.note
    });
    showModal.value = false;
};

const handleDelete = () => {
    if (confirm('Hapus catatan untuk tanggal ini?')) {
        const dateStr = formatDateKey(selectedDay.value);
        puasaStore.deleteLogByDate(dateStr);
        showModal.value = false;
    }
};

const prevMonth = () => {
    if (currentMonth.value === 0) {
        currentMonth.value = 11;
        currentYear.value--;
    } else {
        currentMonth.value--;
    }
};

const nextMonth = () => {
    if (currentMonth.value === 11) {
        currentMonth.value = 0;
        currentYear.value++;
    } else {
        currentMonth.value++;
    }
};

const goToToday = () => {
    currentMonth.value = today.getMonth();
    currentYear.value = today.getFullYear();
};

// Quick Actions from History List
const quickEditLog = (log) => {
    // Parse the date string to get day, month, year
    const date = new Date(log.date);
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    
    // Navigate calendar to that month
    currentMonth.value = month;
    currentYear.value = year;
    
    // Open modal with existing data
    selectedDay.value = day;
    form.status = log.status;
    form.note = log.note || '';
    showModal.value = true;
    
    // Scroll to calendar
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const quickDeleteLog = (dateStr) => {
    if (confirm('Hapus catatan untuk tanggal ini?')) {
        puasaStore.deleteLogByDate(dateStr);
    }
};

// Helpers
const formatDateKey = (day) => {
    const year = currentYear.value;
    const month = String(currentMonth.value + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${month}-${d}`;
};

const getLogForDate = (day) => {
    return puasaStore.logsMapped[formatDateKey(day)];
};

const isToday = (day) => {
    return day === today.getDate() && 
           currentMonth.value === today.getMonth() && 
           currentYear.value === today.getFullYear();
};

const isFuture = (day) => {
    const d = new Date(currentYear.value, currentMonth.value, day);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return d > now;
};

const formattedSelectedDate = computed(() => {
    if (!selectedDay.value) return '';
    const date = new Date(currentYear.value, currentMonth.value, selectedDay.value);
    const masehi = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const hijri = getHijriDate(selectedDay.value);
    return `${masehi} (${hijri.day} ${hijri.month} ${hijri.year} H)`;
});

const totalPuasa = computed(() => puasaStore.logs.filter(l => l.status === 'puasa').length);
const totalBolong = computed(() => puasaStore.logs.filter(l => l.status === 'bolong').length);
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.3s ease-out;
}

.animate-slide-up {
    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
