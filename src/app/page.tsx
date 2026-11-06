import Link from "next/link";
import Image from "next/image";
import logoNilaiHub from "../../public/logo-nilaihub.png";
import { daftarKelas } from "@/lib/data";
import { penggunaSaatIni } from "@/lib/supabase/server";
import { supabaseSiap } from "@/lib/env";
import { keluar } from "./(auth)/actions";
import Penyiapan from "@/components/penyiapan";
import Halaman from "@/components/halaman";
import KepalaHalaman from "@/components/kepala-halaman";
import SaringKelas from "@/components/saring-kelas";

export default async function Beranda() {
  if (!supabaseSiap) return <Penyiapan />;

  const [kelas, pengguna] = await Promise.all([
    daftarKelas(),
    penggunaSaatIni(),
  ]);
  const adaAktif = kelas.some((k) => k.aktif);
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

            {!adaAktif && (
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
            )}

            <SaringKelas kelas={kelas} />
          </Halaman>
        </main>
      </div>
    </div>
  );
}
