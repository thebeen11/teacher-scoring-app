'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useKelas } from '@/lib/store'
import { n } from '@/lib/format'

/**
 * Bingkai halaman cetak: bilah tombol (tidak ikut tercetak), judul, dan kop
 * kelas. Dialog cetak dibuka otomatis setelah huruf sempat dimuat.
 */
export default function KopCetak({
  judul,
  kembali,
  children,
}: {
  judul: string
  /** Ruas layar asal, mis. "formatif" atau "asesmen/tengah". */
  kembali: string
  children: React.ReactNode
}) {
  const { kelas, hasil } = useKelas()
  const [naMin, naMax] = hasil.naRange

  useEffect(() => {
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="p-4 sm:p-6 bg-white min-h-full">
      <div className="tanpa-cetak mb-6 flex flex-wrap items-center gap-3">
        <Link href={`/kelas/${kelas.id}/${kembali}`} className="tombol-garis no-underline">
          ← Kembali
        </Link>
        <button className="tombol" onClick={() => window.print()}>
          Cetak
        </button>
        <span className="keterangan">Tersusun untuk A4 melintang.</span>
      </div>

      <div className="text-center mb-1 text-[16px] font-bold tracking-[-0.01em]">{judul}</div>
      <div className="text-center mikro mb-5">
        SEMESTER {kelas.semester} · {kelas.tahunAjaran}
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-2 mb-3 text-[11px]">
        <div>
          <span className="mikro">KELAS </span>
          <strong>{kelas.nama}</strong>
        </div>
        <div>
          <span className="mikro">KKTP </span>
          <strong className="angka">{kelas.kktp}</strong>
        </div>
        <div>
          <span className="mikro">BOBOT </span>
          <strong className="angka">
            F {kelas.bobot.formatif} · S {kelas.bobot.sumatif} · AST {kelas.bobot.tengah} · AAS{' '}
            {kelas.bobot.akhir}
          </strong>
        </div>
        <div>
          <span className="mikro">NA </span>
          <strong className="angka">
            {n(naMin)}–{n(naMax)}
          </strong>
          <span className="mikro"> → RENTANG </span>
          <strong className="angka">
            {n(kelas.naBandMin, 0)}–{n(kelas.naBandMax, 0)}
          </strong>
        </div>
        <div className="ml-auto">
          <span className="mikro">TUNTAS </span>
          <strong className="angka">{hasil.jumlahTuntas}</strong>
          <span className="mikro"> · BELUM </span>
          <strong className="angka">{hasil.jumlahBelum}</strong>
        </div>
      </div>

      {/* Di layar sempit pratinjaunya digulir mendatar; di kertas A4 melintang
          lebarnya sudah cukup, jadi gulirnya dimatikan. */}
      <div className="overflow-x-auto print:overflow-visible">
        <div className="min-w-[760px] print:min-w-0">{children}</div>
      </div>
    </div>
  )
}
