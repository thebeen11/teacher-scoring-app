"use client";

import { useState } from "react";
import { useKelas } from "@/lib/store";
import { BONUS_MAKS, bonusKeaktifan, tambahanMentah } from "@/lib/nilai";
import { n } from "@/lib/format";
import { InputAngka, navigasiSel } from "@/components/kendali";
import { gayaKolom, KepalaBeku, SelBeku } from "@/components/tabel";
import Halaman from "@/components/halaman";
import KepalaHalaman from "@/components/kepala-halaman";

const gayaTabel = gayaKolom("auto", "auto");

const TOMBOL_LANGKAH =
  "tombol-neu w-7 h-7 p-0 text-[1rem] leading-none flex-none disabled:opacity-40 disabled:cursor-not-allowed";

/**
 * Nilai Keaktifan: akumulasi skor per siswa tanpa log aktivitas. Tombol −/+
 * untuk menambah atau mengoreksi satu poin di tengah pelajaran.
 */
export default function HalamanKeaktifan() {
  const { kelas, setTambahan } = useKelas();
  const [fokus, setFokus] = useState(0);

  const siswa = kelas.siswa.slice().sort((a, b) => a.noUrut - b.noUrut);

  const ubah = (siswaId: string, skor: number) => {
    setTambahan(siswaId, {
      ...tambahanMentah(kelas, siswaId),
      keaktifan: Math.max(0, skor),
    });
  };

  return (
    <Halaman>
      <KepalaHalaman judul="Nilai Keaktifan" />

      <div className="tabel-padat min-w-min" style={gayaTabel}>
        <div className="kepala-padat">
          <KepalaBeku />
          <div className="sel-padat mikro justify-center sekat-padat" style={{ gridColumn: 3 }}>
            SKOR
          </div>
          <div
            className="sel-padat mikro justify-end"
            style={{ gridColumn: 4 }}
            title={`Bonus = skor × 0,5, maksimal ${BONUS_MAKS}; di luar bobot nilai akademis`}
          >
            BONUS
          </div>
        </div>

        <div className="grup-padat">
          {siswa.map((s, i) => {
            const skor = tambahanMentah(kelas, s.id).keaktifan;
            const bonus = bonusKeaktifan(skor);
            return (
              <div
                key={s.id}
                className="baris-padat"
                style={fokus === i ? { background: "var(--color-sorot)" } : undefined}
              >
                <SelBeku no={s.noUrut} nama={s.nama} onKlik={() => setFokus(i)} />

                <div className="sel-padat sekat-padat gap-1.5">
                  <button
                    type="button"
                    className={TOMBOL_LANGKAH}
                    onClick={() => {
                      setFokus(i);
                      ubah(s.id, skor - 1);
                    }}
                    disabled={skor <= 0}
                    aria-label={`Kurangi skor ${s.nama}`}
                  >
                    −
                  </button>
                  <InputAngka
                    data-sel="1"
                    nilai={skor}
                    onUbah={(v) => ubah(s.id, v)}
                    onFocus={() => setFokus(i)}
                    onKeyDown={(e) => navigasiSel(e, 1)}
                    className="sel-input-padat w-[3.5rem]"
                    aria-label={`Skor keaktifan ${s.nama}`}
                  />
                  <button
                    type="button"
                    className={TOMBOL_LANGKAH}
                    onClick={() => {
                      setFokus(i);
                      ubah(s.id, skor + 1);
                    }}
                    aria-label={`Tambah skor ${s.nama}`}
                  >
                    +
                  </button>
                </div>

                <div className="sel-padat justify-end gap-2 text-[1rem] font-extrabold angka">
                  {bonus >= BONUS_MAKS && (
                    <span className="mikro text-[0.6875rem] text-[color:var(--color-redup)]">
                      MAKS
                    </span>
                  )}
                  {n(bonus)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Halaman>
  );
}
