import { describe, expect, it } from 'vitest'
import { hitungKelas, type Kelas } from './nilai'
import {
  jenisEksporSah,
  lembarAsesmen,
  lembarDaftar,
  lembarKomponen,
  namaBerkas,
  semuaLembar,
} from './ekspor'

function kelasUji(): Kelas {
  const k = (id: string, jenis: 'formatif' | 'lingkup', label: string, indukId: string | null = null, urutan = 1) => ({
    id, jenis, urutan, label, nama: '', indukId, bandMin: 75, bandMax: 95,
  })
  return {
    id: 'k1',
    mapelId: 'm1',
    nama: 'VIII A',
    tahunAjaran: '2026/2027',
    semester: 1,
    kktp: 75,
    bobot: { formatif: 30, sumatif: 30, tengah: 20, akhir: 20 },
    naBandMin: 75,
    naBandMax: 95,
    sumberMinMaks: 'kelas',
    siswa: [
      { id: 's1', noUrut: 1, nama: 'Ani', jk: 'P' },
      { id: 's2', noUrut: 2, nama: 'Budi', jk: 'L' },
    ],
    komponen: [
      k('f1', 'formatif', 'F1', null, 1),
      k('f2', 'formatif', 'F2', null, 2),
      k('f2a', 'formatif', 'a', 'f2', 1),
      k('f2b', 'formatif', 'b', 'f2', 2),
      k('l1', 'lingkup', 'S1'),
    ],
    asesmen: [
      { id: 'a1', jenis: 'ASTS', mode: 'bagian', bobotA: 2, bobotB: 2, bobotC: 1, bandMin: 70, bandMax: 95 },
      { id: 'a2', jenis: 'ASAS', mode: 'langsung', bobotA: 1, bobotB: 1, bobotC: 1, bandMin: 70, bandMax: 95 },
    ],
    skorKomponen: {
      s1: { f1: 80, f2a: 60, f2b: 80, l1: 70 },
      s2: { f1: 90, f2a: 90, f2b: 100, l1: 85 },
    },
    skorAsesmen: {
      s1: { a1: { a: 10, b: 5, c: 20, skor: 0 }, a2: { a: 0, b: 0, c: 0, skor: 60 } },
      s2: { a1: { a: 15, b: 8, c: 25, skor: 0 }, a2: { a: 0, b: 0, c: 0, skor: 90 } },
    },
  }
}

describe('ekspor', () => {
  const kelas = kelasUji()
  const hasil = hitungKelas(kelas)

  it('lembar formatif: sub, rerata, nilai per kolom, lalu RT F', () => {
    const l = lembarKomponen(kelas, hasil, 'formatif')
    expect(l.kolom.map((k) => k.label)).toEqual([
      'NO', 'NAMA PESERTA DIDIK', 'SKOR', 'NILAI', 'a', 'b', 'RERATA', 'NILAI', 'RT F',
    ])
    expect(l.kolom[4].grup).toBe('F2')
    expect(l.baris).toHaveLength(2)
    const [no, nama, f1, , a, b, rerata, , rt] = l.baris[0]
    expect([no, nama, f1, a, b, rerata]).toEqual([1, 'Ani', 80, 60, 80, 70])
    expect(rt).toBe(hasil.baris[0].rtF)
  })

  it('lembar asesmen mengikuti mode', () => {
    const t = lembarAsesmen(kelas, hasil, 'tengah')!
    expect(t.namaSheet).toBe('ASTS')
    expect(t.kolom.map((k) => k.label)).toEqual(['NO', 'NAMA PESERTA DIDIK', 'A (×2)', 'B (×2)', 'C (×1)', 'SKOR', 'NILAI'])
    expect(t.baris[0].slice(2)).toEqual([10, 5, 20, 50, hasil.baris[0].asesmen[0].nilai])

    const a = lembarAsesmen(kelas, hasil, 'akhir')!
    expect(a.kolom.map((k) => k.label)).toEqual(['NO', 'NAMA PESERTA DIDIK', 'SKOR', 'NILAI'])
    expect(a.baris[1].slice(2)).toEqual([90, hasil.baris[1].asesmen[1].nilai])
  })

  it('lembar asesmen kosong bila kelas tidak punya slotnya', () => {
    const tanpa = { ...kelas, asesmen: kelas.asesmen.filter((x) => x.jenis !== 'ASTS') }
    expect(lembarAsesmen(tanpa, hitungKelas(tanpa), 'tengah')).toBeNull()
  })

  it('lembar daftar sama dengan hasil hitung', () => {
    const l = lembarDaftar(kelas, hasil)
    const i = l.kolom.findIndex((k) => k.label === 'NA')
    const j = l.kolom.findIndex((k) => k.label === 'RAPORT')
    hasil.baris.forEach((b, r) => {
      expect(l.baris[r][i]).toBe(b.na)
      expect(l.baris[r][j]).toBe(b.raport)
      expect(l.baris[r].at(-1)).toBe(b.tuntas ? 'TUNTAS' : 'BELUM')
    })
    // Setiap baris selebar kepalanya.
    for (const lb of semuaLembar(kelas, hasil)) for (const b of lb.baris) expect(b).toHaveLength(lb.kolom.length)
  })

  it('semua lembar urut dan nama berkas bersih', () => {
    expect(semuaLembar(kelas, hasil).map((l) => l.namaSheet)).toEqual(['Formatif', 'Sumatif', 'ASTS', 'ASAS', 'Daftar Nilai'])
    expect(namaBerkas(kelas, 'Daftar Nilai')).toBe('Daftar Nilai - VIII A - 2026-2027 S1.xlsx')
    expect(jenisEksporSah('daftar')).toBe(true)
    expect(jenisEksporSah('x')).toBe(false)
  })
})
