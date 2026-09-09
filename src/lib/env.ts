/**
 * Variabel lingkungan Supabase.
 *
 * Berkas .env.local sengaja tidak ikut di repo — kunci diisi sendiri oleh
 * pemilik proyek. Bila belum ada, aplikasi tidak dibiarkan tumbang dengan galat
 * yang membingungkan: proxy dilewati dan halaman depan menampilkan petunjuk
 * penyiapan.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabaseSiap = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== ''
