import { komponenOf, subOf, type Asesmen, type HasilKelas, type JenisKomponen, type Kelas } from './nilai'

/**
 * Ekspor nilai — satu `Lembar` per layar, dipakai oleh DUA keluaran: penulis
 * .xlsx dan halaman cetak. Kolomnya ditulis sekali di sini, jadi menambah satu
 * kolom tidak berarti menyunting dua tempat.
 *
 * Angka tetap `number` (bukan teks "78,5") supaya di Excel masih bisa dihitung;
 * pemformatan desimal diserahkan ke perender masing-masing.
 */

export type Sel = number | string | null

export type KolomLembar = {
  label: string
  /** Kepala tingkat atas — kolom berurutan dengan grup sama digabung. */
  grup?: string
  /** Garis pemisah kelompok di kanan kolom. */
  sekat?: boolean
  /** Kolom teks (rata kiri). */
  teks?: boolean
  /** Angka bulat — tanpa desimal. */
  bulat?: boolean
}

export type Lembar = {
  judul: string
  /** Nama tab di workbook (≤31 karakter, tanpa karakter terlarang). */
  namaSheet: string
  kolom: KolomLembar[]
  baris: Sel[][]
}

export type JenisEkspor = 'formatif' | 'lingkup' | 'tengah' | 'akhir' | 'daftar'
export const JENIS_EKSPOR: readonly JenisEkspor[] = ['formatif', 'lingkup', 'tengah', 'akhir', 'daftar']

export function jenisEksporSah(x: string): x is JenisEkspor {
  return (JENIS_EKSPOR as readonly string[]).includes(x)
}

export type SlotAsesmen = 'tengah' | 'akhir'

/** Slot "tengah" memegang ASTS; slot "akhir" memegang ASAS/ASAT. */
export function asesmenSlot(kelas: Kelas, slot: SlotAsesmen): Asesmen | undefined {
  return kelas.asesmen.find((a) => (slot === 'tengah' ? a.jenis === 'ASTS' : a.jenis !== 'ASTS'))
}

const KOLOM_AWAL: KolomLembar[] = [
  { label: 'NO', bulat: true },
  { label: 'NAMA PESERTA DIDIK', teks: true, sekat: true },
]

function namaKomponen(k: { label: string; nama: string }) {
  return k.nama ? `${k.label} · ${k.nama}` : k.label
}

// --------------------------------------------------------- formatif/sumatif --

export function lembarKomponen(kelas: Kelas, hasil: HasilKelas, jenis: JenisKomponen): Lembar {
  const formatif = jenis === 'formatif'
  const kolomAtas = komponenOf(kelas, jenis)

  const kolom: KolomLembar[] = [...KOLOM_AWAL]
  for (const k of kolomAtas) {
    const grup = namaKomponen(k)
    const sub = subOf(kelas, k.id)
    for (const s of sub) kolom.push({ label: s.nama || s.label, grup })
    kolom.push({ label: sub.length ? 'RERATA' : 'SKOR', grup })
    kolom.push({ label: 'NILAI', grup, sekat: true })
  }
  kolom.push({ label: formatif ? 'RT F' : 'RT S' })

  const baris = hasil.baris.map((b) => {
    const r: Sel[] = [b.siswa.noUrut, b.siswa.nama]
    for (const c of formatif ? b.formatif : b.lingkup) {
      for (const s of c.sub) r.push(s.mentah)
      r.push(c.mentah, c.konversi)
    }
    r.push(formatif ? b.rtF : b.rtNS)
    return r
  })

  const judul = formatif ? 'NILAI FORMATIF' : 'NILAI SUMATIF'
  return { judul, namaSheet: formatif ? 'Formatif' : 'Sumatif', kolom, baris }
}

// ----------------------------------------------------------------- asesmen --

export function lembarAsesmen(kelas: Kelas, hasil: HasilKelas, slot: SlotAsesmen): Lembar | null {
  const a = asesmenSlot(kelas, slot)
  if (!a) return null
  const i = kelas.asesmen.indexOf(a)
  const langsung = a.mode === 'langsung'

  const kolom: KolomLembar[] = [
    ...KOLOM_AWAL,
    ...(langsung
      ? []
      : [
          { label: `A (×${a.bobotA})` },
          { label: `B (×${a.bobotB})` },
          { label: `C (×${a.bobotC})` },
        ]),
    { label: 'SKOR', sekat: true },
    { label: 'NILAI' },
  ]

  const baris = hasil.baris.map((b) => {
    const h = b.asesmen[i]
    const r: Sel[] = [b.siswa.noUrut, b.siswa.nama]
    if (!langsung) r.push(h?.butir.a ?? 0, h?.butir.b ?? 0, h?.butir.c ?? 0)
    r.push(h?.total ?? 0, h?.nilai ?? 0)
    return r
  })

  const judul =
    slot === 'tengah'
      ? `ASESMEN TENGAH SEMESTER (${a.jenis})`
      : `ASESMEN AKHIR ${a.jenis === 'ASAT' ? 'TAHUN' : 'SEMESTER'} (${a.jenis})`
  return { judul, namaSheet: a.jenis, kolom, baris }
}

// ------------------------------------------------------------ daftar nilai --

/** Kolom sama dengan `TabelDaftar`. */
export function lembarDaftar(kelas: Kelas, hasil: HasilKelas): Lembar {
  const kolom: KolomLembar[] = [
    ...KOLOM_AWAL,
    { label: 'RT F' },
    { label: 'RT S', sekat: true },
    ...kelas.asesmen.map((a) => ({ label: a.jenis })),
    { label: 'RT AS', sekat: true },
    { label: 'NA' },
    { label: 'RAPORT', bulat: true },
    { label: 'STATUS', teks: true },
  ]

  const baris = hasil.baris.map((b): Sel[] => [
    b.siswa.noUrut,
    b.siswa.nama,
    b.rtF,
    b.rtNS,
    ...kelas.asesmen.map((_, i) => b.asesmen[i]?.nilai ?? 0),
    b.rtA,
    b.na,
    b.raport,
    b.tuntas ? 'TUNTAS' : 'BELUM',
  ])

  return { judul: 'DAFTAR NILAI PESERTA DIDIK', namaSheet: 'Daftar Nilai', kolom, baris }
}

// ------------------------------------------------------------------ umum --

export function lembarUntuk(kelas: Kelas, hasil: HasilKelas, jenis: JenisEkspor): Lembar | null {
  switch (jenis) {
    case 'formatif':
    case 'lingkup':
      return lembarKomponen(kelas, hasil, jenis)
    case 'tengah':
    case 'akhir':
      return lembarAsesmen(kelas, hasil, jenis)
    case 'daftar':
      return lembarDaftar(kelas, hasil)
  }
}

/** Seluruh lembar, urut seperti navigasi: Formatif, Sumatif, ASTS, ASAS/ASAT, Daftar. */
export function semuaLembar(kelas: Kelas, hasil: HasilKelas): Lembar[] {
  return JENIS_EKSPOR.map((j) => lembarUntuk(kelas, hasil, j)).filter((l): l is Lembar => l !== null)
}

/** Baris keterangan di atas tabel — pasangan label/isi. */
export function kopLembar(kelas: Kelas, hasil: HasilKelas): [string, string][] {
  const [naMin, naMax] = hasil.naRange
  const d = (x: number) => x.toFixed(1).replace('.', ',')
  const b = kelas.bobot
  return [
    ['Kelas', kelas.nama],
    ['Semester', `${kelas.semester} · ${kelas.tahunAjaran}`],
    ['KKTP', String(kelas.kktp)],
    ['Bobot', `F ${b.formatif} · S ${b.sumatif} · AST ${b.tengah} · AAS ${b.akhir}`],
    ['NA', `${d(naMin)}–${d(naMax)} → rentang ${kelas.naBandMin}–${kelas.naBandMax}`],
    ['Tuntas', `${hasil.jumlahTuntas} · belum ${hasil.jumlahBelum}`],
  ]
}

export function namaBerkas(kelas: Kelas, judul: string): string {
  const bersih = (s: string) => s.replace(/[\\/:*?"<>|]+/g, '-').trim()
  return bersih(`${judul} - ${kelas.nama} - ${kelas.tahunAjaran} S${kelas.semester}`) + '.xlsx'
}
