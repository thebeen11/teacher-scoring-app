'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { buatKlien } from '@/lib/supabase/client'
import {
  hitungKelas,
  type ButirAsesmen,
  type HasilKelas,
  type Kelas,
  type SumberMinMaks,
} from '@/lib/nilai'

/**
 * Satu penyimpan untuk satu grup kelas (mapel + semester yang sama).
 *
 * Aturannya: state hanya memuat SKOR MENTAH dan variabel skala. Setiap angka
 * yang ditampilkan dihitung ulang lewat hitungKelas() pada tiap render, tidak
 * pernah disimpan. Itu satu-satunya cara membuat "ubah satu sel, seluruh kolom
 * ikut bergeser" benar — karena min/maks kolom bersifat sekelas.
 *
 * Penulisan ke Supabase dilakukan langsung dari peramban dengan penundaan,
 * bukan lewat Server Action: mengetik di tabel nilai memicu perubahan tiap
 * ketukan, dan RLS sudah menjaga kepemilikan datanya.
 */

export type StatusSimpan = 'bersih' | 'menyimpan' | 'tersimpan' | 'galat'

type Antrean =
  | { tabel: 'nilai_komponen'; siswaId: string; komponenId: string; skor: number }
  | { tabel: 'nilai_asesmen'; siswaId: string; asesmenId: string; butir: ButirAsesmen }
  | { tabel: 'komponen'; komponenId: string; bandMin: number; bandMax: number }
  | { tabel: 'kelas'; kelasId: string; kolom: Record<string, number | string> }

type Nilai = {
  kelas: Kelas
  grup: Kelas[]
  hasil: HasilKelas
  status: StatusSimpan
  setSkor: (siswaId: string, komponenId: string, skor: number) => void
  setButir: (siswaId: string, asesmenId: string, butir: ButirAsesmen) => void
  setBand: (komponenId: string, bandMin: number, bandMax: number) => void
  setPengaturan: (p: Partial<PengaturanKelas>) => void
}

export type PengaturanKelas = {
  kktp: number
  bobot: number
  naBandMin: number
  naBandMax: number
  sumberMinMaks: SumberMinMaks
}

const Konteks = createContext<Nilai | null>(null)

const JEDA_SIMPAN = 600

export function PenyediaKelas({
  awal,
  aktifId,
  children,
}: {
  awal: Kelas[]
  aktifId: string
  children: React.ReactNode
}) {
  const [grup, setGrup] = useState<Kelas[]>(awal)
  const [status, setStatus] = useState<StatusSimpan>('bersih')

  /*
   * Menyerap data baru dari server.
   *
   * Tandanya hanya memuat STRUKTUR — id kelas, siswa, kolom, dan asesmen —
   * bukan skornya. Nama kolom ikut karena ia disunting lewat aksi server, yang
   * tidak mengubah satu pun id; tanpa itu ganti nama tidak akan pernah sampai
   * ke layar. Band tidak ikut, sebab band ditulis lewat antrean tunda dan
   * memasukkannya akan membuat server menimpa ketikan yang belum tersimpan. Jadi state lokal diperbarui ketika roster atau kolom berubah
   * (lewat aksi server di layar Kelola Kelas), tetapi tidak ketika server
   * mengirim ulang skor yang mungkin sudah lebih lama daripada ketikan yang
   * belum sempat tersimpan.
   */
  const tanda = useMemo(
    () =>
      awal
        .map(
          (k) =>
            `${k.id}:${k.siswa.map((s) => s.id).join('.')}` +
            `:${k.komponen.map((c) => `${c.id}~${c.nama}`).join('.')}` +
            `:${k.asesmen.map((a) => a.id).join('.')}`,
        )
        .join('|'),
    [awal],
  )
  const [tandaTerpakai, setTandaTerpakai] = useState(tanda)
  if (tanda !== tandaTerpakai) {
    setTandaTerpakai(tanda)
    setGrup(awal)
  }

  const antrean = useRef(new Map<string, Antrean>())
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flush = useCallback(async () => {
    const tugas = [...antrean.current.values()]
    antrean.current.clear()
    if (tugas.length === 0) return

    setStatus('menyimpan')
    const supabase = buatKlien()

    const nk = tugas.filter((t) => t.tabel === 'nilai_komponen')
    const na = tugas.filter((t) => t.tabel === 'nilai_asesmen')
    const kmp = tugas.filter((t) => t.tabel === 'komponen')
    const kls = tugas.filter((t) => t.tabel === 'kelas')

    const hasil = await Promise.all([
      nk.length
        ? supabase.from('nilai_komponen').upsert(
            nk.map((t) => ({
              siswa_id: t.siswaId,
              komponen_id: t.komponenId,
              skor: t.skor,
              updated_at: new Date().toISOString(),
            })),
            { onConflict: 'siswa_id,komponen_id' },
          )
        : null,
      na.length
        ? supabase.from('nilai_asesmen').upsert(
            na.map((t) => ({
              siswa_id: t.siswaId,
              asesmen_id: t.asesmenId,
              a: t.butir.a,
              b: t.butir.b,
              c: t.butir.c,
              updated_at: new Date().toISOString(),
            })),
            { onConflict: 'siswa_id,asesmen_id' },
          )
        : null,
      ...kmp.map((t) =>
        supabase
          .from('komponen')
          .update({ band_min: t.bandMin, band_max: t.bandMax })
          .eq('id', t.komponenId),
      ),
      ...kls.map((t) => supabase.from('kelas').update(t.kolom).eq('id', t.kelasId)),
    ])

    const gagal = hasil.some((r) => r && 'error' in r && r.error)
    setStatus(gagal ? 'galat' : 'tersimpan')
  }, [])

  const jadwalkan = useCallback(
    (kunci: string, tugas: Antrean) => {
      antrean.current.set(kunci, tugas)
      setStatus('menyimpan')
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => void flush(), JEDA_SIMPAN)
    },
    [flush],
  )

  // Jangan biarkan ketukan terakhir hilang saat tab ditutup.
  useEffect(() => {
    const pada = () => {
      if (antrean.current.size > 0) void flush()
    }
    window.addEventListener('pagehide', pada)
    return () => {
      window.removeEventListener('pagehide', pada)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [flush])

  const ubahAktif = useCallback(
    (ubah: (k: Kelas) => Kelas) => {
      setGrup((lama) => lama.map((k) => (k.id === aktifId ? ubah(k) : k)))
    },
    [aktifId],
  )

  const setSkor = useCallback(
    (siswaId: string, komponenId: string, skor: number) => {
      ubahAktif((k) => ({
        ...k,
        skorKomponen: {
          ...k.skorKomponen,
          [siswaId]: { ...k.skorKomponen[siswaId], [komponenId]: skor },
        },
      }))
      jadwalkan(`nk:${siswaId}:${komponenId}`, {
        tabel: 'nilai_komponen',
        siswaId,
        komponenId,
        skor,
      })
    },
    [jadwalkan, ubahAktif],
  )

  const setButir = useCallback(
    (siswaId: string, asesmenId: string, butir: ButirAsesmen) => {
      ubahAktif((k) => ({
        ...k,
        skorAsesmen: {
          ...k.skorAsesmen,
          [siswaId]: { ...k.skorAsesmen[siswaId], [asesmenId]: butir },
        },
      }))
      jadwalkan(`na:${siswaId}:${asesmenId}`, {
        tabel: 'nilai_asesmen',
        siswaId,
        asesmenId,
        butir,
      })
    },
    [jadwalkan, ubahAktif],
  )

  const setBand = useCallback(
    (komponenId: string, bandMin: number, bandMax: number) => {
      ubahAktif((k) => ({
        ...k,
        komponen: k.komponen.map((c) =>
          c.id === komponenId ? { ...c, bandMin, bandMax } : c,
        ),
      }))
      jadwalkan(`kmp:${komponenId}`, { tabel: 'komponen', komponenId, bandMin, bandMax })
    },
    [jadwalkan, ubahAktif],
  )

  const setPengaturan = useCallback(
    (p: Partial<PengaturanKelas>) => {
      ubahAktif((k) => ({ ...k, ...p }))

      const kolom: Record<string, number | string> = {}
      if (p.kktp !== undefined) kolom.kktp = p.kktp
      if (p.bobot !== undefined) kolom.bobot = p.bobot
      if (p.naBandMin !== undefined) kolom.na_band_min = p.naBandMin
      if (p.naBandMax !== undefined) kolom.na_band_max = p.naBandMax
      if (p.sumberMinMaks !== undefined) kolom.sumber_minmaks = p.sumberMinMaks

      // Digabung per-kolom supaya menggeser penggeser bobot tidak menumpuk tugas.
      const sebelumnya = antrean.current.get(`kls:${aktifId}`)
      const gabung =
        sebelumnya?.tabel === 'kelas' ? { ...sebelumnya.kolom, ...kolom } : kolom

      jadwalkan(`kls:${aktifId}`, { tabel: 'kelas', kelasId: aktifId, kolom: gabung })
    },
    [aktifId, jadwalkan, ubahAktif],
  )

  const kelas = useMemo(
    () => grup.find((k) => k.id === aktifId) ?? grup[0],
    [grup, aktifId],
  )
  const hasil = useMemo(() => hitungKelas(kelas, grup), [kelas, grup])

  const nilai = useMemo<Nilai>(
    () => ({ kelas, grup, hasil, status, setSkor, setButir, setBand, setPengaturan }),
    [kelas, grup, hasil, status, setSkor, setButir, setBand, setPengaturan],
  )

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>
}

export function useKelas(): Nilai {
  const v = useContext(Konteks)
  if (!v) throw new Error('useKelas dipakai di luar PenyediaKelas')
  return v
}
