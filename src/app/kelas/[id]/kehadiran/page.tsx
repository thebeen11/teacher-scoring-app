"use client";

import { useState } from "react";
import { useKelas } from "@/lib/store";
import { hitungKehadiran, tambahanMentah, type Tambahan } from "@/lib/nilai";
import { n, nAuto } from "@/lib/format";
import { InputAngka, navigasiSel } from "@/components/kendali";
import { gayaKolom, KepalaBeku, SelBeku } from "@/components/tabel";
import Halaman from "@/components/halaman";
import KepalaHalaman from "@/components/kepala-halaman";

/* H, S, I diketik; A, SKOR, % HADIR dihitung. */
const gayaTabel = gayaKolom("auto", "auto", "auto", "auto", "auto", "auto");

const ISIAN: {
  kunci: "hadir" | "sakit" | "izin";
  kode: string;
  nama: string;
}[] = [
  { kunci: "hadir", kode: "H", nama: "Hadir" },
  { kunci: "sakit", kode: "S", nama: "Sakit" },
  { kunci: "izin", kode: "I", nama: "Izin" },
];

/**
 * Nilai Kehadiran. Total pertemuan (T) diisi sekali per kelas; guru mengetik
 * jumlah Hadir/Sakit/Izin tiap siswa, dan Alpa adalah sisanya.
 */
export default function HalamanKehadiran() {
  const { kelas, setTambahan, setPengaturan } = useKelas();
  const [fokus, setFokus] = useState(0);

  const T = kelas.totalPertemuan;
  const siswa = kelas.siswa.slice().sort((a, b) => a.noUrut - b.noUrut);

  const ubah = (siswaId: string, kunci: keyof Tambahan, v: number) => {
    setTambahan(siswaId, { ...tambahanMentah(kelas, siswaId), [kunci]: v });
  };

  return (
    <Halaman>
      <KepalaHalaman
        judul="Nilai Kehadiran"
        aksi={
          <label className="flex items-center gap-2">
            <span className="mikro">TOTAL PERTEMUAN</span>
            <InputAngka
              nilai={T}
              onUbah={(v) => setPengaturan({ totalPertemuan: Math.floor(v) })}
              className="band-input band-input-besar"
              aria-label="Total pertemuan"
            />
          </label>
        }
      />

      <div className="tabel-padat min-w-min" style={gayaTabel}>
        <div className="kepala-padat">
          <KepalaBeku />
          {ISIAN.map((x, i) => (
            <div
              key={x.kunci}
              className={`sel-padat mikro justify-center ${i === 2 ? "sekat-padat" : "sekat-sub"}`}
              style={{ gridColumn: 3 + i }}
              title={x.nama}
            >
              {x.nama.toUpperCase()}
            </div>
          ))}
          <div
            className="sel-padat mikro justify-end sekat-padat"
            style={{ gridColumn: 6 }}
            title="Alpa = total pertemuan − H − S − I"
          >
            ALPA
          </div>
          <div
            className="sel-padat mikro justify-end sekat-sub"
            style={{ gridColumn: 7 }}
            title="Skor berbobot: (H + 0,5·S + 0,5·I) ÷ total pertemuan × 100"
          >
            SKOR
          </div>
          <div
            className="sel-padat mikro justify-end"
            style={{ gridColumn: 8 }}
            title="Persentase hadir sebenarnya: H ÷ total pertemuan × 100"
          >
            % HADIR
          </div>
        </div>

        <div className="grup-padat">
          {siswa.map((s, i) => {
            const t = tambahanMentah(kelas, s.id);
            const h = hitungKehadiran(t, T);
            const lebih = T > 0 && h.alpa < 0;
            return (
              <div
                key={s.id}
                className="baris-padat"
                style={
                  fokus === i ? { background: "var(--color-sorot)" } : undefined
                }
                title={
                  lebih
                    ? `H + S + I melebihi total pertemuan (${nAuto(T)})`
                    : undefined
                }
              >
                <SelBeku
                  no={s.noUrut}
                  nama={s.nama}
                  onKlik={() => setFokus(i)}
                />

                {ISIAN.map((x, j) => (
                  <div
                    key={x.kunci}
                    className={`sel-padat ${j === 2 ? "sekat-padat" : "sekat-sub"}`}
                  >
                    <InputAngka
                      data-sel="1"
                      nilai={t[x.kunci]}
                      onUbah={(v) => ubah(s.id, x.kunci, v)}
                      onFocus={() => setFokus(i)}
                      onKeyDown={(e) => navigasiSel(e, 3)}
                      className="sel-input-padat w-[3.5rem]"
                      aria-label={`${x.nama} ${s.nama}`}
                    />
                  </div>
                ))}

                <div
                  className="sel-padat sekat-padat justify-end text-[0.9375rem] font-semibold angka"
                  style={{
                    color: lebih ? "var(--color-bahaya)" : "var(--color-redup)",
                  }}
                >
                  {T > 0 ? nAuto(h.alpa) : "—"}
                </div>
                <div className="sel-padat sekat-sub justify-end text-[1rem] font-extrabold angka">
                  {h.nilai === null ? "—" : n(h.nilai)}
                </div>
                <div className="sel-padat justify-end text-[0.9375rem] font-medium angka text-[color:var(--color-redup)]">
                  {h.persenHadir === null ? "—" : `${n(h.persenHadir)}%`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Halaman>
  );
}
