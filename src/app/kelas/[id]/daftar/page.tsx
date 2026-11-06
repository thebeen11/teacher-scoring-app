"use client";

import { useKelas } from "@/lib/store";
import { n } from "@/lib/format";
import { InputBand } from "@/components/kendali";
import TabelDaftar from "@/components/tabel-daftar";
import Halaman from "@/components/halaman";
import TombolUnduh from "@/components/tombol-unduh";
import KepalaHalaman from "@/components/kepala-halaman";

export default function HalamanDaftar() {
  const { kelas, hasil, setPengaturan } = useKelas();
  const [naMin, naMax] = hasil.naRange;
  const ada = hasil.baris.length > 0;
  const raport = hasil.baris.map((b) => b.raport);
  const total = hasil.baris.length;

  const statistik = [
    {
      label: "TERTINGGI",
      nilai: ada ? n(naMax) : "–",
      warna: "var(--color-aksen-gelap)",
      sub: ada ? `raport ${Math.max(...raport)}` : "belum ada siswa",
    },
    {
      label: "TERENDAH",
      nilai: ada ? n(naMin) : "–",
      warna: "var(--color-bahaya-pekat)",
      sub: ada ? `raport ${Math.min(...raport)}` : "belum ada siswa",
    },
    {
      label: "TUNTAS",
      nilai: hasil.jumlahTuntas,
      sub: `dari ${total} siswa`,
      warna: "var(--color-aksen-gelap)",
    },
    {
      label: "BELUM TUNTAS",
      nilai: hasil.jumlahBelum,
      sub: `dari ${total} siswa`,
      warna: "var(--color-bahaya-pekat)",
    },
  ];

  return (
    <Halaman>
      <KepalaHalaman
        judul={
          <>
            Daftar Nilai Peserta Didik
          </>
        }
        aksi={
          <>
            <InputBand
              label="RENTANG"
              besar
              min={kelas.naBandMin}
              max={kelas.naBandMax}
              onUbah={(mn, mx) =>
                setPengaturan({ naBandMin: mn, naBandMax: mx })
              }
            />
            <TombolUnduh jenis="daftar" />
          </>
        }
        statistik={statistik}
      />

      <TabelDaftar />
    </Halaman>
  );
}
