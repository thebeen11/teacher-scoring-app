import Link from 'next/link'
import FormDaftar from './form'

export default function HalamanDaftar() {
  return (
    <div className="papan p-7">
      <div className="mikro mb-4">DAFTAR</div>
      <FormDaftar />
      <p className="keterangan mt-5 pt-4 border-t border-[color:var(--color-garis)]">
        Sudah punya akun? <Link href="/masuk">Masuk di sini</Link>.
      </p>
    </div>
  )
}
