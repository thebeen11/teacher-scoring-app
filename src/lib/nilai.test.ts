import { describe, expect, it } from 'vitest'
import fixture from './__fixtures__/viii-a.json'
import {
  hitungAsesmen,
  hitungKelas,
  hitungSiswa,
  hitungBounds,
  kelengkapanKolom,
  komponenOf,
  nilaiRaport,
  resc,
  mean,
  skorKolom,
  subOf,
  type Asesmen,
  type Kelas,
  type Komponen,
  type Siswa,
} from './nilai'

// Rentang NA yang benar-benar dipakai spreadsheet di sel U12/U13 lembar DafNil:
//   U12 = MIN(Q10:Q39, Q65:Q96, Q120:Q151)
//   U13 = MAX(Q10:Q39, Q65:Q96, Q120:Q151)
// Ketiga rentang baris itu adalah VIII A, VIII B, dan VII A — jadi nilai raport
// di workbook diskalakan terhadap NA SELURUH ANGKATAN, sementara min/maks tiap
// kolom formatif/lingkup tetap dihitung per kelas.
const NA_RANGE_WORKBOOK = [68.5, 89.11987951807231] as const

function bangunKelas(): Kelas {
  const komponen: Komponen[] = [
    ...fixture.bandFormatif.map((b, i) => ({
      id: `f${i}`,
      jenis: 'formatif' as const,
      urutan: i + 1,
      label: `F${i + 1}`,
      nama: '',
      indukId: null,
      bandMin: b[0],
      bandMax: b[1],
    })),
    ...fixture.bandLingkup.map((b, i) => ({
      id: `lm${i}`,
      jenis: 'lingkup' as const,
      urutan: i + 1,
      label: `LM${i + 1}`,
      nama: '',
      indukId: null,
      bandMin: b[0],
      bandMax: b[1],
    })),
  ]

  const asesmen: Asesmen[] = (['ASTS', 'ASAS'] as const).map((jenis) => ({
    id: jenis,
    jenis,
    bobotA: 2,
    bobotB: 2,
    bobotC: 1,
    konstanta: 85,
    pembagi: 2,
  }))

  const siswa: Siswa[] = fixture.siswa.map((s, i) => ({
    id: `s${i}`,
    noUrut: i + 1,
    nama: s.nama,
    jk: null,
  }))

  const skorKomponen: Kelas['skorKomponen'] = {}
  const skorAsesmen: Kelas['skorAsesmen'] = {}

  fixture.siswa.forEach((s, i) => {
    const id = `s${i}`
    skorKomponen[id] = {}
    s.formatif.forEach((v, j) => (skorKomponen[id][`f${j}`] = v))
    s.lingkup.forEach((v, j) => (skorKomponen[id][`lm${j}`] = v))
    skorAsesmen[id] = {
      ASTS: { a: s.ASTS[0], b: s.ASTS[1], c: s.ASTS[2] },
      ASAS: { a: s.ASAS[0], b: s.ASAS[1], c: s.ASAS[2] },
    }
  })

  return {
    id: 'viii-a',
    mapelId: 'ipa',
    nama: fixture.kelas,
    tahunAjaran: '2025/2026',
    semester: 1,
    kktp: fixture.kktp,
    bobot: fixture.bobot,
    naBandMin: fixture.naBand[0],
    naBandMax: fixture.naBand[1],
    sumberMinMaks: 'kelas',
    siswa,
    komponen,
    asesmen,
    skorKomponen,
    skorAsesmen,
  }
}

describe('resc', () => {
  it('memetakan titik ujung ke band tujuan', () => {
    expect(resc(0, 0, 10, 80, 100)).toBe(80)
    expect(resc(10, 0, 10, 80, 100)).toBe(100)
    expect(resc(5, 0, 10, 80, 100)).toBe(90)
  })

  it('mereproduksi sel Forf S 1 D5 dari workbook', () => {
    // ADINDA, F1 = 10, min/maks kelas 0..10, band 80..100
    expect(resc(10, 0, 10, 80, 100)).toBe(100)
    // ADINDA, F2 = 83, min/maks kelas 0..95, band 80..100
    expect(resc(83, 0, 95, 80, 100)).toBeCloseTo(97.473684210526315, 10)
    // ADINDA, F3 = 73, min/maks kelas 0..92, band 80..100
    expect(resc(73, 0, 92, 80, 100)).toBeCloseTo(95.869565217391312, 10)
  })

  it('mengembalikan batas BAWAH band saat rentang sumber nol (workbook: #DIV/0!)', () => {
    expect(resc(5, 3, 3, 80, 100)).toBe(80)
    expect(resc(0, 0, 0, 78, 98)).toBe(78)
  })
})

describe('mean', () => {
  it('mengembalikan 0 untuk daftar kosong, bukan NaN', () => {
    expect(mean([])).toBe(0)
  })
})

describe('hitungAsesmen', () => {
  const asts: Asesmen = {
    id: 'ASTS',
    jenis: 'ASTS',
    bobotA: 2,
    bobotB: 2,
    bobotC: 1,
    konstanta: 85,
    pembagi: 2,
  }

  it('mereproduksi ASTS 1 baris 7 (ABDUL GHOFAR)', () => {
    // (9x2) + (5x2) + 15 = 43  ->  (85 + 43) / 2 = 64
    const h = hitungAsesmen({ a: 9, b: 5, c: 15 }, asts)
    expect(h.total).toBe(43)
    expect(h.nilai).toBe(64)
  })

  it('mereproduksi ASAS 1 baris 7 (ABDUL GHOFAR)', () => {
    // (12x2) + (8x2) + 10 = 50  ->  (85 + 50) / 2 = 67,5
    const h = hitungAsesmen({ a: 12, b: 8, c: 10 }, asts)
    expect(h.total).toBe(50)
    expect(h.nilai).toBe(67.5)
  })
})

describe('rantai penuh terhadap lembar DafNil S 1', () => {
  const kelas = bangunKelas()
  const peta = hitungBounds(kelas)

  it('memuat 30 siswa VIII A', () => {
    expect(kelas.siswa).toHaveLength(30)
  })

  it('menghitung min/maks kolom sama dengan baris kaki blok', () => {
    // Forf S 1 baris 36/37 untuk VIII A: maks 10 / 95 / 92, min 0 / 0 / 0
    expect(peta.f0).toEqual([0, 10])
    expect(peta.f1).toEqual([0, 95])
    expect(peta.f2).toEqual([0, 92])
    // Sums S 1 baris 36/37: maks 100 / 100 / 85 / 10
    expect(peta.lm0).toEqual([0, 100])
    expect(peta.lm1).toEqual([0, 100])
    expect(peta.lm2).toEqual([0, 85])
    expect(peta.lm3).toEqual([0, 10])
  })

  it.each(fixture.siswa.map((s, i) => [i, s.nama] as const))(
    'NA siswa %i (%s) sama dengan kolom Q DafNil',
    (i) => {
      const hasil = hitungSiswa(kelas, kelas.siswa[i], peta)
      expect(hasil.na).toBeCloseTo(fixture.siswa[i].harapan.na, 9)
    },
  )

  it('mereproduksi rantai lengkap ABDUL GHOFAR (DafNil baris 10)', () => {
    const h = hitungSiswa(kelas, kelas.siswa[0], peta)
    expect(h.formatif.map((c) => c.konversi)).toEqual([96, 80, 80])
    expect(h.rtF).toBeCloseTo(85.333333333333329, 9)
    expect(h.lingkup.map((c) => c.konversi)).toEqual([80, 78, 78, 80])
    expect(h.rtLM).toBe(79)
    expect(h.asesmen.map((a) => a.nilai)).toEqual([64, 67.5])
    expect(h.rtA).toBe(65.75)
    expect(h.na).toBeCloseTo(75.599999999999994, 9)
  })

  // Dua sel di workbook rumusnya sudah tertimpa ketikan tangan: DafNil S 1
  // R19 (FAIZ PRATAMA) berisi konstanta 80 padahal rumusnya menghasilkan
  // 80,513 -> 81, dan R28 (MUHAMAD ANGGA ALFIANSYAH) berisi 79 padahal
  // rumusnya menghasilkan 80,339 -> 80. Baris lain memakai rumus utuh
  // {(Q-$U$12)*($U$11-$U$10)/($U$13-$U$12)+$U$10}.
  //
  // Justru inilah yang dihapus aplikasi ini: tidak ada sel turunan yang bisa
  // ditimpa, karena tidak ada satu pun angka turunan yang disimpan.
  const SEL_TERTIMPA: Record<string, { workbook: number; seharusnya: number }> = {
    'FAIZ PRATAMA': { workbook: 80, seharusnya: 81 },
    'MUHAMAD ANGGA ALFIANSYAH': { workbook: 79, seharusnya: 80 },
  }

  it('nilai raport cocok dengan kolom S DafNil bila memakai rentang NA se-angkatan', () => {
    const beda: string[] = []
    for (let i = 0; i < kelas.siswa.length; i++) {
      const h = hitungSiswa(kelas, kelas.siswa[i], peta)
      const raport = nilaiRaport(h.na, NA_RANGE_WORKBOOK, kelas)
      const nama = fixture.siswa[i].nama
      const harapan = SEL_TERTIMPA[nama]?.seharusnya ?? fixture.siswa[i].harapan.raport
      if (raport !== harapan) beda.push(`${nama}: ${raport} != ${harapan}`)
    }
    expect(beda).toEqual([])
  })

  it('hanya dua sel workbook itu yang menyimpang, sisanya identik', () => {
    const menyimpang: string[] = []
    for (let i = 0; i < kelas.siswa.length; i++) {
      const h = hitungSiswa(kelas, kelas.siswa[i], peta)
      const raport = nilaiRaport(h.na, NA_RANGE_WORKBOOK, kelas)
      if (raport !== fixture.siswa[i].harapan.raport) menyimpang.push(fixture.siswa[i].nama)
    }
    expect(menyimpang.sort()).toEqual(Object.keys(SEL_TERTIMPA).sort())
  })

  it('rentang NA sekelas adalah min/maks kolom Q untuk VIII A saja', () => {
    const hasil = hitungKelas(kelas)
    const harapan = fixture.siswa.map((s) => s.harapan.na)
    expect(hasil.naRange[0]).toBeCloseTo(Math.min(...harapan), 9)
    expect(hasil.naRange[1]).toBeCloseTo(Math.max(...harapan), 9)
  })
})

describe('min/maks sekelas bersifat menular', () => {
  it('mengubah skor satu siswa menggeser konversi siswa lain', () => {
    const kelas = bangunKelas()
    const sebelum = hitungKelas(kelas).baris[1].formatif[1].konversi

    // Naikkan maksimum kolom F2 dari 95 menjadi 200 lewat siswa lain.
    const lain = kelas.siswa[2].id
    kelas.skorKomponen[lain] = { ...kelas.skorKomponen[lain], f1: 200 }

    const sesudah = hitungKelas(kelas).baris[1].formatif[1].konversi
    expect(sesudah).not.toBe(sebelum)
    expect(sesudah).toBeLessThan(sebelum)
  })
})

describe('sub-formatif', () => {
  /**
   * Memecah F1 jadi beberapa sub. Skor F1 yang lama sengaja dibiarkan tersimpan:
   * begitu ada sub, angka itu harus diabaikan, bukan ikut dirata-rata.
   */
  function denganSub(jumlah: number, skor: (siswaIdx: number, subIdx: number) => number): Kelas {
    const kelas = bangunKelas()

    for (let j = 0; j < jumlah; j++) {
      kelas.komponen.push({
        id: `f0.${j + 1}`,
        jenis: 'formatif',
        urutan: j + 1,
        label: `F1.${j + 1}`,
        nama: '',
        indukId: 'f0',
        bandMin: 80,
        bandMax: 100,
      })
    }

    kelas.siswa.forEach((s, i) => {
      for (let j = 0; j < jumlah; j++) {
        kelas.skorKomponen[s.id][`f0.${j + 1}`] = skor(i, j)
      }
    })

    return kelas
  }

  it('menjadikan skor kolom rerata sub-subnya', () => {
    const kelas = denganSub(3, (i, j) => (i === 0 ? [80, 90, 70][j] : 0))
    const f1 = kelas.komponen.find((k) => k.id === 'f0')!
    expect(skorKolom(kelas, kelas.siswa[0].id, f1)).toBe(80)
  })

  it('menghitung sub yang masih kosong sebagai nol', () => {
    const kelas = denganSub(3, (i, j) => (i === 0 && j < 2 ? [80, 90][j] : 0))
    const f1 = kelas.komponen.find((k) => k.id === 'f0')!
    expect(skorKolom(kelas, kelas.siswa[0].id, f1)).toBeCloseTo(56.666666666666664, 9)
  })

  it('mengabaikan skor induk yang tersimpan selama masih ada sub', () => {
    const kelas = denganSub(2, () => 50)
    const f1 = kelas.komponen.find((k) => k.id === 'f0')!
    // Skor lama ABDUL GHOFAR di F1 adalah 8 (lihat fikstur); tidak boleh terpakai.
    expect(kelas.skorKomponen[kelas.siswa[0].id].f0).toBe(8)
    expect(skorKolom(kelas, kelas.siswa[0].id, f1)).toBe(50)
  })

  it('mengembalikan skor induk begitu sub terakhir dihapus', () => {
    const kelas = denganSub(2, () => 50)
    kelas.komponen = kelas.komponen.filter((k) => k.indukId === null)
    const f1 = kelas.komponen.find((k) => k.id === 'f0')!
    expect(skorKolom(kelas, kelas.siswa[0].id, f1)).toBe(8)
  })

  it('tidak memasukkan sub ke daftar kolom, jadi jumlah suku RT F tetap', () => {
    const polos = bangunKelas()
    const kelas = denganSub(3, () => 50)
    expect(komponenOf(kelas, 'formatif')).toHaveLength(komponenOf(polos, 'formatif').length)
    expect(subOf(kelas, 'f0')).toHaveLength(3)
    expect(hitungSiswa(kelas, kelas.siswa[0], hitungBounds(kelas)).formatif).toHaveLength(
      komponenOf(polos, 'formatif').length,
    )
  })

  it('menghitung min/maks sekelas atas nilai turunan, bukan skor sub', () => {
    const kelas = denganSub(2, (i) => (i === 0 ? 80 : 40))
    // Rerata siswa 0 = 80, sisanya 40 -> rentang kolom F1 adalah 40..80.
    expect(hitungBounds(kelas).f0).toEqual([40, 80])
  })

  /*
   * Sub bernomor 1..n DI DALAM induknya dan mewarisi `jenis`-nya, jadi F1.2 dan
   * F2 sama-sama ('formatif', 2). Pemuat data hanya mengurutkan dengan
   * `order('urutan')`, sehingga baris yang seri bisa datang dalam urutan mana
   * saja — dan versi lama bounds() memilih yang pertama ketemu. Bila yang
   * kejemput sub yang masih kosong, rentang F2 jadi 0..0 dan SELURUH siswa
   * terbaca di batas band, walau skor mentahnya jelas berbeda-beda.
   */
  it('tidak tertukar dengan sub yang urutannya bertabrakan', () => {
    for (const subDiDepan of [false, true]) {
      const kelas = denganSub(2, () => 0)
      if (subDiDepan) {
        kelas.komponen = [
          ...kelas.komponen.filter((k) => k.indukId !== null),
          ...kelas.komponen.filter((k) => k.indukId === null),
        ]
      }

      // F2 (id f1, urutan 2) berisi skor yang berbeda-beda; F1.2 (urutan 2) kosong.
      const peta = hitungBounds(kelas)
      expect(peta.f1).toEqual([0, 95])

      const konversi = hitungKelas(kelas).baris.map((b) => b.formatif[1].konversi)
      expect(new Set(konversi).size).toBeGreaterThan(1)
    }
  })

  it('memberi batas BAWAH band, bukan 100, untuk kolom yang belum diisi', () => {
    const kelas = bangunKelas()
    for (const s of kelas.siswa) kelas.skorKomponen[s.id].f0 = 0

    const f1 = kelas.komponen.find((k) => k.id === 'f0')!
    expect(hitungBounds(kelas).f0).toEqual([0, 0])
    expect(hitungKelas(kelas).baris.map((b) => b.formatif[0].konversi)).toEqual(
      kelas.siswa.map(() => f1.bandMin),
    )
  })

  it('mengubah satu sub milik siswa lain menggeser konversi siswa ini', () => {
    // Siswa 0 harus berdiri di puncak rentang, bukan di rentang nol: kolom yang
    // seluruh siswanya bernilai sama sudah jatuh ke batas bawah band, jadi ia
    // tidak bisa membuktikan apa pun soal pergeseran.
    const kelas = denganSub(2, (i) => (i === 0 ? 80 : 50))
    const sebelum = hitungKelas(kelas).baris[0].formatif[0].konversi

    kelas.skorKomponen[kelas.siswa[2].id]['f0.1'] = 200

    const sesudah = hitungKelas(kelas).baris[0].formatif[0].konversi
    expect(sebelum).toBe(100)
    expect(sesudah).toBeLessThan(sebelum)
  })

  it('membaca kelengkapan kolom dari sub, bukan dari nilai turunannya', () => {
    // Satu dari tiga sub terisi untuk semua siswa.
    const kelas = denganSub(3, (_i, j) => (j === 0 ? 75 : 0))
    expect(kelengkapanKolom(kelas, 'f0')).toBeCloseTo(100 / 3, 9)
  })

  it('membawa skor tiap sub di hasil kolom untuk digambar tabel', () => {
    const kelas = denganSub(2, (i, j) => (i === 0 ? [80, 90][j] : 0))
    const h = hitungSiswa(kelas, kelas.siswa[0], hitungBounds(kelas))
    expect(h.formatif[0].sub.map((s) => s.mentah)).toEqual([80, 90])
    expect(h.formatif[1].sub).toEqual([])
  })
})
