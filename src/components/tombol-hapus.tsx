"use client";

import { useState, useTransition } from "react";
import Dialog, { KELAS_TOMBOL_BAHAYA } from "./dialog";

/** Ikon trash-2 dari set Lucide (lisensi ISC), digambar inline. */
export function IkonSampah({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

/**
 * Tombol hapus yang meminta konfirmasi lebih dulu. Aksi server baru dijalankan
 * setelah pengguna menekan "Hapus" di dialog.
 *
 * Tombolnya `type="button"`: ia bisa berada di dalam <form> swasimpan dan
 * tidak boleh ikut mengirim form itu.
 */
export default function TombolHapus({
  aksi,
  judul,
  pesan,
  label = "Hapus",
  className = "",
  style,
}: {
  aksi: () => Promise<unknown>;
  judul: string;
  pesan: React.ReactNode;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [buka, setBuka] = useState(false);
  const [sibuk, mulai] = useTransition();

  const hapus = () =>
    mulai(async () => {
      await aksi();
      setBuka(false);
    });

  return (
    <>
      <button
        type="button"
        onClick={() => setBuka(true)}
        className={`inline-flex items-center gap-1.5 ${className}`}
        style={style}
      >
        <IkonSampah className="w-3.5 h-3.5 flex-none" />
        {label}
      </button>

      {buka && (
        <Dialog
          nada="bahaya"
          ikon={<IkonSampah className="w-4 h-4" />}
          judul={judul}
          keterangan={pesan}
          sibuk={sibuk}
          onTutup={() => setBuka(false)}
          kaki={
            <>
              <button
                type="button"
                className="tombol-garis"
                onClick={() => setBuka(false)}
                disabled={sibuk}
                autoFocus
              >
                Batal
              </button>
              <button
                type="button"
                className={KELAS_TOMBOL_BAHAYA}
                style={{ background: "var(--color-bahaya)" }}
                onClick={hapus}
                disabled={sibuk}
              >
                <IkonSampah className="w-3.5 h-3.5" />
                {sibuk ? "Menghapus…" : "Hapus"}
              </button>
            </>
          }
        />
      )}
    </>
  );
}
