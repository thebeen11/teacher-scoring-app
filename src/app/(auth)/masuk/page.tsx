import Link from 'next/link'
import FormMasuk from './form'

export default async function HalamanMasuk({
  searchParams,
}: {
  searchParams: Promise<{ lanjut?: string }>
}) {
  const { lanjut } = await searchParams

  return (
    <div className="papan p-7">
      <div className="mikro mb-4">MASUK</div>
      <FormMasuk lanjut={lanjut ?? '/'} />
      <p className="keterangan mt-5 pt-4 border-t border-[color:var(--color-garis)]">
        Belum punya akun? <Link href="/daftar">Daftar di sini</Link>.
      </p>
    </div>
  )
}
