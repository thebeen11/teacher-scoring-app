'use client'

import { useState } from 'react'
import { useKelas } from '@/lib/store'
import type { BarisNilai } from '@/lib/nilai'
import { n } from '@/lib/format'
import { gayaKolom, KepalaBeku, SelBeku } from './tabel'
import { ChipStatus } from './chip-status'

/**
 * Daftar Nilai — tidak ada satu sel pun yang diisi tangan di sini. Setiap angka
 * turunan dari layar entri: ubah satu skor formatif dan seluruh baris ini ikut
 * bergerak sampai ke band raport.
 *
 * Dua perender di atas SATU daftar kolom. Di layar tabel ini adalah kisi padat
 * seperti layar entri: kepala lengket dan kolom nama beku, supaya nama siswa
 * tidak hilang saat kelas dengan banyak asesmen tergulir mendatar. Di kertas
 * kolom beku tidak berarti apa-apa dan lebarnya harus mengalah pada lebar
 * halaman, jadi `untukCetak` memakai baris flex bergaris.
 *
 * Yang tidak boleh dikerjakan dua kali adalah isi selnya: kalau tiap perender
 * membaca `b.rtF`, `b.rtNS`, `b.rtA` sendiri-sendiri, menambah satu kolom
 * berarti menyunting dua tempat dan yang kedua pasti terlewat.
 */

type Kolom = {
  kunci: string
  label: string
  /** Trek grid untuk tampilan layar. */
  lebar: string
  /** Kelas lebar untuk tampilan cetak. */
  lebarCetak: string
  /** Garis pemisah kelompok di kanan sel. */
  sekat?: boolean
  isi: (b: BarisNilai) => React.ReactNode
  /** Kelas tambahan untuk sel isi. */
  kelas?: string
  gaya?: (b: BarisNilai) => React.CSSProperties | undefined
  /** Kunci urut; bila ada, kepala kolom ini bisa diklik di layar. */
  urut?: (b: BarisNilai) => number
}

type Urut = { kunci: string; arah: 'naik' | 'turun' } | null

const REDUP = 'text-[0.8438rem] text-[color:var(--color-redup)] angka'

export default function TabelDaftar({ untukCetak = false }: { untukCetak?: boolean }) {
  const { kelas, hasil } = useKelas()

  const kolom: Kolom[] = [
    {
      kunci: 'rtF',
      label: 'RT F',
      lebar: 'auto',
      lebarCetak: 'w-16 flex-none',
      isi: (b) => n(b.rtF),
      kelas: REDUP,
    },
    {
      kunci: 'rtNS',
      label: 'RT S',
      lebar: 'auto',
      lebarCetak: 'w-16 flex-none',
      sekat: true,
      isi: (b) => n(b.rtNS),
      kelas: REDUP,
    },
    ...kelas.asesmen.map((a, i) => ({
      kunci: a.id,
      label: a.jenis,
      lebar: 'auto',
      lebarCetak: 'w-16 flex-none',
      isi: (b: BarisNilai) => n(b.asesmen[i]?.nilai ?? 0),
      kelas: REDUP,
    })),
    {
      kunci: 'rtA',
      label: 'RT AS',
      lebar: 'auto',
      lebarCetak: 'w-16 flex-none',
      sekat: true,
      isi: (b) => n(b.rtA),
      kelas: REDUP,
    },
    {
      kunci: 'na',
      label: 'NA',
      lebar: 'auto',
      lebarCetak: 'w-[5.25rem] flex-none',
      isi: (b) => n(b.na),
      kelas: 'text-[0.875rem] font-bold angka',
    },
    {
      kunci: 'raport',
      label: 'RAPORT',
      lebar: 'auto',
      lebarCetak: 'w-[5.75rem] flex-none',
      isi: (b) => b.raport,
      kelas: 'text-[1.1875rem] font-extrabold angka',
      gaya: (b) => ({ color: b.tuntas ? 'var(--color-tinta)' : 'var(--color-bahaya)' }),
    },
    {
      kunci: 'status',
      label: 'STATUS',
      lebar: 'auto',
      lebarCetak: 'w-28 flex-none',
      isi: (b) => <ChipStatus tuntas={b.tuntas} />,
    },
    {
      kunci: 'peringkat',
      label: 'PERINGKAT',
      lebar: 'auto',
      lebarCetak: 'w-24 flex-none',
      isi: (b) => b.peringkat,
      kelas: 'text-[0.875rem] font-bold angka',
      urut: (b) => b.peringkat,
    },
  ]

  if (untukCetak) return <Cetak kolom={kolom} baris={hasil.baris} />
  return <Layar kolom={kolom} baris={hasil.baris} />
}

/* ------------------------------------------------------------------ layar --
   Kisi padat yang sama dengan layar entri. Kolom terakhir memuat tag, bukan
   angka, jadi ia satu-satunya yang tidak dirapatkan ke kanan. */

function Layar({ kolom, baris }: { kolom: Kolom[]; baris: BarisNilai[] }) {
  const gaya = gayaKolom(...kolom.map((k) => k.lebar))
  const rata = (k: Kolom) => (k.kunci === 'status' ? '' : ' justify-end')
  const [urut, setUrut] = useState<Urut>(null)

  // Klik berputar: naik → turun → kembali ke urutan NO.
  const ganti = (kunci: string) =>
    setUrut((u) =>
      u?.kunci !== kunci ? { kunci, arah: 'naik' } : u.arah === 'naik' ? { kunci, arah: 'turun' } : null,
    )

  const kunciUrut = kolom.find((k) => k.kunci === urut?.kunci)?.urut
  const terurut =
    urut && kunciUrut
      ? baris.slice().sort((x, y) => {
          const d = kunciUrut(x) - kunciUrut(y)
          return (urut.arah === 'naik' ? d : -d) || x.siswa.noUrut - y.siswa.noUrut
        })
      : baris

  return (
    <div className="tabel-padat min-w-max" style={gaya}>
      <div className="kepala-padat">
        <KepalaBeku />
        {kolom.map((k) => {
          const aktif = urut?.kunci === k.kunci ? urut.arah : null
          return (
            <div
              key={k.kunci}
              className={`sel-padat mikro${rata(k)}${k.sekat ? ' sekat-padat' : ''}`}
              aria-sort={
                k.urut ? (aktif === 'naik' ? 'ascending' : aktif === 'turun' ? 'descending' : 'none') : undefined
              }
            >
              {k.urut ? (
                <button
                  type="button"
                  className="mikro inline-flex items-center gap-1 cursor-pointer hover:text-[color:var(--color-tinta)]"
                  onClick={() => ganti(k.kunci)}
                  title={`Urutkan menurut ${k.label.toLowerCase()}`}
                >
                  {k.label}
                  <span className={aktif ? '' : 'opacity-40'}>
                    {aktif === 'naik' ? '↑' : aktif === 'turun' ? '↓' : '↕'}
                  </span>
                </button>
              ) : (
                k.label
              )}
            </div>
          )
        })}
      </div>

      <div className="grup-padat">
        {terurut.map((b) => (
          <div key={b.siswa.id} className="baris-padat">
            <SelBeku no={b.siswa.noUrut} nama={b.siswa.nama} />
            {kolom.map((k) => (
              <div
                key={k.kunci}
                className={`sel-padat${rata(k)}${k.sekat ? ' sekat-padat' : ''} ${k.kelas ?? ''}`}
                style={k.gaya?.(b)}
              >
                {k.isi(b)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ cetak --
   Baris bergaris rapat: di kertas, bayangan dan jarak antarkartu hanya
   membuang ruang, dan `.sekat` yang di layar tidak menggambar apa-apa berubah
   jadi garis hitam sungguhan lewat blok @media print. */

function Cetak({ kolom, baris }: { kolom: Kolom[]; baris: BarisNilai[] }) {
  const rata = (k: Kolom) => (k.kunci === 'status' ? '' : ' text-right')

  return (
    <div>
      <div className="kepala-cetak mikro">
        <div className="w-11 flex-none px-2.5 py-[11px]">NO</div>
        <div className="flex-1 min-w-[11.25rem] px-2.5 py-[11px] sekat">NAMA PESERTA DIDIK</div>
        {kolom.map((k) => (
          <div
            key={k.kunci}
            className={`${k.lebarCetak} px-2.5 py-[11px]${rata(k)}${k.sekat ? ' sekat' : ''}`}
          >
            {k.label}
          </div>
        ))}
      </div>

      {baris.map((b) => (
        <div key={b.siswa.id} className="baris-cetak">
          <div className="w-11 flex-none px-2.5 py-[11px] text-[0.7188rem] font-semibold text-[color:var(--color-samar)] angka">
            {b.siswa.noUrut}
          </div>
          <div
            className="flex-1 min-w-[11.25rem] px-2.5 py-[11px] text-[0.7812rem] font-semibold sekat truncate"
            title={b.siswa.nama}
          >
            {b.siswa.nama}
          </div>
          {kolom.map((k) => (
            <div
              key={k.kunci}
              className={`${k.lebarCetak} px-2.5 py-[11px]${rata(k)}${
                k.sekat ? ' sekat' : ''
              } ${k.kelas ?? ''}`}
              style={k.gaya?.(b)}
            >
              {k.isi(b)}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
