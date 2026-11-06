"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logoNilaiHub from "../../public/logo-nilaihub.png";
import { usePathname } from "next/navigation";
import { useKelas } from "@/lib/store";
import Halaman from "@/components/halaman";
import type { RingkasanKelas } from "@/lib/data";
import { keluar } from "@/app/(auth)/actions";

type ItemNav = {
  label: string;
  ruas: string;
  kelompok?: string;
  anak?: { label: string; ruas: string }[];
};

const NAV: ItemNav[] = [
  { label: "Dasbor", ruas: "dasbor" },
  { label: "Nilai Formatif", ruas: "formatif", kelompok: "ENTRI" },
  { label: "Nilai Sumatif", ruas: "lingkup" },
  {
    label: "Asesmen Sumatif",
    ruas: "asesmen",
    anak: [
      { label: "Asesmen Tengah Semester", ruas: "tengah" },
      { label: "Asesmen Akhir Semester", ruas: "akhir" },
    ],
  },
  { label: "Daftar Nilai", ruas: "daftar", kelompok: "HASIL" },
  // { label: "Rincian Siswa", ruas: "siswa" },
  { label: "Skala & KKTP", ruas: "skala" },
];

function LencanaSimpan() {
  const { status } = useKelas();
  // "Tersimpan" hanya tampil 3 detik; status lain tetap tampil selama berlaku.
  const [statusLalu, setStatusLalu] = useState(status);
  const [habis, setHabis] = useState(false);
  if (status !== statusLalu) {
    setStatusLalu(status);
    setHabis(false);
  }

  useEffect(() => {
    if (status !== "tersimpan") return;
    const t = setTimeout(() => setHabis(true), 3000);
    return () => clearTimeout(t);
  }, [status]);

  const teks = {
    bersih: "",
    menyimpan: "Menyimpan…",
    tersimpan: "Tersimpan",
    galat: "Gagal menyimpan",
  }[status];

  if (!teks || (status === "tersimpan" && habis)) return null;

  const galat = status === "galat";

  return (
    <span
      className="tag"
      style={{
        background: galat ? "var(--color-basuh)" : "var(--color-sorot)",
        color: galat ? "var(--color-bahaya-pekat)" : "var(--color-aksen-gelap)",
      }}
    >
      {teks.toUpperCase()}
    </span>
  );
}

/** Satu butir navigasi: kapsul hijau bila aktif, datar bila tidak. */
function ButirNav({
  href,
  label,
  aktif,
  induk = false,
  sub = false,
  onPilih,
}: {
  href: string;
  label: string;
  aktif: boolean;
  /** Induk dari sub-menu yang sedang aktif: tinta gelap, tanpa kapsul. */
  induk?: boolean;
  /** Butir sub-menu: menjorok dan sedikit lebih kecil. */
  sub?: boolean;
  onPilih?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onPilih}
      aria-current={aktif ? "page" : undefined}
      className={`flex items-center gap-2.5 mr-2 rounded-[var(--r-kendali)] font-semibold no-underline transition-colors ${
        sub
          ? "ml-6 px-3 py-[8px] text-[0.75rem]"
          : "ml-2 px-3 py-[10px] text-[0.7812rem]"
      }`}
      style={{
        background: aktif ? "var(--color-aksen)" : "transparent",
        color: aktif
          ? "#ffffff"
          : induk
            ? "var(--color-tinta)"
            : "var(--color-redup)",
        boxShadow: aktif ? "var(--bayang-cta)" : "none",
      }}
    >
      <span
        className={`${sub ? "w-[5px] h-[5px]" : "w-[7px] h-[7px]"} flex-none rounded-full`}
        style={{
          background: aktif
            ? "#ffffff"
            : induk
              ? "var(--color-aksen)"
              : "var(--color-samar)",
        }}
      />
      {label}
    </Link>
  );
}

type Pengguna = { nama: string; email: string };

/** Huruf awal untuk avatar: dua kata pertama nama, atau huruf pertama email. */
function inisial({ nama, email }: Pengguna): string {
  const kata = nama.trim().split(/\s+/).filter(Boolean);
  if (kata.length)
    return kata
      .slice(0, 2)
      .map((k) => k[0])
      .join("")
      .toUpperCase();
  return (email[0] ?? "?").toUpperCase();
}

/**
 * Kaki rail: konteks kelas aktif, kartu pengguna, dan pemilih kelas yang
 * terbuka ke atas. Pindah di dalam grup yang sama mempertahankan layar yang
 * sedang dibuka; pindah ke mapel lain mendarat di dasbor.
 */
function KakiPanel({
  mapel,
  pengguna,
  semuaKelas,
  ruasAktif,
  onPilih,
}: {
  mapel: string;
  pengguna: Pengguna;
  semuaKelas: RingkasanKelas[];
  ruasAktif: string;
  onPilih?: () => void;
}) {
  const { kelas, grup } = useKelas();
  const [buka, setBuka] = useState(false);
  const akar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!buka) return;
    const kunci = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setBuka(false);
      }
    };
    const klik = (e: MouseEvent) => {
      if (!akar.current?.contains(e.target as Node)) setBuka(false);
    };
    window.addEventListener("keydown", kunci, true);
    document.addEventListener("mousedown", klik);
    return () => {
      window.removeEventListener("keydown", kunci, true);
      document.removeEventListener("mousedown", klik);
    };
  }, [buka]);

  // Kelompokkan per mapel + semester + tahun, urutan pertama kali muncul.
  const kelompok = new Map<string, RingkasanKelas[]>();
  for (const k of semuaKelas) {
    const kunci = `${k.mapel} · SMT ${k.semester} · ${k.tahunAjaran}`;
    kelompok.set(kunci, [...(kelompok.get(kunci) ?? []), k]);
  }

  const pilih = () => {
    setBuka(false);
    onPilih?.();
  };

  return (
    <div
      ref={akar}
      className="relative flex-none border-t border-[color:var(--color-garis)] px-3 pt-3 pb-3"
    >
      <LencanaSimpan />

      <div className="px-2 pb-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1 text-[0.875rem] font-semibold leading-[1.25] font-[family-name:var(--font-judul)] text-[color:var(--color-tinta)]">
            {mapel} · Kelas {kelas.nama}
          </div>
        </div>
        <div className="mikro mt-1">
          SMT {kelas.semester} · {kelas.tahunAjaran} · KKTP {kelas.kktp}
        </div>
      </div>

      {buka && (
        <div
          role="menu"
          className="papan absolute left-2 right-2 bottom-[calc(100%-8px)] z-10 p-2 max-h-[min(60vh,420px)] overflow-y-auto"
        >
          {[...kelompok].map(([judul, daftar]) => (
            <div key={judul} className="pb-1">
              <div className="px-3 pt-2 pb-1 text-[0.5938rem] font-bold tracking-[0.1em] text-[color:var(--color-samar)] truncate">
                {judul.toUpperCase()}
              </div>
              {daftar.map((k) => {
                const aktif = k.id === kelas.id;
                const segrup = grup.some((g) => g.id === k.id);
                return (
                  <Link
                    key={k.id}
                    role="menuitem"
                    href={`/kelas/${k.id}/${segrup ? ruasAktif : "dasbor"}`}
                    onClick={pilih}
                    aria-current={aktif ? "true" : undefined}
                    className="flex items-center gap-2 px-3 py-2 rounded-[var(--r-kendali)] text-[0.7812rem] font-semibold no-underline"
                    style={{
                      background: aktif ? "var(--color-aksen)" : "transparent",
                      color: aktif ? "#ffffff" : "var(--color-tinta)",
                    }}
                  >
                    <span className="flex-1 truncate">{k.nama}</span>
                    <span
                      className="text-[0.625rem] font-medium angka"
                      style={{
                        color: aktif
                          ? "rgba(255,255,255,0.8)"
                          : "var(--color-samar)",
                      }}
                    >
                      {k.jumlahSiswa} siswa
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}

          <div className="mt-1 pt-1 border-t border-[color:var(--color-garis)] flex flex-col">
            <Link
              href="/"
              role="menuitem"
              onClick={pilih}
              className="px-3 py-2 rounded-[var(--r-kendali)] text-[0.7812rem] font-semibold no-underline"
              style={{ color: "var(--color-redup)" }}
            >
              Semua kelas
            </Link>
            <Link
              href="/kelas/baru"
              role="menuitem"
              onClick={pilih}
              className="px-3 py-2 rounded-[var(--r-kendali)] text-[0.7812rem] font-semibold no-underline"
              style={{ color: "var(--color-redup)" }}
            >
              Kelas baru
            </Link>
            <form action={keluar}>
              <button
                type="submit"
                role="menuitem"
                className="w-full text-left px-3 py-2 rounded-[var(--r-kendali)] text-[0.7812rem] font-semibold border-0 bg-transparent cursor-pointer text-[color:var(--color-bahaya-pekat)]"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        aria-haspopup="menu"
        aria-expanded={buka}
        className=" w-full flex items-center gap-2.5 px-2.5 py-2 justify-start text-left"
      >
        <span
          aria-hidden
          className="kotak-ikon w-9 h-9 flex-none rounded-full bg-gradient-to-br from-[color:var(--color-langit)] to-[color:var(--color-daun)] text-[0.75rem] font-bold text-white"
        >
          {inisial(pengguna)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.7812rem] font-semibold leading-tight truncate text-[color:var(--color-tinta)]">
            {pengguna.nama || pengguna.email || "Guru"}
          </span>
        </span>
        <span
          aria-hidden
          className="flex-none text-[0.625rem] text-[color:var(--color-samar)] transition-transform"
          style={{ transform: buka ? "rotate(180deg)" : "none" }}
        >
          ▲
        </span>
      </button>
    </div>
  );
}

/**
 * Isi rail navigasi: logo, daftar layar, dan kaki berisi kelas aktif serta
 * pengguna. Digambar di dua tempat — rail tetap di layar lebar dan laci geser
 * di bawah `lg` — jadi isinya ditulis sekali di sini.
 */
function PanelNav({
  mapel,
  sekolah,
  pengguna,
  semuaKelas,
  ruasAktif,
  subAktif,
  onPilih,
}: {
  mapel: string;
  sekolah: string;
  pengguna: Pengguna;
  semuaKelas: RingkasanKelas[];
  ruasAktif: string;
  subAktif?: string;
  onPilih?: () => void;
}) {
  const { kelas } = useKelas();

  return (
    <>
      <Link
        href="/"
        onClick={onPilih}
        className="flex-none flex flex-col items-start px-5 pt-[22px] pb-[18px] no-underline"
      >
        <Image
          src={logoNilaiHub}
          alt="nilaiHub"
          loading="eager"
          className="h-11 w-auto"
        />
      </Link>

      <nav className="flex-1 min-h-0 flex flex-col pb-2.5 overflow-y-auto">
        {NAV.map((item) => (
          <div key={item.ruas}>
            {item.kelompok && (
              <div className="px-5 pt-4 pb-1.5 text-[0.5938rem] font-bold tracking-[0.12em] text-[color:var(--color-samar)]">
                {item.kelompok}
              </div>
            )}
            {item.anak ? (
              <>
                <ButirNav
                  href={`/kelas/${kelas.id}/${item.ruas}/${item.anak[0].ruas}`}
                  label={item.label}
                  aktif={false}
                  induk={ruasAktif === item.ruas}
                  onPilih={onPilih}
                />
                {item.anak.map((anak) => (
                  <ButirNav
                    key={anak.ruas}
                    href={`/kelas/${kelas.id}/${item.ruas}/${anak.ruas}`}
                    label={anak.label}
                    aktif={ruasAktif === item.ruas && subAktif === anak.ruas}
                    sub
                    onPilih={onPilih}
                  />
                ))}
              </>
            ) : (
              <ButirNav
                href={`/kelas/${kelas.id}/${item.ruas}`}
                label={item.label}
                aktif={ruasAktif === item.ruas}
                onPilih={onPilih}
              />
            )}
          </div>
        ))}

        <div className="px-5 pt-4 pb-1.5 text-[0.5938rem] font-bold tracking-[0.12em] text-[color:var(--color-samar)]">
          PENGATURAN
        </div>
        <ButirNav
          href={`/kelas/${kelas.id}/kelola`}
          label="Kelola Kelas"
          aktif={ruasAktif === "kelola"}
          onPilih={onPilih}
        />
      </nav>

      <KakiPanel
        mapel={mapel}
        pengguna={pengguna}
        semuaKelas={semuaKelas}
        ruasAktif={subAktif ? `${ruasAktif}/${subAktif}` : ruasAktif}
        onPilih={onPilih}
      />
    </>
  );
}

export default function Cangkang({
  mapel,
  sekolah,
  pengguna,
  semuaKelas,
  children,
}: {
  mapel: string;
  sekolah: string;
  pengguna: Pengguna;
  semuaKelas: RingkasanKelas[];
  children: React.ReactNode;
}) {
  const { kelas, hasil } = useKelas();
  const pathname = usePathname();
  const [laci, setLaci] = useState(false);

  const ruasAktif = pathname.split("/")[3] ?? "dasbor";
  const subAktif = pathname.split("/")[4];

  // Escape menutup laci, sama seperti klik di luar panel.
  useEffect(() => {
    if (!laci) return;
    const tutup = (e: KeyboardEvent) => e.key === "Escape" && setLaci(false);
    window.addEventListener("keydown", tutup);
    return () => window.removeEventListener("keydown", tutup);
  }, [laci]);

  const panel = { mapel, sekolah, pengguna, semuaKelas, ruasAktif, subAktif };

  return (
    <div className="flex h-dvh overflow-hidden bg-[color:var(--color-kertas)]">
      {/* ------------------------------------------------ rail (lg ke atas) -- */}
      <aside className="hidden lg:flex w-[15.25rem] flex-none m-4 mr-0 2xl:m-6 2xl:mr-0 flex-col papan-neu bg-white p-0 overflow-hidden tanpa-cetak">
        <PanelNav {...panel} />
      </aside>

      {/* --------------------------------------------- laci (di bawah lg) -- */}
      {laci && (
        <div
          className="fixed inset-0 z-50 lg:hidden tanpa-cetak"
          role="dialog"
          aria-modal="true"
          aria-label="Navigasi"
        >
          <button
            aria-label="Tutup menu"
            onClick={() => setLaci(false)}
            className="absolute inset-0 w-full h-full border-0 bg-[rgba(23,59,85,0.35)] cursor-pointer"
          />
          <aside className="laci absolute left-3 top-3 bottom-3 w-[17rem] max-w-[calc(100vw-24px)] flex flex-col papan-neu bg-white p-0 overflow-hidden">
            <PanelNav {...panel} onPilih={() => setLaci(false)} />
          </aside>
        </div>
      )}

      {/* ---------------------------------------------------------- isi -- */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="w-full max-w-halaman mx-auto flex-1 min-h-0 flex flex-col">
          {/* Bilah ringkas hanya di bawah lg: rail tersembunyi, jadi tombol
              menu, nama mapel, dan status simpan tetap terlihat di sini. */}
          <header className="lg:hidden flex-none flex items-center gap-3 mx-4 mt-4 px-3 py-3 papan tanpa-cetak">
            <button
              onClick={() => setLaci(true)}
              aria-label="Menu"
              aria-expanded={laci}
              className="tombol-neu w-10 h-10 p-0 flex-none flex-col gap-[4px]"
            >
              <span className="block w-4 h-[2px] rounded-full bg-[color:var(--color-tinta)]" />
              <span className="block w-4 h-[2px] rounded-full bg-[color:var(--color-tinta)]" />
              <span className="block w-4 h-[2px] rounded-full bg-[color:var(--color-tinta)]" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-[0.9375rem] font-semibold leading-[1.2] truncate font-[family-name:var(--font-judul)]">
                {mapel}
              </div>
              <div className="mikro mt-0.5 truncate">
                KELAS {kelas.nama.toUpperCase()}
              </div>
            </div>
            <LencanaSimpan />
          </header>

          <div className="flex-1 min-h-0 overflow-auto">
            {kelas.siswa.length === 0 && ruasAktif !== "kelola" ? (
              <RosterKosong kelasId={kelas.id} />
            ) : (
              children
            )}
          </div>
        </div>
      </div>

      <span className="sr-only">{hasil.baris.length}</span>
    </div>
  );
}

function RosterKosong({ kelasId }: { kelasId: string }) {
  return (
    <Halaman lebar="fokus">
      <div className="papan p-6 sm:p-8">
        <div
          className="kotak-ikon w-14 h-14 mb-5"
          style={{ background: "rgba(169, 196, 108, 0.2)" }}
        >
          <span className="text-[1.375rem] font-semibold text-[color:var(--color-langit-gelap)]">
            +
          </span>
        </div>
        <div className="mikro">KELAS INI BELUM PUNYA SISWA</div>

        <Link
          href={`/kelas/${kelasId}/kelola`}
          className="tombol inline-flex mt-5 no-underline"
        >
          Isi daftar siswa
        </Link>
      </div>
    </Halaman>
  );
}
