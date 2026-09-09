import { notFound } from 'next/navigation'
import { muatGrup } from '@/lib/data'
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
  const [data, pengguna] = await Promise.all([muatGrup(id), penggunaSaatIni()])

  if (!data) notFound()

  const meta = (pengguna?.user_metadata ?? {}) as { sekolah?: string }

  return (
    <PenyediaKelas awal={data.grup} aktifId={id}>
      <Cangkang mapel={data.mapel.nama} sekolah={meta.sekolah || 'Olah Nilai'}>
        {children}
      </Cangkang>
    </PenyediaKelas>
  )
}
