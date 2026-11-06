-- NILAI asesmen memakai rentang, sama seperti kolom Formatif/Sumatif
--
-- Semula NILAI = (konstanta + SKOR) / pembagi. Kini SKOR direscale dari
-- min/maks SKOR sekelas ke rentang yang diatur guru:
--   NILAI = (SKOR - min) x (band_max - band_min) / (maks - min) + band_min
--
-- Kolom konstanta/pembagi dibiarkan (tidak dipakai lagi) supaya migrasi ini
-- tidak merusak data lama.

alter table public.asesmen
  add column if not exists band_min numeric not null default 80,
  add column if not exists band_max numeric not null default 100;
