"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { RingkasanKelas } from "@/lib/data";
import Pilihan from "@/components/pilihan";

const kunciPeriode = (k: RingkasanKelas) => `${k.tahunAjaran}|${k.semester}`;

/**
 * Daftar kartu kelas di beranda beserta penyaringnya (cari, mapel, periode).
 * Saringan hanya hidup di state klien — kembali kosong saat halaman dimuat ulang.
 */
export default function SaringKelas({ kelas }: { kelas: RingkasanKelas[] }) {
  const [cari, setCari] = useState("");
  const [mapel, setMapel] = useState("semua");
  const [periode, setPeriode] = useState("semua");

  const daftarMapel = useMemo(
    () =>
      [...new Set(kelas.map((k) => k.mapel))].sort((a, b) =>
        a.localeCompare(b, "id"),
      ),
    [kelas],
  );

  const daftarPeriode = useMemo(() => {
    const peta = new Map<string, RingkasanKelas>();
    for (const k of kelas) peta.set(kunciPeriode(k), k);
    return [...peta.entries()]
      .sort(
        ([, a], [, b]) =>
          b.tahunAjaran.localeCompare(a.tahunAjaran) || b.semester - a.semester,
      )
      .map(([kunci, k]) => ({
        nilai: kunci,
        label: `${k.tahunAjaran} · Semester ${k.semester}`,
      }));
  }, [kelas]);

  const teks = cari.trim().toLowerCase();
  const filterAktif = teks !== "" || mapel !== "semua" || periode !== "semua";

  const cocok = kelas.filter(
    (k) =>
      (mapel === "semua" || k.mapel === mapel) &&
      (periode === "semua" || kunciPeriode(k) === periode) &&
      (teks === "" ||
        k.nama.toLowerCase().includes(teks) ||
        k.mapel.toLowerCase().includes(teks)),
  );
  const aktif = cocok.filter((k) => k.aktif);
  const nonaktif = cocok.filter((k) => !k.aktif);
  const adaKelasAktif = kelas.some((k) => k.aktif);

  const reset = () => {
    setCari("");
    setMapel("semua");
    setPeriode("semua");
  };

  return (
    <>
      {adaKelasAktif && kelas.length > 1 && (
        <div className="mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-3">
            <div>
              <label htmlFor="saring-cari" className="mikro mb-1.5 block">
                CARI
              </label>
              <input
                id="saring-cari"
                type="search"
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="Cari kelas atau mapel…"
                className="isian w-full"
                autoComplete="off"
              />
            </div>
            <div>
              <div id="label-beranda-mapel" className="mikro mb-1.5">
                MAPEL
              </div>
              <Pilihan
                value={mapel}
                onUbah={setMapel}
                className="isian w-full"
                aria-labelledby="label-beranda-mapel"
                opsi={[
                  { nilai: "semua", label: "Semua mapel" },
                  ...daftarMapel.map((m) => ({ nilai: m, label: m })),
                ]}
              />
            </div>
            <div>
              <div id="label-beranda-periode" className="mikro mb-1.5">
                PERIODE
              </div>
              <Pilihan
                value={periode}
                onUbah={setPeriode}
                className="isian w-full"
                aria-labelledby="label-beranda-periode"
                opsi={[
                  { nilai: "semua", label: "Semua periode" },
                  ...daftarPeriode,
                ]}
              />
            </div>
          </div>
          {filterAktif && (
            <div className="mt-3 flex items-center gap-3">
              <span className="mikro angka">
                {cocok.length} DARI {kelas.length} KELAS
              </span>
              <button type="button" className="tombol-garis" onClick={reset}>
                Reset
              </button>
            </div>
          )}
        </div>
      )}

      {adaKelasAktif &&
        (aktif.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-4 sm:gap-7">
            {aktif.map((k) => (
              <KartuKelas key={k.id} k={k} />
            ))}
          </div>
        ) : (
          <p className="keterangan">
            {nonaktif.length > 0
              ? "Tidak ada kelas aktif yang cocok — lihat kelas nonaktif di bawah."
              : "Tidak ada kelas yang cocok."}
          </p>
        ))}

      {/* Kelas nonaktif: arsip, terlipat. Masih bisa dibuka dan
          diaktifkan lagi dari layar Kelola Kelas-nya. Terbuka sendiri
          saat saringan aktif supaya hasil di arsip ikut terlihat. */}
      {nonaktif.length > 0 && (
        <details
          className="mt-8 sm:mt-10 group"
          open={filterAktif || undefined}
        >
          <summary className="mikro cursor-pointer select-none list-none inline-flex items-center gap-2 hover:text-[color:var(--color-tinta)]">
            <span className="inline-block transition-transform group-open:rotate-90">
              ›
            </span>
            KELAS NONAKTIF ({nonaktif.length})
          </summary>
          <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-4 sm:gap-7">
            {nonaktif.map((k) => (
              <KartuKelas key={k.id} k={k} />
            ))}
          </div>
        </details>
      )}
    </>
  );
}

function KartuKelas({ k }: { k: RingkasanKelas }) {
  return (
    <Link
      href={`/kelas/${k.id}/dasbor`}
      className={`papan papan-angkat p-6 no-underline${k.aktif ? "" : " opacity-70"}`}
    >
      <div className="flex items-baseline gap-2">
        <div className="text-[1.375rem] font-semibold leading-none font-[family-name:var(--font-judul)]">
          {k.nama}
        </div>
        <div className="mikro angka">{k.jumlahSiswa} SISWA</div>
        {!k.aktif && (
          <span
            className="tag ml-auto text-[0.75rem]"
            style={{
              background: "var(--color-sorot)",
              color: "var(--color-redup)",
            }}
          >
            NONAKTIF
          </span>
        )}
      </div>
      <div className="text-[0.875rem] text-[color:var(--color-redup)] mt-3">
        {k.mapel}
      </div>
      <div className="mikro mt-1.5">
        SEMESTER {k.semester} · {k.tahunAjaran}
      </div>
    </Link>
  );
}
