'use client'

import { useState } from 'react'
import { useKelas } from '@/lib/store'
import { hitungSiswa, komponenOf, skorKolom, type Rentang } from '@/lib/nilai'
import { n, nAuto } from '@/lib/format'
import { InputBand } from './kendali'

/**
 * Peta Skala (papan 1b) — rescale digambar sebagai pemetaan dua garis.
 *
 * Garis atas adalah skor mentah, garis bawah hasil konversi, dan tiap ruas yang
 * menghubungkannya adalah satu siswa. Band yang sempit membuat semua ruas
 * mengumpul: itulah alasan nilai raport terasa berdempetan. Menggeser band di
 * sini menggambar ulang kedua garis seketika, jadi akibat pelebaran atau
 * penyempitan band terlihat sebelum diputuskan.
 */

const SUMBU_MIN = 60
const SUMBU_MAKS = 100

export default function PetaSkala() {
  const { kelas, grup, hasil, setBand, setPengaturan } = useKelas()

  // Hanya kolom tingkat atas: sub tidak punya band sendiri untuk digeser.
  const namai = (k: { label: string; nama: string }) =>
    k.nama ? `${k.label} · ${k.nama}` : k.label

  const pilihan = [
    ...komponenOf(kelas, 'formatif').map((k) => ({ kunci: k.id, label: namai(k) })),
    ...komponenOf(kelas, 'lingkup').map((k) => ({ kunci: k.id, label: namai(k) })),
    { kunci: 'na', label: 'NA → Raport' },
  ]

  const [aktif, setAktif] = useState(pilihan.at(-1)?.kunci ?? 'na')

  // Kumpulkan nilai mentah, rentang sumber, dan band tujuan untuk pilihan aktif.
  let nilai: number[]
  let bd: Rentang
  let band: [number, number]
  let judul: string
  let simpanBand: (mn: number, mx: number) => void

  if (aktif === 'na') {
    const peta = hasil.bounds
    nilai = kelas.siswa.map((s) => hitungSiswa(kelas, s, peta).na)
    bd = hasil.naRange
    band = [kelas.naBandMin, kelas.naBandMax]
    judul = 'Nilai Akhir → Raport'
    simpanBand = (mn, mx) => setPengaturan({ naBandMin: mn, naBandMax: mx })
  } else {
    const kol = kelas.komponen.find((k) => k.id === aktif)
    if (!kol) return null
    // Kolom bersub digambar dari nilai turunannya, sama seperti bounds-nya.
    nilai = kelas.siswa.map((s) => skorKolom(kelas, s.id, kol))
    bd = hasil.bounds[kol.jenis][kol.urutan] ?? [0, 0]
    band = [kol.bandMin, kol.bandMax]
    judul = `${kol.jenis === 'formatif' ? 'Formatif' : 'Lingkup Materi'} ${namai(kol)}`
    simpanBand = (mn, mx) => setBand(kol.id, mn, mx)
  }

  const rentangSumber = bd[1] - bd[0] || 1
  const jepit = (x: number) => Math.max(0, Math.min(100, x))
  const resc1 = (v: number) =>
    bd[1] === bd[0] ? band[1] : ((v - bd[0]) * (band[1] - band[0])) / (bd[1] - bd[0]) + band[0]

  const ruas = nilai.map((v) => ({
    a: jepit(((v - bd[0]) / rentangSumber) * 100),
    b: jepit(((resc1(v) - SUMBU_MIN) / (SUMBU_MAKS - SUMBU_MIN)) * 100),
  }))

  const lebarBand = band[1] - band[0]
  const sempit = lebarBand < rentangSumber / 3

  return (
    <div className="papan p-7">
      <div className="text-[18px] font-semibold leading-[1.2] font-[family-name:var(--font-lora)]">
        Peta Skala
      </div>
      <p className="keterangan mt-1.5 text-[11.5px] max-w-[560px]">
        Tiap jenis asesmen punya rentang mentah dan band tujuannya sendiri. Di sini rumusnya
        jadi gambar: geser band, lihat sebaran siswa berpindah.
      </p>

      <div className="flex flex-wrap gap-1.5 mt-4">
        {pilihan.map((p) => {
          const on = p.kunci === aktif
          return (
            <button
              key={p.kunci}
              onClick={() => setAktif(p.kunci)}
              className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold border-0 cursor-pointer transition-colors"
              style={{
                background: on ? 'var(--color-aksen)' : 'var(--color-keping)',
                color: on ? '#ffffff' : 'var(--color-redup)',
                boxShadow: on ? 'var(--bayang-cta)' : 'none',
              }}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      <div className="mt-6 pt-5 border-t border-[color:var(--color-garis)]">
        <div className="flex items-baseline gap-2.5">
          <div className="text-[13px] font-extrabold">{judul}</div>
          <div className="text-[10px] font-medium text-[color:var(--color-redup)] angka">
            mentah {nAuto(bd[0])}–{nAuto(bd[1])}
          </div>
          <div className="ml-auto">
            <InputBand min={band[0]} max={band[1]} onUbah={simpanBand} />
          </div>
        </div>

        <div className="flex justify-between mt-2.5 text-[9.5px] font-medium text-[color:var(--color-redup)] angka">
          <span>MENTAH {nAuto(bd[0])}</span>
          <span>{nAuto(bd[1])}</span>
        </div>

        <svg viewBox="0 0 100 78" preserveAspectRatio="none" className="w-full h-[78px] block">
          <line x1="0" y1="8" x2="100" y2="8" stroke="var(--color-tinta)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="70" x2="100" y2="70" stroke="var(--color-aksen)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {ruas.map((t, i) => (
            <line
              key={`r${i}`}
              x1={t.a}
              y1="8"
              x2={t.b}
              y2="70"
              stroke="var(--color-langit-gelap)"
              strokeOpacity="0.5"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {ruas.map((t, i) => (
            <line
              key={`a${i}`}
              x1={t.a}
              y1="2"
              x2={t.a}
              y2="15"
              stroke="var(--color-tinta)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {ruas.map((t, i) => (
            <line
              key={`b${i}`}
              x1={t.b}
              y1="63"
              x2={t.b}
              y2="76"
              stroke="var(--color-aksen)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        <div className="flex justify-between mt-1 text-[9.5px] font-medium text-[color:var(--color-redup)] angka">
          <span>KONVERSI {SUMBU_MIN}</span>
          <span>
            rentang {n(rentangSumber)} → {n(lebarBand, 0)} poin
          </span>
          <span>{SUMBU_MAKS}</span>
        </div>
      </div>

      {sempit && (
        <div className="mt-5 px-5 py-4 rounded-[var(--r-kendali)] bg-[color:var(--color-sorot)] text-[11px] leading-[1.55]">
          Band yang sempit meratakan siswa: jarak {nAuto(bd[0])} dan {nAuto(bd[1])} pada skor
          mentah menyusut jadi {n(lebarBand, 0)} poin saja. Itu sebabnya nilai raport terasa
          mengumpul.
        </div>
      )}

      <p className="keterangan mt-3 text-[11px]">
        Sumber min/maks saat ini: <strong>{kelas.sumberMinMaks === 'kelas' ? 'kelas ini' : `semua kelas (${grup.length})`}</strong>.
      </p>
    </div>
  )
}
