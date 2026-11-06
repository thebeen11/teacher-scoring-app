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
  butirMentah,
  hitungKelas,
  skorBagian,
  type ButirAsesmen,
  type ModeAsesmen,
  type HasilKelas,
  type Tambahan,
  type Kelas,
  type Bobot,
  type SumberMinMaks,
} from '@/lib/nilai'
import type { RingkasanKelas } from '@/lib/data'

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
  | { tabel: 'nilai_tambahan'; siswaId: string; tambahan: Tambahan }
  | { tabel: 'komponen'; komponenId: string; bandMin: number; bandMax: number }
  | { tabel: 'asesmen'; asesmenId: string; kolom: { mode?: ModeAsesmen; band_min?: number; band_max?: number } }
  | { tabel: 'kelas'; kelasId: string; kolom: Record<string, number | string> }

type Nilai = {
  kelas: Kelas
  grup: Kelas[]
  /** Seluruh kelas milik guru (lintas mapel/semester), untuk menyalin pengaturan. */
  semuaKelas: RingkasanKelas[]
  hasil: HasilKelas
  status: StatusSimpan
  setSkor: (siswaId: string, komponenId: string, skor: number) => void
  setButir: (siswaId: string, asesmenId: string, butir: ButirAsesmen) => void
  setTambahan: (siswaId: string, tambahan: Tambahan) => void
  setModeAsesmen: (asesmenId: string, mode: ModeAsesmen) => void
  setBand: (komponenId: string, bandMin: number, bandMax: number) => void
  setBandAsesmen: (asesmenId: string, bandMin: number, bandMax: number) => void
  setPengaturan: (p: Partial<PengaturanKelas>) => void
  /** Salin KKTP + bobot kelas aktif ke kelas lain di grup (state lokal saja). */
  salinPengaturan: (kelasIds: string[]) => void
}

export type PengaturanKelas = {
  kktp: number
  /** Sebagian bagian saja boleh dikirim; sisanya dipertahankan. */
  bobot: Partial<Bobot>
  naBandMin: number
  naBandMax: number
  sumberMinMaks: SumberMinMaks
  totalPertemuan: number
}

const Konteks = createContext<Nilai | null>(null)

const JEDA_SIMPAN = 600

export function PenyediaKelas({
  awal,
  aktifId,
  semuaKelas,
  children,
}: {
  awal: Kelas[]
  aktifId: string
  semuaKelas: RingkasanKelas[]
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
   * (lewat aksi server dari tab kolom di layar entri atau layar Kelola Kelas), tetapi tidak ketika server
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
    const ases = tugas.filter((t) => t.tabel === 'asesmen')
    const nt = tugas.filter((t) => t.tabel === 'nilai_tambahan')

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
              skor_langsung: t.butir.skor,
              updated_at: new Date().toISOString(),
            })),
            { onConflict: 'siswa_id,asesmen_id' },
          )
        : null,
      nt.length
        ? supabase.from('nilai_tambahan').upsert(
            nt.map((t) => ({
              siswa_id: t.siswaId,
              hadir: t.tambahan.hadir,
              sakit: t.tambahan.sakit,
              izin: t.tambahan.izin,
              keaktifan: t.tambahan.keaktifan,
              updated_at: new Date().toISOString(),
            })),
            { onConflict: 'siswa_id' },
          )
        : null,
      ...kmp.map((t) =>
        supabase
          .from('komponen')
          .update({ band_min: t.bandMin, band_max: t.bandMax })
          .eq('id', t.komponenId),
      ),
      ...kls.map((t) => supabase.from('kelas').update(t.kolom).eq('id', t.kelasId)),
      ...ases.map((t) => supabase.from('asesmen').update(t.kolom).eq('id', t.asesmenId)),
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

  // Mode dan rentang asesmen berbagi satu tugas per asesmen; digabung supaya
  // perubahan yang satu tidak menimpa yang lain sebelum tersimpan.
  const jadwalkanAsesmen = useCallback(
    (asesmenId: string, kolom: { mode?: ModeAsesmen; band_min?: number; band_max?: number }) => {
      const sebelumnya = antrean.current.get(`as:${asesmenId}`)
      const gabung = sebelumnya?.tabel === 'asesmen' ? { ...sebelumnya.kolom, ...kolom } : kolom
      jadwalkan(`as:${asesmenId}`, { tabel: 'asesmen', asesmenId, kolom: gabung })
    },
    [jadwalkan],
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

  const setTambahan = useCallback(
    (siswaId: string, tambahan: Tambahan) => {
      ubahAktif((k) => ({
        ...k,
        skorTambahan: { ...k.skorTambahan, [siswaId]: tambahan },
      }))
      jadwalkan(`nt:${siswaId}`, { tabel: 'nilai_tambahan', siswaId, tambahan })
    },
    [jadwalkan, ubahAktif],
  )

  /*
   * Pindah ke mode 'langsung' membawa SKOR yang baru saja terlihat di mode
   * 'bagian', supaya angkanya tidak tiba-tiba menjadi nol. Siswa yang belum
   * punya rincian bagian (SKOR 0) tidak disentuh, jadi SKOR yang dulu diketik
   * langsung untuknya tetap utuh. Arah sebaliknya tidak menyalin apa pun:
   * SKOR tunggal tidak bisa dipecah kembali menjadi A/B/C.
   */
  const setModeAsesmen = useCallback(
    (asesmenId: string, mode: ModeAsesmen) => {
      const k = grup.find((g) => g.id === aktifId) ?? grup[0]
      const a = k?.asesmen.find((x) => x.id === asesmenId)
      if (!k || !a || a.mode === mode) return

      const bawa: { siswaId: string; butir: ButirAsesmen }[] = []
      if (mode === 'langsung') {
        for (const s of k.siswa) {
          const butir = butirMentah(k, s.id, asesmenId)
          const skor = skorBagian(butir, a)
          if (skor > 0 && skor !== butir.skor) bawa.push({ siswaId: s.id, butir: { ...butir, skor } })
        }
      }

      ubahAktif((kls) => {
        const skorAsesmen = { ...kls.skorAsesmen }
        for (const { siswaId, butir } of bawa) {
          skorAsesmen[siswaId] = { ...skorAsesmen[siswaId], [asesmenId]: butir }
        }
        return {
          ...kls,
          asesmen: kls.asesmen.map((x) => (x.id === asesmenId ? { ...x, mode } : x)),
          skorAsesmen,
        }
      })

      for (const { siswaId, butir } of bawa) {
        jadwalkan(`na:${siswaId}:${asesmenId}`, {
          tabel: 'nilai_asesmen',
          siswaId,
          asesmenId,
          butir,
        })
      }
      jadwalkanAsesmen(asesmenId, { mode })
    },
    [aktifId, grup, jadwalkan, jadwalkanAsesmen, ubahAktif],
  )

  const setBandAsesmen = useCallback(
    (asesmenId: string, bandMin: number, bandMax: number) => {
      ubahAktif((k) => ({
        ...k,
        asesmen: k.asesmen.map((a) => (a.id === asesmenId ? { ...a, bandMin, bandMax } : a)),
      }))
      jadwalkanAsesmen(asesmenId, { band_min: bandMin, band_max: bandMax })
    },
    [jadwalkanAsesmen, ubahAktif],
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
      ubahAktif((k) => ({ ...k, ...p, bobot: { ...k.bobot, ...p.bobot } }))

      const kolom: Record<string, number | string> = {}
      if (p.kktp !== undefined) kolom.kktp = p.kktp
      if (p.bobot?.formatif !== undefined) kolom.bobot_formatif = p.bobot.formatif
      if (p.bobot?.sumatif !== undefined) kolom.bobot_sumatif = p.bobot.sumatif
      if (p.bobot?.tengah !== undefined) kolom.bobot_tengah = p.bobot.tengah
      if (p.bobot?.akhir !== undefined) kolom.bobot_akhir = p.bobot.akhir
      if (p.bobot?.kehadiran !== undefined) kolom.bobot_kehadiran = p.bobot.kehadiran
      if (p.naBandMin !== undefined) kolom.na_band_min = p.naBandMin
      if (p.naBandMax !== undefined) kolom.na_band_max = p.naBandMax
      if (p.sumberMinMaks !== undefined) kolom.sumber_minmaks = p.sumberMinMaks
      if (p.totalPertemuan !== undefined) kolom.total_pertemuan = p.totalPertemuan

      // Digabung per-kolom supaya menggeser penggeser bobot tidak menumpuk tugas.
      const sebelumnya = antrean.current.get(`kls:${aktifId}`)
      const gabung =
        sebelumnya?.tabel === 'kelas' ? { ...sebelumnya.kolom, ...kolom } : kolom

      jadwalkan(`kls:${aktifId}`, { tabel: 'kelas', kelasId: aktifId, kolom: gabung })
    },
    [aktifId, jadwalkan, ubahAktif],
  )

  // Hanya state lokal: penulisan ke server dilakukan lewat aksi
  // terapkanPengaturan. Perlu karena `tanda` tidak memuat bobot/KKTP, jadi data
  // baru dari server tidak akan menimpa kelas lain di grup ini.
  const salinPengaturan = useCallback(
    (kelasIds: string[]) => {
      const ids = new Set(kelasIds)
      setGrup((lama) => {
        const sumber = lama.find((k) => k.id === aktifId)
        if (!sumber) return lama
        return lama.map((k) =>
          ids.has(k.id) ? { ...k, kktp: sumber.kktp, bobot: { ...sumber.bobot } } : k,
        )
      })
    },
    [aktifId],
  )

  const kelas = useMemo(
    () => grup.find((k) => k.id === aktifId) ?? grup[0],
    [grup, aktifId],
  )
  const hasil = useMemo(() => hitungKelas(kelas, grup), [kelas, grup])

  const nilai = useMemo<Nilai>(
    () => ({
      kelas,
      grup,
      semuaKelas,
      hasil,
      status,
      setSkor,
      setButir,
      setTambahan,
      setModeAsesmen,
      setBand,
      setBandAsesmen,
      setPengaturan,
      salinPengaturan,
    }),
    [kelas, grup, semuaKelas, hasil, status, setSkor, setButir, setTambahan, setModeAsesmen, setBand, setBandAsesmen, setPengaturan, salinPengaturan],
  )

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>
}

export function useKelas(): Nilai {
  const v = useContext(Konteks)
  if (!v) throw new Error('useKelas dipakai di luar PenyediaKelas')
  return v
}
