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
        "Ketik skor mentah tiap kolom — sel kosong terhitung nol. Tiap kolom dikonversi ke rentang tujuannya sendiri, lalu seluruh kolom dirata-rata menjadi RT F. Kolom yang punya sub diisi lewat sub-subnya. Tambah kolom lewat + Kolom, ganti nama atau hapus lewat ikon pensil di tab-nya, dan tambah sub lewat tombol + Sub. Kolom yang belum diisi tetap ikut dirata-rata, jadi tambahkan saat penilaiannya memang dikerjakan."
      }
    />
  );
}
