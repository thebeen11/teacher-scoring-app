-- Nilai tambahan: kehadiran dan keaktifan
--
-- Keduanya berada di luar bobot empat komponen akademis.
--
-- Kehadiran: guru mengisi total pertemuan (T) sekali per kelas, lalu jumlah
-- Hadir/Sakit/Izin per siswa. Alpa TIDAK disimpan — ia selalu T − H − S − I,
-- jadi menyimpannya hanya membuka peluang dua angka yang saling bertentangan.
--   NH = (H + 0,5·S + 0,5·I) / T × 100
--
-- Keaktifan: akumulasi skor per siswa, tanpa log tanggal atau jenis aktivitas.
--   Bonus = min(skor × 0,5; 10)
--
-- Seperti tabel nilai lain, hanya angka mentah yang disimpan; NH dan bonus
-- dihitung di aplikasi (src/lib/nilai.ts).

alter table public.kelas
  add column if not exists total_pertemuan integer not null default 0
    check (total_pertemuan >= 0);

create table if not exists public.nilai_tambahan (
  siswa_id   uuid primary key references public.siswa on delete cascade,
  hadir      numeric not null default 0 check (hadir >= 0),
  sakit      numeric not null default 0 check (sakit >= 0),
  izin       numeric not null default 0 check (izin >= 0),
  keaktifan  numeric not null default 0 check (keaktifan >= 0),
  updated_at timestamptz not null default now()
);

alter table public.nilai_tambahan enable row level security;

drop policy if exists nilai_tambahan_own on public.nilai_tambahan;
create policy nilai_tambahan_own on public.nilai_tambahan
  for all using (
    exists (
      select 1 from public.siswa s
      join public.kelas k on k.id = s.kelas_id
      where s.id = nilai_tambahan.siswa_id and k.guru_id = (select auth.uid())
    )
  ) with check (
    exists (
      select 1 from public.siswa s
      join public.kelas k on k.id = s.kelas_id
      where s.id = nilai_tambahan.siswa_id and k.guru_id = (select auth.uid())
    )
  );
