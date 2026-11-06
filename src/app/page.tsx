import Link from 'next/link'
import { daftarKelas } from '@/lib/data'
import { penggunaSaatIni } from '@/lib/supabase/server'
import { supabaseSiap } from '@/lib/env'
import { keluar } from './(auth)/actions'
import Penyiapan from '@/components/penyiapan'
import Halaman from '@/components/halaman'

export default async function Beranda() {
  if (!supabaseSiap) return <Penyiapan />

  const [kelas, pengguna] = await Promise.all([daftarKelas(), penggunaSaatIni()])
  const meta = (pengguna?.user_metadata ?? {}) as { nama?: string; sekolah?: string }

  return (
    <div className="min-h-screen">
      <div className="w-full max-w-halaman mx-auto">
        <header className="flex items-center gap-3 sm:gap-5 mx-4 mt-4 px-4 py-4 sm:mx-6 sm:mt-6 sm:px-6 sm:py-5 papan">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="kotak-ikon w-10 h-10 bg-gradient-to-br from-[color:var(--color-langit)] to-[color:var(--color-daun)]">
              <span className="w-3.5 h-3.5 rounded-[4px] bg-white/85" />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold leading-none font-[family-name:var(--font-lora)]">
                Olah Nilai
              </span>
              <span className="block mikro mt-1.5 truncate">
                {meta.sekolah?.toUpperCase() || 'PAPAN NILAI GURU'}
              </span>
            </span>
          </div>
          <div className="ml-auto flex items-center gap-4 min-w-0">
            <span className="hidden sm:inline truncate text-[12px] text-[color:var(--color-redup)]">
              {meta.nama || pengguna?.email}
            </span>
            <form action={keluar}>
              <button type="submit" className="tombol-garis">
                Keluar
              </button>
            </form>
          </div>
        </header>

        <main>
          <Halaman>
            <div className="flex flex-wrap items-end gap-4 mb-7">
              <div className="min-w-0">
                <h1 className="judul">Semua <span className="teks-gradien">Kelas</span></h1>
                <p className="keterangan mt-1.5">
                  Setiap kelas membawa kolom nilai, band skala, dan KKTP-nya sendiri.
                </p>
              </div>
              <Link href="/kelas/baru" className="tombol ml-auto no-underline">
                Kelas baru
              </Link>
            </div>

            {kelas.length === 0 ? (
              <div className="papan p-6 sm:p-8">
                <div className="mikro">BELUM ADA KELAS</div>
                <p className="keterangan mt-3 max-w-[560px]">
                  Mulai dengan membuat satu kelas: isi mata pelajaran, nama kelas, dan tempelkan
                  daftar nama siswa. Kolom formatif F1–F4, lingkup materi LM1–LM4, serta ASTS dan
                  ASAS akan dibuatkan otomatis dengan band bawaan — semuanya bisa diubah nanti di
                  layar Skala &amp; KKTP.
                </p>
                <Link
                  href="/kelas/baru"
                  className="tombol inline-flex mt-5 no-underline"
                >
                  Buat kelas pertama
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-4 sm:gap-7">
                {kelas.map((k) => (
                  <Link
                    key={k.id}
                    href={`/kelas/${k.id}/dasbor`}
                    className="papan papan-angkat p-6 no-underline"
                  >
                    <div className="flex items-baseline gap-2">
                      <div className="text-[22px] font-semibold leading-none font-[family-name:var(--font-lora)]">
                        {k.nama}
                      </div>
                      <div className="mikro angka">{k.jumlahSiswa} SISWA</div>
                    </div>
                    <div className="text-[12px] text-[color:var(--color-redup)] mt-3">{k.mapel}</div>
                    <div className="mikro mt-1.5">
                      SEMESTER {k.semester} · {k.tahunAjaran}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Halaman>
        </main>
      </div>
    </div>
  )
}
