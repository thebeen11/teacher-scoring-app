"use client";

import { useState } from "react";
import { useKelas } from "@/lib/store";
import { komponenOf, totalBobot, type Bobot } from "@/lib/nilai";
import { n } from "@/lib/format";
import { InputAngka, InputBand } from "@/components/kendali";
import Halaman from "@/components/halaman";
import KepalaHalaman from "@/components/kepala-halaman";
import DialogTerapkan from "@/components/terapkan-pengaturan";

const BAGIAN = [
  { kunci: "formatif", label: "Formatif", kategori: "Nilai Akademis" },
  { kunci: "sumatif", label: "Sumatif", kategori: "Nilai Akademis" },
  { kunci: "tengah", label: "Asesmen Tengah Semester", kategori: "Nilai Akademis" },
  { kunci: "akhir", label: "Asesmen Akhir Semester", kategori: "Nilai Akademis" },
  { kunci: "kehadiran", label: "Kehadiran", kategori: "Nilai Tambahan" },
] as const satisfies readonly { kunci: keyof Bobot; label: string; kategori: string }[];

/** Jumlah baris berturut-turut berkategori sama, mulai dari indeks i. */
function rentangKategori(i: number): number {
  let j = i;
  while (j < BAGIAN.length && BAGIAN[j].kategori === BAGIAN[i].kategori) j++;
  return j - i;
}

/**
 * Skala & KKTP — satu papan untuk seluruh variabel yang membentuk nilai akhir:
 * band tujuan tiap kolom, band NA → raport, bobot formatif : sumatif : ASTS :
 * ASAS/ASAT (total 100%), dan KKTP — yang bisa disalin ke kelas lain. Setiap perubahan di sini langsung merambat ke layar entri,
 * Daftar Nilai, dan dasbor.
 */
export default function HalamanSkala() {
  const { kelas, setBand, setPengaturan } = useKelas();
  const [dialog, setDialog] = useState(false);

  const total = totalBobot(kelas.bobot);
  const pasBobot = total === 100;

  const sumberLabel = "min/maks kelas";

  const barisSkala = [
    ...komponenOf(kelas, "formatif").map((k) => ({
      id: k.id,
      tipe: `Formatif ${k.label}${k.nama ? ` · ${k.nama}` : ""}`,
      rumus: "(NA − min) × (NK maks − NK min) ÷ (maks − min) + NK min",
      sumber: sumberLabel,
      min: k.bandMin,
      max: k.bandMax,
      ubah: (mn: number, mx: number) => setBand(k.id, mn, mx),
    })),
    ...komponenOf(kelas, "lingkup").map((k) => ({
      id: k.id,
      tipe: `Lingkup ${k.label}${k.nama ? ` · ${k.nama}` : ""}`,
      rumus: "sama, rentang berbeda tiap lingkup",
      sumber: sumberLabel,
      min: k.bandMin,
      max: k.bandMax,
      ubah: (mn: number, mx: number) => setBand(k.id, mn, mx),
    })),
  ];

  return (
    <Halaman lebar="sempit">
      <KepalaHalaman
        judul={<>Skala &amp; KKTP</>}
        aksi={
          <button
            className="tombol whitespace-nowrap shadow-none hover:shadow-none hover:translate-y-0"
            onClick={() => setDialog(true)}
          >
            Terapkan ke kelas lain
          </button>
        }
      />

      {/* ------------------------------------------------- bobot / KKTP -- */}
      <div className="papan p-6">
        <div>
          <div className="mikro">BOBOT NILAI AKHIR</div>

          {/* Sudut membulat ada di pembungkus: tabel border-collapse tidak bisa
              diberi radius. `border-hidden` menyembunyikan tepi luar tabel
              supaya tidak dobel dengan garis pembungkus. */}
          <div className="mt-3 overflow-x-auto rounded-[var(--r-kartu)] border border-[color:var(--color-garis)] bg-[color:var(--color-papan)]">
            <table className="w-full border-collapse border-hidden text-[0.9375rem]">
              <thead>
                <tr className="bg-[color:var(--color-kepala)]">
                  <th className="border border-[color:var(--color-garis)] px-4 py-3 text-left w-px whitespace-nowrap mikro">
                    NO
                  </th>
                  <th className="border border-[color:var(--color-garis)] px-4 py-3 text-left w-px whitespace-nowrap mikro">
                    KATEGORI
                  </th>
                  <th className="border border-[color:var(--color-garis)] px-4 py-3 text-left mikro">
                    KOMPONEN NILAI
                  </th>
                  <th className="border border-[color:var(--color-garis)] px-4 py-3 text-right w-px whitespace-nowrap mikro">
                    BOBOT (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {BAGIAN.map((g, i) => (
                  <tr
                    key={g.kunci}
                    className="even:bg-[color:var(--color-belang)]"
                  >
                    <td className="border border-[color:var(--color-garis)] px-4 py-2.5 angka">
                      {i + 1}
                    </td>
                    {/* Kategori ditulis sekali per kelompok, membentang ke
                        baris-baris di bawahnya. */}
                    {(i === 0 || BAGIAN[i - 1].kategori !== g.kategori) && (
                      <td
                        rowSpan={rentangKategori(i)}
                        className="border border-[color:var(--color-garis)] px-4 py-2.5 align-top whitespace-nowrap font-semibold text-[color:var(--color-redup)] bg-[color:var(--color-papan)]"
                      >
                        {g.kategori}
                      </td>
                    )}
                    <td className="border border-[color:var(--color-garis)] px-4 py-2.5 font-semibold">
                      {g.label}
                    </td>
                    <td className="border border-[color:var(--color-garis)] px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <InputAngka
                          nilai={kelas.bobot[g.kunci]}
                          onUbah={(v) =>
                            setPengaturan({
                              bobot: {
                                [g.kunci]: Math.min(
                                  100,
                                  Math.max(0, Math.round(v)),
                                ),
                              },
                            })
                          }
                          max={100}
                          step={5}
                          className="sel-input-padat w-[4rem]"
                          aria-label={`Bobot ${g.label}`}
                        />
                        <span className="text-[0.875rem] font-semibold text-[color:var(--color-redup)]">
                          %
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr
                  style={{
                    background: pasBobot
                      ? "var(--color-lulus)"
                      : "var(--color-basuh)",
                    color: pasBobot
                      ? "var(--color-lulus-pekat)"
                      : "var(--color-bahaya)",
                  }}
                >
                  <th
                    colSpan={3}
                    className="border border-[color:var(--color-garis)] px-4 py-3 text-left mikro"
                    style={{ color: "inherit" }}
                  >
                    TOTAL
                    {!pasBobot &&
                      ` · ${total < 100 ? "KURANG" : "LEBIH"} ${Math.abs(100 - total)}%`}
                  </th>
                  <td
                    className="border border-[color:var(--color-garis)] px-4 py-3 text-right text-[1.0625rem] font-extrabold angka"
                    aria-live="polite"
                  >
                    {total}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-[color:var(--color-garis)]">
          <div className="mikro">KKTP</div>
          <InputAngka
            nilai={kelas.kktp}
            onUbah={(v) => setPengaturan({ kktp: v })}
            className="sel-input w-24 mt-2.5 px-3 py-2.5 text-[1.5rem] font-extrabold angka"
            aria-label="KKTP"
          />
        </div>
      </div>

      {dialog && <DialogTerapkan onTutup={() => setDialog(false)} />}
    </Halaman>
  );
}
