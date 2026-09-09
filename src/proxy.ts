import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseSiap } from '@/lib/env'

/**
 * Menyegarkan sesi Supabase pada setiap navigasi dan menjaga rute aplikasi
 * tetap tertutup bagi yang belum masuk. Otorisasi sebenarnya tetap dijaga oleh
 * RLS di basis data — ini hanya pemeriksaan optimistis.
 */
export async function proxy(request: NextRequest) {
  // Belum dikonfigurasi: biarkan lewat supaya halaman penyiapan bisa tampil.
  if (!supabaseSiap) return NextResponse.next({ request })

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const rutePublik = path.startsWith('/masuk') || path.startsWith('/daftar')

  if (!user && !rutePublik) {
    const url = request.nextUrl.clone()
    url.pathname = '/masuk'
    url.searchParams.set('lanjut', path)
    return NextResponse.redirect(url)
  }

  if (user && rutePublik) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
