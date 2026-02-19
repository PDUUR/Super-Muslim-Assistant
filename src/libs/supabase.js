/**
 * ============================================================
 * SUPABASE CLIENT - Singleton Instance
 * ============================================================
 * Konfigurasi koneksi ke Supabase.
 * Environment variables diambil dari .env (lokal) atau Vercel (production).
 * 
 * Penggunaan:
 *   import { supabase } from '@/libs/supabase'
 *   const { data } = await supabase.from('profiles').select('*')
 * ============================================================
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
        '⚠️ Supabase belum dikonfigurasi!\n' +
        'Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY ada di file .env\n' +
        'Lihat .env.example untuk referensi.'
    )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Simpan session di localStorage agar persist setelah refresh
        persistSession: true,
        // Auto-refresh token sebelum expired
        autoRefreshToken: true,
        // Deteksi session dari URL (untuk OAuth callback)
        detectSessionInUrl: true,
    },
    realtime: {
        params: {
            // Heartbeat interval untuk Realtime (30 detik)
            eventsPerSecond: 10,
        },
    },
})
