-- Olah Nilai — skema awal
--
-- Prinsip: hanya SKOR MENTAH yang disimpan. Semua nilai konversi, rerata, NA,
-- dan nilai raport dihitung ulang di aplikasi (src/lib/nilai.ts) supaya tidak
-- pernah ada dua sumber kebenaran — dan supaya tidak ada sel hasil yang bisa
-- basi atau tertimpa ketikan tangan, seperti yang terjadi di workbook asal.

-- ---------------------------------------------------------------- profiles --

create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  nama       text not null default '',
  sekolah    text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nama, sekolah)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nama', ''),
    coalesce(new.raw_user_meta_data ->> 'sekolah', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------- mapel --

create table if not exists public.mapel (
  id         uuid primary key default gen_random_uuid(),
  guru_id    uuid not null references auth.users on delete cascade,
  nama       text not null,
  created_at timestamptz not null default now()
);

create index if not exists mapel_guru_idx on public.mapel (guru_id);

-- ------------------------------------------------------------------- kelas --
-- Kolom kktp/bobot/na_band/sumber_minmaks adalah variabel yang di spreadsheet
-- tersembunyi di baris kaki tiap blok.

create table if not exists public.kelas (
  id             uuid primary key default gen_random_uuid(),
  guru_id        uuid not null references auth.users on delete cascade,
  mapel_id       uuid not null references public.mapel on delete cascade,
  nama           text not null,
  tahun_ajaran   text not null default '2025/2026',
  semester       smallint not null default 1 check (semester in (1, 2)),
  kktp           integer not null default 80 check (kktp between 0 and 100),
  bobot          integer not null default 60 check (bobot between 0 and 100),
  na_band_min    numeric not null default 79,
  na_band_max    numeric not null default 91,
  sumber_minmaks text not null default 'kelas' check (sumber_minmaks in ('kelas', 'sekolah')),
  created_at     timestamptz not null default now()
);

create index if not exists kelas_guru_idx  on public.kelas (guru_id);
create index if not exists kelas_mapel_idx on public.kelas (mapel_id, semester);

-- ------------------------------------------------------------------- siswa --

create table if not exists public.siswa (
  id       uuid primary key default gen_random_uuid(),
  kelas_id uuid not null references public.kelas on delete cascade,
  no_urut  integer not null default 1,
  nama     text not null,
  jk       text check (jk in ('L', 'P'))
);

create index if not exists siswa_kelas_idx on public.siswa (kelas_id, no_urut);

-- ---------------------------------------------------------------- komponen --
-- Satu baris = satu kolom nilai (F1, F2, ... / LM1, LM2, ...) dengan band
-- tujuannya sendiri. Di spreadsheet band ini hanya ada sebagai angka lepas di
-- baris kaki, berbeda-beda tiap kolom dan jauh dari kolomnya.

create table if not exists public.komponen (
  id       uuid primary key default gen_random_uuid(),
  kelas_id uuid not null references public.kelas on delete cascade,
  jenis    text not null check (jenis in ('formatif', 'lingkup')),
  urutan   integer not null,
  label    text not null,
  band_min numeric not null default 80,
  band_max numeric not null default 100
);

create index if not exists komponen_kelas_idx on public.komponen (kelas_id, jenis, urutan);

create table if not exists public.nilai_komponen (
  siswa_id    uuid not null references public.siswa on delete cascade,
  komponen_id uuid not null references public.komponen on delete cascade,
  skor        numeric not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (siswa_id, komponen_id)
);

-- ----------------------------------------------------------------- asesmen --
-- ASTS / ASAS / ASAT. Bobot butir dan konstanta dibuat eksplisit, bukan
-- ditanam di rumus seperti (A*2)+(B*2)+C lalu (85+skor)/2.

create table if not exists public.asesmen (
  id        uuid primary key default gen_random_uuid(),
  kelas_id  uuid not null references public.kelas on delete cascade,
  jenis     text not null check (jenis in ('ASTS', 'ASAS', 'ASAT')),
  bobot_a   numeric not null default 2,
  bobot_b   numeric not null default 2,
  bobot_c   numeric not null default 1,
  konstanta numeric not null default 85,
  pembagi   numeric not null default 2 check (pembagi <> 0),
  unique (kelas_id, jenis)
);

create table if not exists public.nilai_asesmen (
  siswa_id   uuid not null references public.siswa on delete cascade,
  asesmen_id uuid not null references public.asesmen on delete cascade,
  a          numeric not null default 0,
  b          numeric not null default 0,
  c          numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (siswa_id, asesmen_id)
);

-- --------------------------------------------------------------------- RLS --
-- Setiap guru hanya melihat datanya sendiri. Tabel nilai dijangkau lewat
-- siswa -> kelas -> guru_id.

alter table public.profiles       enable row level security;
alter table public.mapel          enable row level security;
alter table public.kelas          enable row level security;
alter table public.siswa          enable row level security;
alter table public.komponen       enable row level security;
alter table public.nilai_komponen enable row level security;
alter table public.asesmen        enable row level security;
alter table public.nilai_asesmen  enable row level security;

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for all using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists mapel_own on public.mapel;
create policy mapel_own on public.mapel
  for all using (guru_id = (select auth.uid())) with check (guru_id = (select auth.uid()));

drop policy if exists kelas_own on public.kelas;
create policy kelas_own on public.kelas
  for all using (guru_id = (select auth.uid())) with check (guru_id = (select auth.uid()));

drop policy if exists siswa_own on public.siswa;
create policy siswa_own on public.siswa
  for all using (
    exists (select 1 from public.kelas k where k.id = siswa.kelas_id and k.guru_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.kelas k where k.id = siswa.kelas_id and k.guru_id = (select auth.uid()))
  );

drop policy if exists komponen_own on public.komponen;
create policy komponen_own on public.komponen
  for all using (
    exists (select 1 from public.kelas k where k.id = komponen.kelas_id and k.guru_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.kelas k where k.id = komponen.kelas_id and k.guru_id = (select auth.uid()))
  );

drop policy if exists asesmen_own on public.asesmen;
create policy asesmen_own on public.asesmen
  for all using (
    exists (select 1 from public.kelas k where k.id = asesmen.kelas_id and k.guru_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.kelas k where k.id = asesmen.kelas_id and k.guru_id = (select auth.uid()))
  );

drop policy if exists nilai_komponen_own on public.nilai_komponen;
create policy nilai_komponen_own on public.nilai_komponen
  for all using (
    exists (
      select 1 from public.siswa s
      join public.kelas k on k.id = s.kelas_id
      where s.id = nilai_komponen.siswa_id and k.guru_id = (select auth.uid())
    )
  ) with check (
    exists (
      select 1 from public.siswa s
      join public.kelas k on k.id = s.kelas_id
      where s.id = nilai_komponen.siswa_id and k.guru_id = (select auth.uid())
    )
  );

drop policy if exists nilai_asesmen_own on public.nilai_asesmen;
create policy nilai_asesmen_own on public.nilai_asesmen
  for all using (
    exists (
      select 1 from public.siswa s
      join public.kelas k on k.id = s.kelas_id
      where s.id = nilai_asesmen.siswa_id and k.guru_id = (select auth.uid())
    )
  ) with check (
    exists (
      select 1 from public.siswa s
      join public.kelas k on k.id = s.kelas_id
      where s.id = nilai_asesmen.siswa_id and k.guru_id = (select auth.uid())
    )
  );
