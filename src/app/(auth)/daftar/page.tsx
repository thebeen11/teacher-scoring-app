import Link from 'next/link'
import FormDaftar from './form'

export default function HalamanDaftar() {
  return (
    <div className="papan p-7 sm:p-8">
      <h1 className="text-[1.375rem] leading-tight font-semibold tracking-[-0.01em]">
        Buat akun
      </h1>
      <p className="keterangan mt-1 mb-6">Daftar untuk mulai mengolah nilai siswa.</p>
      <FormDaftar />
      <p className="keterangan text-center mt-6 pt-5 border-t border-[color:var(--color-garis)]">
        Sudah punya akun? <Link href="/masuk">Masuk di sini</Link>
      </p>
    </div>
  )
}
