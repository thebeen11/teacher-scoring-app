"use client";

import { useState } from "react";
import Pilihan from "@/components/pilihan";

const inputKelas = "isian w-full";

/**
 * Isian identitas kelas — mata pelajaran, nama, tahun ajaran, semester —
 * dipakai bersama oleh form Kelas Baru dan dialog Ubah Kelas. Nama field
 * (`mapel_id` / `mapel_baru` / `nama` / `tahun_ajaran` / `semester`) dibaca
 * apa adanya oleh buatKelas dan ubahKelas.
 */
export default function IsianKelas({
  mapel,
  awal,
  onSemester,
}: {
  mapel: { id: string; nama: string }[];
  awal?: { mapelId?: string; nama?: string; tahunAjaran?: string; semester?: number };
  onSemester?: (semester: number) => void;
}) {
  const [pakaiBaru, setPakaiBaru] = useState(mapel.length === 0);

  return (
    <>
      <div>
        <div className="mikro mb-2">MATA PELAJARAN</div>
        {mapel.length > 0 && (
          <div className="segmen mb-3 w-fit">
            <button
              type="button"
              onClick={() => setPakaiBaru(false)}
              style={{
                background: pakaiBaru ? "transparent" : "var(--color-aksen)",
                color: pakaiBaru ? "var(--color-redup)" : "#ffffff",
              }}
            >
              Yang sudah ada
            </button>
            <button
              type="button"
              onClick={() => setPakaiBaru(true)}
              style={{
                background: pakaiBaru ? "var(--color-aksen)" : "transparent",
                color: pakaiBaru ? "#ffffff" : "var(--color-redup)",
              }}
            >
              Baru
            </button>
          </div>
        )}

        {pakaiBaru ? (
          <input
            name="mapel_baru"
            placeholder="Ilmu Pengetahuan Alam (IPA)"
            className={inputKelas}
            required
          />
        ) : (
          <Pilihan
            name="mapel_id"
            className={inputKelas}
            required
            aria-label="Mata pelajaran"
            defaultValue={awal?.mapelId ?? mapel[0]?.id}
            opsi={mapel.map((m) => ({ nilai: m.id, label: m.nama }))}
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="mikro">NAMA KELAS</span>
          <input
            name="nama"
            placeholder="VIII A"
            defaultValue={awal?.nama}
            className={inputKelas}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="mikro">TAHUN AJARAN</span>
          <input
            name="tahun_ajaran"
            defaultValue={awal?.tahunAjaran ?? "2025/2026"}
            className={inputKelas}
          />
        </label>
        <div className="flex flex-col gap-1.5">
          <span id="label-semester" className="mikro">
            SEMESTER
          </span>
          <Pilihan
            name="semester"
            defaultValue={String(awal?.semester ?? 1)}
            onUbah={(v) => onSemester?.(Number(v))}
            className={inputKelas}
            aria-labelledby="label-semester"
            opsi={[
              { nilai: "1", label: "1" },
              { nilai: "2", label: "2" },
            ]}
          />
        </div>
      </div>
    </>
  );
}
