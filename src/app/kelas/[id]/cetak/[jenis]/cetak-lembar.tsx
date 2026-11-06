'use client'

import { useKelas } from '@/lib/store'
import { lembarUntuk, type JenisEkspor, type KolomLembar, type Lembar } from '@/lib/ekspor'
import { n } from '@/lib/format'
import KopCetak from '@/components/kop-cetak'
import TabelDaftar from '@/components/tabel-daftar'

const KEMBALI: Record<JenisEkspor, string> = {
  formatif: 'formatif',
  lingkup: 'lingkup',
  tengah: 'asesmen/tengah',
  akhir: 'asesmen/akhir',
  daftar: 'daftar',
}

export default function CetakLembar({ jenis }: { jenis: JenisEkspor }) {
  const { kelas, hasil } = useKelas()
  const lembar = lembarUntuk(kelas, hasil, jenis)

  if (!lembar) {
    return (
      <KopCetak judul="BELUM ADA DATA" kembali={KEMBALI[jenis]}>
        <p className="keterangan">Asesmen ini belum ada di kelas ini.</p>
      </KopCetak>
    )
  }

  return (
    <KopCetak judul={lembar.judul} kembali={KEMBALI[jenis]}>
      {/* Daftar Nilai punya perender cetak sendiri (warna raport, tag status). */}
      {jenis === 'daftar' ? <TabelDaftar untukCetak /> : <TabelLembar lembar={lembar} />}
    </KopCetak>
  )
}

/* Tabel bergaris sederhana dari satu `Lembar`; kepala dua tingkat bila ada
   kolom bergrup. Garisnya dihitamkan blok @media print di globals.css. */
function TabelLembar({ lembar }: { lembar: Lembar }) {
  const { kolom, baris } = lembar
  const adaGrup = kolom.some((k) => k.grup)

  // Rentetan grup untuk kepala atas: kolom tanpa grup jadi satu sel rowSpan 2.
  const atas: { k: KolomLembar; span: number }[] = []
  for (const k of kolom) {
    const akhir = atas.at(-1)
    if (k.grup && akhir?.k.grup === k.grup) akhir.span++
    else atas.push({ k, span: 1 })
  }

  const garis = 'border border-[color:var(--color-garis)] print:border-black'
  const kepala = `${garis} px-2 py-[7px] mikro text-center align-middle`
  const sekat = (k: KolomLembar) => (k.sekat ? ' border-r-[1.5px] border-r-[color:var(--color-tinta)]' : '')

  const isi = (v: unknown, k: KolomLembar) =>
    typeof v === 'number' ? n(v, k.bulat ? 0 : 1) : (v as string | null) ?? ''

  return (
    <table className="w-full border-collapse text-[11.5px]">
      <thead className="bg-[color:var(--color-kepala)] print:bg-white">
        {adaGrup ? (
          <>
            <tr>
              {atas.map(({ k, span }, i) =>
                k.grup ? (
                  <th key={i} colSpan={span} className={kepala}>
                    {k.grup}
                  </th>
                ) : (
                  <th key={i} rowSpan={2} className={kepala + sekat(k)}>
                    {k.label}
                  </th>
                ),
              )}
            </tr>
            <tr>
              {kolom
                .filter((k) => k.grup)
                .map((k, i) => (
                  <th key={i} className={kepala + sekat(k)}>
                    {k.label}
                  </th>
                ))}
            </tr>
          </>
        ) : (
          <tr>
            {kolom.map((k, i) => (
              <th key={i} className={kepala + sekat(k)}>
                {k.label}
              </th>
            ))}
          </tr>
        )}
      </thead>
      <tbody>
        {baris.map((b, r) => (
          <tr key={r} className="break-inside-avoid">
            {kolom.map((k, i) => (
              <td
                key={i}
                className={`${garis} px-2 py-[6px] angka ${
                  k.teks ? 'text-left font-semibold' : 'text-right'
                }${sekat(k)}`}
              >
                {isi(b[i], k)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
