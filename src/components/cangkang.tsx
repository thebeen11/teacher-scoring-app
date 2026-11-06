"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import logoNilaiHub from "../../public/logo-nilaihub.png";
import { usePathname } from "next/navigation";
import { useKelas } from "@/lib/store";
import Halaman from "@/components/halaman";
import type { RingkasanKelas } from "@/lib/data";
import { keluar } from "@/app/(auth)/actions";
import IkonNav, { type NamaIkon } from "@/components/ikon-nav";

type ItemNav = {
  label: string;
  ruas: string;
  ikon: NamaIkon;
  kelompok?: string;
  anak?: { label: string; ruas: string; ikon: NamaIkon }[];
};

const NAV: ItemNav[] = [
  { label: "Dasbor", ruas: "dasbor", ikon: "dasbor" },
  {
    label: "Nilai Formatif",
    ruas: "formatif",
    ikon: "formatif",
    kelompok: "ENTRI",
  },
  { label: "Nilai Sumatif", ruas: "lingkup", ikon: "lingkup" },
  {
    label: "Asesmen Sumatif",
    ruas: "asesmen",
    ikon: "asesmen",
    anak: [
      { label: "Asesmen Tengah Semester", ruas: "tengah", ikon: "tengah" },
      { label: "Asesmen Akhir Semester", ruas: "akhir", ikon: "akhir" },
    ],
  },
  { label: "Daftar Nilai", ruas: "daftar", ikon: "daftar", kelompok: "HASIL" },
  // { label: "Rincian Siswa", ruas: "siswa" },
  {
    label: "Skala & KKTP",
    ruas: "skala",
    ikon: "skala",
    kelompok: "PENGATURAN",
  },
  { label: "Kelola Kelas", ruas: "kelola", ikon: "kelola" },
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
  ikon,
  aktif,
  induk = false,
  sub = false,
  onPilih,
}: {
  href: string;
  label: string;
  ikon: NamaIkon;
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
        className="flex-none flex"
        style={{
          color: aktif
            ? "#ffffff"
            : induk
              ? "var(--color-aksen)"
              : "var(--color-samar)",
        }}
      >
        <IkonNav nama={ikon} ukuran={sub ? 14 : 16} />
      </span>
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

const KELAS_BUTIR =
  "flex items-center gap-2 px-3 py-2 rounded-[var(--r-kendali)] text-[0.7812rem] font-semibold no-underline";

/**
 * Menu melayang di samping pemicunya — keluar dari rail ke kanan. Dirender
 * lewat portal dengan posisi `fixed` supaya tidak terpotong `overflow-hidden`
 * rail. Bila ruang di kanan sempit (laci di layar kecil), membuka ke atas.
 */
function MenuSamping({
  pemicu,
  buka,
  onTutup,
  label,
  children,
}: {
  pemicu: React.RefObject<HTMLButtonElement | null>;
  buka: boolean;
  onTutup: () => void;
  label: string;
  children: React.ReactNode;
}) {
  const menu = useRef<HTMLDivElement>(null);

  // Posisi ditulis langsung ke DOM (sebelum dilukis), bukan lewat state.
  useLayoutEffect(() => {
    if (!buka) return;
    const ukur = () => {
      const el = pemicu.current;
      const m = menu.current;
      if (!el || !m) return;
      const r = el.getBoundingClientRect();
      const lebar = 256;
      const celah = 12;
      const keKanan = window.innerWidth - r.right >= lebar + celah + 8;
      Object.assign(
        m.style,
        keKanan
          ? {
              left: `${r.right + celah}px`,
              bottom: `${Math.max(8, window.innerHeight - r.bottom)}px`,
              width: `${lebar}px`,
              maxHeight: `${Math.min(window.innerHeight * 0.6, 420)}px`,
            }
          : {
              left: `${r.left}px`,
              bottom: `${window.innerHeight - r.top + 8}px`,
              width: `${r.width}px`,
              maxHeight: `${Math.min(r.top - 16, 420)}px`,
            },
      );
    };
    ukur();
    const kunci = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onTutup();
        pemicu.current?.focus();
      }
    };
    const luar = (e: PointerEvent) => {
      const t = e.target as Node;
      if (pemicu.current?.contains(t) || menu.current?.contains(t)) return;
      onTutup();
    };
    window.addEventListener("keydown", kunci, true);
    window.addEventListener("scroll", ukur, true);
    window.addEventListener("resize", ukur);
    document.addEventListener("pointerdown", luar);
    return () => {
      window.removeEventListener("keydown", kunci, true);
      window.removeEventListener("scroll", ukur, true);
      window.removeEventListener("resize", ukur);
      document.removeEventListener("pointerdown", luar);
    };
  }, [buka, onTutup, pemicu]);

  if (!buka) return null;
  return createPortal(
    <div
      ref={menu}
      role="menu"
      aria-label={label}
      className="menu-samping tanpa-cetak"
      style={{ position: "fixed" }}
    >
      {children}
    </div>,
    document.body,
  );
}

/** Panah kecil penanda menu samping; berputar saat menu terbuka. */
function PanahSamping({ buka }: { buka: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="w-3.5 h-3.5 flex-none text-[color:var(--color-samar)] transition-transform"
      style={{ transform: buka ? "rotate(180deg)" : "none" }}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

/**
 * Kaki rail: kelas aktif (membuka pemilih kelas) dan kartu pengguna (membuka
 * menu akun). Pindah di dalam grup yang sama mempertahankan layar yang sedang
 * dibuka; pindah ke mapel lain mendarat di dasbor.
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
  const [menu, setMenu] = useState<"kelas" | "akun" | null>(null);
  const pemicuKelas = useRef<HTMLButtonElement>(null);
  const pemicuAkun = useRef<HTMLButtonElement>(null);
  const tutup = useCallback(() => setMenu(null), []);

  // Kelompokkan per mapel + semester + tahun, urutan pertama kali muncul.
  const kelompok = new Map<string, RingkasanKelas[]>();
  // Kelas nonaktif tidak ditawarkan — kecuali yang sedang dibuka.
  for (const k of semuaKelas.filter((k) => k.aktif || k.id === kelas.id)) {
    const kunci = `${k.mapel} · SMT ${k.semester} · ${k.tahunAjaran}`;
    kelompok.set(kunci, [...(kelompok.get(kunci) ?? []), k]);
  }

  const pilih = () => {
    setMenu(null);
    onPilih?.();
  };

  const alih = (m: "kelas" | "akun") => setMenu((x) => (x === m ? null : m));

  return (
    <div className="relative flex-none border-t border-[color:var(--color-garis)] px-3 pt-3 pb-3">
      <LencanaSimpan />

      <button
        ref={pemicuKelas}
        type="button"
        onClick={() => alih("kelas")}
        aria-haspopup="menu"
        aria-expanded={menu === "kelas"}
        className="w-full flex items-center gap-2 px-2.5 py-2 mb-1 rounded-[var(--r-kendali)] text-left border-0 bg-transparent cursor-pointer transition-colors hover:bg-[color:var(--color-sorot)]"
        style={{
          background: menu === "kelas" ? "var(--color-sorot)" : undefined,
        }}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[0.875rem] font-semibold leading-[1.25] font-[family-name:var(--font-judul)] text-[color:var(--color-tinta)]">
            {mapel} · Kelas {kelas.nama}
          </span>
          <span className="block mikro mt-1">
            SMT {kelas.semester} · {kelas.tahunAjaran} · KKTP {kelas.kktp}
          </span>
        </span>
        <PanahSamping buka={menu === "kelas"} />
      </button>

      <MenuSamping
        pemicu={pemicuKelas}
        buka={menu === "kelas"}
        onTutup={tutup}
        label="Pindah kelas"
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
                  className={KELAS_BUTIR}
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
            className={KELAS_BUTIR}
            style={{ color: "var(--color-redup)" }}
          >
            Semua kelas
          </Link>
          <Link
            href="/kelas/baru"
            role="menuitem"
            onClick={pilih}
            className={KELAS_BUTIR}
            style={{ color: "var(--color-redup)" }}
          >
            Kelas baru
          </Link>
        </div>
      </MenuSamping>

      <button
        ref={pemicuAkun}
        type="button"
        onClick={() => alih("akun")}
        aria-haspopup="menu"
        aria-expanded={menu === "akun"}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 justify-start text-left"
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
        <PanahSamping buka={menu === "akun"} />
      </button>

      <MenuSamping
        pemicu={pemicuAkun}
        buka={menu === "akun"}
        onTutup={tutup}
        label="Akun"
      >
        <div className="px-3 pt-2 pb-2.5">
          <div className="text-[0.7812rem] font-semibold leading-tight truncate text-[color:var(--color-tinta)]">
            {pengguna.nama || "Guru"}
          </div>
          {pengguna.email && (
            <div className="mt-0.5 text-[0.6875rem] truncate text-[color:var(--color-samar)]">
              {pengguna.email}
            </div>
          )}
        </div>
        <div className="pt-1 border-t border-[color:var(--color-garis)] flex flex-col">
          <span
            role="menuitem"
            aria-disabled="true"
            className={`${KELAS_BUTIR} cursor-not-allowed`}
            style={{ color: "var(--color-samar)" }}
          >
            <span className="flex-1">Pengaturan akun</span>
            <span className="tag">SEGERA</span>
          </span>
          <form action={keluar}>
            <button
              type="submit"
              role="menuitem"
              className={`${KELAS_BUTIR} w-full text-left border-0 bg-transparent cursor-pointer text-[color:var(--color-bahaya-pekat)]`}
            >
              Keluar
            </button>
          </form>
        </div>
      </MenuSamping>
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
                  ikon={item.ikon}
                  aktif={false}
                  induk={ruasAktif === item.ruas}
                  onPilih={onPilih}
                />
                {item.anak.map((anak) => (
                  <ButirNav
                    key={anak.ruas}
                    href={`/kelas/${kelas.id}/${item.ruas}/${anak.ruas}`}
                    label={anak.label}
                    ikon={anak.ikon}
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
                ikon={item.ikon}
                aktif={ruasAktif === item.ruas}
                onPilih={onPilih}
              />
            )}
          </div>
        ))}
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
