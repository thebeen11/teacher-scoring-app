-- Kelas nonaktif (arsip)
--
-- Kelas yang sudah tidak diajar disembunyikan dari "Semua Kelas" dan pemilih
-- kelas, tapi datanya utuh dan tetap bisa dibuka/diaktifkan lagi. Kebijakan
-- RLS `kelas_own` sudah menaungi kolom baru ini.

alter table public.kelas
  add column if not exists aktif boolean not null default true;
