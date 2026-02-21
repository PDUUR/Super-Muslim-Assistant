import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNotificationStore = defineStore('notification', () => {
    const isVisible = ref(false);
    const currentMessage = ref(null);

    const categories = {
        azan: {
            title: "Waktunya Shalat",
            messages: {
                subuh: "Subuh itu pembuka rezeki. Bangun, yuk? Duniamu menanti berkah.",
                dzuhur: "Dunia bisa tunggu, Allah nggak. Yuk, Zuhur dulu.",
                ashar: "Lelahmu butuh jeda. Rehat sejenak di hadapan-Nya, yuk.",
                maghrib: "Hari hampir usai. Pulanglah ke sujudmu sejenak.",
                isya: "Tutup harimu dengan indah. Jangan biarkan Isya terlewat."
            }
        },
        zikir: {
            title: "Waktunya Zikir",
            pagi: "Awali harimu dengan mengingat-Nya. Zikir pagi dulu, yuk?",
            sore: "Tenangkan hatimu sebelum petang. Waktunya zikir sore."
        },
        dhuha: {
            title: "Penyemangat Duha",
            message: "Lagi sibuk? Panggil rezekimu lewat Duha sebentar."
        }
    };

    const showNotification = (type, key = null) => {
        let title = "Super Muslim Reminder";
        let body = "";

        if (type === 'azan') {
            title = categories.azan.title;
            body = categories.azan.messages[key] || "Waktunya sholat telah tiba.";
        } else if (type === 'zikir') {
            title = categories.zikir.title;
            body = key === 'pagi' ? categories.zikir.pagi : categories.zikir.sore;
        } else if (type === 'dhuha') {
            title = categories.dhuha.title;
            body = categories.dhuha.message;
        }

        currentMessage.value = { title, body, type };
        isVisible.value = true;
    };

    const closeNotification = (isFinished = false) => {
        isVisible.value = false;
        if (isFinished) {
            // Logic for "Na'am" (finished)
            console.log("Notification marked as finished");
        }
        setTimeout(() => {
            currentMessage.value = null;
        }, 500);
    };

    const snooze = () => {
        closeNotification();
    };


    return {
        isVisible,
        currentMessage,
        showNotification,
        closeNotification,
        snooze
    };
});
