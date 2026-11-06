"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useKelas } from "@/lib/store";
import {
  kelengkapanAsesmen,
  kelengkapanKelas,
  kelengkapanKolom,
  komponenOf,
} from "@/lib/nilai";
import { n, pct } from "@/lib/format";
import Halaman from "@/components/halaman";
import DialogGantiKelas from "@/components/dialog-ganti-kelas";
import { gayaKolom, KepalaBeku, SelBeku } from "@/components/tabel";
import { ChipStatus } from "@/components/chip-status";

export default function HalamanDasbor() {
  const { kelas, hasil, semuaKelas } = useKelas();
  const mapel = semuaKelas.find((r) => r.id === kelas.id)?.mapel;
  const router = useRouter();
  const [gantiBuka, setGantiBuka] = useState(false);

  const k = {
    nama: kelas.nama,
    siswa: kelas.siswa.length,
    rerata: hasil.baris.length ? n(hasil.rerataRaport) : "–",
    tuntas: hasil.jumlahTuntas,
    belum: hasil.jumlahBelum,
    kelengkapan: kelengkapanKelas(kelas),
  };

  // Alur nilai: satu kotak per kelompok kolom dan per asesmen.
  const formatif = komponenOf(kelas, "formatif");
  const lingkup = komponenOf(kelas, "lingkup");

  const ringkasKolom = (label: string, ids: string[]) => {
    const nilai = ids.map((id) => kelengkapanKolom(kelas, id));
    const penuh = nilai.filter((v) => v >= 100).length;
    const rata = nilai.length
      ? nilai.reduce((a, b) => a + b, 0) / nilai.length
      : 0;
    return {
      kode: label,
      status:
        penuh === nilai.length
          ? "lengkap"
          : `${penuh} dari ${nilai.length} terisi`,
      pct: rata,
    };
  };

  const alur = [
    {
      ...ringkasKolom(
        formatif.length
          ? `${formatif[0].label}–${formatif.at(-1)!.label}`
          : "F",
        formatif.map((k) => k.id),
      ),
      nama: "Nilai Formatif",
    },
    {
      ...ringkasKolom(
        lingkup.length ? `${lingkup[0].label}–${lingkup.at(-1)!.label}` : "S",
        lingkup.map((k) => k.id),
      ),
      nama: "Nilai Sumatif",
    },
    ...kelas.asesmen.map((a) => {
      const p = kelengkapanAsesmen(kelas, a.id);
      return {
        kode: a.jenis,
        nama:
          a.jenis === "ASTS"
            ? "Asesmen tengah semester"
            : a.jenis === "ASAS"
              ? "Asesmen akhir semester"
              : "Asesmen akhir tahun",
        status: p >= 100 ? "lengkap" : `${Math.round(p)}% terisi`,
        pct: p,
      };
    }),
  ];

  const [naMin, naMax] = hasil.naRange;
  const belum = hasil.baris.filter((b) => !b.tuntas);

  return (
    <Halaman>
      {/* ------------------------------------------------- kartu kelas -- */}
      <div
        className="papan px-5 sm:px-6 py-[22px]"
        style={{
          boxShadow: "var(--bayang-neu)",
          background: "var(--color-papan)",
        }}
      >
        <div className="flex items-center gap-2">
          <h1 className="judul text-[1.75rem] leading-none">{k.nama}</h1>
          {mapel && <div className="mikro">{mapel.toUpperCase()}</div>}

          <button
            type="button"
            className="tombol ml-auto"
            onClick={() => setGantiBuka(true)}
          >
            Ganti kelas
          </button>
        </div>
        {gantiBuka && <DialogGantiKelas onTutup={() => setGantiBuka(false)} />}

        <div className="flex gap-[22px] mt-3.5">
          <div>
            <div className="mikro">JUMLAH SISWA</div>
            <div className="text-[1.25rem] font-bold mt-[3px] angka">
              {k.siswa}
            </div>
          </div>
          <div>
            <div className="mikro">RERATA RAPORT</div>
            <div className="text-[1.25rem] font-bold mt-[3px] angka">
              {k.rerata}
            </div>
          </div>
          <div>
            <div className="mikro">TUNTAS</div>
            <div
              className="text-[1.25rem] font-bold mt-[3px] angka"
              style={{
                color: k.tuntas ? "var(--color-lulus-pekat)" : "var(--color-tinta)",
              }}
            >
              {k.tuntas}
            </div>
          </div>
          <div>
            <div className="mikro">BELUM</div>
            <div
              className="text-[1.25rem] font-bold mt-[3px] angka"
              style={{
                color: k.belum ? "var(--color-bahaya)" : "var(--color-tinta)",
              }}
            >
              {k.belum}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between mikro">
            <span>KELENGKAPAN</span>
            <span className="angka">{pct(k.kelengkapan)}</span>
          </div>
          <div className="bilah mt-1.5">
            <span style={{ width: pct(k.kelengkapan) }} />
          </div>
        </div>
      </div>

      {/* ------------------------------------------- alur + di bawah KKTP -- */}
      <div className="flex flex-col xl:flex-row gap-4 sm:gap-7 mt-4 sm:mt-7">
        <div className="flex-1 min-w-0 papan px-5 sm:px-6 py-[22px]">
          <div className="grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
            {alur.map((a) => {
              const lengkap = a.pct >= 100;
              const warna = lengkap
                ? "var(--color-lulus-pekat)"
                : "var(--color-bahaya)";
              return (
                <div
                  key={a.kode}
                  className="papan-dalam shadow-none flex flex-col"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="mikro truncate">{a.kode}</span>
                    <span
                      className="w-2 h-2 rounded-full flex-none"
                      style={{ background: warna }}
                      aria-hidden
                    />
                  </div>

                  <div
                    className="text-[1.75rem] font-bold leading-none mt-3 angka"
                    style={{ color: warna }}
                  >
                    {Math.round(a.pct)}
                    <span className="text-[1rem] font-semibold ml-0.5 text-[color:var(--color-redup)]">
                      %
                    </span>
                  </div>

                  <div className="text-[0.875rem] font-semibold leading-[1.35] mt-2">
                    {a.nama}
                  </div>
                  <div className="text-[0.8125rem] leading-[1.4] text-[color:var(--color-redup)] mt-0.5 angka">
                    {a.status}
                  </div>

                  <div className="mt-auto pt-3">
                    <div className="bilah h-1.5">
                      <span style={{ background: warna, width: pct(a.pct) }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-[color:var(--color-garis)] flex gap-x-7 gap-y-4 flex-wrap">
            <div>
              <div className="mikro">NA TERENDAH</div>
              <div className="text-[1.125rem] font-bold mt-[3px] angka text-[color:var(--color-bahaya)]">
                {n(naMin)}
              </div>
            </div>
            <div>
              <div className="mikro">NA TERTINGGI</div>
              <div className="text-[1.125rem] font-bold mt-[3px] angka text-[color:var(--color-lulus-pekat)]">
                {n(naMax)}
              </div>
            </div>
            <div>
              <div className="mikro">RENTANG RAPORT</div>
              <div className="text-[1.125rem] font-bold mt-[3px] angka">
                {n(kelas.naBandMin, 0)}–{n(kelas.naBandMax, 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[20.625rem] flex-none papan px-5 sm:px-6 py-[22px]">
          <div className="mikro-lebar text-[color:var(--color-bahaya)]">
            DI BAWAH KKTP {kelas.kktp}
          </div>

          <div className="mt-3">
            {belum.length === 0 ? (
              <p className="keterangan">
                Semua siswa mencapai KKTP.{" "}
                {hasil.baris.length ? "" : "Belum ada data nilai."}
              </p>
            ) : (
              belum.map((b) => (
                <button
                  key={b.siswa.id}
                  onClick={() =>
                    router.push(`/kelas/${kelas.id}/siswa?siswa=${b.siswa.id}`)
                  }
                  className="w-full flex items-center gap-2.5 px-3 py-[10px] mb-1 rounded-[var(--r-kecil)] border-0 bg-transparent text-[0.875rem] font-medium text-left cursor-pointer transition-colors hover:bg-[color:var(--color-basuh)]"
                >
                  <span className="flex-1 min-w-0 truncate">
                    {b.siswa.nama}
                  </span>
                  <span className="text-[0.9375rem] font-bold text-[color:var(--color-bahaya)] angka">
                    {b.raport}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------- daftar siswa -- */}
      <div className="mikro flex mb-2 px-1 mt-4 sm:mt-7">
        <span>DAFTAR SISWA</span>
        <span className="ml-auto angka">{hasil.baris.length} ORANG</span>
      </div>

      {/* Jangan dibungkus elemen ber-overflow: kepala lengket akan menempel
          di dalam pembungkus itu (lihat kelola/page.tsx). */}
      <div className="tabel-padat min-w-min" style={gayaKolom("auto", "auto")}>
        <div className="kepala-padat">
          <KepalaBeku />
          <div className="sel-padat mikro sekat-padat justify-end">RAPORT</div>
          <div className="sel-padat mikro">STATUS</div>
        </div>

        <div className="grup-padat">
          {hasil.baris.length === 0 && (
            <div className="baris-padat">
              <div
                className="sel-padat text-[0.9375rem] text-[color:var(--color-redup)]"
                style={{ gridColumn: "1 / -1" }}
              >
                Belum ada data nilai.
              </div>
            </div>
          )}
          {hasil.baris.map((b) => (
            <div key={b.siswa.id} className="baris-padat">
              <SelBeku
                no={b.siswa.noUrut}
                nama={b.siswa.nama}
                onKlik={() =>
                  router.push(`/kelas/${kelas.id}/siswa?siswa=${b.siswa.id}`)
                }
              />
              <div
                className="sel-padat sekat-padat justify-end text-[1.1875rem] font-extrabold angka"
                style={{
                  color: b.tuntas
                    ? "var(--color-lulus-pekat)"
                    : "var(--color-bahaya)",
                }}
              >
                {b.raport}
              </div>
              <div className="sel-padat">
                <ChipStatus tuntas={b.tuntas} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Halaman>
  );
}
