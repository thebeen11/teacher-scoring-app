'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useKelas } from '@/lib/store'
import { n } from '@/lib/format'
import TabelDaftar from '@/components/tabel-daftar'

export default function HalamanCetak() {
  const { kelas, hasil } = useKelas()
  const [naMin, naMax] = hasil.naRange

  useEffect(() => {
    // Beri kesempatan huruf dimuat sebelum dialog cetak muncul.
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="p-6 bg-white min-h-full">
      <div className="tanpa-cetak mb-6 flex items-center gap-3">
        <Link href={`/kelas/${kelas.id}/daftar`} className="tombol-garis no-underline">
          ← Kembali
        </Link>
        <button className="tombol" onClick={() => window.print()}>
          Cetak
        </button>
        <span className="keterangan">Tersusun untuk A4 melintang.</span>
      </div>

      <div className="text-center mb-1 text-[16px] font-bold tracking-[-0.01em]">
        DAFTAR NILAI PESERTA DIDIK
      </div>
      <div className="text-center mikro mb-5">
        SEMESTER {kelas.semester} · {kelas.tahunAjaran}
      </div>

      <div className="flex gap-8 mb-3 text-[11px]">
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
            {kelas.bobot} : {100 - kelas.bobot}
          </strong>
        </div>
        <div>
          <span className="mikro">NA </span>
          <strong className="angka">
            {n(naMin)}–{n(naMax)}
          </strong>
          <span className="mikro"> → BAND </span>
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

      <TabelDaftar untukCetak />
    </div>
  )
}
