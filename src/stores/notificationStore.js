import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNotificationStore = defineStore('notification', () => {
    const isVisible = ref(false);
    const currentMessage = ref(null);
    const notificationAudio = new Audio('/audio/notification_simple_02.wav'); // Placeholder path, we will try to use a default or just silent visual for now if audio missing

    const categories = {
        shalat: {
            subuh: "Subuh itu pembuka rezeki. Bangun, yuk? Duniamu menanti berkah.",
            dzuhur: "Dunia bisa tunggu, Allah nggak. Yuk, Zuhur dulu.",
            ashar: "Lelahmu butuh jeda. Rehat sejenak di hadapan-Nya, yuk.",
            maghrib: "Hari hampir usai. Pulanglah ke sujudmu sejenak.",
            isya: "Tutup harimu dengan indah. Jangan biarkan Isya terlewat."
        },
        sunnah: {
            duha: "Lagi sibuk? Panggil rezekimu lewat Duha sebentar.",
            tahajud: "Hanya kamu dan Allah. Curhatkan semuanya di sujud malam ini.",
            quran: "Satu ayat saja, untuk tenangkan hatimu yang sedang berisik."
        },
        reminder: [
            "Sudah sapa Penciptamu hari ini?",
            "Tenang itu sederhana: Ambil wudhu, lalu sujud.",
            "Jangan sampai duniamu membuatmu lupa jalan pulang."
        ]
    };

    const showNotification = (type, key = null) => {
        let title = "Sapa Penciptamu sebentar?";
        let body = "";

        if (type === 'shalat') {
            title = `Waktunya ${key.charAt(0).toUpperCase() + key.slice(1)}`;
            body = categories.shalat[key] || "Waktunya sholat telah tiba.";
        } else if (type === 'sunnah') {
            title = "Penyemangat Ibadah";
            body = categories.sunnah[key];
        } else {
            title = "Pengingat Diri";
            const randomIdx = Math.floor(Math.random() * categories.reminder.length);
            body = categories.reminder[randomIdx];
        }

        currentMessage.value = { title, body, type };
        isVisible.value = true;

        // Play sound if possible
        // notificationAudio.play().catch(e => console.log("Audio play blocked", e));

        // Auto hide after 10 seconds if not interacted? No, user explicitly requested buttons.
    };

    const closeNotification = () => {
        isVisible.value = false;
        currentMessage.value = null;
    };

    const snooze = () => {
        const messageToSnooze = { ...currentMessage.value };
        closeNotification();

        setTimeout(() => {
            currentMessage.value = messageToSnooze;
            isVisible.value = true;
        }, 5 * 60 * 1000);
    };

    return { isVisible, currentMessage, showNotification, closeNotification, snooze };
});
