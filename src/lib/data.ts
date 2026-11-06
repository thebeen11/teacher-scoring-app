import 'server-only'
import { buatKlienServer } from '@/lib/supabase/server'
import type { Asesmen, Kelas, Komponen, Siswa } from '@/lib/nilai'

/**
 * Pemuat data.
 *
 * Satu kelas tidak pernah dimuat sendirian: seluruh kelas dengan mapel dan
 * semester yang sama ikut dimuat sebagai satu grup. Tiga alasan:
 *
 *  - Dasbor menampilkan kartu untuk setiap kelas.
 *  - Penukar kelas di kepala halaman butuh daftarnya.
 *  - Mode min/maks 'sekolah' menghitung rentang lintas kelas — persis seperti
 *    sel U12/U13 di lembar DafNil yang berbunyi
 *    MIN(Q10:Q39, Q65:Q96, Q120:Q151), yaitu ketiga blok kelas sekaligus.
 *
 * Ukurannya kecil (satu angkatan ~100 siswa), jadi memuat semuanya jauh lebih
 * sederhana daripada menghitung sebagian di SQL dan sebagian di klien.
 */

type BarisKelas = {
  id: string
  mapel_id: string
  nama: string
  tahun_ajaran: string
  semester: number
  kktp: number
  bobot_formatif: number
  bobot_sumatif: number
  bobot_tengah: number
  bobot_akhir: number
  na_band_min: number
  na_band_max: number
  sumber_minmaks: 'kelas' | 'sekolah'
}

export type Mapel = { id: string; nama: string }

export type GrupKelas = {
  mapel: Mapel
  /** Kelas yang sedang dibuka. */
  aktif: Kelas
  /** Seluruh kelas dengan mapel + semester yang sama, termasuk yang aktif. */
  grup: Kelas[]
}

function rakitKelas(
  k: BarisKelas,
  siswa: Siswa[],
  komponen: Komponen[],
  asesmen: Asesmen[],
  skorKomponen: Kelas['skorKomponen'],
  skorAsesmen: Kelas['skorAsesmen'],
): Kelas {
  return {
    id: k.id,
    mapelId: k.mapel_id,
    nama: k.nama,
    tahunAjaran: k.tahun_ajaran,
    semester: k.semester,
    kktp: Number(k.kktp),
    bobot: {
      formatif: Number(k.bobot_formatif),
      sumatif: Number(k.bobot_sumatif),
      tengah: Number(k.bobot_tengah),
      akhir: Number(k.bobot_akhir),
    },
    naBandMin: Number(k.na_band_min),
    naBandMax: Number(k.na_band_max),
    sumberMinMaks: k.sumber_minmaks,
    siswa,
    komponen,
    asesmen,
    skorKomponen,
    skorAsesmen,
  }
}

export async function muatGrup(kelasId: string): Promise<GrupKelas | null> {
  const supabase = await buatKlienServer()

  const { data: fokus } = await supabase
    .from('kelas')
    .select('id, mapel_id, semester')
    .eq('id', kelasId)
    .maybeSingle()

  if (!fokus) return null

  const [{ data: mapel }, { data: kelasRows }] = await Promise.all([
    supabase.from('mapel').select('id, nama').eq('id', fokus.mapel_id).maybeSingle(),
    supabase
      .from('kelas')
      .select(
        'id, mapel_id, nama, tahun_ajaran, semester, kktp, bobot_formatif, bobot_sumatif, bobot_tengah, bobot_akhir, na_band_min, na_band_max, sumber_minmaks',
      )
      .eq('mapel_id', fokus.mapel_id)
      .eq('semester', fokus.semester)
      .order('nama'),
  ])

  if (!mapel || !kelasRows?.length) return null

  const kelasIds = kelasRows.map((k) => k.id)

  const [{ data: siswaRows }, { data: komponenRows }, { data: asesmenRows }] = await Promise.all([
    supabase.from('siswa').select('*').in('kelas_id', kelasIds).order('no_urut'),
    supabase.from('komponen').select('*').in('kelas_id', kelasIds).order('urutan'),
    supabase.from('asesmen').select('*').in('kelas_id', kelasIds),
  ])

  const siswaIds = (siswaRows ?? []).map((s) => s.id)

  const [{ data: nkRows }, { data: naRows }] = siswaIds.length
    ? await Promise.all([
        supabase.from('nilai_komponen').select('*').in('siswa_id', siswaIds),
        supabase.from('nilai_asesmen').select('*').in('siswa_id', siswaIds),
      ])
    : [{ data: [] }, { data: [] }]

  // Kelompokkan sekali, lalu rakit tiap kelas.
  const perKelas = <T extends { kelas_id: string }>(rows: T[] | null) => {
    const peta = new Map<string, T[]>()
    for (const r of rows ?? []) {
      const arr = peta.get(r.kelas_id)
      if (arr) arr.push(r)
      else peta.set(r.kelas_id, [r])
    }
    return peta
  }

  const siswaPer = perKelas(siswaRows)
  const komponenPer = perKelas(komponenRows)
  const asesmenPer = perKelas(asesmenRows)

  const skorKomponenGlobal: Kelas['skorKomponen'] = {}
  for (const r of nkRows ?? []) {
    ;(skorKomponenGlobal[r.siswa_id] ??= {})[r.komponen_id] = Number(r.skor)
  }
  const skorAsesmenGlobal: Kelas['skorAsesmen'] = {}
  for (const r of naRows ?? []) {
    ;(skorAsesmenGlobal[r.siswa_id] ??= {})[r.asesmen_id] = {
      a: Number(r.a),
      b: Number(r.b),
      c: Number(r.c),
      skor: Number(r.skor_langsung ?? 0),
    }
  }

  const grup = kelasRows.map((k) => {
    const siswa: Siswa[] = (siswaPer.get(k.id) ?? []).map((s) => ({
      id: s.id,
      noUrut: s.no_urut,
      nama: s.nama,
      jk: s.jk,
    }))

    const komponen: Komponen[] = (komponenPer.get(k.id) ?? []).map((c) => ({
      id: c.id,
      jenis: c.jenis,
      urutan: c.urutan,
      // Database tetap menyimpan LM1, LM2, ...; tampilan memakai S (Sumatif).
      label: c.label.replace(/^LM/, 'S'),
      nama: c.nama ?? '',
      indukId: c.induk_id ?? null,
      bandMin: Number(c.band_min),
      bandMax: Number(c.band_max),
    }))

    const urutanAsesmen = { ASTS: 0, ASAS: 1, ASAT: 2 } as const
    const asesmen: Asesmen[] = (asesmenPer.get(k.id) ?? [])
      .map((a) => ({
        id: a.id,
        jenis: a.jenis as Asesmen['jenis'],
        mode: (a.mode === 'langsung' ? 'langsung' : 'bagian') as Asesmen['mode'],
        bobotA: Number(a.bobot_a),
        bobotB: Number(a.bobot_b),
        bobotC: Number(a.bobot_c),
        bandMin: Number(a.band_min ?? 80),
        bandMax: Number(a.band_max ?? 100),
      }))
      .sort((x, y) => urutanAsesmen[x.jenis] - urutanAsesmen[y.jenis])

    // Hanya bawa skor milik siswa kelas ini.
    const skorKomponen: Kelas['skorKomponen'] = {}
    const skorAsesmen: Kelas['skorAsesmen'] = {}
    for (const s of siswa) {
      skorKomponen[s.id] = skorKomponenGlobal[s.id] ?? {}
      skorAsesmen[s.id] = skorAsesmenGlobal[s.id] ?? {}
    }

    return rakitKelas(k, siswa, komponen, asesmen, skorKomponen, skorAsesmen)
  })

  const aktif = grup.find((k) => k.id === kelasId)
  if (!aktif) return null

  return { mapel: { id: mapel.id, nama: mapel.nama }, aktif, grup }
}

export type RingkasanKelas = {
  id: string
  nama: string
  semester: number
  tahunAjaran: string
  mapel: string
  jumlahSiswa: number
}

/** Daftar seluruh kelas milik guru, untuk halaman depan. */
export async function daftarKelas(): Promise<RingkasanKelas[]> {
  const supabase = await buatKlienServer()

  const { data } = await supabase
    .from('kelas')
    .select('id, nama, semester, tahun_ajaran, mapel(nama), siswa(count)')
    .order('created_at', { ascending: false })

  type Baris = {
    id: string
    nama: string
    semester: number
    tahun_ajaran: string
    mapel: { nama: string } | { nama: string }[] | null
    siswa: { count: number }[] | null
  }

  return ((data ?? []) as Baris[]).map((k) => ({
    id: k.id,
    nama: k.nama,
    semester: k.semester,
    tahunAjaran: k.tahun_ajaran,
    mapel: (Array.isArray(k.mapel) ? k.mapel[0]?.nama : k.mapel?.nama) ?? '—',
    jumlahSiswa: k.siswa?.[0]?.count ?? 0,
  }))
}
