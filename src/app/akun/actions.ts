'use server'

import { revalidatePath } from 'next/cache'
import { buatKlienServer } from '@/lib/supabase/server'

export type HasilAkun = { galat?: string; sukses?: string } | undefined

/** Mengganti nama guru. Email sengaja tidak disentuh — tidak bisa diubah. */
export async function ubahNama(_prev: HasilAkun, formData: FormData): Promise<HasilAkun> {
  const nama = String(formData.get('nama') ?? '').trim()

  if (!nama) return { galat: 'Nama tidak boleh kosong.' }
  if (nama.length > 100) return { galat: 'Nama maksimal 100 karakter.' }

  const supabase = await buatKlienServer()
  // `data` digabung ke user_metadata, jadi `sekolah` tetap utuh.
  const { error } = await supabase.auth.updateUser({ data: { nama } })
  if (error) return { galat: `Gagal menyimpan nama: ${error.message}` }

  revalidatePath('/', 'layout')
  return { sukses: 'Nama tersimpan.' }
}

/**
 * Mengganti kata sandi. Kata sandi lama diperiksa dulu — `secure_password_change`
 * mati, jadi tanpa ini sesi yang tertinggal di perangkat lain cukup untuk
 * mengambil alih akun.
 */
export async function ubahSandi(_prev: HasilAkun, formData: FormData): Promise<HasilAkun> {
  const lama = String(formData.get('sandi_lama') ?? '')
  const baru = String(formData.get('sandi_baru') ?? '')
  const ulang = String(formData.get('sandi_ulang') ?? '')

  if (!lama || !baru || !ulang) return { galat: 'Semua kolom kata sandi harus diisi.' }
  if (baru.length < 8) return { galat: 'Kata sandi baru minimal 8 karakter.' }
  if (baru !== ulang) return { galat: 'Ulangan kata sandi baru tidak sama.' }
  if (baru === lama) return { galat: 'Kata sandi baru harus berbeda dari yang lama.' }

  const supabase = await buatKlienServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return { galat: 'Sesi berakhir. Silakan masuk lagi.' }

  const { error: galatMasuk } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: lama,
  })
  if (galatMasuk) return { galat: 'Kata sandi lama tidak cocok.' }

  const { error } = await supabase.auth.updateUser({ password: baru })
  if (error) {
    return {
      galat:
        error.code === 'same_password'
          ? 'Kata sandi baru harus berbeda dari yang lama.'
          : error.code === 'weak_password'
            ? 'Kata sandi baru terlalu lemah.'
            : `Gagal mengganti kata sandi: ${error.message}`,
    }
  }

  return { sukses: 'Kata sandi berhasil diganti.' }
}
