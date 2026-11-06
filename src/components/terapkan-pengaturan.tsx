"use client";

import { useEffect, useState, useTransition } from "react";
import { useKelas } from "@/lib/store";
import { terapkanPengaturan } from "@/app/kelas/actions";
import type { RingkasanKelas } from "@/lib/data";

/**
 * Dialog "Terapkan ke kelas lain": menyalin KKTP + bobot kelas aktif ke kelas
 * lain milik guru, lintas mapel dan semester. Band per kolom tidak ikut,
 * karena kolom tiap kelas berbeda.
 */
export default function DialogTerapkan({ onTutup }: { onTutup: () => void }) {
  const { kelas, semuaKelas, salinPengaturan } = useKelas();
  const [pilihan, setPilihan] = useState<Set<string>>(new Set());
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, mulai] = useTransition();

  const lain = semuaKelas.filter((k) => k.id !== kelas.id);

  // Kelompokkan per mapel + semester + tahun, sama seperti navigasi kelas.
  const kelompok = new Map<string, RingkasanKelas[]>();
  for (const k of lain) {
    const kunci = `${k.mapel} · SMT ${k.semester} · ${k.tahunAjaran}`;
    kelompok.set(kunci, [...(kelompok.get(kunci) ?? []), k]);
  }

  useEffect(() => {
    const kunci = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sibuk) onTutup();
    };
    window.addEventListener("keydown", kunci);
    return () => window.removeEventListener("keydown", kunci);
  }, [onTutup, sibuk]);

  const ubah = (id: string) =>
    setPilihan((lama) => {
      const baru = new Set(lama);
      if (baru.has(id)) baru.delete(id);
      else baru.add(id);
      return baru;
    });

  const semua = lain.length > 0 && pilihan.size === lain.length;
  const pilihSemua = () =>
    setPilihan(semua ? new Set() : new Set(lain.map((k) => k.id)));

  const terapkan = () => {
    setGalat(null);
    const ids = [...pilihan];
    mulai(async () => {
      const hasil = await terapkanPengaturan(ids, {
        kktp: kelas.kktp,
        bobot: kelas.bobot,
      });
      if (hasil?.galat) {
        setGalat(hasil.galat);
        return;
      }
      salinPengaturan(ids);
      onTutup();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 tanpa-cetak"
      role="dialog"
      aria-modal="true"
      aria-labelledby="judul-terapkan"
    >
      <button
        aria-label="Tutup"
        onClick={() => !sibuk && onTutup()}
        className="absolute inset-0 w-full h-full border-0 bg-[rgba(45,55,72,0.35)] cursor-pointer"
      />
      <div className="relative w-full max-w-[440px] max-h-[calc(100dvh-32px)] flex flex-col papan p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div id="judul-terapkan" className="judul text-[18px]">
            Terapkan ke kelas lain
          </div>
          <p className="keterangan mt-1.5 text-[11px]">
            Salin KKTP {kelas.kktp} dan bobot {kelas.bobot.formatif} :{" "}
            {kelas.bobot.sumatif} : {kelas.bobot.tengah} : {kelas.bobot.akhir}{" "}
            dari kelas {kelas.nama} ke kelas yang dipilih.
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-auto px-6 border-y border-[color:var(--color-garis)]">
          {lain.length === 0 ? (
            <p className="keterangan py-5">Belum ada kelas lain.</p>
          ) : (
            <>
              <label className="flex items-center gap-3 py-3 border-b border-[color:var(--color-garis)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={semua}
                  onChange={pilihSemua}
                  className="w-4 h-4 accent-[color:var(--color-aksen)]"
                />
                <span className="text-[13px] font-semibold">Pilih semua</span>
              </label>
              {[...kelompok].map(([judul, daftar]) => (
                <div key={judul} className="py-3">
                  <div className="mikro mb-1.5">{judul.toUpperCase()}</div>
                  {daftar.map((k) => (
                    <label
                      key={k.id}
                      className="flex items-center gap-3 py-1.5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={pilihan.has(k.id)}
                        onChange={() => ubah(k.id)}
                        className="w-4 h-4 accent-[color:var(--color-aksen)]"
                      />
                      <span className="text-[13px] font-semibold flex-1 min-w-0 truncate">
                        {k.nama}
                      </span>
                      <span className="text-[11px] text-[color:var(--color-redup)] angka">
                        {k.jumlahSiswa} siswa
                      </span>
                    </label>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="px-6 py-4">
          {galat && (
            <p
              className="keterangan mb-3 text-[11px]"
              style={{ color: "var(--color-bahaya)" }}
              role="alert"
            >
              {galat}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button className="tombol-garis" onClick={onTutup} disabled={sibuk}>
              Batal
            </button>
            <button
              className="tombol shadow-none hover:shadow-none hover:translate-y-0"
              onClick={terapkan}
              disabled={pilihan.size === 0 || sibuk}
            >
              {sibuk ? "Menerapkan…" : `Terapkan (${pilihan.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
