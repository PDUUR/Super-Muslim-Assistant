# 🛡️ Admin Dashboard - Moderation Features

## ✅ Backend API Selesai

### 🔑 Fitur Admin:

#### **1. User Management**
- `POST /api/admin/users/:id/ban` - Ban user dengan alasan
- `POST /api/admin/users/:id/unban` - Unban user
- `DELETE /api/admin/users/:id` - Hapus user permanen

#### **2. Community Moderation**
- `POST /api/admin/communities/:slug/broadcast` - Kirim pengumuman
- `POST /api/admin/communities/:slug/kick/:userId` - Kick user dari komunitas

#### **3. Dashboard Stats**
- `GET /api/admin/dashboard` - Statistik lengkap
- `GET /api/admin/users` - List semua user

### 📝 Audit Log
Semua aksi admin tercatat di tabel `admin_audit_log`

### 🔐 Akses
Hanya user dengan `role = 'admin'`

---

**Status:** ✅ Backend Ready  
**Next:** Frontend Admin Dashboard
