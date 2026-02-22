<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const updates = ref([
    {
        version: '1.1.0',
        date: '22 Februari 2026',
        isLatest: true,
        features: [
            {
                title: 'Baca Al-Qur\'an Jadi Lebih Tenang',
                icon: '📖',
                desc: 'Perbaikan masalah layar yang melompat saat pindah surah. Sekarang otomatis mulai dari ayat pertama.'
            },
            {
                title: 'Fokus Ibadah Tanpa Gangguan',
                icon: '🧘',
                desc: 'Penghapusan total notifikasi sedekah setiap 3 menit agar lebih khusyuk.'
            },
            {
                title: 'Leaderboard Baru',
                icon: '🏆',
                desc: 'Filter user 0 XP dan penambahan kategori Top Mingguan.'
            },
            {
                title: 'Indikator Status Admin',
                icon: '🟢',
                desc: 'Sekarang kamu bisa melihat status Online/Offline Admin Cool secara real-time.'
            }
        ]
    },
    {
        version: '1.0.5',
        date: '15 Februari 2026',
        features: [
            {
                title: 'Optimalisasi Performa',
                icon: '⚡',
                desc: 'Aplikasi kini 20% lebih cepat saat memuat data surah.'
            },
            {
                title: 'Tema Adaptif',
                icon: '🎨',
                desc: 'Warna aplikasi akan berubah sesuai dengan waktu shalat saat ini.'
            }
        ]
    }
])

const goBack = () => router.back()
</script>

<template>
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
        <!-- Header -->
        <header class="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-4">
            <div class="max-w-2xl mx-auto flex items-center gap-4">
                <button @click="goBack" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 class="text-xl font-bold text-slate-900 dark:text-white">Catatan Pembaruan</h1>
            </div>
        </header>

        <main class="max-w-2xl mx-auto px-4 py-8">
            <div class="mb-8 p-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl text-white shadow-lg shadow-emerald-500/20">
                <h2 class="text-2xl font-bold mb-2">Halo, Sahabat! 👋</h2>
                <p class="text-emerald-50 opacity-90">Di sini kamu bisa melihat perkembangan "rumah digital" kita dari waktu ke waktu. Admin Cool akan terus berusaha memberikan yang terbaik untuk kenyamanan ibadahmu.</p>
            </div>

            <div class="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                
                <div v-for="(update, idx) in updates" :key="update.version" class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <!-- Dot -->
                    <div class="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 text-slate-500 group-[.is-active]:bg-emerald-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <span v-if="update.isLatest" class="text-xs font-bold whitespace-nowrap absolute -top-6 bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full ring-2 ring-emerald-500 ring-offset-2">LATEST</span>
                        <svg class="fill-current" xmlns="http://www.w3.org/2000/svg" width="12" height="10">
                            <path fill-rule="nonzero" d="M10.422 1.257 4.655 7.025 1.578 3.948 0 5.527l4.655 4.655 7.345-7.345z" />
                        </svg>
                    </div>

                    <!-- Content Card -->
                    <div class="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-900">
                        <div class="flex items-center justify-between mb-1">
                            <time class="text-sm font-medium text-emerald-600 underline underline-offset-4 decoration-emerald-200">{{ update.date }}</time>
                            <span class="text-xs font-bold text-slate-400">v{{ update.version }}</span>
                        </div>
                        <div class="space-y-4 mt-4 text-slate-600 dark:text-slate-400">
                            <div v-for="feature in update.features" :key="feature.title" class="flex gap-3">
                                <span class="text-xl flex-shrink-0">{{ feature.icon }}</span>
                                <div>
                                    <h4 class="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight">{{ feature.title }}</h4>
                                    <p class="text-xs mt-1 leading-relaxed">{{ feature.desc }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Footer Message -->
            <div class="mt-16 text-center">
                <p class="text-slate-400 text-sm">Akan ada lebih banyak kebaikan di pembaruan berikutnya...</p>
                <div class="mt-4 flex justify-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-.3s]"></span>
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-.5s]"></span>
                </div>
            </div>
        </main>
    </div>
</template>

<style scoped>
.group.is-active::before {
    background-color: theme('colors.emerald.500');
}
</style>
