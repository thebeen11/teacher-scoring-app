'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Buang minus di depan.
 *
 * Sengaja tidak menyentuh minus di tengah, supaya notasi eksponen seperti
 * "1e-5" tidak diam-diam berubah makna jadi "1e5".
 */
export function tanpaNegatif(teks: string): string {
  return teks.replace(/^-+/, '')
}

/**
 * Input angka yang tidak melawan pengetik.
 *
 * Input terkendali yang langsung diikat ke angka di penyimpan akan menolak
 * keadaan setengah jadi: menghapus isi sel untuk mengetik ulang akan langsung
 * dipaksa kembali menjadi "0". Jadi teksnya dipegang lokal, dan hanya angkanya
 * yang dikirim ke atas; nilai dari luar disalin ulang hanya ketika sel tidak
 * sedang disunting.
 *
 * Tidak ada angka di aplikasi ini yang boleh negatif — skor mentah, band
 * tujuan, maupun KKTP. Minus ditolak sebelum sempat masuk kotak, bukan
 * dibetulkan belakangan, jadi `min` ikut dikunci dari pemanggil.
 */
export function InputAngka({
  nilai,
  onUbah,
  className,
  ...rest
}: {
  nilai: number
  onUbah: (v: number) => void
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'min'
>) {
  const [teks, setTeks] = useState(String(nilai))
  const fokus = useRef(false)

  useEffect(() => {
    if (!fokus.current) setTeks(String(nilai))
  }, [nilai])

  return (
    <input
      {...rest}
      type="number"
      inputMode="decimal"
      min={0}
      value={teks}
      className={className}
      onFocus={(e) => {
        fokus.current = true
        e.currentTarget.select()
        rest.onFocus?.(e)
      }}
      onBlur={(e) => {
        fokus.current = false
        setTeks(String(nilai))
        rest.onBlur?.(e)
      }}
      onKeyDown={(e) => {
        // Ditahan di sini supaya minus tidak sempat berkedip di layar.
        if (e.key === '-') e.preventDefault()
        rest.onKeyDown?.(e)
      }}
      onChange={(e) => {
        const mentah = e.target.value
        const bersih = tanpaNegatif(mentah)
        // Input type=number bisa memegang teks yang React tidak tahu: kalau
        // `teks` kebetulan tidak berubah, React tidak akan menyentuh node-nya
        // dan "-5" tertinggal di layar. Jadi DOM-nya ditulis ulang sendiri.
        if (bersih !== mentah) e.target.value = bersih
        setTeks(bersih)
        // Sel kosong berarti nol: rerata tetap dibagi jumlah kolom seluruhnya.
        const angka = bersih === '' ? 0 : Number(bersih)
        if (Number.isFinite(angka) && angka >= 0) onUbah(angka)
      }}
    />
  )
}

/**
 * Sepasang input band tujuan: "80 – 100".
 *
 * `padat` menyempitkan kedua kotak untuk tabel rapat, tempat satu kolom hanya
 * selebar sekitar 180px dan kotak 54px tidak muat berdampingan.
 */
export function InputBand({
  min,
  max,
  onUbah,
  label,
  padat = false,
  besar = false,
}: {
  min: number
  max: number
  onUbah: (min: number, max: number) => void
  label?: string
  padat?: boolean
  /** Setinggi `.tombol`, untuk diletakkan berdampingan dengan tombol. */
  besar?: boolean
}) {
  const kelas = padat
    ? 'band-input band-input-padat'
    : besar
      ? 'band-input band-input-besar'
      : 'band-input'
  return (
    <div className={`flex items-center ${besar ? 'gap-2' : 'gap-[5px]'}`}>
      {label && (
        <span className={besar ? 'mikro' : 'mikro text-[9px] tracking-[0.06em]'}>{label}</span>
      )}
      <InputAngka
        nilai={min}
        onUbah={(v) => onUbah(v, max)}
        className={kelas}
        aria-label="Rentang minimum"
      />
      <span className="text-[color:var(--color-redup)]">–</span>
      <InputAngka
        nilai={max}
        onUbah={(v) => onUbah(min, v)}
        className={kelas}
        aria-label="Rentang maksimum"
      />
    </div>
  )
}

/**
 * Pindah sel dengan ↑ / ↓ / Enter: Enter dan ↓ turun satu baris, ↑ naik satu,
 * supaya satu kolom bisa diisi dari atas ke bawah tanpa menyentuh tetikus.
 * `langkah` = jumlah input per baris, supaya lompatannya turun satu baris.
 */
export function navigasiSel(e: React.KeyboardEvent<HTMLInputElement>, langkah: number) {
  if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) return
  e.preventDefault()

  const semua = Array.from(
    document.querySelectorAll<HTMLInputElement>('[data-sel="1"]'),
  )
  const i = semua.indexOf(e.currentTarget)
  if (i < 0) return

  const berikut = semua[i + (e.key === 'ArrowUp' ? -langkah : langkah)]
  berikut?.focus()
}
