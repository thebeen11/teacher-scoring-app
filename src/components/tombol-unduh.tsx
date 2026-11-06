"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useKelas } from "@/lib/store";
import {
  kopLembar,
  lembarUntuk,
  namaBerkas,
  semuaLembar,
  type JenisEkspor,
} from "@/lib/ekspor";

const JUDUL_BERKAS: Record<JenisEkspor, string> = {
  formatif: "Nilai Formatif",
  lingkup: "Nilai Sumatif",
  tengah: "Asesmen Tengah Semester",
  akhir: "Asesmen Akhir Semester",
  daftar: "Daftar Nilai",
};

/**
 * Tombol "Unduh" di kepala tiap layar nilai: Excel (.xlsx) untuk layar ini,
 * atau halaman cetak. Di Daftar Nilai ada satu pilihan lagi — workbook berisi
 * seluruh lembar sekaligus.
 */
export default function TombolUnduh({ jenis }: { jenis: JenisEkspor }) {
  const { kelas, hasil } = useKelas();
  const router = useRouter();
  const akar = useRef<HTMLDivElement>(null);
  const [buka, setBuka] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState(false);

  useEffect(() => {
    if (!buka) return;
    const klik = (e: MouseEvent) => {
      if (!akar.current?.contains(e.target as Node)) setBuka(false);
    };
    const tombolKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBuka(false);
    };
    document.addEventListener("mousedown", klik);
    document.addEventListener("keydown", tombolKey);
    return () => {
      document.removeEventListener("mousedown", klik);
      document.removeEventListener("keydown", tombolKey);
    };
  }, [buka]);

  const excel = async (semua: boolean) => {
    setBuka(false);
    const lembar = semua
      ? semuaLembar(kelas, hasil)
      : [lembarUntuk(kelas, hasil, jenis)].filter((l) => l !== null);
    if (!lembar.length) return;
    setSibuk(true);
    setGalat(false);
    try {
      const { unduhXlsx } = await import("@/lib/unduh-xlsx");
      await unduhXlsx(
        namaBerkas(kelas, semua ? "Olah Nilai" : JUDUL_BERKAS[jenis]),
        lembar,
        kopLembar(kelas, hasil),
      );
    } catch (e) {
      console.error(e);
      setGalat(true);
    } finally {
      setSibuk(false);
    }
  };

  const kosong = lembarUntuk(kelas, hasil, jenis) === null;

  const butir =
    "disabled:cursor-not-allowed disabled:opacity-40 w-full text-left px-3 py-2 text-[12px] font-semibold border-0 bg-transparent cursor-pointer rounded-[var(--r-kecil)] transition-colors hover:bg-[color:var(--color-kepala)]";

  const keterangan =
    "block mt-0.5 text-[10.5px] font-medium leading-snug text-[color:var(--color-redup)]";

  return (
    <div ref={akar} className="relative tanpa-cetak">
      <button
        type="button"
        className="tombol whitespace-nowrap"
        aria-haspopup="menu"
        aria-expanded={buka}
        disabled={sibuk}
        onClick={() => setBuka((b) => !b)}
      >
        {sibuk ? "Menyiapkan…" : "Unduh ▾"}
      </button>
      {galat && (
        <div className="absolute right-0 top-full mt-1 whitespace-nowrap text-[11px] font-semibold text-[color:var(--color-bahaya)]">
          Gagal membuat berkas
        </div>
      )}

      {buka && (
        <div
          role="menu"
          className="papan absolute right-0 top-full z-50 mt-1.5 w-[270px] p-1.5"
          style={{ boxShadow: "var(--bayang-lembut)" }}
        >
          <button
            role="menuitem"
            type="button"
            className={butir}
            disabled={kosong}
            title={kosong ? "Belum ada data untuk diunduh" : undefined}
            onClick={() => excel(false)}
          >
            Excel — {JUDUL_BERKAS[jenis]}
            <span className={keterangan}>
              {kosong ? "Belum ada data untuk diunduh" : "Hanya tabel di layar ini"}
            </span>
          </button>
          {jenis === "daftar" && (
            <button role="menuitem" type="button" className={butir} onClick={() => excel(true)}>
              Excel — Seluruh nilai kelas
              <span className={keterangan}>
                Formatif, Sumatif, ASTS, ASAS, dan Daftar Nilai dalam satu berkas
              </span>
            </button>
          )}
          <button
            role="menuitem"
            type="button"
            className={butir}
            onClick={() => {
              setBuka(false);
              router.push(`/kelas/${kelas.id}/cetak/${jenis}`);
            }}
          >
            Cetak — {JUDUL_BERKAS[jenis]}
            <span className={keterangan}>Buka halaman siap cetak, A4 melintang</span>
          </button>
        </div>
      )}
    </div>
  );
}
