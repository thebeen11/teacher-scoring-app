'use client'

import { useRouter } from 'next/navigation'

/** Kembali ke halaman sebelumnya; jika tak ada riwayat (tab baru), ke beranda. */
export default function TombolKembali({ className }: { className?: string }) {
  const router = useRouter()

  return (
    <button
      type="button"
      className={className}
      onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
    >
      ← Kembali
    </button>
  )
}
