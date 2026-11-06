-- Bobot NA dipecah menjadi empat bagian
--
-- Semula hanya satu angka `bobot` (proses : asesmen, mis. 60 : 40):
--   NA = (bobot × (RT F + RT NS)/2 + (100 − bobot) × RT A) / 100
-- Kini guru menimbang tiap bagian sendiri-sendiri — Formatif, Sumatif,
-- Asesmen Tengah Semester (ASTS), Asesmen Akhir Semester (ASAS/ASAT):
--   NA = (wF·RT F + wS·RT NS + wT·ASTS + wA·AKHIR) / Σw
--
-- Pengisian dari bobot lama membagi tiap sisi rata ke dua bagiannya, jadi
-- 60 → 30/30/20/20. Untuk kelas yang punya ASTS dan ASAS hasilnya identik
-- dengan rumus lama.
--
-- Constraint "jumlah = 100" sengaja TIDAK dipasang: simpan otomatis mengirim
-- satu kolom setiap kali, sehingga keadaan antara yang totalnya ≠ 100 pasti
-- terjadi. UI yang menjaga totalnya, dan rumus membagi dengan Σw.

alter table public.kelas
  add column if not exists bobot_formatif integer not null default 30
    check (bobot_formatif between 0 and 100),
  add column if not exists bobot_sumatif  integer not null default 30
    check (bobot_sumatif between 0 and 100),
  add column if not exists bobot_tengah   integer not null default 20
    check (bobot_tengah between 0 and 100),
  add column if not exists bobot_akhir    integer not null default 20
    check (bobot_akhir between 0 and 100);

update public.kelas set
  bobot_formatif = ceil(bobot / 2.0),
  bobot_sumatif  = floor(bobot / 2.0),
  bobot_tengah   = ceil((100 - bobot) / 2.0),
  bobot_akhir    = floor((100 - bobot) / 2.0);

alter table public.kelas drop column if exists bobot;
