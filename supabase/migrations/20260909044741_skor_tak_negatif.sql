-- Skor tidak boleh negatif
--
-- Skor mentah negatif bukan sekadar janggal — ia menular. Min/maks tiap kolom
-- bersifat sekelas (lihat bounds() di src/lib/nilai.ts), jadi satu sel `-5`
-- menarik turun batas bawah kolom dan menggeser nilai konversi SETIAP siswa di
-- kolom itu. Salah ketik satu tanda minus diam-diam mengubah rapor sekelas.
--
-- Penjaga utamanya ada di InputAngka (src/components/kendali.tsx), yang menolak
-- minus sebelum sempat masuk kotak ketik. Constraint di sini jaring pengaman
-- terakhir: skor ditulis langsung dari peramban ke Supabase, tanpa lewat aksi
-- server, jadi basis data adalah satu-satunya lapis yang tidak bisa dilewati.
--
-- Baris lama dijinakkan dulu: `add constraint` memvalidasi seluruh tabel dan
-- akan gagal kalau ada satu saja nilai negatif tersimpan.
--
-- Batas ATAS sengaja dibiarkan bebas. Skor mentah memang boleh melampaui 100 —
-- fixture viii-a.json bahkan memuat 200 — dan band tujuan bisa saja disetel di
-- luar 0–100 secara sah. Yang ditutup hanya sisi negatifnya.
--
-- kelas.kktp dan kelas.bobot sudah punya `check (… between 0 and 100)` sejak
-- migrasi awal, jadi tidak diulang di sini.

-- Skor mentah formatif / lingkup materi.

update public.nilai_komponen set skor = 0 where skor < 0;

alter table public.nilai_komponen
  add constraint nilai_komponen_skor_nonneg check (skor >= 0);

-- Butir A/B/C asesmen sumatif.

update public.nilai_asesmen set a = 0 where a < 0;
update public.nilai_asesmen set b = 0 where b < 0;
update public.nilai_asesmen set c = 0 where c < 0;

alter table public.nilai_asesmen
  add constraint nilai_asesmen_butir_nonneg check (a >= 0 and b >= 0 and c >= 0);

-- Band tujuan per kolom, dan band NA untuk nilai raport. Keduanya diketik lewat
-- InputAngka yang sama, jadi basis datanya ikut disejajarkan.

update public.komponen set band_min = 0 where band_min < 0;
update public.komponen set band_max = 0 where band_max < 0;

alter table public.komponen
  add constraint komponen_band_nonneg check (band_min >= 0 and band_max >= 0);

update public.kelas set na_band_min = 0 where na_band_min < 0;
update public.kelas set na_band_max = 0 where na_band_max < 0;

alter table public.kelas
  add constraint kelas_na_band_nonneg check (na_band_min >= 0 and na_band_max >= 0);
