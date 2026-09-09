"use client";

import { useKelas } from "@/lib/store";
import { komponenOf } from "@/lib/nilai";
import { n } from "@/lib/format";
import { InputAngka, InputBand } from "@/components/kendali";
import PetaSkala from "@/components/peta-skala";
import Halaman from "@/components/halaman";

/**
 * Skala & KKTP — satu papan untuk seluruh variabel yang membentuk nilai akhir:
 * band tujuan tiap kolom, band NA → raport, bobot proses : asesmen, KKTP, dan
 * sumber min/maks. Setiap perubahan di sini langsung merambat ke layar entri,
 * Daftar Nilai, dan dasbor.
 */
export default function HalamanSkala() {
  const { kelas, grup, setBand, setPengaturan } = useKelas();

  const sumberLabel =
    kelas.sumberMinMaks === "kelas" ? "min/maks kelas" : "min/maks angkatan";

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
      rumus: "sama, band berbeda tiap lingkup",
      sumber: sumberLabel,
      min: k.bandMin,
      max: k.bandMax,
      ubah: (mn: number, mx: number) => setBand(k.id, mn, mx),
    })),
  ];

  return (
    <Halaman lebar="sempit">
      <div className="judul">
        Skala &amp; <span className="teks-gradien">KKTP</span>
      </div>

      {/* --------------------------------------------------- tabel skala -- */}
      <div className="papan p-0 overflow-hidden">
        <div className="flex px-4 bg-[color:var(--color-kepala)] border-b border-[color:var(--color-garis)] mikro">
          <div className="w-[150px] flex-none p-2.5">JENIS NILAI</div>
          <div className="flex-1 min-w-0 p-2.5">RUMUS</div>
          <div className="w-[150px] flex-none p-2.5">SUMBER MIN/MAKS</div>
          <div className="w-[140px] flex-none p-2.5 text-right">
            BAND TUJUAN
          </div>
        </div>

        {barisSkala.map((s) => (
          <div
            key={s.id}
            className="flex items-center px-4 border-b border-[color:var(--color-garis)]"
          >
            <div className="w-[150px] flex-none px-2.5 py-[11px] text-[12px] font-bold">
              {s.tipe}
            </div>
            <div className="flex-1 min-w-0 px-2.5 py-[11px] text-[11px] font-medium text-[color:var(--color-redup)] angka">
              {s.rumus}
            </div>
            <div className="w-[150px] flex-none px-2.5 py-[11px] text-[11px] font-medium text-[color:var(--color-redup)]">
              {s.sumber}
            </div>
            <div className="w-[140px] flex-none px-2.5 py-1.5 flex items-center justify-end">
              <InputBand min={s.min} max={s.max} onUbah={s.ubah} />
            </div>
          </div>
        ))}

        {kelas.asesmen.map((a) => (
          <div
            key={a.id}
            className="flex items-center px-4 border-b border-[color:var(--color-garis)]"
          >
            <div className="w-[150px] flex-none px-2.5 py-[11px] text-[12px] font-bold">
              {a.jenis}
            </div>
            <div className="flex-1 min-w-0 px-2.5 py-[11px] text-[11px] font-medium text-[color:var(--color-redup)] angka">
              (A×{a.bobotA})+(B×{a.bobotB})+(C×{a.bobotC}) = skor, lalu (
              {n(a.konstanta, 0)} + skor) ÷ {n(a.pembagi, 0)}
            </div>
            <div className="w-[150px] flex-none px-2.5 py-[11px] text-[11px] font-medium text-[color:var(--color-redup)]">
              bobot butir, tanpa min/maks
            </div>
            <div className="w-[140px] flex-none px-2.5 py-[11px] text-[11px] text-right text-[color:var(--color-samar)] angka">
              {n(a.konstanta / a.pembagi, 1)} – …
            </div>
          </div>
        ))}

        <div className="flex items-center px-4 pb-1.5">
          <div className="w-[150px] flex-none px-2.5 py-[11px] text-[12px] font-bold">
            Nilai Raport
          </div>
          <div className="flex-1 min-w-0 px-2.5 py-[11px] text-[11px] font-medium text-[color:var(--color-redup)] angka">
            NA direscale ke band, lalu dibulatkan
          </div>
          <div className="w-[150px] flex-none px-2.5 py-[11px] text-[11px] font-medium text-[color:var(--color-redup)]">
            {kelas.sumberMinMaks === "kelas"
              ? "NA min/maks kelas"
              : "NA min/maks angkatan"}
          </div>
          <div className="w-[140px] flex-none px-2.5 py-1.5 flex items-center justify-end">
            <InputBand
              min={kelas.naBandMin}
              max={kelas.naBandMax}
              onUbah={(mn, mx) =>
                setPengaturan({ naBandMin: mn, naBandMax: mx })
              }
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------ bobot / KKTP / sumber -- */}
      <div className="grid grid-cols-3 gap-7 mt-7">
        <div className="papan-neu p-6">
          <div className="mikro">BOBOT PROSES : ASESMEN</div>
          <div className="flex items-baseline gap-1.5 mt-2.5">
            <span className="text-[30px] font-extrabold angka">
              {kelas.bobot}
            </span>
            <span className="text-[14px] font-semibold text-[color:var(--color-redup)] angka">
              : {100 - kelas.bobot}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={kelas.bobot}
            onChange={(e) => setPengaturan({ bobot: Number(e.target.value) })}
            className="w-full mt-3 accent-[color:var(--color-aksen)]"
            aria-label="Bobot proses terhadap asesmen"
          />
          <p className="keterangan mt-1.5 text-[11px]">
            Formatif dan lingkup materi dirata-rata dulu, baru ditimbang
            terhadap asesmen sumatif.
          </p>
        </div>

        <div className="papan-neu p-6">
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

        <div className="papan-neu p-6">
          <div className="mikro">SUMBER MIN/MAKS</div>
          <div className="segmen mt-2.5">
            {(["kelas", "sekolah"] as const).map((s) => {
              const on = kelas.sumberMinMaks === s;
              return (
                <button
                  key={s}
                  onClick={() => setPengaturan({ sumberMinMaks: s })}
                  className="flex-1"
                  style={{
                    background: on ? "var(--color-aksen)" : "transparent",
                    color: on ? "#ffffff" : "var(--color-redup)",
                  }}
                >
                  {s === "kelas" ? "Kelas ini" : "Semua kelas"}
                </button>
              );
            })}
          </div>
          <p className="keterangan mt-2.5 text-[11px]">
            Pakai rentang kelas sendiri, atau rentang seluruh angkatan (
            {grup.length} kelas) supaya antar kelas sebanding.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------ peta 1b -- */}
      <div className="mt-7">
        <PetaSkala />
      </div>
    </Halaman>
  );
}
