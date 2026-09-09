import { describe, expect, it } from 'vitest'
import { tanpaNegatif } from './kendali'

describe('tanpaNegatif', () => {
  it('membuang minus di depan', () => {
    expect(tanpaNegatif('-5')).toBe('5')
    expect(tanpaNegatif('-0')).toBe('0')
    expect(tanpaNegatif('-8.5')).toBe('8.5')
  })

  it('membuang minus beruntun', () => {
    expect(tanpaNegatif('--5')).toBe('5')
    expect(tanpaNegatif('---')).toBe('')
  })

  it('minus sendirian jadi kosong, bukan nol', () => {
    // Sel yang sedang dikosongkan untuk diketik ulang harus tetap kosong.
    expect(tanpaNegatif('-')).toBe('')
    expect(tanpaNegatif('')).toBe('')
  })

  it('membiarkan angka yang sudah benar apa adanya', () => {
    expect(tanpaNegatif('5')).toBe('5')
    expect(tanpaNegatif('8.5')).toBe('8.5')
    expect(tanpaNegatif('100')).toBe('100')
    expect(tanpaNegatif('0')).toBe('0')
  })

  it('tidak merusak notasi eksponen', () => {
    // Minus di tengah bagian dari angkanya; membuangnya akan mengubah
    // 0,00001 jadi 100000.
    expect(tanpaNegatif('1e-5')).toBe('1e-5')
    expect(tanpaNegatif('-1e-5')).toBe('1e-5')
  })
})
