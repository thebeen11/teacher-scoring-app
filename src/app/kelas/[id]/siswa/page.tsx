'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useKelas } from '@/lib/store'
import { n } from '@/lib/format'
import Halaman from '@/components/halaman'

/**
 * Rincian Siswa — rantai nilai satu siswa dibuka penuh, dari skor mentah
 * sampai nilai raport, dengan aritmetika tiap tahap ditulis apa adanya.
 * Ini jawaban untuk "kenapa nilai saya segini?": tiap tahap menampilkan angka
 * yang masuk, rumus yang dipakai, dan angka keluar yang jadi masukan tahap
 * berikutnya, sampai band raport terakhir.
 */
export default function HalamanSiswa() {
  const { kelas, hasil } = useKelas()
  const params = useSearchParams()
  const dariTaut = params.get('siswa')

  const indeksAwal = Math.max(
    0,
    hasil.baris.findIndex((b) => b.siswa.id === dariTaut),
  )
  const [terpilih, setTerpilih] = useState(indeksAwal)

  const b = hasil.baris[Math.min(terpilih, hasil.baris.length - 1)]
  if (!b) return null

  const [naMin, naMax] = hasil.naRange
  const bobotSisa = 100 - kelas.bobot

  const tahap = [
    {
      kode: b.formatif.length ? `${b.formatif[0].komponen.label}–${b.formatif.at(-1)!.komponen.label}` : 'F',
      label: 'Formatif, tiap kolom direscale ke band-nya',
      detail: `${b.formatif.map((c) => c.mentah).join(' · ')}  →  ${b.formatif
        .map((c) => n(c.konversi))
        .join(' · ')}`,
      nilai: n(b.rtF),
    },
    {
      kode: b.lingkup.length ? `${b.lingkup[0].komponen.label}–${b.lingkup.at(-1)!.komponen.label}` : 'LM',
      label: 'Sumatif lingkup materi, band per kolom',
      detail: `${b.lingkup.map((c) => c.mentah).join(' · ')}  →  ${b.lingkup
        .map((c) => n(c.konversi))
        .join(' · ')}`,
      nilai: n(b.rtLM),
    },
    ...b.asesmen.map((a) => ({
      kode: a.asesmen.jenis,
      label:
        a.asesmen.jenis === 'ASTS'
          ? 'Asesmen tengah semester'
          : a.asesmen.jenis === 'ASAS'
            ? 'Asesmen akhir semester'
            : 'Asesmen akhir tahun',
      detail:
        `(${a.butir.a}×${a.asesmen.bobotA})+(${a.butir.b}×${a.asesmen.bobotB})+` +
        `${a.butir.c === 0 ? '0' : a.butir.c} = ${n(a.total, 0)} → ` +
        `(${n(a.asesmen.konstanta, 0)}+${n(a.total, 0)})÷${n(a.asesmen.pembagi, 0)}`,
      nilai: n(a.nilai),
    })),
    {
      kode: 'NA',
      label: 'Nilai akhir, bobot proses : asesmen',
      detail: `(${kelas.bobot}×(${n(b.rtF)}+${n(b.rtLM)})/2 + ${bobotSisa}×${n(b.rtA)}) ÷ 100`,
      nilai: n(b.na),
    },
    {
      kode: 'RAPORT',
      label: 'NA direscale ke band raport, dibulatkan',
      detail: `NA ${n(naMin)}–${n(naMax)}  →  band ${n(kelas.naBandMin, 0)}–${n(kelas.naBandMax, 0)}`,
      nilai: String(b.raport),
      aksen: true,
    },
  ]

  return (
    <Halaman className="flex gap-7">
      {/* --------------------------------------------------------- roster -- */}
      <div className="w-[250px] flex-none papan self-start max-h-[calc(100vh-150px)] overflow-auto p-3">
        <div className="px-3 py-2.5 mb-1 border-b border-[color:var(--color-garis)] mikro sticky top-0 bg-[color:var(--color-papan)] z-10">
          {kelas.nama} · {hasil.baris.length} SISWA
        </div>
        {hasil.baris.map((r, i) => (
          <button
            key={r.siswa.id}
            onClick={() => setTerpilih(i)}
            className="w-full flex gap-2 px-3 py-[9px] rounded-[var(--r-kecil)] border-0 text-[11.5px] font-medium text-left cursor-pointer transition-colors hover:bg-[color:var(--color-kepala)]"
            style={{ background: i === terpilih ? 'var(--color-sorot)' : 'transparent' }}
          >
            <span className="text-[color:var(--color-samar)] angka">{r.siswa.noUrut}</span>
            <span className="flex-1 min-w-0 truncate">{r.siswa.nama}</span>
            <span
              className="font-bold angka"
              style={{ color: r.tuntas ? 'var(--color-tinta)' : 'var(--color-bahaya)' }}
            >
              {r.raport}
            </span>
          </button>
        ))}
      </div>

      {/* ---------------------------------------------------------- kanan -- */}
      <div className="flex-1 min-w-0">
        <div className="papan-neu px-7 py-6">
          <div className="flex items-end gap-5">
            <div>
              <div className="mikro">
                PESERTA DIDIK {b.siswa.noUrut} · {kelas.nama}
              </div>
              <div className="text-[26px] font-semibold leading-[1.2] mt-1.5 tracking-[-0.01em] font-[family-name:var(--font-lora)]">
                {b.siswa.nama}
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="mikro">NILAI RAPORT</div>
              <div
                className="text-[46px] font-extrabold leading-none tracking-[-0.02em] angka"
                style={{ color: b.tuntas ? 'var(--color-tinta)' : 'var(--color-bahaya)' }}
              >
                {b.raport}
              </div>
            </div>
            <div className="text-right">
              <div className="mikro">STATUS</div>
              <div
                className="tag mt-2 text-[11px]"
                style={{
                  background: b.tuntas ? 'var(--color-sorot)' : 'var(--color-basuh)',
                  color: b.tuntas ? 'var(--color-aksen-gelap)' : 'var(--color-bahaya-pekat)',
                }}
              >
                {b.tuntas ? 'TUNTAS' : 'BELUM'}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 papan p-0 overflow-hidden">
          <div className="px-6 py-3.5 border-b border-[color:var(--color-garis)] bg-[color:var(--color-kepala)] mikro">
            RANTAI NILAI — DARI SKOR MENTAH KE RAPORT
          </div>
          {tahap.map((t) => (
            <div
              key={t.kode}
              className="flex items-center px-1.5 border-b border-[color:var(--color-garis)]"
            >
              <div className="w-[120px] flex-none px-[18px] py-3.5 text-[13px] font-extrabold sekat">
                {t.kode}
              </div>
              <div className="w-[200px] flex-none px-[18px] py-3.5 text-[11.5px] leading-[1.4] text-[color:var(--color-redup)]">
                {t.label}
              </div>
              <div className="flex-1 min-w-0 px-[18px] py-3.5 text-[11.5px] font-medium angka">
                {t.detail}
              </div>
              <div
                className="w-[120px] flex-none px-[18px] py-3.5 text-[18px] font-extrabold text-right angka"
                style={{ color: t.aksen ? 'var(--color-aksen-gelap)' : 'var(--color-tinta)' }}
              >
                {t.nilai}
              </div>
            </div>
          ))}
          <p className="px-6 py-4 keterangan">
            Setiap baris memakai variabel skala yang bisa diubah di layar{' '}
            <strong>Skala &amp; KKTP</strong>. Ubah satu, seluruh rantai ini ikut bergerak.
          </p>
        </div>
      </div>
    </Halaman>
  )
}
