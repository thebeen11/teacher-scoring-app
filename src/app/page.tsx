import Link from "next/link";
import Image from "next/image";
import logoNilaiHub from "../../public/logo-nilaihub.png";
import { daftarKelas, type RingkasanKelas } from "@/lib/data";
import { penggunaSaatIni } from "@/lib/supabase/server";
import { supabaseSiap } from "@/lib/env";
import { keluar } from "./(auth)/actions";
import Penyiapan from "@/components/penyiapan";
import Halaman from "@/components/halaman";
import KepalaHalaman from "@/components/kepala-halaman";

export default async function Beranda() {
  if (!supabaseSiap) return <Penyiapan />;

  const [kelas, pengguna] = await Promise.all([
    daftarKelas(),
    penggunaSaatIni(),
  ]);
  const aktif = kelas.filter((k) => k.aktif);
  const nonaktif = kelas.filter((k) => !k.aktif);
  const meta = (pengguna?.user_metadata ?? {}) as {
    nama?: string;
    sekolah?: string;
  };

  return (
    <div className="min-h-screen">
      <div className="w-full max-w-halaman mx-auto">
        <header className="flex items-center gap-3 sm:gap-5 mx-4 mt-4 px-4 py-4 sm:mx-6 sm:mt-6 sm:px-6 sm:py-5 papan">
          <div className="flex flex-col items-start min-w-0">
            <Image
              src={logoNilaiHub}
              alt="nilaiHub"
              loading="eager"
              className="h-10 sm:h-11 w-auto"
            />
          </div>
          <div className="ml-auto flex items-center gap-4 min-w-0">
            <span className="hidden sm:inline truncate text-[0.75rem] text-[color:var(--color-redup)]">
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
            <KepalaHalaman
              lengket={false}
              judul={<>Semua Kelas</>}
              keterangan="Setiap kelas membawa kolom nilai, rentang skala, dan KKTP-nya sendiri."
              aksi={
                <Link href="/kelas/baru" className="tombol no-underline">
                  Kelas baru
                </Link>
              }
            />

            {aktif.length === 0 ? (
              <div className="papan p-6 sm:p-8">
                <div className="mikro">BELUM ADA KELAS</div>
                <p className="keterangan mt-3 max-w-[35rem]">
                  Mulai dengan membuat satu kelas: isi mata pelajaran, nama
                  kelas, dan tempelkan daftar nama siswa. Kolom formatif dan
                  sumatif Bab 1–Bab 4, serta ASTS dan ASAS akan dibuatkan
                  otomatis dengan rentang bawaan — semuanya bisa diubah nanti di
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
                {aktif.map((k) => (
                  <KartuKelas key={k.id} k={k} />
                ))}
              </div>
            )}

            {/* Kelas nonaktif: arsip, terlipat. Masih bisa dibuka dan
                diaktifkan lagi dari layar Kelola Kelas-nya. */}
            {nonaktif.length > 0 && (
              <details className="mt-8 sm:mt-10 group">
                <summary className="mikro cursor-pointer select-none list-none inline-flex items-center gap-2 hover:text-[color:var(--color-tinta)]">
                  <span className="inline-block transition-transform group-open:rotate-90">
                    ›
                  </span>
                  KELAS NONAKTIF ({nonaktif.length})
                </summary>
                <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-4 sm:gap-7">
                  {nonaktif.map((k) => (
                    <KartuKelas key={k.id} k={k} />
                  ))}
                </div>
              </details>
            )}
          </Halaman>
        </main>
      </div>
    </div>
  );
}

function KartuKelas({ k }: { k: RingkasanKelas }) {
  return (
    <Link
      href={`/kelas/${k.id}/dasbor`}
      className={`papan papan-angkat p-6 no-underline${k.aktif ? "" : " opacity-70"}`}
    >
      <div className="flex items-baseline gap-2">
        <div className="text-[1.375rem] font-semibold leading-none font-[family-name:var(--font-judul)]">
          {k.nama}
        </div>
        <div className="mikro angka">{k.jumlahSiswa} SISWA</div>
        {!k.aktif && (
          <span
            className="tag ml-auto text-[0.625rem]"
            style={{
              background: "var(--color-sorot)",
              color: "var(--color-redup)",
            }}
          >
            NONAKTIF
          </span>
        )}
      </div>
      <div className="text-[0.75rem] text-[color:var(--color-redup)] mt-3">
        {k.mapel}
      </div>
      <div className="mikro mt-1.5">
        SEMESTER {k.semester} · {k.tahunAjaran}
      </div>
    </Link>
  );
}
