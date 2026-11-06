"use client";

import { useState } from "react";
import { useKelas } from "@/lib/store";
import { type Asesmen, type ButirAsesmen, type ModeAsesmen } from "@/lib/nilai";
import { n, nAuto } from "@/lib/format";
import { InputAngka, InputBand, navigasiSel } from "@/components/kendali";
import { gayaKolom, KepalaBeku, Panah, SelBeku } from "@/components/tabel";
import Halaman from "@/components/halaman";
import TombolUnduh from "@/components/tombol-unduh";
import KepalaHalaman from "@/components/kepala-halaman";
import { asesmenSlot, type SlotAsesmen } from "@/lib/ekspor";

const LABEL: ("a" | "b" | "c")[] = ["a", "b", "c"];

const NAMA_BAGIAN = {
  a: "Pilihan ganda",
  b: "Menjodohkan",
  c: "Uraian",
} as const;

/* Satu trek per bagian, lalu dua kolom hasil; semuanya selebar isinya —
   sisa lebar jatuh ke NAMA (maks. separuh tabel). */
const gayaTabel = gayaKolom("auto", "auto", "auto", "auto", "auto");

/* Mode langsung: SKOR diketik, NILAI dihitung. */
const gayaTabelLangsung = gayaKolom("auto", "auto");

const PILIHAN_MODE: { mode: ModeAsesmen; label: string }[] = [
  { mode: "bagian", label: "Per bagian" },
  { mode: "langsung", label: "Nilai langsung" },
];

const BUTIR_KOSONG: ButirAsesmen = { a: 0, b: 0, c: 0, skor: 0 };

function bobotDari(a: Asesmen, k: "a" | "b" | "c") {
  return k === "a" ? a.bobotA : k === "b" ? a.bobotB : a.bobotC;
}

const JUDUL: Record<SlotAsesmen, string> = {
  tengah: "Tengah Semester",
  akhir: "Akhir Semester",
};

/**
 * Entri butir A/B/C untuk satu asesmen. Slot "tengah" memegang ASTS; slot
 * "akhir" memegang ASAS (semester 1) atau ASAT (semester 2).
 */
export default function EntriAsesmen({ slot }: { slot: SlotAsesmen }) {
  const { kelas, hasil, setButir, setModeAsesmen, setBandAsesmen } = useKelas();
  const [fokus, setFokus] = useState(0);

  const asesmen = asesmenSlot(kelas, slot);

  if (!asesmen) {
    return (
      <Halaman lebar="fokus">
        <KepalaHalaman
          judul={
            <>
              Asesmen {JUDUL[slot]}
            </>
          }
          aksi={<TombolUnduh jenis={slot} />}
        />
        <div className="papan p-6">
          <div className="mikro">
            BELUM ADA ASESMEN {JUDUL[slot].toUpperCase()}
          </div>
          <p className="keterangan mt-2">
            Tambahkan {slot === "tengah" ? "ASTS" : "ASAS/ASAT"} di layar Kelola
            Kelas.
          </p>
        </div>
      </Halaman>
    );
  }

  const ubah = (siswaId: string, kunci: keyof ButirAsesmen, v: number) => {
    const lama = {
      ...BUTIR_KOSONG,
      ...kelas.skorAsesmen[siswaId]?.[asesmen.id],
    };
    setButir(siswaId, asesmen.id, { ...lama, [kunci]: v });
  };

  const langsung = asesmen.mode === "langsung";
  const bd = hasil.bounds[asesmen.id] ?? [0, 0];

  /* Kepala kolom NILAI: SKOR direscale dari min/maks sekelas ke rentang yang
     diatur guru — tata letaknya sama dengan kepala kolom Formatif/Sumatif. */
  const kepalaNilai = (
    <>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[0.7812rem] font-semibold text-[color:var(--color-redup)]">
          NILAI
        </span>
        <span className="ml-auto flex-none whitespace-nowrap text-[0.6562rem] font-medium text-[color:var(--color-redup)] angka">
          maks {nAuto(bd[1])} · min {nAuto(bd[0])}
        </span>
      </div>
      <div className="mt-1">
        <InputBand
          label="RENTANG"
          padat
          min={asesmen.bandMin}
          max={asesmen.bandMax}
          onUbah={(mn, mx) => setBandAsesmen(asesmen.id, mn, mx)}
        />
      </div>
    </>
  );

  return (
    <Halaman>
      <KepalaHalaman
        judul={
          <>
            Asesmen {JUDUL[slot]}
          </>
        }
        aksi={
          <>
            {/* Mode entri disimpan per asesmen per kelas. Isian mode lain tidak
            dihapus, jadi berpindah bolak-balik aman. */}
            <div
              className="segmen max-w-full overflow-x-auto"
              role="radiogroup"
              aria-label="Cara mengisi nilai"
            >
              {PILIHAN_MODE.map((p) => {
                const aktif = asesmen.mode === p.mode;
                return (
                  <button
                    key={p.mode}
                    type="button"
                    role="radio"
                    aria-checked={aktif}
                    onClick={() => setModeAsesmen(asesmen.id, p.mode)}
                    style={{
                      background: aktif ? "var(--color-aksen)" : "transparent",
                      color: aktif ? "#ffffff" : "var(--color-redup)",
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <TombolUnduh jenis={slot} />
          </>
        }
      />

      {langsung ? (
        <>
          <div className="tabel-padat min-w-min" style={gayaTabelLangsung}>
            <div className="kepala-padat">
              <KepalaBeku />
              <div
                className="sel-padat mikro sekat-padat"
                style={{ gridColumn: 3 }}
              >
                SKOR
              </div>
              <div className="px-2.5 py-2 min-w-0" style={{ gridColumn: 4 }}>
                {kepalaNilai}
              </div>
            </div>
            <div className="grup-padat">
              {hasil.baris.map((baris, i) => {
                const h = baris.asesmen.find(
                  (x) => x.asesmen.id === asesmen.id,
                );
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
                    <div className="sel-padat sekat-padat">
                      <InputAngka
                        data-sel="1"
                        nilai={h.butir.skor}
                        onUbah={(v) => ubah(baris.siswa.id, "skor", v)}
                        onFocus={() => setFokus(i)}
                        onKeyDown={(e) => navigasiSel(e, 1)}
                        className="sel-input-padat w-[4.5rem]"
                        aria-label={`Skor ${baris.siswa.nama}`}
                      />
                    </div>
                    <div
                      className="sel-padat justify-end text-[0.9375rem] font-extrabold angka"
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
        </>
      ) : (
        <>
          {/* --------------------------------------------------- bilah rumus -- */}

          <div className="tabel-padat min-w-min" style={gayaTabel}>
            <div className="kepala-padat">
              <KepalaBeku duaBaris />
              <div
                className="px-2 py-1.5 min-w-0 mikro text-center sekat-padat border-b border-[color:var(--color-garis)]"
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
                  className={`px-2 pt-1.5 pb-1 mikro text-[0.6562rem] tracking-[0.06em] ${
                    i === 2 ? "sekat-padat" : "sekat-sub"
                  }`}
                  style={{ gridColumn: 3 + i, gridRow: 2 }}
                >
                  {NAMA_BAGIAN[k].toUpperCase()} ×{bobotDari(asesmen, k)}
                </div>
              ))}
              <div
                className="sel-padat mikro justify-end sekat-padat"
                style={{ gridColumn: 6, gridRow: "1 / 3" }}
              >
                SKOR
              </div>
              <div
                className="px-2.5 py-2 min-w-0 self-end"
                style={{ gridColumn: 7, gridRow: "1 / 3" }}
              >
                {kepalaNilai}
              </div>
            </div>

            <div className="grup-padat">
              {hasil.baris.map((baris, i) => {
                const h = baris.asesmen.find(
                  (x) => x.asesmen.id === asesmen.id,
                );
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
                          className="sel-input-padat w-[3rem]"
                          aria-label={`${NAMA_BAGIAN[k]} ${baris.siswa.nama}`}
                        />
                        <Panah />
                        <span className="text-[0.875rem] font-bold angka">
                          {h.butir[k] * bobotDari(asesmen, k)}
                        </span>
                      </div>
                    ))}

                    <div className="sel-padat sekat-padat justify-end text-[0.875rem] font-semibold angka">
                      {n(h.total, 0)}
                    </div>
                    <div
                      className="sel-padat justify-end text-[0.9375rem] font-extrabold angka"
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
        </>
      )}
    </Halaman>
  );
}
