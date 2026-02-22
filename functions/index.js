const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

/**
 * Konfigurasi Nodemailer
 * Catatan: Untuk produksi, gunakan layanan seperti SendGrid, Mailgun, 
 * atau gunakan App Password jika menggunakan Gmail.
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'admin@supermuslim.com', // Ganti dengan email admin
        pass: 'your-app-password'      // Ganti dengan App Password Gmail
    }
});

exports.sendUpdateEmail = functions.firestore
    .document('app_metadata/latest_version')
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const oldData = change.before.data();

        // Hanya kirim jika versi berubah
        if (newData.version === oldData.version) return null;

        console.log(`[Email] New version detected: ${newData.version}. Sending mass emails...`);

        // 1. Ambil semua email user dari Firestore
        const usersSnapshot = await admin.firestore().collection('users').get();
        const emails = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.email) emails.push(userData.email);
        });

        if (emails.length === 0) return null;

        // 2. Template HTML Email
        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; }
                    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                    .header { background: linear-gradient(135deg, #10b981, #059669); padding: 40px 20px; text-align: center; color: white; }
                    .content { padding: 30px; }
                    .feature-card { background: #f1f5f9; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #10b981; }
                    .footer { text-align: center; padding: 20px; font-size: 14px; color: #64748b; background: #f8fafc; }
                    .btn { display: inline-block; padding: 12px 24px; background: #10b981 !important; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
                    h1, h2, h3 { color: #1e293b; }
                    .emoji { font-size: 24px; margin-bottom: 10px; display: block; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <span class="emoji">✨</span>
                        <h1 style="color: white; margin: 0;">Kabar Hangat dari Admin Cool!</h1>
                    </div>
                    <div class="content">
                        <p><strong>Halo, Pejuang Kebaikan! 👋</strong></p>
                        <p>Apa kabarnya hari ini? Semoga semangat ibadahnya tetap terjaga dan selalu dalam lindungan-Nya, ya.</p>
                        <p>Admin Cool mau bagi cerita sedikit nih. Akhir-akhir ini saya baru saja merapikan 'rumah digital' kita supaya kamu makin nyaman dan fokus saat menggunakannya. Ada beberapa perubahan hangat yang sudah saya siapkan khusus buat kamu:</p>
                        
                        <div class="feature-card">
                            <h3>📖 Baca Al-Qur'an Jadi Lebih Tenang</h3>
                            <p>Saya sudah perbaiki masalah layar yang suka melompat-lompat sendiri saat kamu pindah surah. Sekarang tampilannya akan selalu mulai rapi dari ayat pertama.</p>
                        </div>
                        
                        <div class="feature-card">
                            <h3>🧘 Fokus Ibadah Tanpa Gangguan</h3>
                            <p>Pengingat sedekah yang muncul setiap 3 menit sudah saya hapus total. Sekarang kamu bisa lebih tenang menjelajahi fitur lainnya.</p>
                        </div>
                        
                        <div class="feature-card">
                            <h3>🏆 Papan Pejuang Sejati</h3>
                            <p>Leaderboard sekarang lebih adil! Hanya kamu yang sudah mulai mengumpulkan XP yang akan muncul di sana. Ada kategori <strong>Top Mingguan</strong> juga lho!</p>
                        </div>

                        <p>Terima kasih ya sudah setia menemani perjalanan aplikasi ini. Saya sadar masih banyak kekurangan, tapi saya akan terus belajar untuk memberikan yang terbaik buat kamu.</p>
                        
                        <p>Selamat beribadah dan menebar kebaikan!</p>
                        <p><em>Salam hangat,</em><br><strong>Admin Cool</strong></p>
                        
                        <center><a href="https://supermuslim.app" class="btn">Buka Aplikasi Sekarang</a></center>
                    </div>
                    <div class="footer">
                        &copy; 2026 Super Muslim Assistant. Dibuat dengan ❤️ oleh Admin Cool.
                    </div>
                </div>
            </body>
            </html>
        `;

        // 3. Kirim Email (Massal)
        const mailOptions = {
            from: '"Admin Cool ✨" <admin@supermuslim.com>',
            bcc: emails.join(','), // Gunakan BCC agar user tidak melihat email orang lain
            subject: `✨ Ada kabar baru dari Admin Cool! (v${newData.version})`,
            html: emailHtml
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log('[Email] Mass email sent successfully.');
            return { success: true };
        } catch (error) {
            console.error('[Email] Failed to send email:', error);
            return { success: false, error: error.message };
        }
    });
