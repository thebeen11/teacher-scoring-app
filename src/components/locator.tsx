'use client'

import { useEffect } from 'react'

// LocatorJS (dev only): Alt/Option+klik elemen untuk membuka sumbernya di editor.
// Membaca atribut `data-locatorjs` yang disuntik @locator/webpack-loader
// (lihat next.config.ts).
export function Locator() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    import('@locator/runtime').then(({ default: setup }) => setup())
  }, [])
  return null
}
