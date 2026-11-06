import Link from 'next/link'
import FormMasuk from './form'

export default async function HalamanMasuk({
  searchParams,
}: {
  searchParams: Promise<{ lanjut?: string }>
}) {
  const { lanjut } = await searchParams

  return (
    <div className="papan p-7 sm:p-8">
      <h1 className="text-[1.375rem] leading-tight font-semibold tracking-[-0.01em]">
        Masuk
      </h1>
      <p className="keterangan mt-1 mb-6">Masuk untuk mengelola nilai siswa Anda.</p>
      <FormMasuk lanjut={lanjut ?? '/'} />
      <p className="keterangan text-center mt-6 pt-5 border-t border-[color:var(--color-garis)]">
        Belum punya akun? <Link href="/daftar">Daftar di sini</Link>
      </p>
    </div>
  )
}
