import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/env'

export async function buatKlienServer() {
  const cookieStore = await cookies()

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Dipanggil dari Server Component — penyegaran sesi ditangani proxy.
          }
        },
      },
    },
  )
}

/** Pengguna yang sedang masuk, atau null. */
export async function penggunaSaatIni() {
  const supabase = await buatKlienServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
