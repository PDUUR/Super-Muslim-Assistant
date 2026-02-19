import "./assets/main.css";

import { createApp } from "vue";
import App from "@/App.vue";
import router from "@/router";
import { createPinia } from "pinia";
import { useApiDataStore } from "@/stores/apiDataStore.js";
import { useAuthStore } from "@/stores/authStore.js";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia).use(router);

// Initialize stores
const apiDataStore = useApiDataStore();
apiDataStore.callAPIs();

// Initialize Firebase auth (session recovery)
const authStore = useAuthStore();
authStore.initialize();

app.mount("#app");
