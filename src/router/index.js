import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import AsmaulHusnaView from "@/views/asmaul-husna/AsmaulHusnaView.vue";
import BacaAlQuranView from "@/views/al-quran/BacaAlQuranView.vue";
import BacaSurahQuranView from "@/views/al-quran/BacaSurahQuranView.vue";
import DoaHarianView from "@/views/doa/DoaHarianView.vue";
import CatatanPuasaView from "@/views/CatatanPuasaView.vue";
import IbadahTrackerView from "@/views/IbadahTrackerView.vue";
import CariMasjidView from "@/views/CariMasjidView.vue";
import KomunitasView from "@/views/KomunitasView.vue";
import ProfileView from "@/views/ProfileView.vue";
import AuthView from "@/views/AuthView.vue";
import AdminDashboardView from "@/views/AdminDashboardView.vue";
import AdminUsersView from "@/views/AdminUsersView.vue";
import QiblaView from "@/views/QiblaView.vue";
import SuperFeaturesView from "@/views/SuperFeaturesView.vue";
import ErrorView from "@/views/ErrorView.vue";
import { useAuthStore } from "@/stores/authStore";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL ?? '/'),
  scrollBehavior() {
    return { top: 0 };
  },
  routes: [
    {
      path: "/",
      name: "Home",
      component: HomeView,
      meta: {
        title: "Home - Super Muslim Assistant",
        requiresAuth: true
      },
    },
    {
      path: "/auth",
      name: "Auth",
      component: AuthView,
      meta: {
        title: "Masuk / Daftar - Super Muslim Assistant",
      },
    },
    {
      path: "/asmaul-husna",
      name: "Asma'ul Husna",
      component: AsmaulHusnaView,
      meta: {
        title: "Asma'ul Husna - Super Muslim Assistant",
      },
    },
    {
      path: "/baca-al-quran",
      name: "Baca Al-Qur'an",
      component: BacaAlQuranView,
      meta: {
        title: "Baca Al-Qur'an - Super Muslim Assistant",
      },
    },
    {
      path: "/doa-harian",
      name: "Do'a Harian",
      component: DoaHarianView,
      meta: {
        title: "Do'a Harian - Super Muslim Assistant",
      },
    },
    {
      path: "/catatan-puasa",
      name: "Catatan Puasa",
      component: CatatanPuasaView,
      meta: {
        title: "Catatan Puasa - Super Muslim Assistant",
      },
    },
    {
      path: "/ibadah-tracker",
      name: "Ibadah Tracker",
      component: IbadahTrackerView,
      meta: {
        title: "Ibadah Tracker - Super Muslim Assistant",
        requiresAuth: true
      },
    },
    {
      path: "/cari-masjid",
      name: "Cari Masjid",
      component: CariMasjidView,
      meta: {
        title: "Cari Masjid Terdekat - Super Muslim Assistant",
      },
    },
    {
      path: "/komunitas",
      name: "Komunitas",
      component: KomunitasView,
      meta: {
        title: "Komunitas Muslim - Super Muslim Assistant",
        requiresAuth: true
      },
    },
    {
      path: "/profile",
      name: "Profile",
      component: ProfileView,
      meta: {
        title: "Profil Saya - Super Muslim Assistant",
        requiresAuth: true
      },
    },
    {
      path: "/qibla",
      name: "Compass",
      component: QiblaView,
      meta: {
        title: "Arah Kiblat - Super Muslim Assistant",
        requiresAuth: true
      },
    },
    {
      path: "/super",
      name: "Super Features",
      component: SuperFeaturesView,
      meta: {
        title: "Fitur Super - Super Muslim Assistant",
        requiresAuth: true
      },
    },
    {
      path: "/baca-al-quran/surah/:id",
      name: "BacaSurah",
      component: BacaSurahQuranView,
      meta: {
        title: "Baca Surah - Super Muslim Assistant",
      },
    },
    {
      path: "/error",
      name: "404 Not Found",
      component: ErrorView,
      meta: {
        title: "404 Not Found - Super Muslim Assistant",
      },
    },
    {
      path: "/admin",
      name: "AdminDashboard",
      component: AdminDashboardView,
      meta: {
        title: "Admin Dashboard - Super Muslim Assistant",
        requiresAuth: true,
        requiresAdmin: true,
        layout: 'admin'
      },
    },
    {
      path: "/admin/users",
      name: "AdminUsers",
      component: AdminUsersView,
      meta: {
        title: "Manajemen User - Super Muslim Assistant",
        requiresAuth: true,
        requiresAdmin: true,
        layout: 'admin'
      },
    },
    { path: "/:pathMatch(.*)", redirect: "/error" },
  ],
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || "Super Muslim Assistant";

  const authStore = useAuthStore();
  const userRole = authStore.profile?.role;

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Auth' });
  } else if (to.meta.requiresAdmin && userRole !== 'admin') {
    next({ name: 'Home' }); // Redirect non-admins to home
  } else if (to.name === 'Auth' && authStore.isAuthenticated) {
    next({ name: 'Home' });
  } else {
    next();
  }
});

export default router;
