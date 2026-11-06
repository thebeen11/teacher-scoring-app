"use client";

import { useState } from "react";
import Link from "next/link";
import { useKelas } from "@/lib/store";
import type { RingkasanKelas } from "@/lib/data";
import Dialog from "@/components/dialog";
import Pilihan from "@/components/pilihan";

type Status = "aktif" | "nonaktif" | "semua";

/**
 * Dialog "Ganti kelas" di dasbor: seluruh kelas milik guru, bisa disaring
 * per mapel dan status (aktif / nonaktif). Memilih kelas membuka dasbornya.
 */
export default function DialogGantiKelas({ onTutup }: { onTutup: () => void }) {
  const { kelas, semuaKelas } = useKelas();
  const [mapel, setMapel] = useState("semua");
  const [status, setStatus] = useState<Status>("aktif");

  const daftarMapel = [...new Set(semuaKelas.map((k) => k.mapel))].sort(
    (a, b) => a.localeCompare(b, "id"),
  );

  const tersaring = semuaKelas.filter(
    (k) =>
      (mapel === "semua" || k.mapel === mapel) &&
      (status === "semua" || (status === "aktif" ? k.aktif : !k.aktif)),
  );

  // Kelompokkan per mapel + semester + tahun, sama seperti navigasi kelas.
  const kelompok = new Map<string, RingkasanKelas[]>();
  for (const k of tersaring) {
    const kunci = `${k.mapel} · SMT ${k.semester} · ${k.tahunAjaran}`;
    kelompok.set(kunci, [...(kelompok.get(kunci) ?? []), k]);
  }

  return (
    <Dialog judul="Ganti kelas" onTutup={onTutup} lebar="max-w-[30rem]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div id="label-saring-mapel" className="mikro mb-1.5">
            MAPEL
          </div>
          <Pilihan
            value={mapel}
            onUbah={setMapel}
            className="isian w-full"
            aria-labelledby="label-saring-mapel"
            opsi={[
              { nilai: "semua", label: "Semua mapel" },
              ...daftarMapel.map((m) => ({ nilai: m, label: m })),
            ]}
          />
        </div>
        <div>
          <div id="label-saring-status" className="mikro mb-1.5">
            STATUS
          </div>
          <Pilihan
            value={status}
            onUbah={(v) => setStatus(v as Status)}
            className="isian w-full"
            aria-labelledby="label-saring-status"
            opsi={[
              { nilai: "aktif", label: "Aktif" },
              { nilai: "nonaktif", label: "Nonaktif" },
              { nilai: "semua", label: "Semua status" },
            ]}
          />
        </div>
      </div>

      <div className="mt-4 max-h-[min(60dvh,26rem)] overflow-auto -mx-2 px-2">
        {kelompok.size === 0 ? (
          <p className="keterangan py-2">Tidak ada kelas yang cocok.</p>
        ) : (
          [...kelompok].map(([judul, daftar]) => (
            <div key={judul} className="pb-2">
              <div className="px-3 pt-2 pb-1 text-[0.5938rem] font-bold tracking-[0.1em] text-[color:var(--color-samar)] truncate">
                {judul.toUpperCase()}
              </div>
              {daftar.map((k) => {
                const aktif = k.id === kelas.id;
                return (
                  <Link
                    key={k.id}
                    href={`/kelas/${k.id}/dasbor`}
                    onClick={onTutup}
                    aria-current={aktif ? "true" : undefined}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--r-kecil)] text-[0.8125rem] font-semibold no-underline transition-colors hover:bg-[color:var(--color-sorot)]"
                    style={{
                      background: aktif ? "var(--color-aksen)" : undefined,
                      color: aktif ? "#ffffff" : "var(--color-tinta)",
                    }}
                  >
                    <span className="flex-1 min-w-0 truncate">{k.nama}</span>
                    {!k.aktif && (
                      <span
                        className="mikro"
                        style={{
                          color: aktif ? "rgba(255,255,255,0.8)" : undefined,
                        }}
                      >
                        NONAKTIF
                      </span>
                    )}
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
          ))
        )}
      </div>
    </Dialog>
  );
}
