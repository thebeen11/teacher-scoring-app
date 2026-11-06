import { describe, expect, it } from 'vitest'
import fixture from './__fixtures__/viii-a.json'
import {
  bonusKeaktifan,
  hitungAsesmen,
  hitungKehadiran,
  hitungKelas,
  hitungNA,
  hitungSiswa,
  hitungBounds,
  kelengkapanAsesmen,
  skorBagian,
  kelengkapanKolom,
  komponenOf,
  nilaiAkhir,
  nilaiRaport,
  peringkatNA,
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
      label: `S${i + 1}`,
      nama: '',
      indukId: null,
      bandMin: b[0],
      bandMax: b[1],
    })),
  ]

  // Workbook memakai NILAI = (85 + SKOR) / 2. Rumus itu linier, jadi rescale
  // dengan rentang [(85 + min) / 2, (85 + maks) / 2] menghasilkan angka yang
  // persis sama — rantai workbook tetap bisa diverifikasi lewat rumus rentang.
  const asesmen: Asesmen[] = (['ASTS', 'ASAS'] as const).map((jenis) => {
    const skor = fixture.siswa.map((s) => s[jenis][0] * 2 + s[jenis][1] * 2 + s[jenis][2])
    return {
      id: jenis,
      jenis,
      mode: 'bagian',
      bobotA: 2,
      bobotB: 2,
      bobotC: 1,
      bandMin: (85 + Math.min(...skor)) / 2,
      bandMax: (85 + Math.max(...skor)) / 2,
    }
  })

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
      ASTS: { a: s.ASTS[0], b: s.ASTS[1], c: s.ASTS[2], skor: 0 },
      ASAS: { a: s.ASAS[0], b: s.ASAS[1], c: s.ASAS[2], skor: 0 },
    }
  })

  return {
    id: 'viii-a',
    mapelId: 'ipa',
    nama: fixture.kelas,
    tahunAjaran: '2025/2026',
    semester: 1,
    kktp: fixture.kktp,
    // Workbook: proses : asesmen = 60 : 40, dibagi rata ke dua bagian tiap sisi.
    bobot: {
      formatif: fixture.bobot / 2,
      sumatif: fixture.bobot / 2,
      tengah: (100 - fixture.bobot) / 2,
      akhir: (100 - fixture.bobot) / 2,
      kehadiran: 0,
    },
    naBandMin: fixture.naBand[0],
    naBandMax: fixture.naBand[1],
    sumberMinMaks: 'kelas',
    siswa,
    komponen,
    asesmen,
    skorKomponen,
    skorAsesmen,
    totalPertemuan: 0,
    skorTambahan: {},
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

describe('peringkatNA', () => {
  it('NA tertinggi = 1, NA sama berbagi peringkat lalu melompat', () => {
    expect(peringkatNA([70, 90, 80, 80, 60])).toEqual([4, 1, 2, 2, 5])
  })
  it('dibandingkan pada satu desimal yang tampil', () => {
    expect(peringkatNA([84.31, 84.34, 84.4])).toEqual([2, 2, 1])
  })
  it('daftar kosong', () => {
    expect(peringkatNA([])).toEqual([])
  })
})

describe('hitungAsesmen', () => {
  const asts: Asesmen = {
    id: 'ASTS',
    jenis: 'ASTS',
    mode: 'bagian',
    bobotA: 2,
    bobotB: 2,
    bobotC: 1,
    bandMin: 80,
    bandMax: 100,
  }

  it('SKOR bagian direscale dari min/maks ke rentang asesmen', () => {
    // (9x2) + (5x2) + 15 = 43; 43 di [20, 60] -> (23 x 20 / 40) + 80 = 91,5
    const h = hitungAsesmen({ a: 9, b: 5, c: 15, skor: 0 }, asts, [20, 60])
    expect(h.total).toBe(43)
    expect(h.bounds).toEqual([20, 60])
    expect(h.nilai).toBe(91.5)
  })

  it('SKOR tertinggi dan terendah jatuh tepat di batas rentang', () => {
    const a = { ...asts, bandMin: 70, bandMax: 95 }
    expect(hitungAsesmen({ a: 0, b: 0, c: 0, skor: 0 }, { ...a, mode: 'langsung' }, [0, 50]).nilai).toBe(70)
    expect(hitungAsesmen({ a: 0, b: 0, c: 0, skor: 50 }, { ...a, mode: 'langsung' }, [0, 50]).nilai).toBe(95)
  })

  it('rentang SKOR nol jatuh ke batas bawah', () => {
    const h = hitungAsesmen({ a: 9, b: 5, c: 15, skor: 0 }, asts, [43, 43])
    expect(h.nilai).toBe(80)
  })

  it('mode langsung memakai SKOR yang diketik, lalu rumus nilai yang sama', () => {
    const h = hitungAsesmen({ a: 0, b: 0, c: 0, skor: 43 }, { ...asts, mode: 'langsung' }, [20, 60])
    expect(h.total).toBe(43)
    expect(h.nilai).toBe(91.5)
  })

  it('skorBagian menjumlahkan bagian berbobot, sama dengan total mode bagian', () => {
    // (9x2) + (5x2) + 15 = 43
    expect(skorBagian({ a: 9, b: 5, c: 15, skor: 0 }, asts)).toBe(43)
  })

  it('mode bagian mengabaikan skor langsung yang tersimpan', () => {
    const h = hitungAsesmen({ a: 9, b: 5, c: 15, skor: 88 }, asts, [20, 60])
    expect(h.nilai).toBe(91.5)
  })
})

describe('hitungNA — bobot empat bagian', () => {
  const nilai = { formatif: 90, sumatif: 80, tengah: 70, akhir: 60 }

  it('menimbang tiap bagian dengan bobotnya sendiri', () => {
    // 40×90 + 30×80 + 10×70 + 20×60 = 7900  ->  79
    expect(hitungNA({ formatif: 40, sumatif: 30, tengah: 10, akhir: 20, kehadiran: 0 }, nilai)).toBe(79)
  })

  it('bagian yang tidak ada keluar, bobot sisanya dibagi ulang', () => {
    // tanpa ASTS: (30×90 + 30×80 + 20×60) / 80 = 78,75
    expect(
      hitungNA({ formatif: 30, sumatif: 30, tengah: 20, akhir: 20, kehadiran: 0 }, { ...nilai, tengah: null }),
    ).toBe(78.75)
  })

  it('total ≠ 100 dibagi Σw, bukan 100', () => {
    // (50×90 + 50×80 + 50×70 + 50×60) / 200 = 75
    expect(hitungNA({ formatif: 50, sumatif: 50, tengah: 50, akhir: 50, kehadiran: 0 }, nilai)).toBe(75)
  })

  it('kehadiran ikut ditimbang bila bobotnya > 0', () => {
    // (30×90 + 30×80 + 10×70 + 20×60 + 10×82,5) / 100 = 78,25
    expect(
      hitungNA(
        { formatif: 30, sumatif: 30, tengah: 10, akhir: 20, kehadiran: 10 },
        { ...nilai, kehadiran: 82.5 },
      ),
    ).toBeCloseTo(78.25)
  })

  it('kehadiran yang belum bisa dihitung keluar, bobot sisanya dibagi ulang', () => {
    // (30×90 + 30×80 + 10×70 + 20×60) / 90
    expect(
      hitungNA(
        { formatif: 30, sumatif: 30, tengah: 10, akhir: 20, kehadiran: 10 },
        { ...nilai, kehadiran: null },
      ),
    ).toBeCloseTo(7000 / 90)
  })

  it('semua bobot nol menghasilkan 0, bukan NaN', () => {
    expect(hitungNA({ formatif: 0, sumatif: 0, tengah: 0, akhir: 0, kehadiran: 0 }, nilai)).toBe(0)
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

  it('peta bounds juga memuat min/maks SKOR tiap asesmen', () => {
    for (const jenis of ['ASTS', 'ASAS'] as const) {
      const skor = fixture.siswa.map((s) => s[jenis][0] * 2 + s[jenis][1] * 2 + s[jenis][2])
      expect(peta[jenis]).toEqual([Math.min(...skor), Math.max(...skor)])
    }
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
    expect(h.rtNS).toBe(79)
    expect(h.asesmen[0].nilai).toBeCloseTo(64, 9)
    expect(h.asesmen[1].nilai).toBeCloseTo(67.5, 9)
    expect(h.rtA).toBeCloseTo(65.75, 9)
    expect(h.rtTengah).toBeCloseTo(64, 9)
    expect(h.rtAkhir).toBeCloseTo(67.5, 9)
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

describe('kelengkapanAsesmen', () => {
  it('membaca isian sesuai mode asesmen', () => {
    const kelas = bangunKelas()
    const id = kelas.siswa[0].id
    const kosong = { a: 0, b: 0, c: 0, skor: 0 }
    const skorAsesmen = Object.fromEntries(
      kelas.siswa.map((s) => [s.id, { ASTS: { ...kosong, a: 5 } }]),
    )
    skorAsesmen[id] = { ASTS: { ...kosong, skor: 80 } }
    const bagian = { ...kelas, skorAsesmen }
    const langsung = {
      ...bagian,
      asesmen: bagian.asesmen.map((a) => (a.id === 'ASTS' ? { ...a, mode: 'langsung' as const } : a)),
    }
    const n = kelas.siswa.length
    expect(kelengkapanAsesmen(bagian, 'ASTS')).toBeCloseTo(((n - 1) / n) * 100, 9)
    expect(kelengkapanAsesmen(langsung, 'ASTS')).toBeCloseTo((1 / n) * 100, 9)
  })
})

describe('nilai tambahan', () => {
  const t = (hadir: number, sakit: number, izin: number) => ({ hadir, sakit, izin, keaktifan: 0 })

  it('kehadiran berbobot sesuai contoh spesifikasi: 15 H, 2 S, 1 I dari 20', () => {
    const h = hitungKehadiran(t(15, 2, 1), 20)
    expect(h.alpa).toBe(2)
    expect(h.valid).toBe(true)
    expect(h.nilai).toBeCloseTo(82.5)
    expect(h.persenHadir).toBeCloseTo(75)
  })

  it('total pertemuan 0 belum bisa dinilai', () => {
    const h = hitungKehadiran(t(0, 0, 0), 0)
    expect(h.valid).toBe(false)
    expect(h.nilai).toBeNull()
    expect(h.persenHadir).toBeNull()
  })

  it('isian melebihi total pertemuan ditandai tidak valid', () => {
    const h = hitungKehadiran(t(18, 2, 1), 20)
    expect(h.alpa).toBe(-1)
    expect(h.valid).toBe(false)
    expect(h.nilai).toBeNull()
  })

  it('bonus keaktifan 0,5 per skor, maksimal 10', () => {
    expect(bonusKeaktifan(0)).toBe(0)
    expect(bonusKeaktifan(3)).toBe(1.5)
    expect(bonusKeaktifan(10)).toBe(5)
    expect(bonusKeaktifan(20)).toBe(10)
    expect(bonusKeaktifan(25)).toBe(10)
  })
})

describe('kehadiran di dalam NA', () => {
  it('total pertemuan 0: NA sama persis dengan tanpa kehadiran', () => {
    const dasar = bangunKelas()
    const kelas = { ...dasar, bobot: { ...dasar.bobot, kehadiran: 10 } }
    const peta = hitungBounds(kelas)
    for (const s of kelas.siswa) {
      expect(hitungSiswa(kelas, s, peta).na).toBeCloseTo(hitungSiswa(dasar, s, peta).na)
    }
  })

  it('kehadiran terisi menggeser NA sesuai bobotnya', () => {
    const dasar = bangunKelas()
    const s = dasar.siswa[0]
    const kelas: Kelas = {
      ...dasar,
      bobot: { ...dasar.bobot, kehadiran: 10 },
      totalPertemuan: 20,
      skorTambahan: { [s.id]: { hadir: 15, sakit: 2, izin: 1, keaktifan: 0 } },
    }
    const peta = hitungBounds(kelas)
    const naLama = hitungSiswa(dasar, s, peta).na
    const h = hitungSiswa(kelas, s, peta)
    expect(h.kehadiran.nilai).toBeCloseTo(82.5)
    expect(h.na).toBeCloseTo((naLama * 100 + 10 * 82.5) / 110)
  })
})

describe('bonus keaktifan di nilai akhir', () => {
  const dasar = bangunKelas()
  const hasilDasar = hitungKelas(dasar)
  const denganSkor = (skor: Record<string, number>): Kelas => ({
    ...dasar,
    skorTambahan: Object.fromEntries(
      Object.entries(skor).map(([id, k]) => [id, { hadir: 0, sakit: 0, izin: 0, keaktifan: k }]),
    ),
  })

  it('tanpa keaktifan, raport sama dengan rescale NA biasa', () => {
    for (const b of hasilDasar.baris) {
      expect(b.bonus).toBe(0)
      expect(b.raport).toBe(nilaiRaport(b.na, hasilDasar.naRange, dasar))
    }
  })

  it('bonus ditambahkan setelah rescale', () => {
    // Siswa terendah: rescale-nya = RENTANG min, jauh dari batas atas.
    const bawah = hasilDasar.baris.reduce((x, y) => (y.na < x.na ? y : x))
    const h = hitungKelas(denganSkor({ [bawah.siswa.id]: 6 }))
    const b = h.baris.find((x) => x.siswa.id === bawah.siswa.id)!
    expect(b.bonus).toBe(3)
    expect(b.nilaiAkhir).toBeCloseTo(nilaiAkhir(bawah.na, h.naRange, dasar) + 3)
    expect(b.raport).toBe(Math.round(b.nilaiAkhir))
    // Rentang NA tidak ikut bergeser karena bonus.
    expect(h.naRange).toEqual(hasilDasar.naRange)
  })

  it('tidak melewati RENTANG maks, dan tidak pernah menurunkan nilai', () => {
    const atas = hasilDasar.baris.reduce((x, y) => (y.na > x.na ? y : x))
    const h = hitungKelas(denganSkor({ [atas.siswa.id]: 40 }))
    const b = h.baris.find((x) => x.siswa.id === atas.siswa.id)!
    expect(b.bonus).toBe(10)
    expect(b.nilaiAkhir).toBeCloseTo(dasar.naBandMax)
    expect(nilaiAkhir(0, [0, 10], { ...dasar, naBandMin: 95, naBandMax: 90 }, 5)).toBe(95)
  })

  it('peringkat mengikuti nilai akhir', () => {
    const bawah = hasilDasar.baris.reduce((x, y) => (y.na < x.na ? y : x))
    const h = hitungKelas(denganSkor({ [bawah.siswa.id]: 20 }))
    const b = h.baris.find((x) => x.siswa.id === bawah.siswa.id)!
    expect(b.peringkat).toBeLessThan(bawah.peringkat)
  })
})
