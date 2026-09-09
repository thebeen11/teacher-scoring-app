'use client'

import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/env'

export function buatKlien() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
