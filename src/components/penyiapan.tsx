import Halaman from './halaman'

/**
 * Ditampilkan saat NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY belum diisi, supaya
 * jalan pertama tidak berakhir dengan galat runtime yang tidak menjelaskan apa
 * pun.
 */
export default function Penyiapan() {
  return (
    <Halaman lebar="fokus" className="min-h-screen">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold tracking-[0.04em] text-[color:var(--color-aksen-gelap)] bg-[color:var(--color-sorot)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-aksen)]" />
        Penyiapan · satu langkah lagi
      </div>
      <h1 className="text-[28px] sm:text-[34px] leading-[1.15] font-semibold tracking-[-0.01em] mt-5 mb-2">
        nilaiHub belum terhubung ke Supabase
      </h1>
      <p className="keterangan mb-7">
        Kunci proyek tidak disimpan di repo. Isi sendiri, lalu muat ulang halaman ini.
      </p>

      <ol className="flex flex-col gap-7 list-none m-0 p-0">
        <li className="papan-neu p-6">
          <div className="mikro mb-2">1 · ISI KUNCI</div>
          <p className="keterangan mb-2">
            Salin dari <em>Project Settings → API</em> ke berkas{' '}
            <code className="text-[12px]">.env.local</code> di akar proyek:
          </p>
          <pre className="bg-[color:var(--color-kepala)] rounded-[var(--r-kecil)] px-4 py-3 text-[12px] overflow-x-auto m-0">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...`}
          </pre>
        </li>

        <li className="papan-neu p-6">
          <div className="mikro mb-2">2 · TERAPKAN SKEMA</div>
          <p className="keterangan mb-2">
            Lewat CLI — menyambung langsung ke Postgres remote, tanpa Docker:
          </p>
          <pre className="bg-[color:var(--color-kepala)] rounded-[var(--r-kecil)] px-4 py-3 text-[12px] overflow-x-auto m-0">
{`SUPABASE_DB_URL=postgresql://postgres:SANDI@db.REF.supabase.co:5432/postgres

pnpm db:push`}
          </pre>
          <p className="keterangan mt-2 text-[11px]">
            Connection string ada di <em>Project Settings → Database</em>. Perintahnya
            menembak basis data langsung, jadi tidak perlu{' '}
            <code className="text-[12px]">supabase login</code> maupun{' '}
            <code className="text-[12px]">link</code> — akun mana yang sedang login di CLI
            tidak berpengaruh. Alternatifnya, tempelkan isi{' '}
            <code className="text-[12px]">supabase/migrations/*.sql</code> ke SQL Editor di
            dasbor.
          </p>
        </li>

        <li className="papan-neu p-6">
          <div className="mikro mb-2">3 · MULAI ULANG</div>
          <p className="keterangan">
            Hentikan lalu jalankan lagi <code className="text-[12px]">pnpm dev</code> —
            variabel lingkungan hanya dibaca saat proses dimulai.
          </p>
        </li>
      </ol>

      <p className="keterangan mt-6">
        Perhitungannya sendiri tidak bergantung pada basis data: jalankan{' '}
        <code className="text-[12px]">pnpm test</code> untuk memverifikasi seluruh rantai
        rumus — formatif, nilai sumatif, asesmen, sampai nilai raport — atas satu kelas
        contoh berisi 30 siswa.
      </p>
    </Halaman>
  )
}
