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
  { kunci: "formatif", label: "Formatif" },
  { kunci: "sumatif", label: "Sumatif" },
  { kunci: "tengah", label: "Asesmen Tengah Semester" },
  { kunci: "akhir", label: "Asesmen Akhir Semester" },
] as const satisfies readonly { kunci: keyof Bobot; label: string }[];

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
        judul={
          <>
            Skala &amp; KKTP
          </>
        }
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
            <table className="w-full border-collapse border-hidden text-[13px]">
              <thead>
                <tr className="bg-[color:var(--color-kepala)]">
                  <th className="border border-[color:var(--color-garis)] px-3 py-2 text-left w-px whitespace-nowrap mikro">
                    NO
                  </th>
                  <th className="border border-[color:var(--color-garis)] px-3 py-2 text-left mikro">
                    KOMPONEN NILAI
                  </th>
                  <th className="border border-[color:var(--color-garis)] px-3 py-2 text-right w-px whitespace-nowrap mikro">
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
                    <td className="border border-[color:var(--color-garis)] px-3 py-1.5 angka">
                      {i + 1}
                    </td>
                    <td className="border border-[color:var(--color-garis)] px-3 py-1.5 font-semibold">
                      {g.label}
                    </td>
                    <td className="border border-[color:var(--color-garis)] px-3 py-1.5">
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
                          className="sel-input-padat w-[64px]"
                          aria-label={`Bobot ${g.label}`}
                        />
                        <span className="text-[12px] font-semibold text-[color:var(--color-redup)]">
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
                      ? "var(--color-sorot)"
                      : "var(--color-basuh)",
                    color: pasBobot
                      ? "var(--color-aksen-gelap)"
                      : "var(--color-bahaya)",
                  }}
                >
                  <th
                    colSpan={2}
                    className="border border-[color:var(--color-garis)] px-3 py-2 text-left mikro"
                    style={{ color: "inherit" }}
                  >
                    TOTAL
                    {!pasBobot &&
                      ` · ${total < 100 ? "KURANG" : "LEBIH"} ${Math.abs(100 - total)}%`}
                  </th>
                  <td
                    className="border border-[color:var(--color-garis)] px-3 py-2 text-right text-[15px] font-extrabold angka"
                    aria-live="polite"
                  >
                    {total}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p
            className="keterangan mt-3 text-[11px]"
            style={pasBobot ? undefined : { color: "var(--color-bahaya)" }}
          >
            {pasBobot
              ? "NA = rerata tiap bagian dikali bobotnya. Bagian yang belum ada di kelas ini (mis. tanpa ASTS) tidak ikut, bobot sisanya dibagi ulang."
              : "Total bobot harus 100%. Sampai genap, NA dihitung dengan membagi jumlah bobot yang ada."}
          </p>
        </div>

        <div className="mt-5 pt-5 border-t border-[color:var(--color-garis)]">
          <div className="mikro">KKTP</div>
          <InputAngka
            nilai={kelas.kktp}
            onUbah={(v) => setPengaturan({ kktp: v })}
            className="sel-input w-24 mt-2.5 px-3 py-2.5 text-[24px] font-extrabold angka"
            aria-label="KKTP"
          />
          <p className="keterangan mt-2.5 text-[11px]">
            Batas ketuntasan. Nilai di bawahnya ditandai merah di Daftar Nilai
            dan muncul di dasbor.
          </p>
        </div>
      </div>

      {dialog && <DialogTerapkan onTutup={() => setDialog(false)} />}
    </Halaman>
  );
}
