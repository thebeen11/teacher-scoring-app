"use client";

import { useState } from "react";
import { useKelas } from "@/lib/store";
import { type Asesmen, type ButirAsesmen } from "@/lib/nilai";
import { n } from "@/lib/format";
import { InputAngka, navigasiSel } from "@/components/kendali";
import { gayaKolom, KepalaBeku, Panah, SelBeku } from "@/components/tabel";
import Halaman from "@/components/halaman";

const LABEL: ("a" | "b" | "c")[] = ["a", "b", "c"];

/* Satu trek per bagian, lalu rantai hitung yang memakan sisa lebar, lalu dua
   kolom hasil. Bagian A/B/C dibuat sama lebar supaya tiga angka yang dibaca
   berdampingan tetap sejajar walau bobotnya berbeda digit. */
const LEBAR_BUTIR = "112px";
const gayaTabel = gayaKolom(
  LEBAR_BUTIR,
  LEBAR_BUTIR,
  LEBAR_BUTIR,
  "minmax(240px, 1fr)",
  "72px",
  "88px",
);

function bobotDari(a: Asesmen, k: "a" | "b" | "c") {
  return k === "a" ? a.bobotA : k === "b" ? a.bobotB : a.bobotC;
}

function rantai(butir: ButirAsesmen, a: Asesmen, total: number) {
  return (
    `(${butir.a}×${a.bobotA}) + (${butir.b}×${a.bobotB}) + ` +
    `${a.bobotC === 1 ? butir.c : `(${butir.c}×${a.bobotC})`} = ${n(total, 0)}` +
    `  →  (${n(a.konstanta, 0)} + ${n(total, 0)}) ÷ ${n(a.pembagi, 0)}`
  );
}

export default function HalamanAsesmen() {
  const { kelas, hasil, setButir } = useKelas();
  const [jenisAktif, setJenisAktif] = useState(kelas.asesmen[0]?.jenis);
  const [fokus, setFokus] = useState(0);

  const asesmen =
    kelas.asesmen.find((a) => a.jenis === jenisAktif) ?? kelas.asesmen[0];

  if (!asesmen) {
    return (
      <Halaman lebar="fokus">
        <div className="papan p-6">
          <div className="mikro">BELUM ADA ASESMEN</div>
          <p className="keterangan mt-2">
            Tambahkan ASTS atau ASAS di layar Kelola Kelas.
          </p>
        </div>
      </Halaman>
    );
  }

  const ubah = (siswaId: string, kunci: "a" | "b" | "c", v: number) => {
    const lama = kelas.skorAsesmen[siswaId]?.[asesmen.id] ?? {
      a: 0,
      b: 0,
      c: 0,
    };
    setButir(siswaId, asesmen.id, { ...lama, [kunci]: v });
  };

  return (
    <Halaman>
      <div className="flex flex-wrap items-end gap-4 mb-7">
        <div>
          <div className="judul">
            Asesmen <span className="teks-gradien">Sumatif</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3 max-w-full">
          {kelas.asesmen.length > 1 && (
            <div className="segmen max-w-full overflow-x-auto">
              {kelas.asesmen.map((a) => {
                const aktif = a.id === asesmen.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setJenisAktif(a.jenis)}
                    style={{
                      background: aktif ? "var(--color-aksen)" : "transparent",
                      color: aktif ? "#ffffff" : "var(--color-redup)",
                    }}
                  >
                    {a.jenis}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --------------------------------------------------- bilah rumus -- */}
      <div className="papan-neu flex flex-wrap items-center gap-y-2 px-5 sm:px-6 py-5 mb-7">
        <div className="mikro mr-3.5">RUMUS BUTIR</div>
        <div className="text-[12px] font-semibold angka">
          (A × {asesmen.bobotA}) + (B × {asesmen.bobotB}) + (C ×{" "}
          {asesmen.bobotC}) = SKOR
        </div>
        <div className="hidden md:block w-px h-[22px] bg-[color:var(--color-garis)] mx-4" />
        <div className="basis-full md:basis-auto text-[12px] font-semibold angka">
          NILAI = ({n(asesmen.konstanta, 0)} + SKOR) ÷ {n(asesmen.pembagi, 0)}
        </div>
        <div className="hidden md:block ml-auto text-[11px] font-medium text-[color:var(--color-redup)]">
          Tab / ↓ pindah sel · baris aktif tersorot
        </div>
      </div>

      <div className="tabel-padat min-w-fit" style={gayaTabel}>
        <div className="kepala-padat">
          <KepalaBeku duaBaris />
          <div
            className="px-2 py-1.5 min-w-0 mikro sekat-padat"
            style={{ gridColumn: "3 / span 3", gridRow: 1 }}
          >
            BAGIAN
          </div>
          {/* Bobot tiap bagian naik ke kepala kolom: di baris setinggi 28px
              ia tidak muat lagi di dalam sel, dan di sana ia memang diulang
              sekali per siswa padahal nilainya sama sekelas. */}
          {LABEL.map((k, i) => (
            <div
              key={k}
              className={`px-2 pb-1 mikro text-[9px] tracking-[0.06em] ${
                i === 2 ? "sekat-padat" : "sekat-sub"
              }`}
              style={{ gridColumn: 3 + i, gridRow: 2 }}
            >
              {k.toUpperCase()} ×{bobotDari(asesmen, k)}
            </div>
          ))}
          <div
            className="sel-padat mikro sekat-padat"
            style={{ gridColumn: 6, gridRow: "1 / 3" }}
          >
            RANTAI HITUNG
          </div>
          <div
            className="sel-padat mikro justify-end sekat-padat"
            style={{ gridColumn: 7, gridRow: "1 / 3" }}
          >
            SKOR
          </div>
          <div
            className="sel-padat mikro justify-end"
            style={{ gridColumn: 8, gridRow: "1 / 3" }}
          >
            NILAI
          </div>
        </div>

        <div>
          {hasil.baris.map((baris, i) => {
            const h = baris.asesmen.find((x) => x.asesmen.id === asesmen.id);
            if (!h) return null;
            return (
              <div
                key={baris.siswa.id}
                className="baris-padat"
                style={
                  fokus === i
                    ? { background: "var(--color-sorot)" }
                    : undefined
                }
              >
                <SelBeku
                  no={baris.siswa.noUrut}
                  nama={baris.siswa.nama}
                  onKlik={() => setFokus(i)}
                />

                {LABEL.map((k, j) => (
                  <div
                    key={k}
                    className={`sel-padat ${j === 2 ? "sekat-padat" : "sekat-sub"}`}
                  >
                    <InputAngka
                      data-sel="1"
                      nilai={h.butir[k]}
                      onUbah={(v) => ubah(baris.siswa.id, k, v)}
                      onFocus={() => setFokus(i)}
                      onKeyDown={(e) => navigasiSel(e, 3)}
                      className="sel-input-padat max-w-[48px]"
                      aria-label={`Bagian ${k.toUpperCase()} ${baris.siswa.nama}`}
                    />
                    <Panah />
                    <span className="text-[12.5px] font-bold angka">
                      {h.butir[k] * bobotDari(asesmen, k)}
                    </span>
                  </div>
                ))}

                <div className="sel-padat sekat-padat text-[11px] font-medium text-[color:var(--color-redup)] angka">
                  <span className="truncate">
                    {rantai(h.butir, asesmen, h.total)}
                  </span>
                </div>
                <div className="sel-padat sekat-padat justify-end text-[12.5px] font-semibold angka">
                  {n(h.total, 0)}
                </div>
                <div
                  className="sel-padat justify-end text-[13px] font-extrabold angka"
                  style={{
                    color:
                      h.nilai >= 70
                        ? "var(--color-tinta)"
                        : "var(--color-bahaya)",
                  }}
                >
                  {n(h.nilai)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Halaman>
  );
}
