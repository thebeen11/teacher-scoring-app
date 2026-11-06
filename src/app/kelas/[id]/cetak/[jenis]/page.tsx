import { notFound } from 'next/navigation'
import { jenisEksporSah } from '@/lib/ekspor'
import CetakLembar from './cetak-lembar'

export default async function HalamanCetak({
  params,
}: {
  params: Promise<{ id: string; jenis: string }>
}) {
  const { jenis } = await params
  if (!jenisEksporSah(jenis)) notFound()
  return <CetakLembar jenis={jenis} />
}
