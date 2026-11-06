-- Mode 'langsung' mengetik SKOR, bukan NILAI
--
-- Migrasi 20261106000000 menamai kolomnya `nilai_langsung` karena mode itu
-- semula dimaksudkan untuk mengetik nilai akhir. Ternyata guru mengetik SKOR
-- total, lalu NILAI tetap dihitung dengan rumus asesmen yang sama:
--   NILAI = (konstanta + SKOR) / pembagi
-- Jadi kolomnya diganti nama agar sesuai isinya. Datanya tidak diubah.

alter table public.nilai_asesmen
  rename column nilai_langsung to skor_langsung;

alter table public.nilai_asesmen
  rename constraint nilai_asesmen_langsung_nonneg to nilai_asesmen_skor_langsung_nonneg;
