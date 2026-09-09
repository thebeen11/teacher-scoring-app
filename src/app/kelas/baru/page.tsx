import Link from 'next/link'
import { buatKlienServer } from '@/lib/supabase/server'
import FormKelasBaru from './form'
import Halaman from '@/components/halaman'

export default async function HalamanKelasBaru() {
  const supabase = await buatKlienServer()
  const { data: mapel } = await supabase.from('mapel').select('id, nama').order('nama')

  return (
    <Halaman lebar="fokus" className="min-h-screen">
      <Link href="/" className="mikro">
        ← SEMUA KELAS
      </Link>
      <h1 className="judul mt-4">Kelas <span className="teks-gradien">baru</span></h1>
      <p className="keterangan mt-1.5 mb-6">
        Kolom F1–F4 dan LM1–LM4 beserta ASTS/ASAS dibuatkan otomatis dengan band bawaan, jadi
        kelas langsung siap diisi. Jumlah kolom, band, bobot, dan KKTP bisa diubah kapan saja
        setelah kelas jadi.
      </p>
      <FormKelasBaru mapel={mapel ?? []} />
    </Halaman>
  )
}
