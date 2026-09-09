'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { buatKlienServer } from '@/lib/supabase/server'

export type HasilAuth = { galat: string } | undefined

export async function masuk(_prev: HasilAuth, formData: FormData): Promise<HasilAuth> {
  const email = String(formData.get('email') ?? '').trim()
  const sandi = String(formData.get('sandi') ?? '')
  const lanjut = String(formData.get('lanjut') ?? '/')

  if (!email || !sandi) return { galat: 'Email dan kata sandi harus diisi.' }

  const supabase = await buatKlienServer()
  const { error } = await supabase.auth.signInWithPassword({ email, password: sandi })

  if (error) return { galat: 'Email atau kata sandi tidak cocok.' }

  revalidatePath('/', 'layout')
  redirect(lanjut.startsWith('/') ? lanjut : '/')
}

export async function daftar(_prev: HasilAuth, formData: FormData): Promise<HasilAuth> {
  const email = String(formData.get('email') ?? '').trim()
  const sandi = String(formData.get('sandi') ?? '')
  const nama = String(formData.get('nama') ?? '').trim()
  const sekolah = String(formData.get('sekolah') ?? '').trim()

  if (!email || !sandi) return { galat: 'Email dan kata sandi harus diisi.' }
  if (sandi.length < 8) return { galat: 'Kata sandi minimal 8 karakter.' }

  const supabase = await buatKlienServer()
  const { error } = await supabase.auth.signUp({
    email,
    password: sandi,
    options: { data: { nama, sekolah } },
  })

  if (error) {
    return {
      galat:
        error.message === 'User already registered'
          ? 'Email ini sudah terdaftar. Silakan masuk.'
          : `Pendaftaran gagal: ${error.message}`,
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function keluar() {
  const supabase = await buatKlienServer()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/masuk')
}
