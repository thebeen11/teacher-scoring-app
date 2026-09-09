"use client";

import TabelPadat from "@/components/tabel-padat";

export default function HalamanFormatif() {
  return (
    <TabelPadat
      jenis="formatif"
      judul="Nilai Formatif"
      tampilkanRumus
      tampilkanKaki
      keterangan={
        "Ketik skor mentah tiap kolom — sel kosong terhitung nol. Tiap kolom dikonversi ke band tujuannya sendiri, lalu seluruh kolom dirata-rata menjadi RT F. Kolom yang punya sub diisi lewat sub-subnya."
      }
    />
  );
}
