"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";

/**
 * Kendali sunting kolom yang menempel langsung di tab dan kepala tabel entri.
 *
 * Kolom tidak lagi diatur dari layar terpisah: tab `+` menambah kolom, menu
 * ikon pensil pada tiap tab mengganti nama / menghapus, dan kepala sub
 * bisa disunting di tempat. Penambahan selalu meminta nama lebih dulu, jadi
 * tidak ada kolom kosong tanpa nama yang diam-diam menarik rerata turun.
 */

/**
 * Isian nama sebaris. Enter menyimpan, Esc membatalkan, dan meninggalkan
 * isian menyimpan bila isinya berubah. Tombol panah tidak diteruskan ke
 * tablist, supaya mengetik tidak sekaligus berpindah tab.
 */
export function IsianNama({
  awal = "",
  placeholder,
  onSimpan,
  onBatal,
  className = "",
}: {
  awal?: string;
  placeholder: string;
  onSimpan: (nama: string) => void;
  onBatal: () => void;
  className?: string;
}) {
  const [nilai, setNilai] = useState(awal);
  const selesai = useRef(false);

  const tutup = (simpan: boolean) => {
    if (selesai.current) return;
    selesai.current = true;
    const nama = nilai.trim();
    if (simpan && nama !== awal.trim()) onSimpan(nama);
    else onBatal();
  };

  return (
    <input
      autoFocus
      value={nilai}
      maxLength={60}
      placeholder={placeholder}
      aria-label={placeholder}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setNilai(e.target.value)}
      onBlur={() => tutup(true)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
          e.preventDefault();
          tutup(true);
        } else if (e.key === "Escape") {
          e.preventDefault();
          tutup(false);
        }
      }}
      className={`isian px-2.5 py-1.5 text-[0.875rem] ${className}`}
    />
  );
}

/** Menjalankan aksi server kolom dalam transisi dan melaporkan statusnya. */
export function useAksiKolom() {
  const [menyimpan, mulai] = useTransition();
  const jalankan = (aksi: () => Promise<unknown>) =>
    mulai(async () => {
      await aksi();
    });
  return { menyimpan, jalankan };
}

/** Lencana status yang sama gayanya dengan PenandaSimpan di swasimpan.tsx. */
export function PenandaAksi({ aktif }: { aktif: boolean }) {
  return (
    <span aria-live="polite" className="mikro text-[color:var(--color-samar)]">
      {aktif ? "MENYIMPAN…" : ""}
    </span>
  );
}

/**
 * Menu pensil sebuah tab kolom. Popover-nya berposisi `fixed` dari kotak tombol,
 * karena tablist bergulir mendatar dan akan memotong popover yang absolut.
 */
export function MenuKolom({
  label,
  aktif,
  bisaHapus,
  onGantiNama,
  onHapus,
}: {
  label: string;
  aktif: boolean;
  bisaHapus: boolean;
  onGantiNama: () => void;
  onHapus: () => void;
}) {
  const tombol = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [buka, setBuka] = useState(false);
  const [yakin, setYakin] = useState(false);
  const [posisi, setPosisi] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!buka || !tombol.current) return;
    const r = tombol.current.getBoundingClientRect();
    const lebar = 200;
    setPosisi({
      top: r.bottom + 6,
      left: Math.max(8, Math.min(r.right - lebar, window.innerWidth - lebar - 8)),
    });
  }, [buka]);

  useEffect(() => {
    if (!buka) return;
    const tutup = () => {
      setBuka(false);
      setYakin(false);
    };
    const klik = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menu.current?.contains(t) || tombol.current?.contains(t)) return;
      tutup();
    };
    const tombolKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      tutup();
      tombol.current?.focus();
    };
    document.addEventListener("mousedown", klik);
    document.addEventListener("keydown", tombolKey);
    window.addEventListener("scroll", tutup, true);
    window.addEventListener("resize", tutup);
    return () => {
      document.removeEventListener("mousedown", klik);
      document.removeEventListener("keydown", tombolKey);
      window.removeEventListener("scroll", tutup, true);
      window.removeEventListener("resize", tutup);
    };
  }, [buka]);

  const pilih = (aksi: () => void) => {
    setBuka(false);
    setYakin(false);
    aksi();
  };

  const butir =
    "w-full text-left px-3 py-2 text-[0.875rem] font-semibold border-0 bg-transparent cursor-pointer rounded-[var(--r-kecil)] transition-colors hover:bg-[color:var(--color-kepala)] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <>
      <button
        ref={tombol}
        type="button"
        tabIndex={-1}
        aria-label={`Atur kolom ${label}`}
        aria-haspopup="menu"
        aria-expanded={buka}
        onClick={() => setBuka((b) => !b)}
        className="flex flex-none items-center border-l-0 px-2"
        style={{
          background: aktif ? "var(--color-aksen)" : "transparent",
          color: aktif ? "#ffffff" : "var(--color-samar)",
        }}
      >
        <IkonPensil />
      </button>

      {buka && (
        <div
          ref={menu}
          role="menu"
          className="papan fixed z-50 w-[12.5rem] p-1.5"
          style={{ top: posisi.top, left: posisi.left, boxShadow: "var(--bayang-lembut)" }}
        >
          <button role="menuitem" type="button" className={butir} onClick={() => pilih(onGantiNama)}>
            Ganti nama
          </button>
          {yakin ? (
            <button
              role="menuitem"
              type="button"
              autoFocus
              className={`${butir} text-[color:var(--color-bahaya)] bg-[color:var(--color-basuh)]`}
              onClick={() => pilih(onHapus)}
            >
              Ya, hapus {label} beserta nilainya
            </button>
          ) : (
            <button
              role="menuitem"
              type="button"
              disabled={!bisaHapus}
              title={bisaHapus ? undefined : "Kolom terakhir tidak bisa dihapus"}
              className={`${butir} text-[color:var(--color-bahaya)]`}
              onClick={() => setYakin(true)}
            >
              Hapus kolom
            </button>
          )}
        </div>
      )}
    </>
  );
}

/** Ikon pensil kecil; warnanya mengikuti `color` induknya. */
export function IkonPensil({ ukuran = 12 }: { ukuran?: number }) {
  return (
    <svg
      aria-hidden
      width={ukuran}
      height={ukuran}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

/** Ikon tempat sampah kecil; warnanya mengikuti `color` induknya. */
export function IkonSampah({ ukuran = 12 }: { ukuran?: number }) {
  return (
    <svg
      aria-hidden
      width={ukuran}
      height={ukuran}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

/** Tombol hapus dua langkah: klik pertama meminta kepastian, klik kedua menghapus. */
export function HapusDuaLangkah({ label, onHapus }: { label: string; onHapus: () => void }) {
  const [yakin, setYakin] = useState(false);
  return (
    <button
      type="button"
      onClick={() => (yakin ? onHapus() : setYakin(true))}
      onBlur={() => setYakin(false)}
      title={yakin ? `Klik lagi untuk menghapus ${label}` : `Hapus ${label}`}
      aria-label={yakin ? `Pastikan hapus ${label}` : `Hapus ${label}`}
      className={`flex flex-none items-center border-0 cursor-pointer rounded-[var(--r-kecil)] px-1 text-[0.8125rem] font-bold leading-none text-[color:var(--color-bahaya)] transition-colors ${
        yakin ? "bg-[color:var(--color-basuh)] py-0.5" : "bg-transparent opacity-50 hover:opacity-100"
      }`}
    >
      {yakin ? "Hapus?" : <IkonSampah ukuran={11} />}
    </button>
  );
}
