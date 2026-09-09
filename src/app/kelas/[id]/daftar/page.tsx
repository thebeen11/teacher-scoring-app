"use client";

import { useKelas } from "@/lib/store";
import { n } from "@/lib/format";
import { InputBand } from "@/components/kendali";
import TabelDaftar from "@/components/tabel-daftar";
import Halaman from "@/components/halaman";

export default function HalamanDaftar() {
  const { kelas, hasil, setPengaturan } = useKelas();
  const [naMin, naMax] = hasil.naRange;

  // Lebar bilah menggambarkan seberapa sempit rentang NA sebenarnya
  // dibandingkan skala 0–100 penuh.
  const lebar = Math.min(100, Math.max(6, (naMax - naMin) * 4));

  return (
    <Halaman>
      <div className="mb-7">
        <div className="judul">
          Daftar <span className="teks-gradien">Nilai</span> Peserta Didik
        </div>
      </div>

      <div className="papan-neu px-6 py-5 flex items-center gap-6 mb-7">
        <div>
          <div className="mikro">NA KELAS</div>
          <div className="text-[16px] font-bold mt-[3px] angka">
            {n(naMin)} → {n(naMax)}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bilah h-2.5">
            <span style={{ width: `${lebar}%` }} />
          </div>
          <div className="flex justify-between mt-[5px] text-[10px] font-medium text-[color:var(--color-redup)]">
            <span>dipetakan ke band raport</span>
            <span className="angka">
              {n(kelas.naBandMin, 0)}–{n(kelas.naBandMax, 0)}
            </span>
          </div>
        </div>

        <InputBand
          label="BAND"
          min={kelas.naBandMin}
          max={kelas.naBandMax}
          onUbah={(mn, mx) => setPengaturan({ naBandMin: mn, naBandMax: mx })}
        />
      </div>

      <TabelDaftar />
    </Halaman>
  );
}
