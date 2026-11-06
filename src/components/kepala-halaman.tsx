"use client";

import { useLayoutEffect, useRef } from "react";

export type Statistik = {
  label: string;
  nilai: React.ReactNode;
  sub?: string;
  /** Warna angka, mis. `var(--color-bahaya-pekat)`. */
  warna?: string;
};

// Ditulis utuh per jumlah ubin — Tailwind tidak membaca kelas rakitan.
const KISI: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

/**
 * Kartu kepala halaman: judul + aksi di baris pertama, ubin statistik di baris
 * kedua.
 *
 * `lengket` menaruh kartu di atas latar pekat selebar wadah gulir — menutup
 * jalur di atas kartu, sudut kartu, dan celah sampai kepala tabel, jadi baris
 * yang tergulir tidak terlihat menembus. Margin negatifnya membatalkan sisipan
 * `Halaman`, jadi komponen ini harus jadi anak langsung `Halaman`.
 *
 * Tinggi latar diukur dan ditulis ke induknya sebagai `--atas-lengket`, supaya
 * `.kepala-padat` di halaman yang sama menempel tepat di bawahnya; kelas
 * `kepala-tutup` mengisi sudut bulat kepala tabel dengan warna halaman.
 */
export default function KepalaHalaman({
  judul,
  keterangan,
  aksi,
  statistik,
  bawah,
  lengket = true,
}: {
  judul: React.ReactNode;
  keterangan?: React.ReactNode;
  aksi?: React.ReactNode;
  statistik?: Statistik[];
  /** Baris kedua bebas (mis. tab kolom) — dipakai bila tanpa `statistik`. */
  bawah?: React.ReactNode;
  lengket?: boolean;
}) {
  const akar = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = akar.current;
    const induk = el?.parentElement;
    if (!lengket || !el || !induk) return;
    const ukur = () =>
      induk.style.setProperty("--atas-lengket", `${el.offsetHeight}px`);
    ukur();
    induk.classList.add("kepala-tutup");
    const ro = new ResizeObserver(ukur);
    ro.observe(el);
    return () => {
      ro.disconnect();
      induk.style.removeProperty("--atas-lengket");
      induk.classList.remove("kepala-tutup");
    };
  }, [lengket]);

  const kartu = (
    <div className="papan-neu bg-white px-5 sm:px-6 py-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0">
          <h1 className="judul">{judul}</h1>
          {keterangan && <p className="keterangan mt-1.5">{keterangan}</p>}
        </div>
        {aksi && (
          <div className="ml-auto flex flex-wrap items-center gap-3 max-w-full">
            {aksi}
          </div>
        )}
      </div>

      {!statistik?.length && bawah && (
        <div className="mt-4 pt-4 border-t border-[color:var(--color-garis)]">
          {bawah}
        </div>
      )}

      {statistik && statistik.length > 0 && (
        <div
          className={`mt-4 pt-4 border-t border-[color:var(--color-garis)] grid gap-3 ${
            KISI[statistik.length] ?? KISI[4]
          }`}
        >
          {statistik.map((s) => (
            <div
              key={s.label}
              className="rounded-[var(--r-kendali)] bg-[color:var(--color-kertas)] px-4 py-3 min-w-0"
            >
              <div className="mikro truncate">{s.label}</div>
              <div
                className="text-[20px] font-bold mt-[3px] leading-tight angka truncate"
                style={s.warna ? { color: s.warna } : undefined}
              >
                {s.nilai}
              </div>
              {s.sub && (
                <div className="text-[10.5px] font-medium mt-0.5 text-[color:var(--color-redup)] truncate angka">
                  {s.sub}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (!lengket) return <div className="mb-4 sm:mb-6">{kartu}</div>;

  return (
    <div
      ref={akar}
      className="sticky top-0 z-20 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 bg-[color:var(--color-kertas)]"
    >
      {kartu}
    </div>
  );
}
