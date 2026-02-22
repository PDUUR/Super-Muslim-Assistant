<script setup>
import { computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import Swal from 'sweetalert2'
import confetti from 'canvas-confetti'

const authStore = useAuthStore()

const showUpdateModal = () => {
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
    })

    Swal.fire({
        title: '<span class="text-2xl font-bold text-emerald-600">✨ Ada kabar baru nih dari Admin Cool!</span>',
        html: `
            <div class="text-left space-y-4 text-slate-700 leading-relaxed max-h-[60vh] overflow-y-auto px-2">
                <p class="font-medium text-lg">"Halo, Pejuang Kebaikan! 👋</p>
                <p>Apa kabarnya hari ini? Semoga semangat ibadahnya tetap terjaga dan selalu dalam lindungan-Nya, ya.</p>
                <p>Admin Cool mau bagi cerita sedikit nih. Akhir-akhir ini saya baru saja merapikan 'rumah digital' kita supaya kamu makin nyaman dan fokus saat menggunakannya. Ada beberapa perubahan hangat yang sudah saya siapkan khusus buat kamu:</p>
                
                <div class="space-y-3 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <div class="flex gap-3">
                        <span class="text-xl">📖</span>
                        <div>
                            <p class="font-bold text-emerald-800">Baca Al-Qur'an Jadi Lebih Tenang</p>
                            <p class="text-sm">Saya sudah perbaiki masalah layar yang suka melompat-lompat sendiri saat kamu pindah surah. Sekarang, setiap buka surah baru, tampilannya akan selalu mulai rapi dari ayat pertama.</p>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <span class="text-xl">🧘</span>
                        <div>
                            <p class="font-bold text-emerald-800">Fokus Ibadah Tanpa Gangguan</p>
                            <p class="text-sm">Banyak yang bilang pengingat sedekah yang muncul setiap 3 menit agak mengganggu konsentrasi, jadi fitur itu sudah saya hapus total. Sekarang kamu bisa lebih tenang menjelajahi fitur lainnya.</p>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <span class="text-xl">🏆</span>
                        <div>
                            <p class="font-bold text-emerald-800">Papan Pejuang Sejati</p>
                            <p class="text-sm">Leaderboard sekarang lebih adil! Hanya kamu yang sudah mulai mengumpulkan XP yang akan muncul di sana. Saya juga tambahkan kategori 'Top Mingguan' supaya kita bisa sama-sama lihat siapa yang paling semangat setiap minggunya.</p>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <span class="text-xl">💬</span>
                        <div>
                            <p class="font-bold text-emerald-800">Sapaan Update Baru</p>
                            <p class="text-sm">Sekarang, setiap kali saya selesai menambahkan fitur baru atau memperbaiki sesuatu, akan ada pesan ramah seperti ini yang menyapamu. Jadi kamu nggak akan ketinggalan info lagi!</p>
                        </div>
                    </div>
                </div>

                <p>Terima kasih ya sudah setia menemani perjalanan aplikasi ini. Saya sadar masih banyak kekurangan, tapi saya akan terus belajar untuk memberikan yang terbaik buat kamu. Kalau kamu lupa apa saja yang baru, cek saja menu 'Catatan Pembaruan' di pojok menu ya.</p>
                
                <p>Selamat beribadah dan menebar kebaikan!</p>
                <div class="pt-2">
                    <p class="font-bold italic text-emerald-700">Salam hangat,</p>
                    <p class="font-bold text-emerald-800">Admin Cool</p>
                </div>
            </div>
        `,
        confirmButtonText: 'Paham, Syukron!',
        confirmButtonColor: '#10b981',
        background: '#ffffff',
        customClass: {
            popup: 'rounded-3xl border-4 border-emerald-100 shadow-2xl',
            confirmButton: 'px-8 py-3 rounded-xl font-bold text-lg hover:scale-105 transition-transform'
        },
        showCloseButton: true,
        allowOutsideClick: false
    }).then((result) => {
        if (result.isConfirmed) {
            authStore.updateUserVersion()
        }
    })
}

// Watch for hasNewUpdate changes
watch(() => authStore.hasNewUpdate, (newVal) => {
    if (newVal) {
        showUpdateModal()
    }
}, { immediate: true })

</script>

<template>
    <!-- Invisible component, just handles the modal logic -->
    <div v-if="false"></div>
</template>
