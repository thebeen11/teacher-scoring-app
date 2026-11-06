-- Mode entri asesmen: per bagian atau nilai langsung
--
-- Sebagian guru sudah memegang nilai akhir ASTS/ASAS dan tidak ingin mengetik
-- tiga butir A/B/C per siswa. Tiap asesmen (per kelas) kini memilih modenya
-- sendiri:
--   'bagian'   -> A/B/C -> SKOR -> NILAI = (konstanta + SKOR) / pembagi
--   'langsung' -> NILAI akhir diketik apa adanya, rumus tidak dipakai.
--
-- Nilai langsung disimpan di kolom tersendiri, bukan menimpa a/b/c, jadi
-- berpindah mode bolak-balik tidak pernah menghapus isian mode yang lain.
-- Baris lama otomatis 'bagian' sehingga perilakunya tidak berubah.

alter table public.asesmen
  add column if not exists mode text not null default 'bagian';

alter table public.asesmen
  add constraint asesmen_mode_valid check (mode in ('bagian', 'langsung'));

alter table public.nilai_asesmen
  add column if not exists nilai_langsung numeric not null default 0;

alter table public.nilai_asesmen
  add constraint nilai_asesmen_langsung_nonneg check (nilai_langsung >= 0);
