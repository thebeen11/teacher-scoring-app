/**
 * Inti perhitungan Olah Nilai.
 *
 * Modul ini murni: tidak menyentuh React maupun Supabase, sehingga bisa diuji
 * langsung dan dipakai ulang di server. Semua rumus di sini diverifikasi
 * terhadap workbook asal (OLAH NILAI.xlsx, lembar Forf / Sums / ASTS / ASAS /
 * DafNil) — lihat nilai.test.ts.
 *
 * Rantainya:
 *
 *   skor mentah --rescale per kolom--> nilai konversi --rerata--> RT F, RT LM
 *   butir A/B/C --(A*wa + B*wb + C*wc)--> SKOR --(k + SKOR)/p--> nilai asesmen
 *   RT F, RT LM, RT AS --bobot--> NA --rescale ke band--> NILAI RAPORT
 *
 * Dua sifat yang menentukan arsitektur aplikasi:
 *
 *  1. Min/maks bersifat SEKELAS. Mengubah satu sel menggeser nilai konversi
 *     SETIAP siswa di kolom itu. Karena itu seluruh kelas harus ada di memori
 *     dan dihitung ulang setiap kali ada perubahan.
 *  2. Tidak ada satu pun angka turunan yang disimpan. Semuanya dihitung ulang
 *     dari skor mentah.
 */

export type JenisKomponen = 'formatif' | 'lingkup'
export type JenisAsesmen = 'ASTS' | 'ASAS' | 'ASAT'
export type SumberMinMaks = 'kelas' | 'sekolah'

export type Komponen = {
  id: string
  jenis: JenisKomponen
  urutan: number
  /** Kode otomatis yang tidak pernah berubah: F1, LM2, F1.1. */
  label: string
  /** Nama bebas dari guru ("Ulangan Bab 1"); boleh kosong. */
  nama: string
  /** Berisi id induk bila kolom ini sub-formatif. */
  indukId: string | null
  bandMin: number
  bandMax: number
}

export type Asesmen = {
  id: string
  jenis: JenisAsesmen
  bobotA: number
  bobotB: number
  bobotC: number
  konstanta: number
  pembagi: number
}

export type Siswa = {
  id: string
  noUrut: number
  nama: string
  jk: 'L' | 'P' | null
}

export type ButirAsesmen = { a: number; b: number; c: number }

export type Kelas = {
  id: string
  mapelId: string
  nama: string
  tahunAjaran: string
  semester: number
  kktp: number
  bobot: number
  naBandMin: number
  naBandMax: number
  sumberMinMaks: SumberMinMaks
  siswa: Siswa[]
  komponen: Komponen[]
  asesmen: Asesmen[]
  /** siswaId -> komponenId -> skor mentah */
  skorKomponen: Record<string, Record<string, number>>
  /** siswaId -> asesmenId -> butir A/B/C */
  skorAsesmen: Record<string, Record<string, ButirAsesmen>>
}

export type Rentang = readonly [number, number]

// --------------------------------------------------------------- primitif --

/**
 * Rescale linier — rumus yang di workbook tertulis
 *   (NA - NA MIN) x (NK MAX - NK MIN) : (NA MAX - NA MIN) + NK MIN
 *
 * Bila rentang sumber nol (semua siswa bernilai sama) pembagian menjadi nol.
 * Workbook menghasilkan #DIV/0! di situ; di sini jatuhnya ke BATAS BAWAH band.
 *
 * Batas atas pernah dipakai dan itu keliru: kolom yang belum diisi sama sekali
 * berentang 0..0, jadi seluruh siswa terbaca sempurna — RT F dan NA ikut
 * terangkat oleh kolom yang bahkan belum dinilai, dan mengubah band minimum
 * tidak mengubah apa pun karena hanya batas atas yang terpakai. Batas bawah
 * membaca keadaan itu apa adanya: belum ada yang dibuktikan siapa pun.
 */
export function resc(v: number, mn: number, mx: number, a: number, b: number): number {
  if (mx === mn) return a
  return ((v - mn) * (b - a)) / (mx - mn) + a
}

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

function angka(x: unknown): number {
  const v = Number(x)
  return Number.isFinite(v) ? v : 0
}

/**
 * Kolom tingkat atas untuk satu jenis — sub-formatif tidak pernah ikut.
 *
 * Ini pemisah pokoknya: sub tidak masuk rerata RT F, tidak dapat baris band
 * sendiri, dan tidak dapat entri di PetaBounds. Yang direscale selalu induknya.
 */
export function komponenOf(kelas: Kelas, jenis: JenisKomponen): Komponen[] {
  return kelas.komponen
    .filter((k) => k.jenis === jenis && k.indukId === null)
    .sort((a, b) => a.urutan - b.urutan)
}

/** Sub-komponen sebuah kolom, terurut. Kosong bila kolomnya diketik langsung. */
export function subOf(kelas: Kelas, indukId: string): Komponen[] {
  return kelas.komponen
    .filter((k) => k.indukId === indukId)
    .sort((a, b) => a.urutan - b.urutan)
}

export function skorMentah(kelas: Kelas, siswaId: string, komponenId: string): number {
  return angka(kelas.skorKomponen[siswaId]?.[komponenId])
}

/**
 * Skor mentah yang benar-benar dipakai sebuah kolom.
 *
 * Kolom bersub tidak pernah diketik: skornya rerata sub-subnya, dan sub yang
 * masih kosong ikut sebagai nol — sama seperti sel kosong di mana pun di
 * aplikasi ini. Satu-satunya tempat aturan kompilasi sub hidup.
 */
export function skorKolom(kelas: Kelas, siswaId: string, kolom: Komponen): number {
  const sub = subOf(kelas, kolom.id)
  if (sub.length === 0) return skorMentah(kelas, siswaId, kolom.id)
  return mean(sub.map((s) => skorMentah(kelas, siswaId, s.id)))
}

export function butirMentah(kelas: Kelas, siswaId: string, asesmenId: string): ButirAsesmen {
  const b = kelas.skorAsesmen[siswaId]?.[asesmenId]
  return { a: angka(b?.a), b: angka(b?.b), c: angka(b?.c) }
}

// ----------------------------------------------------------------- bounds --

/**
 * Min/maks skor mentah untuk satu kolom.
 *
 * `sumberMinMaks = 'kelas'`   -> hanya kelas ini (baris MAX/MIN di bawah blok).
 * `sumberMinMaks = 'sekolah'` -> seluruh kelas dalam grup (mapel + semester
 *                                sama), supaya nilai antar kelas sebanding.
 *
 * Kolomnya diberikan langsung, bukan dicari: `urutan` TIDAK unik sekelas —
 * sub bernomor 1..n di dalam induknya dan mewarisi `jenis`-nya, jadi F1.2 dan
 * F2 sama-sama ('formatif', 2). Mencari dengan pasangan itu bisa mendarat di
 * sub yang masih kosong, rentangnya jadi 0..0, dan seluruh kolom terbaca rata.
 *
 * Hanya kelas LAIN dalam grup yang masih perlu dicocokkan — di situ id memang
 * berbeda — dan pencocokannya wajib menyaring kolom tingkat atas saja.
 */
export function bounds(kelas: Kelas, kolom: Komponen, grup: Kelas[] = [kelas]): Rentang {
  const cakupan = kelas.sumberMinMaks === 'sekolah' ? grup : [kelas]
  const nilai: number[] = []

  for (const k of cakupan) {
    const kol =
      k.id === kelas.id
        ? kolom
        : k.komponen.find(
            (c) =>
              c.jenis === kolom.jenis && c.indukId === null && c.urutan === kolom.urutan,
          )
    if (!kol) continue
    for (const s of k.siswa) nilai.push(skorKolom(k, s.id, kol))
  }

  if (nilai.length === 0) return [0, 0]
  return [Math.min(...nilai), Math.max(...nilai)]
}

/**
 * Peta bounds untuk semua kolom sekaligus — dihitung sekali per render.
 *
 * Dikunci id komponen. `urutan` tidak layak jadi kunci: ia hanya unik di antara
 * kolom tingkat atas sejenis, jadi sebuah sub akan menempati entri milik kolom
 * lain.
 */
export type PetaBounds = Record<string, Rentang>

export function hitungBounds(kelas: Kelas, grup: Kelas[] = [kelas]): PetaBounds {
  const peta: PetaBounds = {}
  for (const jenis of ['formatif', 'lingkup'] as const) {
    for (const kol of komponenOf(kelas, jenis)) {
      peta[kol.id] = bounds(kelas, kol, grup)
    }
  }
  return peta
}

// ------------------------------------------------------- hitung per siswa --

export type HasilKolom = {
  komponen: Komponen
  mentah: number
  konversi: number
  bounds: Rentang
  /** Skor mentah tiap sub; kosong bila kolom ini diketik langsung. */
  sub: { komponen: Komponen; mentah: number }[]
}

export type HasilAsesmen = {
  asesmen: Asesmen
  butir: ButirAsesmen
  /** (A*wa) + (B*wb) + (C*wc) */
  total: number
  /** (konstanta + total) / pembagi */
  nilai: number
}

export type HasilSiswa = {
  siswa: Siswa
  formatif: HasilKolom[]
  lingkup: HasilKolom[]
  asesmen: HasilAsesmen[]
  rtF: number
  rtLM: number
  rtA: number
  na: number
}

export function hitungAsesmen(butir: ButirAsesmen, a: Asesmen): HasilAsesmen {
  const total = butir.a * a.bobotA + butir.b * a.bobotB + butir.c * a.bobotC
  return { asesmen: a, butir, total, nilai: (a.konstanta + total) / a.pembagi }
}

export function hitungSiswa(kelas: Kelas, siswa: Siswa, peta: PetaBounds): HasilSiswa {
  const kolom = (jenis: JenisKomponen): HasilKolom[] =>
    komponenOf(kelas, jenis).map((k) => {
      const bd = peta[k.id] ?? ([0, 0] as const)
      const mentah = skorKolom(kelas, siswa.id, k)
      return {
        komponen: k,
        mentah,
        bounds: bd,
        konversi: resc(mentah, bd[0], bd[1], k.bandMin, k.bandMax),
        sub: subOf(kelas, k.id).map((s) => ({
          komponen: s,
          mentah: skorMentah(kelas, siswa.id, s.id),
        })),
      }
    })

  const formatif = kolom('formatif')
  const lingkup = kolom('lingkup')
  const asesmen = kelas.asesmen.map((a) => hitungAsesmen(butirMentah(kelas, siswa.id, a.id), a))

  const rtF = mean(formatif.map((c) => c.konversi))
  const rtLM = mean(lingkup.map((c) => c.konversi))
  const rtA = mean(asesmen.map((a) => a.nilai))
  const w = kelas.bobot
  const na = (w * ((rtF + rtLM) / 2) + (100 - w) * rtA) / 100

  return { siswa, formatif, lingkup, asesmen, rtF, rtLM, rtA, na }
}

// ------------------------------------------------------- hitung per kelas --

export type BarisNilai = HasilSiswa & {
  raport: number
  tuntas: boolean
}

export type HasilKelas = {
  kelas: Kelas
  bounds: PetaBounds
  baris: BarisNilai[]
  /** rentang NA yang dipakai sebagai sumber rescale nilai raport */
  naRange: Rentang
  rerataRaport: number
  jumlahTuntas: number
  jumlahBelum: number
}

/** Rentang NA — sekelas, atau se-angkatan bila sumbernya 'sekolah'. */
export function naRange(kelas: Kelas, grup: Kelas[] = [kelas]): Rentang {
  const cakupan = kelas.sumberMinMaks === 'sekolah' ? grup : [kelas]
  const nilai: number[] = []

  for (const k of cakupan) {
    const peta = hitungBounds(k, grup)
    for (const s of k.siswa) nilai.push(hitungSiswa(k, s, peta).na)
  }

  if (nilai.length === 0) return [0, 0]
  return [Math.min(...nilai), Math.max(...nilai)]
}

export function nilaiRaport(na: number, rentang: Rentang, kelas: Kelas): number {
  return Math.round(resc(na, rentang[0], rentang[1], kelas.naBandMin, kelas.naBandMax))
}

export function hitungKelas(kelas: Kelas, grup: Kelas[] = [kelas]): HasilKelas {
  const peta = hitungBounds(kelas, grup)
  const hasil = kelas.siswa
    .slice()
    .sort((a, b) => a.noUrut - b.noUrut)
    .map((s) => hitungSiswa(kelas, s, peta))

  // Rentang NA harus berasal dari populasi yang sama dengan sumber min/maks.
  const rentang: Rentang =
    kelas.sumberMinMaks === 'sekolah'
      ? naRange(kelas, grup)
      : hasil.length === 0
        ? [0, 0]
        : [Math.min(...hasil.map((h) => h.na)), Math.max(...hasil.map((h) => h.na))]

  const baris: BarisNilai[] = hasil.map((h) => {
    const raport = nilaiRaport(h.na, rentang, kelas)
    return { ...h, raport, tuntas: raport >= kelas.kktp }
  })

  const jumlahTuntas = baris.filter((b) => b.tuntas).length
  return {
    kelas,
    bounds: peta,
    baris,
    naRange: rentang,
    rerataRaport: mean(baris.map((b) => b.raport)),
    jumlahTuntas,
    jumlahBelum: baris.length - jumlahTuntas,
  }
}

// ------------------------------------------------------------ kelengkapan --

/**
 * Berapa persen sel kolom ini yang sudah terisi (bukan nol).
 *
 * Kolom bersub dihitung dari sub-subnya, bukan dari nilai turunannya: satu dari
 * tiga sub terisi harus terbaca 33%, bukan 100%.
 */
export function kelengkapanKolom(kelas: Kelas, komponenId: string): number {
  if (kelas.siswa.length === 0) return 0

  const sub = subOf(kelas, komponenId)
  if (sub.length > 0) return mean(sub.map((s) => kelengkapanKolom(kelas, s.id)))

  const terisi = kelas.siswa.filter((s) => skorMentah(kelas, s.id, komponenId) !== 0).length
  return (terisi / kelas.siswa.length) * 100
}

export function kelengkapanAsesmen(kelas: Kelas, asesmenId: string): number {
  if (kelas.siswa.length === 0) return 0
  const terisi = kelas.siswa.filter((s) => {
    const b = butirMentah(kelas, s.id, asesmenId)
    return b.a !== 0 || b.b !== 0 || b.c !== 0
  }).length
  return (terisi / kelas.siswa.length) * 100
}

/** Kelengkapan seluruh kelas: semua kolom komponen + semua asesmen. */
export function kelengkapanKelas(kelas: Kelas): number {
  return mean([
    // Kolom tingkat atas saja: sub sudah terhitung lewat induknya.
    ...kelas.komponen
      .filter((k) => k.indukId === null)
      .map((k) => kelengkapanKolom(kelas, k.id)),
    ...kelas.asesmen.map((a) => kelengkapanAsesmen(kelas, a.id)),
  ])
}
