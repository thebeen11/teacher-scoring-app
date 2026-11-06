"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

/**
 * Cangkang dialog modal bersama: latar redup, kartu di tengah, Escape dan klik
 * latar untuk menutup (kecuali sedang `sibuk`).
 *
 * Digambar lewat portal ke <body>, jadi aman dipanggil dari dalam sel tabel
 * lengket atau dari dalam <form> — tombol di dalamnya tidak ikut mengirim form
 * induknya secara DOM. (Event React tetap menggelembung lewat portal; tombol
 * di sini selalu `type="button"`.)
 */
export default function Dialog({
  judul,
  keterangan,
  ikon,
  nada = "biasa",
  onTutup,
  sibuk = false,
  kaki,
  children,
  lebar = "max-w-[25rem]",
}: {
  judul: React.ReactNode;
  keterangan?: React.ReactNode;
  ikon?: React.ReactNode;
  /** `bahaya` memberi lingkaran ikon merah muda dan peran alertdialog. */
  nada?: "biasa" | "bahaya";
  onTutup: () => void;
  sibuk?: boolean;
  /** Baris tombol di kaki dialog, rata kanan. */
  kaki?: React.ReactNode;
  children?: React.ReactNode;
  lebar?: string;
}) {
  const idJudul = useId();
  const idKet = useId();

  useEffect(() => {
    const kunci = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sibuk) onTutup();
    };
    window.addEventListener("keydown", kunci);
    return () => window.removeEventListener("keydown", kunci);
  }, [onTutup, sibuk]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 tanpa-cetak"
      role={nada === "bahaya" ? "alertdialog" : "dialog"}
      aria-modal="true"
      aria-labelledby={idJudul}
      aria-describedby={keterangan ? idKet : undefined}
    >
      <button
        type="button"
        aria-label="Tutup"
        tabIndex={-1}
        onClick={() => !sibuk && onTutup()}
        className="absolute inset-0 w-full h-full border-0 bg-[rgba(23,59,85,0.35)] cursor-pointer"
      />
      <div
        className={`relative w-full ${lebar} max-h-[calc(100dvh-32px)] overflow-auto papan p-6`}
      >
        <div className="flex items-center gap-3">
          {ikon && (
            <span
              className="flex-none grid place-items-center w-9 h-9 rounded-full"
              style={{
                background:
                  nada === "bahaya"
                    ? "var(--color-basuh)"
                    : "var(--color-sorot)",
                color:
                  nada === "bahaya"
                    ? "var(--color-bahaya)"
                    : "var(--color-aksen-gelap)",
              }}
            >
              {ikon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div id={idJudul} className="judul text-[1.125rem]">
              {judul}
            </div>
          </div>
        </div>
        {children && <div className="mt-4">{children}</div>}
        {kaki && <div className="flex justify-end gap-3 mt-6">{kaki}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Tombol merah untuk kaki dialog berbahaya. */
export const KELAS_TOMBOL_BAHAYA =
  "tombol inline-flex items-center gap-1.5 shadow-none hover:shadow-none hover:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed";
