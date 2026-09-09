'use client'

import { useRouter } from 'next/navigation'
import { useKelas } from '@/lib/store'
import {
  hitungKelas,
  kelengkapanAsesmen,
  kelengkapanKelas,
  kelengkapanKolom,
  komponenOf,
} from '@/lib/nilai'
import { n, pct } from '@/lib/format'
import Halaman from '@/components/halaman'

export default function HalamanDasbor() {
  const { kelas, grup, hasil } = useKelas()
  const router = useRouter()

  const kartu = grup.map((k) => {
    const h = k.id === kelas.id ? hasil : hitungKelas(k, grup)
    return {
      id: k.id,
      nama: k.nama,
      siswa: k.siswa.length,
      rerata: h.baris.length ? n(h.rerataRaport) : '–',
      tuntas: h.jumlahTuntas,
      belum: h.jumlahBelum,
      kelengkapan: kelengkapanKelas(k),
      aktif: k.id === kelas.id,
    }
  })

  // Alur nilai: satu kotak per kelompok kolom dan per asesmen.
  const formatif = komponenOf(kelas, 'formatif')
  const lingkup = komponenOf(kelas, 'lingkup')

  const ringkasKolom = (label: string, ids: string[]) => {
    const nilai = ids.map((id) => kelengkapanKolom(kelas, id))
    const penuh = nilai.filter((v) => v >= 100).length
    const rata = nilai.length ? nilai.reduce((a, b) => a + b, 0) / nilai.length : 0
    return {
      kode: label,
      status: penuh === nilai.length ? 'lengkap' : `${penuh} dari ${nilai.length} terisi`,
      pct: rata,
    }
  }

  const alur = [
    {
      ...ringkasKolom(
        formatif.length ? `${formatif[0].label}–${formatif.at(-1)!.label}` : 'F',
        formatif.map((k) => k.id),
      ),
      nama: 'Formatif harian',
    },
    {
      ...ringkasKolom(
        lingkup.length ? `${lingkup[0].label}–${lingkup.at(-1)!.label}` : 'LM',
        lingkup.map((k) => k.id),
      ),
      nama: 'Sumatif lingkup materi',
    },
    ...kelas.asesmen.map((a) => {
      const p = kelengkapanAsesmen(kelas, a.id)
      return {
        kode: a.jenis,
        nama:
          a.jenis === 'ASTS'
            ? 'Asesmen tengah semester'
            : a.jenis === 'ASAS'
              ? 'Asesmen akhir semester'
              : 'Asesmen akhir tahun',
        status: p >= 100 ? 'lengkap' : `${Math.round(p)}% terisi`,
        pct: p,
      }
    }),
  ]

  const [naMin, naMax] = hasil.naRange
  const belum = hasil.baris.filter((b) => !b.tuntas)

  return (
    <Halaman>
      {/* ------------------------------------------------- kartu kelas -- */}
      <div
        className="grid gap-7"
        style={{ gridTemplateColumns: `repeat(${Math.min(kartu.length, 3)}, minmax(0, 1fr))` }}
      >
        {kartu.map((k) => (
          <button
            key={k.id}
            onClick={() => !k.aktif && router.push(`/kelas/${k.id}/dasbor`)}
            className={`papan px-6 py-[22px] text-left border-0 cursor-pointer ${
              k.aktif ? '' : 'papan-angkat'
            }`}
            style={{
              cursor: k.aktif ? 'default' : 'pointer',
              boxShadow: k.aktif ? 'var(--bayang-neu)' : undefined,
              background: k.aktif ? 'var(--color-kertas)' : undefined,
            }}
          >
            <div className="flex items-baseline gap-2">
              <div className="text-[22px] font-semibold leading-none font-[family-name:var(--font-lora)]">
                {k.nama}
              </div>
              <div className="mikro angka">{k.siswa} SISWA</div>
              {k.aktif && (
                <span className="ml-auto w-2 h-2 rounded-full bg-[color:var(--color-aksen)]" />
              )}
            </div>

            <div className="flex gap-[22px] mt-3.5">
              <div>
                <div className="mikro">RERATA RAPORT</div>
                <div className="text-[20px] font-bold mt-[3px] angka">{k.rerata}</div>
              </div>
              <div>
                <div className="mikro">TUNTAS</div>
                <div className="text-[20px] font-bold mt-[3px] angka">{k.tuntas}</div>
              </div>
              <div>
                <div className="mikro">BELUM</div>
                <div
                  className="text-[20px] font-bold mt-[3px] angka"
                  style={{ color: k.belum ? 'var(--color-bahaya)' : 'var(--color-tinta)' }}
                >
                  {k.belum}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between mikro">
                <span>KELENGKAPAN</span>
                <span className="angka">{pct(k.kelengkapan)}</span>
              </div>
              <div className="bilah mt-1.5">
                <span style={{ width: pct(k.kelengkapan) }} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ------------------------------------------- alur + di bawah KKTP -- */}
      <div className="flex gap-7 mt-7">
        <div className="flex-1 min-w-0 papan px-6 py-[22px]">
          <div className="mikro-lebar">ALUR NILAI · {kelas.nama}</div>

          <div
            className="grid gap-3.5 mt-4"
            style={{ gridTemplateColumns: `repeat(${alur.length}, minmax(0, 1fr))` }}
          >
            {alur.map((a) => {
              const warna =
                a.pct >= 100 ? 'var(--color-aksen-gelap)' : 'var(--color-bahaya)'
              return (
                <div key={a.kode} className="papan-dalam">
                  <div className="text-[13px] font-extrabold">{a.kode}</div>
                  <div className="text-[11px] leading-[1.4] text-[color:var(--color-redup)] mt-0.5 h-[30px]">
                    {a.nama}
                  </div>
                  <div className="text-[11px] font-bold mt-1 angka" style={{ color: warna }}>
                    {a.status}
                  </div>
                  <div className="bilah h-1.5 mt-2">
                    <span style={{ background: warna, width: pct(a.pct) }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-[color:var(--color-garis)] flex gap-7 flex-wrap">
            <div>
              <div className="mikro">NA TERENDAH</div>
              <div className="text-[18px] font-bold mt-[3px] angka">{n(naMin)}</div>
            </div>
            <div>
              <div className="mikro">NA TERTINGGI</div>
              <div className="text-[18px] font-bold mt-[3px] angka">{n(naMax)}</div>
            </div>
            <div>
              <div className="mikro">BAND RAPORT</div>
              <div className="text-[18px] font-bold mt-[3px] angka">
                {n(kelas.naBandMin, 0)}–{n(kelas.naBandMax, 0)}
              </div>
            </div>
            <div>
              <div className="mikro">SUMBER MIN/MAKS</div>
              <div className="text-[18px] font-bold mt-[3px]">
                {kelas.sumberMinMaks === 'kelas' ? 'Kelas ini' : 'Semua kelas'}
              </div>
            </div>
          </div>
        </div>

        <div className="w-[330px] flex-none papan px-6 py-[22px]">
          <div className="mikro-lebar text-[color:var(--color-bahaya)]">
            DI BAWAH KKTP {kelas.kktp}
          </div>

          <div className="mt-3">
            {belum.length === 0 ? (
              <p className="keterangan">
                Semua siswa mencapai KKTP. {hasil.baris.length ? '' : 'Belum ada data nilai.'}
              </p>
            ) : (
              belum.map((b) => (
                <button
                  key={b.siswa.id}
                  onClick={() => router.push(`/kelas/${kelas.id}/siswa?siswa=${b.siswa.id}`)}
                  className="w-full flex items-center gap-2.5 px-3 py-[10px] mb-1 rounded-[var(--r-kecil)] border-0 bg-transparent text-[12px] font-medium text-left cursor-pointer transition-colors hover:bg-[color:var(--color-basuh)]"
                >
                  <span className="flex-1 min-w-0 truncate">{b.siswa.nama}</span>
                  <span className="text-[13px] font-bold text-[color:var(--color-bahaya)] angka">
                    {b.raport}
                  </span>
                </button>
              ))
            )}
          </div>

          {belum.length > 0 && (
            <p className="keterangan mt-3.5 text-[11px]">
              Klik nama untuk membuka rincian rantai nilainya.
            </p>
          )}
        </div>
      </div>
    </Halaman>
  )
}
