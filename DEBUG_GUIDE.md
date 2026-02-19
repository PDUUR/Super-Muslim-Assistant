# 🐛 DEBUG GUIDE — Community & Gamification Issues

## Masalah yang Dilaporkan

1. ❌ Tab switching tidak berfungsi (Komunitas → Leaderboard → tidak bisa kembali)
2. ❌ "Offline Mode" banner muncul padahal online
3. ❌ Leaderboard kosong
4. ❌ Online users tidak terlihat
5. ❌ Bug pembuatan komunitas

---

## ✅ Yang Sudah Diperbaiki

### 1. Tab Switching Logic (FIXED)
**Masalah:** Template Vue nested yang menyebabkan kondisi `v-if` tidak terpenuhi ketika kembali ke tab "Komunitas"

**Solusi:**
- Changed `KomunitasView.vue` template struktur dari:
  ```vue
  <template v-if="!activeCommunity">
    <CommunityBoard v-if="mainTab === 'leaderboard'" />
    <template v-if="mainTab === 'komunitas'">
      ...
    </template>
  </template>
  ```
  
  Ke:
  ```vue
  <div v-if="!activeCommunity">Tab switcher</div>
  <CommunityBoard v-if="!activeCommunity && mainTab === 'leaderboard'" />
  <template v-if="!activeCommunity && mainTab === 'komunitas'">
    ...
  </template>
  ```

**Status:** ✅ DIPERBAIKI — Sekarang kedua tab bisa diklik bolak-balik dengan lancar

---

### 2. Syntax Error di communityStore.js (FIXED)
**Masalah:** Ada duplicate closing braces di fungsi `fetchLeaderboard` yang menyebabkan JavaScript error

**Solusi:**
- Fixed broken `fetchLeaderboard()` function
- Added comprehensive error logging di semua API calls
- Added console.debug untuk tracking heartbeat, stats, dan leaderboard fetches

**Status:** ✅ DIPERBAIKI

---

## 🔍 Cara Debug Masalah "Offline Mode" & Data Kosong

### Step 1: Buka Browser Console
1. Buka aplikasi di http://localhost:5173
2. Tekan **F12** atau **Ctrl+Shift+I**
3. Pergi ke tab **Console**

### Step 2: Cari Log Messages
Sekarang ada comprehensive logging. Cari pesan ini:

```
[Heartbeat] Sending...
[Heartbeat] Success: {online: 0, users: 0}

[Leaderboard] Fetching...
[Leaderboard] Success: {weekly: 0, alltime: 0}

[Stats] Fetching user stats...
[Stats] Success: {...}
```

### Step 3: Identifikasi Masalah

#### Jika muncul: `[Heartbeat] Skipped: Not authenticated`
**Artinya:** User belum login  
**Solusi:** Login dulu ke aplikasi

#### Jika muncul: `[Heartbeat] Error: ... 401 Unauthorized`
**Artinya:** Token JWT invalid/expired  
**Solusi:** Logout dan login ulang

#### Jika muncul: `[Heartbeat] Error: ... 404 Not Found`
**Artinya:** Route `/api/heartbeat` belum terdaftar  
**Solusi:** Cek apakah `backend/src/routes/api.php` sudah di-update

#### Jika muncul: `[Heartbeat] Skipped: Browser offline`
**Artinya:** `navigator.onLine` = false  
**Solusi:** Cek koneksi internet atau restart browser

#### Jika muncul: `[Leaderboard] Success: {weekly: 0, alltime: 0}`
**Artinya:** Database kosong, belum ada user yang log ibadah  
**Solusi:**  
1. Add log ibadah di tab "Ibadah"  
2. Cek database via phpMyAdmin: `SELECT * FROM ibadah_logs`

---

## ⚡ Quick Fixes

### Fix 1: Restart Both Servers
```bash
# Terminal 1: Stop backend (Ctrl+C)
php -S localhost:8000 -t backend/public backend/server.php

# Terminal 2: Stop frontend (Ctrl+C)
npm run dev
```

### Fix 2: Clear Browser Cache & localStorage
```javascript
// Paste ini di browser console:
localStorage.clear();
location.reload();
```

### Fix 3: Verify Database Has Data
```bash
php backend/check_tables.php
```

Expected output:
```
TABLES: ..., gamification_config, level_thresholds, ibadah_logs, ...
GAMIFICATION_CONFIG COUNT: 14
LEVEL_THRESHOLDS COUNT: 15
```

### Fix 4: Check API Routes
```bash
# Paste URL ini di browser (ganti TOKEN dengan token JWT dari localStorage):
http://localhost:8000/api/heartbeat
# Should return: 401 Unauthorized (karena perlu token)

http://localhost:8000/api/gamification/leaderboard
# Should return: 401 Unauthorized (karena perlu auth)
```

---

## 🧪 Testing Leaderboard Data

### Cara Populate Data Dummy:

1. **Login sebagai user**
2. **Pergi ke tab "Ibadah"**
3. **Log beberapa ibadah** (Shalat Subuh, Dzuhur, dll.)
4. **Tunggu 5 detik**, lalu pergi ke tab "Komunitas" > "Leaderboard"
5. **Leaderboard harus muncul** dengan XP yang sudah dikumpulkan

### Atau via Database Direct:

```sql
-- Insert dummy XP logs
INSERT INTO ibadah_logs (user_id, ibadah_id, log_date, xp_earned, completed_at) VALUES
(1, 'subuh', CURDATE(), 20, NOW()),
(1, 'dzuhur', CURDATE(), 20, NOW()),
(1, 'ashar', CURDATE(), 20, NOW());

-- Update user total XP
UPDATE users SET total_xp = 60, level = 1, last_ibadah_at = NOW() WHERE id = 1;
```

---

## 🐞 Bug Pembuatan Komunitas

### Deskripsi Bug:
User melaporkan ada bug saat membuat komunitas baru. Saya perlu detail lebih spesifik:

**Questions:**
1. **Apa error message yang muncul?**
2. **Apakah modal "Buat Komunitas" bisa dibuka?**
3. **Apakah ada error di browser console saat submit form?**
4. **Apakah komunitas ter-create tapi tidak muncul di list?**

### Potential Causes:
1. **Validation error** — form data tidak lengkap
2. **API error** — backend tidak merespons
3. **Database error** — tabel `communities` belum exist
4. **Auth error** — user tidak ter-authenticated

### Debug Steps:
1. Buka browser console (F12)
2. Klik tombol "Buat Komunitas"
3. Isi form, lalu klik "Simpan"
4. **Screenshot error message + console logs**
5. Share ke sini

---

## 📞 Next Steps

Setelah mengikuti guide ini:

1. **Buka browser console** (F12)
2. **Login ke aplikasi**
3. **Pergi ke tab "Komunitas" > "Leaderboard"**
4. **Screenshot semua log messages** yang muncul
5. **Paste screenshot/text di sini** untuk debugging lebih lanjut

---

## 🎯 Expected Behavior

### ✅ Normal Flow:

```
1. User login → authStore.isAuthenticated = true
2. App.vue memanggil communityStore.initialize()
3. Heartbeat starts (setiap 25 detik)
4. Fetch stats, leaderboard, dan XP config
5. Data muncul di UI CommunityBoard.vue
```

### Console logs yang benar:

```
[Heartbeat] Sending...
[Heartbeat] Success: {online: 3, users: 3}
[Leaderboard] Fetching...
[Leaderboard] Success: {weekly: 5, alltime: 8}
[Stats] Fetching user stats...
[Stats] Success: {total_xp: 60, level: 1, ...}
```

---

**Jika masih ada error setelah mengikuti guide ini, screenshot console logs dan kirimkan ke sini! 💪**
