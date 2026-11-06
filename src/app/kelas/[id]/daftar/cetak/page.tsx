import { redirect } from 'next/navigation'

/** Tautan lama — halaman cetak kini satu rute untuk semua layar nilai. */
export default async function HalamanCetakLama({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/kelas/${id}/cetak/daftar`)
}
