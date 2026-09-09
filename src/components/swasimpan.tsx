'use client'

import { useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'

/**
 * Form sunting satu baris yang menyimpan dirinya sendiri.
 *
 * Layar Kelola Kelas dulu memberi satu tombol Simpan pada TIAP baris — satu
 * per kolom nilai, satu per sub, satu per siswa — sehingga layar penuh tombol
 * yang semuanya berbunyi sama. Perilakunya kini disamakan dengan layar entri
 * nilai, yang sudah lama menulis sendiri dengan penundaan (lihat lib/store.tsx)
 * dan hanya melapor lewat lencana kecil.
 *
 * Isian teks disimpan saat kursor pergi atau saat Enter ditekan; <select>
 * disimpan begitu pilihannya diganti, karena ia tidak punya saat "selesai
 * mengetik". Baris yang tidak disentuh tidak pernah dikirim.
 */
export default function FormSwaSimpan({
  action,
  className,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>
  className?: string
  children: React.ReactNode
}) {
  const form = useRef<HTMLFormElement>(null)
  const kotor = useRef(false)

  return (
    <form
      ref={form}
      action={action}
      className={className}
      onInput={() => {
        kotor.current = true
      }}
      onSubmit={() => {
        kotor.current = false
      }}
      onChange={(e) => {
        if ((e.target as HTMLElement).tagName !== 'SELECT') return
        form.current?.requestSubmit()
      }}
      onBlur={(e) => {
        if (!kotor.current) return
        // Kursor pindah ke tombol Hapus di baris yang sama: biarkan tombol itu
        // yang menentukan nasib baris, jangan menyimpannya lebih dulu.
        const tujuan = e.relatedTarget as HTMLElement | null
        if (tujuan && tujuan.tagName === 'BUTTON' && form.current?.contains(tujuan)) return
        form.current?.requestSubmit()
      }}
    >
      {children}
    </form>
  )
}

/** Lencana status satu baris. Kosong selama tidak ada yang terjadi. */
export function PenandaSimpan() {
  const { pending } = useFormStatus()
  const [baruSaja, setBaruSaja] = useState(false)
  const sebelumnya = useRef(pending)

  useEffect(() => {
    const selesai = sebelumnya.current && !pending
    sebelumnya.current = pending
    if (!selesai) return
    setBaruSaja(true)
    const jam = setTimeout(() => setBaruSaja(false), 1600)
    return () => clearTimeout(jam)
  }, [pending])

  const teks = pending ? 'Menyimpan…' : baruSaja ? 'Tersimpan' : ''

  return (
    <span
      aria-live="polite"
      className="mikro w-[52px] flex-none text-right"
      style={{ color: baruSaja && !pending ? 'var(--color-aksen-gelap)' : 'var(--color-samar)' }}
    >
      {teks.toUpperCase()}
    </span>
  )
}
