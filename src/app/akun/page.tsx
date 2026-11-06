import Link from 'next/link'
import { penggunaSaatIni } from '@/lib/supabase/server'
import Halaman from '@/components/halaman'
import { FormProfil, FormSandi } from './form'

export default async function HalamanAkun() {
  const pengguna = await penggunaSaatIni()
  const meta = (pengguna?.user_metadata ?? {}) as { nama?: string }

  return (
    <Halaman lebar="fokus" className="min-h-screen">
      <Link href="/" className="mikro">
        ← SEMUA KELAS
      </Link>
      <h1 className="judul mt-4">Pengaturan akun</h1>
      <p className="keterangan mt-1.5 mb-6">Ubah nama yang tampil di aplikasi dan kata sandi untuk masuk.</p>

      <div className="flex flex-col gap-5">
        <FormProfil email={pengguna?.email ?? ''} nama={meta.nama ?? ''} />
        <FormSandi />
      </div>
    </Halaman>
  )
}
