"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useKelas } from "@/lib/store";
import { n } from "@/lib/format";
import Halaman from "@/components/halaman";

/**
 * Rincian Siswa — rantai nilai satu siswa dibuka penuh, dari skor mentah
 * sampai nilai raport, dengan aritmetika tiap tahap ditulis apa adanya.
 * Ini jawaban untuk "kenapa nilai saya segini?": tiap tahap menampilkan angka
 * yang masuk, rumus yang dipakai, dan angka keluar yang jadi masukan tahap
 * berikutnya, sampai band raport terakhir.
 */
export default function HalamanSiswa() {
  const { kelas, hasil } = useKelas();
  const params = useSearchParams();
  const dariTaut = params.get("siswa");

  const indeksAwal = Math.max(
    0,
    hasil.baris.findIndex((b) => b.siswa.id === dariTaut),
  );
  const [terpilih, setTerpilih] = useState(indeksAwal);

  const b = hasil.baris[Math.min(terpilih, hasil.baris.length - 1)];
  if (!b) return null;

  const [naMin, naMax] = hasil.naRange;
  const w = kelas.bobot;
  // Hanya bagian yang ada di kelas ini — sama dengan yang dipakai hitungNA().
  const sukuNA = [
    b.formatif.length ? { w: w.formatif, v: b.rtF } : null,
    b.lingkup.length ? { w: w.sumatif, v: b.rtNS } : null,
    b.rtTengah !== null ? { w: w.tengah, v: b.rtTengah } : null,
    b.rtAkhir !== null ? { w: w.akhir, v: b.rtAkhir } : null,
  ].filter((x) => x !== null);
  const penyebutNA = sukuNA.reduce((t, x) => t + x.w, 0);

  const tahap = [
    {
      kode: b.formatif.length
        ? `${b.formatif[0].komponen.label}–${b.formatif.at(-1)!.komponen.label}`
        : "F",
      label: "Formatif, tiap kolom direscale ke rentangnya",
      detail: `${b.formatif.map((c) => c.mentah).join(" · ")}  →  ${b.formatif
        .map((c) => n(c.konversi))
        .join(" · ")}`,
      nilai: n(b.rtF),
    },
    {
      kode: b.lingkup.length
        ? `${b.lingkup[0].komponen.label}–${b.lingkup.at(-1)!.komponen.label}`
        : "S",
      label: "Nilai sumatif, rentang per kolom",
      detail: `${b.lingkup.map((c) => c.mentah).join(" · ")}  →  ${b.lingkup
        .map((c) => n(c.konversi))
        .join(" · ")}`,
      nilai: n(b.rtNS),
    },
    ...b.asesmen.map((a) => ({
      kode: a.asesmen.jenis,
      label:
        a.asesmen.jenis === "ASTS"
          ? "Asesmen tengah semester"
          : a.asesmen.jenis === "ASAS"
            ? "Asesmen akhir semester"
            : "Asesmen akhir tahun",
      detail:
        a.asesmen.mode === "langsung"
          ? `SKOR ${n(a.total, 0)} diketik langsung → ` +
            `skala ${n(a.bounds[0], 0)}–${n(a.bounds[1], 0)} → ${n(a.asesmen.bandMin, 0)}–${n(a.asesmen.bandMax, 0)}`
          : `(${a.butir.a}×${a.asesmen.bobotA})+(${a.butir.b}×${a.asesmen.bobotB})+` +
            `${a.butir.c === 0 ? "0" : a.butir.c} = ${n(a.total, 0)} → ` +
            `skala ${n(a.bounds[0], 0)}–${n(a.bounds[1], 0)} → ${n(a.asesmen.bandMin, 0)}–${n(a.asesmen.bandMax, 0)}`,
      nilai: n(a.nilai),
    })),
    {
      kode: "NA",
      label: "Nilai akhir, bobot formatif : sumatif : AST : AAS",
      detail: `(${sukuNA.map((x) => `${x.w}×${n(x.v)}`).join(" + ")}) ÷ ${penyebutNA}`,
      nilai: n(b.na),
    },
    {
      kode: "RAPORT",
      label: "NA direscale ke rentang raport, dibulatkan",
      detail: `NA ${n(naMin)}–${n(naMax)}  →  rentang ${n(kelas.naBandMin, 0)}–${n(kelas.naBandMax, 0)}`,
      nilai: String(b.raport),
      aksen: true,
    },
  ];

  return (
    <Halaman className="flex flex-col lg:flex-row gap-4 sm:gap-7">
      {/* ------------------------------------------- pemilih (di bawah lg) --
          Daftar roster setinggi layar tidak muat di atas rincian pada layar
          sempit; satu kotak pilih menggantikannya. */}
      <label className="lg:hidden flex flex-col gap-1.5">
        <span className="mikro">
          {kelas.nama} · {hasil.baris.length} SISWA
        </span>
        <select
          value={terpilih}
          onChange={(e) => setTerpilih(Number(e.target.value))}
          className="isian w-full"
        >
          {hasil.baris.map((r, i) => (
            <option key={r.siswa.id} value={i}>
              {r.siswa.noUrut}. {r.siswa.nama} — {r.raport}
            </option>
          ))}
        </select>
      </label>

      {/* --------------------------------------------------------- roster -- */}
      <div className="hidden lg:block w-[15.625rem] flex-none papan self-start max-h-[calc(100vh-150px)] overflow-auto p-3">
        <div className="px-3 py-2.5 mb-1 border-b border-[color:var(--color-garis)] mikro sticky top-0 bg-[color:var(--color-papan)] z-10">
          {kelas.nama} · {hasil.baris.length} SISWA
        </div>
        {hasil.baris.map((r, i) => (
          <button
            key={r.siswa.id}
            onClick={() => setTerpilih(i)}
            className="w-full flex gap-2 px-3 py-[9px] rounded-[var(--r-kecil)] border-0 text-[0.7188rem] font-medium text-left cursor-pointer transition-colors hover:bg-[color:var(--color-kepala)]"
            style={{
              background: i === terpilih ? "var(--color-sorot)" : "transparent",
            }}
          >
            <span className="text-[color:var(--color-samar)] angka">
              {r.siswa.noUrut}
            </span>
            <span className="flex-1 min-w-0 truncate">{r.siswa.nama}</span>
            <span
              className="font-bold angka"
              style={{
                color: r.tuntas ? "var(--color-tinta)" : "var(--color-bahaya)",
              }}
            >
              {r.raport}
            </span>
          </button>
        ))}
      </div>

      {/* ---------------------------------------------------------- kanan -- */}
      <div className="flex-1 min-w-0">
        <div className="papan-neu px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-wrap items-end gap-x-5 gap-y-4">
            <div className="basis-full sm:basis-auto min-w-0">
              <div className="mikro">
                PESERTA DIDIK {b.siswa.noUrut} · {kelas.nama}
              </div>
              <div className="text-[1.375rem] sm:text-[1.625rem] font-semibold leading-[1.2] mt-1.5 tracking-[-0.01em] font-[family-name:var(--font-judul)]">
                {b.siswa.nama}
              </div>
            </div>
            <div className="sm:ml-auto sm:text-right">
              <div className="mikro">NILAI RAPORT</div>
              <div
                className="text-[2.875rem] font-extrabold leading-none tracking-[-0.02em] angka"
                style={{
                  color: b.tuntas
                    ? "var(--color-tinta)"
                    : "var(--color-bahaya)",
                }}
              >
                {b.raport}
              </div>
            </div>
            <div className="text-right">
              <div className="mikro">STATUS</div>
              <div
                className="tag mt-2 text-[0.6875rem]"
                style={{
                  background: b.tuntas
                    ? "var(--color-sorot)"
                    : "var(--color-basuh)",
                  color: b.tuntas
                    ? "var(--color-aksen-gelap)"
                    : "var(--color-bahaya-pekat)",
                }}
              >
                {b.tuntas ? "TUNTAS" : "BELUM"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-7 papan p-0 overflow-hidden">
          <div className="px-4 sm:px-6 py-3.5 border-b border-[color:var(--color-garis)] bg-[color:var(--color-kepala)] mikro">
            RANTAI NILAI — DARI SKOR MENTAH KE RAPORT
          </div>
          {tahap.map((t) => (
            /* Di layar sempit: kode dan nilai sebaris di atas, keterangan dan
               aritmetikanya turun ke bawah selebar kartu. */
            <div
              key={t.kode}
              className="grid grid-cols-[1fr_auto] md:grid-cols-[120px_200px_minmax(0,1fr)_120px] items-center px-1.5 py-2 md:py-0 border-b border-[color:var(--color-garis)]"
            >
              <div className="px-3 md:px-[18px] pt-1.5 md:py-3.5 text-[0.8125rem] font-extrabold sekat">
                {t.kode}
              </div>
              <div className="order-3 md:order-none col-span-2 md:col-span-1 px-3 md:px-[18px] md:py-3.5 text-[0.7188rem] leading-[1.4] text-[color:var(--color-redup)]">
                {t.label}
              </div>
              <div className="order-4 md:order-none col-span-2 md:col-span-1 min-w-0 px-3 md:px-[18px] pt-1 pb-1.5 md:py-3.5 text-[0.7188rem] font-medium angka break-words">
                {t.detail}
              </div>
              <div
                className="order-2 md:order-none px-3 md:px-[18px] pt-1.5 md:py-3.5 text-[1.125rem] font-extrabold text-right angka"
                style={{
                  color: t.aksen
                    ? "var(--color-aksen-gelap)"
                    : "var(--color-tinta)",
                }}
              >
                {t.nilai}
              </div>
            </div>
          ))}
          <p className="px-4 sm:px-6 py-4 keterangan">
            Setiap baris memakai variabel skala yang bisa diubah di layar{" "}
            <strong>Skala &amp; KKTP</strong>. Ubah satu, seluruh rantai ini
            ikut bergerak.
          </p>
        </div>
      </div>
    </Halaman>
  );
}
