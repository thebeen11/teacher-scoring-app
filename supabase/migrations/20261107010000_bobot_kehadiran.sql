-- Kehadiran ikut BOBOT NILAI AKHIR
--
-- Nilai kehadiran (NH, lihat 20261107000000_nilai_tambahan) kini menjadi
-- bagian kelima NA, berkategori Nilai Tambahan, di samping empat bagian Nilai
-- Akademis (formatif, sumatif, ASTS, ASAS/ASAT):
--   NA = (wF·RT F + wS·RT NS + wT·ASTS + wA·AKHIR + wH·NH) / Σw
--
-- Bawaannya 0, jadi kelas lama tetap berjumlah 100 dan NA-nya tidak berubah
-- sampai guru memberi bobot. Siswa yang kehadirannya belum bisa dihitung
-- (total pertemuan 0) tidak ditarik ke nol: bagian itu keluar dari Σw.
--
-- Dipisah dari migrasi nilai_tambahan karena migrasi itu sudah terpasang
-- sebelum kolom ini ditambahkan ke berkasnya.

alter table public.kelas
  add column if not exists bobot_kehadiran integer not null default 0
    check (bobot_kehadiran between 0 and 100);
