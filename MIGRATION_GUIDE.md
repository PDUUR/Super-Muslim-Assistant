# 🚀 Super Muslim Assistant - Panduan Migrasi ke Supabase

## Arsitektur Baru

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Vercel    │────▶│    Supabase      │────▶│   GitHub     │
│  (Frontend) │     │  (Backend+DB)    │     │   (Source)   │
│  Vue 3 App  │     │  PostgreSQL      │     │              │
│             │     │  Auth (GoTrue)   │     │              │
│             │     │  Realtime        │     │              │
│             │     │  RLS Policies    │     │              │
└─────────────┘     └──────────────────┘     └──────────────┘
```

**Tidak perlu lagi:** PHP backend, Docker, Nginx, custom JWT.

---

## 📝 Langkah Setup (Urutan Wajib)

### Step 1: Buat Project di Supabase
1. Buka https://supabase.com → **New Project**
2. Catat **Project URL** dan **anon/public key** dari **Settings > API**

### Step 2: Jalankan SQL Migration
1. Buka **SQL Editor** di Supabase Dashboard
2. Copy-paste seluruh isi file `supabase/migration.sql`
3. Klik **Run**
4. Verifikasi di **Table Editor**: tabel `profiles`, `messages`, `point_logs` harus muncul

### Step 3: Konfigurasi Environment
1. Salin `.env.example` menjadi `.env`
2. Isi nilai:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```

### Step 4: Jalankan Lokal
```bash
npm install
npm run dev
```

### Step 5: Deploy ke Vercel
1. Push ke GitHub
2. Hubungkan repo di Vercel
3. Tambahkan Environment Variables di Vercel Settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

---

## 📁 File yang Dibuat/Diubah

| File | Fungsi |
|------|--------|
| `supabase/migration.sql` | SQL lengkap: tabel, trigger, RLS, fungsi |
| `src/libs/supabase.js` | Supabase client singleton |
| `src/stores/authStore.js` | ✏️ Rewrite → Supabase Auth |
| `src/stores/prayerStore.js` | 🆕 Jadwal Salat + API Kemenag |
| `src/stores/communityStore.js` | ✏️ Rewrite → Supabase Realtime |
| `src/stores/adminStore.js` | 🆕 Admin Dashboard store |
| `src/components/LeaderboardWidget.vue` | 🆕 Leaderboard Top 10 |
| `src/components/PrayerScheduleWidget.vue` | 🆕 Widget Jadwal Salat |
| `src/views/AdminDashboardView.vue` | ✏️ Rewrite → Supabase |
| `src/main.js` | ✏️ Tambah init Supabase |
| `.env.example` | ✏️ Rewrite → Supabase config |

---

## 🔗 Alur Data (Bagaimana Semua Terhubung)

### Auth Flow
```
User Sign Up → Supabase Auth → Trigger on_auth_user_created → profiles row dibuat
User Login  → Supabase Auth → Session token otomatis → Profile di-fetch
```

### Gamification Flow
```
User selesai ibadah → addXp() di communityStore → supabase.rpc('add_points')
  → UPDATE profiles.total_points (atomik)
  → INSERT point_logs (audit)
  → Realtime broadcast → Leaderboard auto-refresh di semua client
```

### Jadwal Salat Flow
```
User pilih kota → selectCity() di prayerStore
  → Simpan ke Supabase profiles.city_id + city_name
  → Fetch API myquran.com → Cache di localStorage
  → Countdown 1 detik interval dimulai
    → Refresh → city_id tetap ada (dari Supabase)
```

### Admin Dashboard Flow
```
Admin buka dashboard → fetchStats() via supabase.rpc('get_admin_stats')
  → fetchUsers() via supabase.from('profiles').select('*')
  → subscribeRealtime() → listen perubahan profiles & messages
    → Auto-refresh saat ada perubahan
```

---

## 🔐 Environment Variables untuk Vercel

| Variable | Wajib | Keterangan |
|----------|-------|------------|
| `VITE_SUPABASE_URL` | ✅ | URL project Supabase |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Public/anon key Supabase |

**Hanya 2 environment variables.** Tidak perlu DB_HOST, JWT_SECRET, dll — Supabase menangani semuanya.

---

## ✅ Checklist Verifikasi

- [ ] SQL migration berhasil di Supabase SQL Editor
- [ ] Tabel profiles, messages, point_logs ada di Table Editor
- [ ] RLS Policies aktif (Authentication > Policies)
- [ ] Realtime enabled untuk messages & profiles
- [ ] User baru otomatis muncul di profiles setelah Sign Up
- [ ] Leaderboard muncul dan update realtime
- [ ] Jadwal salat bisa pilih kota dan countdown berjalan
- [ ] Admin dashboard menampilkan stats dan user list
- [ ] Vercel deployment berhasil dengan env vars
