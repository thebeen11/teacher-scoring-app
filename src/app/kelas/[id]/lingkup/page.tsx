"use client";

import TabelPadat from "@/components/tabel-padat";

export default function HalamanLingkup() {
  return (
    <TabelPadat
      jenis="lingkup"
      judul="Nilai Sumatif"
      tampilkanKaki
      keterangan={
        "Satu kolom per nilai sumatif. Skornya dikonversi ke rentang tujuan masing-masing, lalu dirata-rata menjadi RT S — yang bersama RT F membentuk nilai proses. Tambah kolom lewat + Kolom, ganti nama atau hapus lewat ikon pensil di tab-nya."
      }
    />
  );
}
