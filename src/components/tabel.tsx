/**
 * Bagian tabel padat yang dipakai lebih dari satu layar.
 *
 * Empat layar menggambar kisi yang sama — formatif, lingkup, asesmen, dan
 * daftar nilai — dan keempatnya membekukan dua kolom pertama. Lebar keduanya
 * tidak boleh berbeda antarlayar: `NAMA` yang bergeser sepuluh piksel saat
 * berpindah tab terbaca sebagai halaman yang melompat. Menyalin dua konstanta
 * ini ke empat berkas adalah cara paling pasti membuatnya melenceng — persis
 * kesalahan yang sudah dihindari `--kolom` di dalam satu tabel.
 */

export const LEBAR_NO = 40
export const LEBAR_NAMA = 220

/**
 * Rakit nilai `--kolom`. NO dan NAMA selalu jadi dua trek pertama, jadi
 * pemanggil hanya menyebut kolom miliknya sendiri dan tidak bisa lupa.
 */
export function gayaKolom(...trek: string[]): React.CSSProperties {
  const kolom = [`${LEBAR_NO}px`, `${LEBAR_NAMA}px`, ...trek].join(' ')
  return { ['--kolom' as string]: kolom } as React.CSSProperties
}

/**
 * Sepasang sel kepala beku. `duaBaris` membentangkannya ke baris kedua kepala,
 * untuk tabel yang kepalanya bertingkat (kolom bersub, bagian A/B/C).
 */
export function KepalaBeku({ duaBaris = false }: { duaBaris?: boolean }) {
  const baris = duaBaris ? '1 / 3' : undefined
  return (
    <>
      <div
        className="sel-padat beku sekat-sub mikro"
        style={{ gridColumn: 1, gridRow: baris, left: 0 }}
      >
        NO
      </div>
      <div
        className="sel-padat beku beku-tepi mikro"
        style={{ gridColumn: 2, gridRow: baris, left: LEBAR_NO }}
      >
        NAMA PESERTA DIDIK
      </div>
    </>
  )
}

/**
 * Sepasang sel NO + NAMA di dalam satu `.baris-padat`.
 *
 * `onKlik` menjadikan sel nama satu tombol selebar sel — dipakai layar asesmen
 * untuk memilih siswa yang sedang dikemudikan.
 */
export function SelBeku({
  no,
  nama,
  onKlik,
}: {
  no: number
  nama: string
  onKlik?: () => void
}) {
  return (
    <>
      <div
        className="sel-padat beku sekat-sub text-[11.5px] font-semibold text-[color:var(--color-samar)] angka"
        style={{ left: 0 }}
      >
        {no}
      </div>
      {onKlik ? (
        <button
          className="sel-padat sel-lipat beku beku-tepi text-[12.5px] font-semibold"
          style={{ left: LEBAR_NO }}
          onClick={onKlik}
          title={nama}
        >
          <span className="truncate">{nama}</span>
        </button>
      ) : (
        <div
          className="sel-padat beku beku-tepi text-[12.5px] font-semibold"
          style={{ left: LEBAR_NO }}
          title={nama}
        >
          <span className="truncate">{nama}</span>
        </div>
      )}
    </>
  )
}

/** Panah antara angka mentah dan hasil turunannya. */
export function Panah() {
  return (
    <span className="flex-none text-[11px] font-medium text-[color:var(--color-samar)]">→</span>
  )
}
