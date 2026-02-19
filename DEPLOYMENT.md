## 🚀 DEPLOYMENT CHECKLIST — Super Muslim Assistant
## Target: Free Shared Hosting (cPanel/FreeHosting)

### ═══════════════════════════════════════════════
### STEP 1: Build Frontend
### ═══════════════════════════════════════════════

```bash
npm run build
```

This creates `dist/` folder with optimized assets.

---

### ═══════════════════════════════════════════════
### STEP 2: Hosting Folder Structure
### ═══════════════════════════════════════════════

```
public_html/                    ← Root website (domain utama)
├── index.html                  ← dari dist/index.html
├── assets/                     ← dari dist/assets/ (JS, CSS, images)
│   ├── js/
│   ├── css/
│   └── ...
├── api/                        ← Symlink atau subfolder ke backend/public
│   ├── index.php               ← Entry point backend
│   └── .htaccess               ← Rewrite ke index.php
└── .htaccess                   ← SPA fallback (semua route ke index.html)

# FOLDER DI LUAR public_html (KEAMANAN!)
backend/                        ← JANGAN diletakkan di public_html
├── src/                        ← Kode PHP (Controllers, Models, dll.)
├── database/
├── .env                        ← WAJIB DI LUAR public_html!
└── ...
```

---

### ═══════════════════════════════════════════════
### STEP 3: .htaccess Files
### ═══════════════════════════════════════════════

**`public_html/.htaccess`** (SPA routing):
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # Jangan rewrite file/folder yang sudah ada (assets, api)
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/api/
    
    # Redirect semua route ke index.html (Vue SPA)
    RewriteRule ^(.*)$ /index.html [L]
</IfModule>

# Caching untuk assets statis
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Gzip Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>
```

**`public_html/api/.htaccess`** (PHP API routing):
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /api/
    
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>
```

---

### ═══════════════════════════════════════════════
### STEP 4: Environment & Database
### ═══════════════════════════════════════════════

1. **Buat Database** di cPanel > MySQL Databases
2. **Import SQL migrations** via phpMyAdmin:
   - `database/migration_stabilization.sql`
   - `database/migration_ibadah.sql`
   - `database/migration_community.sql`
   - `database/migration_gamification_v2.sql`
3. **Edit `.env`** dengan credential hosting:
   ```
   DB_HOST=localhost
   DB_NAME=cpanel_appislami
   DB_USER=cpanel_dbuser
   DB_PASS=strong_password_here
   JWT_SECRET=random_64_char_string
   CORS_ORIGIN=https://your-domain.com
   ```

---

### ═══════════════════════════════════════════════
### STEP 5: Update Frontend API Base URL
### ═══════════════════════════════════════════════

Edit `src/utils/api.js`:
```javascript
baseURL: 'https://your-domain.com/api',
```

Lalu build ulang: `npm run build`

---

### ═══════════════════════════════════════════════
### STEP 6: CORS Configuration
### ═══════════════════════════════════════════════

Di `backend/public/index.php`, ganti wildcard CORS:
```php
header("Access-Control-Allow-Origin: https://your-domain.com");
```

---

### ═══════════════════════════════════════════════  
### STEP 7: Security Final Check
### ═══════════════════════════════════════════════

- [ ] `.env` file TIDAK bisa diakses via browser
- [ ] `backend/src/` TIDAK bisa diakses via browser  
- [ ] Semua API endpoint menggunakan PDO Prepared Statements ✅
- [ ] CORS header mengarah ke domain sendiri saja
- [ ] JWT_SECRET menggunakan random string 64+ karakter
- [ ] Password hash menggunakan `password_hash()` ✅
- [ ] Rate limiting aktif di endpoint sensitif ✅
- [ ] Admin endpoint diproteksi AdminMiddleware ✅

---

### DONE! 🎉
App siap live di: `https://your-domain.com`
