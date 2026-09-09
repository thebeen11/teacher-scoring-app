/**
 * Format angka gaya Indonesia: satu desimal, koma sebagai pemisah.
 * Port langsung dari helper `n()` di berkas desain.
 */
export function n(x: number | null | undefined, d = 1): string {
  const v = Number(x)
  if (!Number.isFinite(v)) return '–'
  return v.toFixed(d).replace('.', ',')
}

/** Angka bulat tanpa desimal, tetap memakai '–' untuk nilai tak hingga. */
export function nInt(x: number | null | undefined): string {
  return n(x, 0)
}

/** Angka untuk kolom min/maks: tampilkan desimal hanya bila memang pecahan. */
export function nAuto(x: number | null | undefined): string {
  const v = Number(x)
  if (!Number.isFinite(v)) return '–'
  return n(v, v % 1 === 0 ? 0 : 1)
}

export function pct(x: number): string {
  const v = Number.isFinite(x) ? Math.max(0, Math.min(100, x)) : 0
  return `${Math.round(v)}%`
}
