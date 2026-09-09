-- Nama kolom + sub-formatif
--
-- Dua penambahan pada public.komponen:
--
--  1. `nama` — nama bebas dari guru ("Ulangan Bab 1"). Kode di `label` (F1, LM2)
--     tetap dibangkitkan otomatis dan tidak pernah berubah, supaya kepala kolom
--     yang sempit dan lembar cetak selalu punya sebutan pendek.
--  2. `induk_id` — sebuah kolom formatif boleh dipecah jadi beberapa sub. Bila
--     ada sub, skor mentah induk tidak lagi diketik: ia rerata skor sub-subnya,
--     dihitung di src/lib/nilai.ts seperti seluruh angka turunan yang lain.
--
-- Baris lama ikut default: nama '' dan induk_id null, jadi perilakunya persis
-- seperti sebelum migrasi ini. Tidak ada backfill.

alter table public.komponen
  add column if not exists nama     text not null default '',
  add column if not exists induk_id uuid references public.komponen(id) on delete cascade;

create index if not exists komponen_induk_idx on public.komponen (induk_id, urutan);

-- Pohon dibatasi satu tingkat, dan sub selalu sekelas serta sejenis dengan
-- induknya. Check constraint tidak bisa melihat baris lain, jadi penjaganya
-- berupa trigger.

create or replace function public.komponen_sub_valid()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  induk public.komponen%rowtype;
begin
  if new.induk_id is null then
    return new;
  end if;

  if new.induk_id = new.id then
    raise exception 'Kolom tidak boleh menjadi induk dirinya sendiri';
  end if;

  select * into induk from public.komponen where id = new.induk_id;

  if not found then
    raise exception 'Induk % tidak ditemukan', new.induk_id;
  end if;

  if induk.induk_id is not null then
    raise exception 'Sub-komponen hanya boleh satu tingkat';
  end if;

  if exists (select 1 from public.komponen where induk_id = new.id) then
    raise exception 'Kolom yang sudah punya sub tidak boleh dijadikan sub';
  end if;

  if induk.kelas_id <> new.kelas_id then
    raise exception 'Sub-komponen harus sekelas dengan induknya';
  end if;

  if induk.jenis <> new.jenis then
    raise exception 'Sub-komponen harus sejenis dengan induknya';
  end if;

  return new;
end;
$$;

drop trigger if exists komponen_sub_valid on public.komponen;
create trigger komponen_sub_valid
  before insert or update of induk_id, kelas_id, jenis on public.komponen
  for each row execute function public.komponen_sub_valid();
