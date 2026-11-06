import { notFound } from 'next/navigation'
import { daftarKelas, muatGrup } from '@/lib/data'
import { penggunaSaatIni } from '@/lib/supabase/server'
import { PenyediaKelas } from '@/lib/store'
import Cangkang from '@/components/cangkang'

export default async function LayoutKelas({
  params,
  children,
}: {
  params: Promise<{ id: string }>
  children: React.ReactNode
}) {
  const { id } = await params
  const [data, pengguna, semuaKelas] = await Promise.all([
    muatGrup(id),
    penggunaSaatIni(),
    daftarKelas(),
  ])

  if (!data) notFound()

  const meta = (pengguna?.user_metadata ?? {}) as { nama?: string; sekolah?: string }

  return (
    <PenyediaKelas awal={data.grup} aktifId={id} semuaKelas={semuaKelas}>
      <Cangkang
        mapel={data.mapel.nama}
        sekolah={meta.sekolah || 'Olah Nilai'}
        pengguna={{ nama: meta.nama || '', email: pengguna?.email || '' }}
        semuaKelas={semuaKelas}
      >
        {children}
      </Cangkang>
    </PenyediaKelas>
  )
}
