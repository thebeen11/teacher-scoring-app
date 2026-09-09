"use client";

import TabelPadat from "@/components/tabel-padat";

export default function HalamanLingkup() {
  return (
    <TabelPadat
      jenis="lingkup"
      judul="Sumatif Lingkup Materi"
      tampilkanKaki
      keterangan={
        "Satu kolom per lingkup materi. Skornya dikonversi ke band tujuan masing-masing, lalu dirata-rata menjadi RT LM — yang bersama RT F membentuk nilai proses."
      }
    />
  );
}
