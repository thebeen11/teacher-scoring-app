# Olah Nilai

Aplikasi olah nilai untuk guru — pengganti workbook `OLAH NILAI.xlsx`.

Tiga lapis entri (**formatif**, **nilai sumatif**, **asesmen sumatif**) bermuara ke
satu **daftar nilai** yang seluruhnya turunan. Yang membedakannya dari spreadsheet:
setiap variabel rescale — min/maks kelas, band tujuan per kolom, bobot proses : asesmen,
KKTP — ditampilkan di tempat ia berpengaruh, bukan disembunyikan di baris kaki blok.

Dibangun dari papan desain `Olah Nilai.dc.html` (Claude Design).

## Menjalankan

Butuh Node 20.9+ dan pnpm (versinya dipatok lewat `packageManager`, jadi `corepack enable`
sudah cukup).

```bash
pnpm install
```

Buat `.env.local` (salin dari `.env.local.example`) dan isi dari dasbor Supabase,
**Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Lalu tambahkan connection string basis data ke `.env.local` yang sama
(**Project Settings → Database → Connection string → URI**) dan terapkan skemanya:

```
SUPABASE_DB_URL=postgresql://postgres:SANDI@db.REF.supabase.co:5432/postgres
```

```bash
pnpm db:push
```

`db:push` menyambung langsung ke Postgres remote lewat `--db-url` — **tidak butuh
Docker, tidak butuh `supabase login`, tidak butuh `supabase link`**. Itu disengaja:
Supabase CLI hanya menyimpan satu sesi login global, sedangkan proyek ini bisa saja
berada di akun yang berbeda dari akun yang biasa dipakai di mesin yang sama. Dengan
menembak basis data langsung, akun mana yang sedang login tidak berpengaruh.

Pakai koneksi langsung atau session pooler (port 5432); transaction pooler (6543) tidak
cocok untuk migrasi. Percent-encode sandi bila mengandung `@ : / ? #` atau spasi.
Tambahkan `--dry-run` untuk melihat dulu apa yang akan dijalankan. Kalau lebih suka lewat
peramban, isi `supabase/migrations/*.sql` juga bisa ditempel ke SQL Editor di dasbor.

```bash
pnpm dev          # http://localhost:3000
pnpm test         # verifikasi rumus terhadap workbook asli
pnpm lint
pnpm build
```

Selama `.env.local` belum diisi, halaman depan menampilkan petunjuk penyiapan, bukan
galat runtime.

### Perintah basis data

| Perintah | Guna |
| --- | --- |
| `pnpm db:push` | Terapkan migrasi yang belum jalan |
| `pnpm db:status` | Lihat migrasi mana yang sudah dan belum jalan |
| `pnpm db:new <nama>` | Buat berkas migrasi baru bertimestamp |
| `pnpm db:types` | Hasilkan `src/lib/database.types.ts` dari skema langsung |

Ketiganya lewat `scripts/db.sh`, yang memuat `.env.local` lalu meneruskan
`SUPABASE_DB_URL` sebagai `--db-url`. Rahasianya tidak pernah lewat argumen baris
perintah, jadi tidak bocor ke riwayat shell atau daftar proses.

CLI-nya ikut sebagai devDependency, jadi versinya terkunci di lockfile dan tidak perlu
dipasang terpisah. Catatan pnpm: `supabase` dan `unrs-resolver` terdaftar di
`pnpm.onlyBuiltDependencies` karena pnpm 10 tidak menjalankan lifecycle script dependensi
secara bawaan — tanpa itu binari CLI tidak terunduh dan `pnpm lint` gagal.

## Rantai perhitungan

```
skor mentah  --rescale per kolom-->  nilai konversi  --rerata-->  RT F, RT S
butir A/B/C  --(A·wa + B·wb + C·wc)-->  SKOR  --(k + SKOR)/p-->  nilai asesmen
RT F, RT S, RT AS  --bobot-->  NA  --rescale ke band-->  NILAI RAPORT
```

Rescale-nya rumus yang di workbook tertulis
`(NA − NA MIN) × (NK MAX − NK MIN) : (NA MAX − NA MIN) + NK MIN`.

Dua sifat yang menentukan arsitekturnya:

1. **Min/maks bersifat sekelas.** Mengubah satu sel menggeser nilai konversi *setiap*
   siswa di kolom itu. Karena itu seluruh kelas ada di memori dan dihitung ulang tiap
   ketukan — lihat `src/lib/store.tsx`.
2. **Tidak ada angka turunan yang disimpan.** Basis data hanya memuat skor mentah dan
   variabel skala. Tidak ada sel hasil yang bisa basi atau tertimpa.

Poin kedua bukan teori. Saat memverifikasi port ini terhadap workbook asli, dua sel
ternyata rumusnya sudah tertimpa ketikan tangan — `DafNil S 1` R19 dan R28 — sehingga
dua siswa memperoleh nilai raport yang lebih rendah satu poin dari yang seharusnya.
Keduanya terdokumentasi di `src/lib/nilai.test.ts`.

## Verifikasi

`pnpm test` menjalankan 57 pengujian. Lima puluh dua di antaranya atas
`src/lib/nilai.ts`, termasuk seluruh rantai untuk **30 siswa asli kelas VIII A**
yang diekstrak dari workbook (`src/lib/__fixtures__/viii-a.json`):

- min/maks tiap kolom cocok dengan baris kaki blok di lembar Forf dan Sums
- NA tiap siswa cocok sampai 9 angka desimal dengan kolom Q lembar DafNil
- nilai raport cocok dengan kolom S, kecuali dua sel tertimpa di atas
- mengubah skor satu siswa terbukti menggeser konversi siswa lain

Sisanya di `src/components/kendali.test.ts`: penyaring minus pada kotak ketik —
tidak ada angka di aplikasi ini yang boleh negatif, dan sel yang sedang
dikosongkan untuk diketik ulang harus tetap kosong, bukan dipaksa jadi nol.

## Struktur

```
src/lib/nilai.ts        inti perhitungan — murni, tanpa React maupun Supabase
src/lib/store.tsx       state satu grup kelas + penyimpanan tertunda ke Supabase
src/lib/data.ts         pemuat: satu kelas selalu dimuat bersama segrupnya
src/app/kelas/[id]/     tujuh layar: dasbor, formatif, lingkup, asesmen,
                        daftar (+ cetak), siswa, skala, dan kelola
supabase/migrations/    skema + RLS
```

Satu kelas tidak pernah dimuat sendirian: seluruh kelas dengan mapel dan semester yang
sama ikut dimuat. Dasbor menampilkan kartu tiap kelas, penukar kelas butuh daftarnya,
dan mode min/maks “Semua kelas” menghitung rentang lintas kelas — persis seperti sel
`U12`/`U13` di lembar DafNil yang berbunyi `MIN(Q10:Q39, Q65:Q96, Q120:Q151)`.

## Catatan kesetiaan pada workbook

Workbook aslinya sebenarnya **campuran**: min/maks tiap kolom formatif/lingkup dihitung
per kelas, tetapi rentang NA untuk nilai raport diambil dari seluruh angkatan.
Aplikasi ini mengikuti papan desain, yang menyatukan keduanya jadi satu sakelar
“Sumber min/maks” — jadi tidak ada satu setelan pun yang meniru workbook persis.
Selisihnya kecil, tetapi nyata; kalau perlu, sakelar itu bisa dipecah dua.
