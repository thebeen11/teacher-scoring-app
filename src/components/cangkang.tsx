'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useKelas } from '@/lib/store'
import { n } from '@/lib/format'
import Halaman from '@/components/halaman'

const NAV: { label: string; ruas: string; kelompok?: string }[] = [
  { label: 'Dasbor', ruas: 'dasbor' },
  { label: 'Nilai Formatif', ruas: 'formatif', kelompok: 'ENTRI' },
  { label: 'Lingkup Materi', ruas: 'lingkup' },
  { label: 'Asesmen Sumatif', ruas: 'asesmen' },
  { label: 'Daftar Nilai', ruas: 'daftar', kelompok: 'HASIL' },
  { label: 'Rincian Siswa', ruas: 'siswa' },
  { label: 'Skala & KKTP', ruas: 'skala' },
]

function LencanaSimpan() {
  const { status } = useKelas()
  const teks = {
    bersih: '',
    menyimpan: 'Menyimpan…',
    tersimpan: 'Tersimpan',
    galat: 'Gagal menyimpan',
  }[status]

  if (!teks) return null

  const galat = status === 'galat'

  return (
    <span
      className="tag"
      style={{
        background: galat ? 'var(--color-basuh)' : 'var(--color-sorot)',
        color: galat ? 'var(--color-bahaya-pekat)' : 'var(--color-aksen-gelap)',
      }}
    >
      {teks.toUpperCase()}
    </span>
  )
}

/** Satu butir navigasi: kapsul hijau bila aktif, datar bila tidak. */
function ButirNav({
  href,
  label,
  aktif,
}: {
  href: string
  label: string
  aktif: boolean
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 mx-2 px-3 py-[10px] rounded-[var(--r-kendali)] text-[12.5px] font-semibold no-underline transition-colors"
      style={{
        background: aktif ? 'var(--color-aksen)' : 'transparent',
        color: aktif ? '#ffffff' : 'var(--color-redup)',
        boxShadow: aktif ? 'var(--bayang-cta)' : 'none',
      }}
    >
      <span
        className="w-[7px] h-[7px] flex-none rounded-full"
        style={{ background: aktif ? '#ffffff' : 'var(--color-samar)' }}
      />
      {label}
    </Link>
  )
}

export default function Cangkang({
  mapel,
  sekolah,
  children,
}: {
  mapel: string
  sekolah: string
  children: React.ReactNode
}) {
  const { kelas, grup, hasil } = useKelas()
  const pathname = usePathname()
  const router = useRouter()

  const ruasAktif = pathname.split('/')[3] ?? 'dasbor'
  const bobotSisa = 100 - kelas.bobot

  return (
    <div className="flex h-screen overflow-hidden bg-[color:var(--color-kertas)]">
      {/* ------------------------------------------------------- sidebar -- */}
      <aside className="w-[244px] flex-none m-6 mr-0 flex flex-col papan-neu p-0 overflow-hidden tanpa-cetak">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-5 pt-[22px] pb-[18px] no-underline"
        >
          <span className="kotak-ikon w-10 h-10 bg-gradient-to-br from-[color:var(--color-langit)] to-[color:var(--color-daun)]">
            <span className="w-3.5 h-3.5 rounded-[4px] bg-white/85" />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-semibold leading-none font-[family-name:var(--font-lora)] text-[color:var(--color-tinta)]">
              Olah Nilai
            </span>
            <span className="block text-[9.5px] font-bold leading-[1.4] tracking-[0.1em] text-[color:var(--color-samar)] mt-1.5 truncate">
              {sekolah.toUpperCase()}
            </span>
          </span>
        </Link>

        <nav className="flex flex-col pb-2.5 overflow-y-auto">
          {NAV.map((item) => (
            <div key={item.ruas}>
              {item.kelompok && (
                <div className="px-5 pt-4 pb-1.5 text-[9.5px] font-bold tracking-[0.12em] text-[color:var(--color-samar)]">
                  {item.kelompok}
                </div>
              )}
              <ButirNav
                href={`/kelas/${kelas.id}/${item.ruas}`}
                label={item.label}
                aktif={ruasAktif === item.ruas}
              />
            </div>
          ))}

          <div className="px-5 pt-4 pb-1.5 text-[9.5px] font-bold tracking-[0.12em] text-[color:var(--color-samar)]">
            PENGATURAN
          </div>
          <ButirNav
            href={`/kelas/${kelas.id}/kelola`}
            label="Kelola Kelas"
            aktif={ruasAktif === 'kelola'}
          />
        </nav>

        {/* Rumus aktif — berubah mengikuti bobot dan band saat ini. */}
        <div className="mt-auto m-2 papan-dalam">
          <div className="text-[9.5px] font-bold tracking-[0.1em] text-[color:var(--color-samar)] mb-2">
            RUMUS AKTIF
          </div>
          <div className="text-[10.5px] font-medium leading-[1.7] text-[color:var(--color-redup)] angka">
            NA = ({kelas.bobot}·(F+LM)/2 + {bobotSisa}·AS)/100
          </div>
          <div className="text-[10.5px] font-medium leading-[1.7] text-[color:var(--color-redup)] angka mt-1">
            RAPORT → band {n(kelas.naBandMin, 0)}–{n(kelas.naBandMax, 0)}
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------------- isi -- */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Batas lebar dipasang sekali di kolom ini, bukan di kepala dan isi
            sendiri-sendiri. Kalau dipasang dua kali, batang gulir menyempitkan
            kotak isi tapi tidak kotak kepala, dan keduanya terpusat pada garis
            tengah yang berbeda — kepala meleset beberapa piksel dari kartu di
            bawahnya. Dengan batas di kolom, batang gulir berada di dalam batas
            dan tepi kiri keduanya selalu jatuh di garis yang sama. */}
        <div className="w-full max-w-halaman mx-auto flex-1 min-h-0 flex flex-col">
          <header className="flex-none flex items-center gap-5 mx-6 mt-6 px-6 py-5 papan tanpa-cetak">
            <div className="min-w-0">
              <div className="text-[18px] font-semibold leading-[1.2] tracking-[-0.01em] truncate font-[family-name:var(--font-lora)]">
                {mapel}
              </div>
              <div className="mikro mt-1">
                SEMESTER {kelas.semester} · {kelas.tahunAjaran} · KKTP {kelas.kktp}
              </div>
            </div>

            <div className="ml-auto flex items-center gap-4">
              <LencanaSimpan />

              {grup.length > 1 && (
                <div className="segmen">
                  {grup.map((k) => {
                    const aktif = k.id === kelas.id
                    return (
                      <button
                        key={k.id}
                        onClick={() => router.push(`/kelas/${k.id}/${ruasAktif}`)}
                        style={{
                          background: aktif ? 'var(--color-aksen)' : 'transparent',
                          color: aktif ? '#ffffff' : 'var(--color-redup)',
                        }}
                      >
                        {k.nama}
                      </button>
                    )
                  })}
                </div>
              )}

              <Link
                href={`/kelas/${kelas.id}/daftar/cetak`}
                className="tombol no-underline"
              >
                Cetak daftar nilai
              </Link>
            </div>
          </header>

          <div className="flex-1 min-h-0 overflow-auto">
            {kelas.siswa.length === 0 ? <RosterKosong kelasId={kelas.id} /> : children}
          </div>
        </div>
      </div>

      <span className="sr-only">{hasil.baris.length}</span>
    </div>
  )
}

function RosterKosong({ kelasId }: { kelasId: string }) {
  return (
    <Halaman lebar="fokus">
      <div className="papan p-8">
        <div
          className="kotak-ikon w-14 h-14 mb-5"
          style={{ background: 'rgba(135, 206, 235, 0.2)' }}
        >
          <span className="text-[22px] font-semibold text-[color:var(--color-langit-gelap)]">
            +
          </span>
        </div>
        <div className="mikro">KELAS INI BELUM PUNYA SISWA</div>
        <p className="keterangan mt-3">
          Tidak ada yang bisa dihitung sebelum ada roster. Tempelkan daftar nama siswa, lalu
          seluruh layar entri dan daftar nilai akan hidup.
        </p>
        <Link
          href={`/kelas/${kelasId}/kelola`}
          className="tombol inline-flex mt-5 no-underline"
        >
          Isi daftar siswa
        </Link>
      </div>
    </Halaman>
  )
}
