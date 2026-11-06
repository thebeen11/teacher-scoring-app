'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { buatKlienServer } from '@/lib/supabase/server'
import type { Bobot } from '@/lib/nilai'

/**
 * Aksi yang mengubah STRUKTUR (kelas, roster, kolom nilai).
 *
 * Pengisian nilai harian tidak lewat sini — itu ditulis langsung dari peramban
 * dengan penundaan (lihat lib/store.tsx), karena tiap ketukan tombol memicu
 * perubahan dan tidak layak menempuh perjalanan pulang-pergi ke server.
 */

export type HasilAksi = { galat: string } | undefined

// Nilai bawaan diambil dari workbook VIII A: band formatif 80–100 seragam,
// band nilai sumatif berbeda-beda tiap kolom.
const BAND_FORMATIF: [number, number][] = [
  [80, 100],
  [80, 100],
  [80, 100],
  [80, 100],
]
const BAND_LINGKUP: [number, number][] = [
  [80, 96],
  [78, 98],
  [78, 98],
  [80, 100],
]

function uraikanRoster(teks: string) {
  return teks
    .split('\n')
    .map((b) => b.trim())
    .filter(Boolean)
    .map((baris, i) => {
      // "Nama" atau "Nama<tab>L" atau "1<tab>Nama<tab>P"
      const bagian = baris.split(/\t|\s{2,}|;/).map((x) => x.trim()).filter(Boolean)
      let jk: 'L' | 'P' | null = null
      const jkIdx = bagian.findIndex((x) => /^[LP]$/i.test(x))
      if (jkIdx >= 0) {
        jk = bagian[jkIdx].toUpperCase() as 'L' | 'P'
        bagian.splice(jkIdx, 1)
      }
      if (bagian.length > 1 && /^\d+$/.test(bagian[0])) bagian.shift()
      return { no_urut: i + 1, nama: bagian.join(' ').trim(), jk }
    })
    .filter((s) => s.nama.length > 0)
}

export async function buatKelas(_prev: HasilAksi, formData: FormData): Promise<HasilAksi> {
  const supabase = await buatKlienServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { galat: 'Sesi berakhir. Silakan masuk lagi.' }

  const mapelId = String(formData.get('mapel_id') ?? '').trim()
  const mapelBaru = String(formData.get('mapel_baru') ?? '').trim()
  const nama = String(formData.get('nama') ?? '').trim()
  const tahun = String(formData.get('tahun_ajaran') ?? '').trim() || '2025/2026'
  const semester = Number(formData.get('semester') ?? 1)
  const roster = uraikanRoster(String(formData.get('roster') ?? ''))

  if (!nama) return { galat: 'Nama kelas harus diisi.' }
  if (!mapelId && !mapelBaru) return { galat: 'Pilih mata pelajaran atau isi yang baru.' }

  let idMapel = mapelId
  if (!idMapel) {
    const { data, error } = await supabase
      .from('mapel')
      .insert({ guru_id: user.id, nama: mapelBaru })
      .select('id')
      .single()
    if (error || !data) return { galat: `Gagal membuat mata pelajaran: ${error?.message}` }
    idMapel = data.id
  }

  const { data: kelas, error: galatKelas } = await supabase
    .from('kelas')
    .insert({
      guru_id: user.id,
      mapel_id: idMapel,
      nama,
      tahun_ajaran: tahun,
      semester,
    })
    .select('id')
    .single()

  if (galatKelas || !kelas) return { galat: `Gagal membuat kelas: ${galatKelas?.message}` }

  const komponen = [
    ...BAND_FORMATIF.map((b, i) => ({
      kelas_id: kelas.id,
      jenis: 'formatif',
      urutan: i + 1,
      label: `F${i + 1}`,
      nama: `Bab ${i + 1}`,
      band_min: b[0],
      band_max: b[1],
    })),
    ...BAND_LINGKUP.map((b, i) => ({
      kelas_id: kelas.id,
      jenis: 'lingkup',
      urutan: i + 1,
      label: `LM${i + 1}`,
      nama: `Bab ${i + 1}`,
      band_min: b[0],
      band_max: b[1],
    })),
  ]

  const asesmen = (semester === 1 ? ['ASTS', 'ASAS'] : ['ASTS', 'ASAT']).map((jenis) => ({
    kelas_id: kelas.id,
    jenis,
  }))

  await Promise.all([
    supabase.from('komponen').insert(komponen),
    supabase.from('asesmen').insert(asesmen),
    roster.length
      ? supabase.from('siswa').insert(roster.map((s) => ({ ...s, kelas_id: kelas.id })))
      : Promise.resolve(),
  ])

  revalidatePath('/', 'layout')
  redirect(`/kelas/${kelas.id}/dasbor`)
}

export async function tambahSiswa(kelasId: string, formData: FormData): Promise<void> {
  const supabase = await buatKlienServer()
  const roster = uraikanRoster(String(formData.get('roster') ?? ''))
  if (!roster.length) return

  const { count } = await supabase
    .from('siswa')
    .select('id', { count: 'exact', head: true })
    .eq('kelas_id', kelasId)

  const mulai = count ?? 0
  await supabase
    .from('siswa')
    .insert(roster.map((s, i) => ({ ...s, no_urut: mulai + i + 1, kelas_id: kelasId })))

  revalidatePath(`/kelas/${kelasId}`, 'layout')
}

export async function ubahSiswa(kelasId: string, siswaId: string, formData: FormData) {
  const supabase = await buatKlienServer()
  const nama = String(formData.get('nama') ?? '').trim()
  const jkMentah = String(formData.get('jk') ?? '')
  if (!nama) return

  await supabase
    .from('siswa')
    .update({ nama, jk: jkMentah === 'L' || jkMentah === 'P' ? jkMentah : null })
    .eq('id', siswaId)

  revalidatePath(`/kelas/${kelasId}`, 'layout')
}

export async function hapusSiswa(kelasId: string, siswaId: string) {
  const supabase = await buatKlienServer()
  await supabase.from('siswa').delete().eq('id', siswaId)
  revalidatePath(`/kelas/${kelasId}`, 'layout')
}

/** Nama bebas kolom: dipangkas dan dibatasi 60 huruf. */
function rapikanNama(nama: string) {
  return String(nama ?? '').trim().slice(0, 60)
}

/**
 * Menambah satu kolom tingkat atas. Namanya wajib — layar entri meminta nama
 * lebih dulu supaya tidak ada kolom kosong tanpa nama yang diam-diam menarik
 * rerata turun. Mengembalikan id kolom baru agar tab-nya bisa langsung dibuka.
 */
export async function tambahKomponen(
  kelasId: string,
  jenis: 'formatif' | 'lingkup',
  namaMentah: string,
): Promise<string | null> {
  const nama = rapikanNama(namaMentah)
  if (!nama) return null
  const supabase = await buatKlienServer()

  // Hanya kolom tingkat atas yang bernomor F1..Fn; sub bernomor di dalam induk.
  const { data } = await supabase
    .from('komponen')
    .select('urutan')
    .eq('kelas_id', kelasId)
    .eq('jenis', jenis)
    .is('induk_id', null)
    .order('urutan', { ascending: false })
    .limit(1)

  const urutan = (data?.[0]?.urutan ?? 0) + 1
  const awalan = jenis === 'formatif' ? 'F' : 'LM'
  const band = jenis === 'formatif' ? [80, 100] : [80, 100]

  const { data: baru } = await supabase
    .from('komponen')
    .insert({
      kelas_id: kelasId,
      jenis,
      urutan,
      label: `${awalan}${urutan}`,
      nama,
      band_min: band[0],
      band_max: band[1],
    })
    .select('id')
    .single()

  revalidatePath(`/kelas/${kelasId}`, 'layout')
  return baru?.id ?? null
}

/**
 * Menambah satu sub pada kolom formatif.
 *
 * Begitu sebuah kolom punya sub, skornya tidak lagi diketik: ia rerata sub-nya
 * (lihat skorKolom di lib/nilai.ts). Band tetap milik induk, jadi sub sengaja
 * dibiarkan memakai band bawaan yang tidak dipakai siapa pun.
 */
export async function tambahSubKomponen(
  kelasId: string,
  indukId: string,
  namaMentah: string,
): Promise<string | null> {
  const nama = rapikanNama(namaMentah)
  if (!nama) return null
  const supabase = await buatKlienServer()

  const { data: induk } = await supabase
    .from('komponen')
    .select('id, kelas_id, jenis, label, induk_id')
    .eq('id', indukId)
    .maybeSingle()

  if (!induk || induk.kelas_id !== kelasId || induk.induk_id !== null) return null

  const { data } = await supabase
    .from('komponen')
    .select('urutan')
    .eq('induk_id', indukId)
    .order('urutan', { ascending: false })
    .limit(1)

  const urutan = (data?.[0]?.urutan ?? 0) + 1

  const { data: baru } = await supabase
    .from('komponen')
    .insert({
      kelas_id: kelasId,
      jenis: induk.jenis,
      induk_id: indukId,
      urutan,
      label: `${induk.label}.${urutan}`,
      nama,
    })
    .select('id')
    .single()

  revalidatePath(`/kelas/${kelasId}`, 'layout')
  return baru?.id ?? null
}

/** Nama bebas kolom. Kode di `label` tidak pernah ikut berubah; nama kosong
 *  membuat layar kembali menampilkan kodenya. */
export async function ubahNamaKomponen(kelasId: string, komponenId: string, namaMentah: string) {
  const supabase = await buatKlienServer()
  const nama = rapikanNama(namaMentah)

  await supabase.from('komponen').update({ nama }).eq('id', komponenId)
  revalidatePath(`/kelas/${kelasId}`, 'layout')
}

export async function hapusKomponen(kelasId: string, komponenId: string) {
  const supabase = await buatKlienServer()

  const { data: kolom } = await supabase
    .from('komponen')
    .select('jenis, induk_id')
    .eq('id', komponenId)
    .maybeSingle()

  if (kolom && kolom.induk_id === null) {
    // Jangan pernah menyisakan nol kolom: rerata kosong akan menarik NA turun
    // tanpa isyarat apa pun ke guru. Sub tidak ikut aturan ini — menghapus sub
    // terakhir hanya mengembalikan induknya jadi kolom yang diketik langsung.
    const { count } = await supabase
      .from('komponen')
      .select('id', { count: 'exact', head: true })
      .eq('kelas_id', kelasId)
      .eq('jenis', kolom.jenis)
      .is('induk_id', null)

    if ((count ?? 0) <= 1) return
  }

  await supabase.from('komponen').delete().eq('id', komponenId)
  revalidatePath(`/kelas/${kelasId}`, 'layout')
}

/**
 * Salin KKTP + bobot ke kelas lain milik guru. Nilainya dikirim dari peramban
 * (bukan dibaca dari baris sumber) supaya ketikan yang belum tersimpan ikut.
 * RLS membatasi pembaruan ke kelas milik pengguna sendiri.
 */
export async function terapkanPengaturan(
  kelasIds: string[],
  p: { kktp: number; bobot: Bobot },
): Promise<HasilAksi> {
  if (!Array.isArray(kelasIds) || kelasIds.length === 0) {
    return { galat: 'Pilih minimal satu kelas.' }
  }
  const angka = [p.kktp, p.bobot.formatif, p.bobot.sumatif, p.bobot.tengah, p.bobot.akhir]
  if (angka.some((v) => typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 100)) {
    return { galat: 'KKTP dan bobot harus berupa angka 0–100.' }
  }

  const supabase = await buatKlienServer()
  const { error } = await supabase
    .from('kelas')
    .update({
      kktp: p.kktp,
      bobot_formatif: p.bobot.formatif,
      bobot_sumatif: p.bobot.sumatif,
      bobot_tengah: p.bobot.tengah,
      bobot_akhir: p.bobot.akhir,
    })
    .in('id', kelasIds)

  if (error) return { galat: 'Gagal menerapkan pengaturan. Coba lagi.' }

  revalidatePath('/kelas', 'layout')
}

/**
 * Menghapus kelas beserta seluruh isinya (cascade). Pengguna harus mengetik
 * nama kelas di dialog; nama itu dicocokkan ulang di sini supaya pemeriksaan
 * tidak hanya hidup di peramban.
 */
export async function hapusKelas(kelasId: string, konfirmasi: string): Promise<HasilAksi> {
  const supabase = await buatKlienServer()
  const { data: kelas } = await supabase
    .from('kelas')
    .select('nama')
    .eq('id', kelasId)
    .maybeSingle()

  if (!kelas) return { galat: 'Kelas tidak ditemukan.' }
  if (String(konfirmasi ?? '').trim() !== kelas.nama.trim()) {
    return { galat: 'Nama kelas tidak cocok.' }
  }

  const { error } = await supabase.from('kelas').delete().eq('id', kelasId)
  if (error) return { galat: 'Gagal menghapus kelas. Coba lagi.' }

  revalidatePath('/', 'layout')
  redirect('/')
}

/**
 * Menonaktifkan (mengarsipkan) atau mengaktifkan lagi sebuah kelas. Kelas
 * nonaktif disembunyikan dari "Semua Kelas" dan pemilih kelas, datanya utuh.
 */
export async function aturAktifKelas(kelasId: string, aktif: boolean): Promise<HasilAksi> {
  const supabase = await buatKlienServer()
  const { error } = await supabase.from('kelas').update({ aktif }).eq('id', kelasId)
  if (error) return { galat: 'Gagal mengubah status kelas. Coba lagi.' }
  revalidatePath('/', 'layout')
}
