'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { buatKelas, type HasilAksi } from '../actions'
import Pilihan from '@/components/pilihan'

const inputKelas = 'isian w-full'

function Tombol() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="tombol" disabled={pending}>
      {pending ? 'Membuat…' : 'Buat kelas'}
    </button>
  )
}

export default function FormKelasBaru({ mapel }: { mapel: { id: string; nama: string }[] }) {
  const [state, action] = useActionState<HasilAksi, FormData>(buatKelas, undefined)
  const [pakaiBaru, setPakaiBaru] = useState(mapel.length === 0)
  const [roster, setRoster] = useState('')

  const jumlahNama = roster.split('\n').filter((b) => b.trim()).length

  return (
    <form action={action} className="papan p-5 sm:p-7 flex flex-col gap-5">
      <div>
        <div className="mikro mb-2">MATA PELAJARAN</div>
        {mapel.length > 0 && (
          <div className="segmen mb-3 w-fit">
            <button
              type="button"
              onClick={() => setPakaiBaru(false)}
              style={{
                background: pakaiBaru ? 'transparent' : 'var(--color-aksen)',
                color: pakaiBaru ? 'var(--color-redup)' : '#ffffff',
              }}
            >
              Yang sudah ada
            </button>
            <button
              type="button"
              onClick={() => setPakaiBaru(true)}
              style={{
                background: pakaiBaru ? 'var(--color-aksen)' : 'transparent',
                color: pakaiBaru ? '#ffffff' : 'var(--color-redup)',
              }}
            >
              Baru
            </button>
          </div>
        )}

        {pakaiBaru ? (
          <input
            name="mapel_baru"
            placeholder="Ilmu Pengetahuan Alam (IPA)"
            className={inputKelas}
            required
          />
        ) : (
          <Pilihan
            name="mapel_id"
            className={inputKelas}
            required
            aria-label="Mata pelajaran"
            defaultValue={mapel[0]?.id}
            opsi={mapel.map((m) => ({ nilai: m.id, label: m.nama }))}
          />
        )}
        <p className="keterangan mt-2 text-[0.6875rem]">
          Kelas dengan mata pelajaran dan semester yang sama saling terhubung: dasbornya
          menampilkan semua kartu kelas.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="mikro">NAMA KELAS</span>
          <input name="nama" placeholder="VIII A" className={inputKelas} required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="mikro">TAHUN AJARAN</span>
          <input name="tahun_ajaran" defaultValue="2025/2026" className={inputKelas} />
        </label>
        <div className="flex flex-col gap-1.5">
          <span id="label-semester" className="mikro">SEMESTER</span>
          <Pilihan
            name="semester"
            defaultValue="1"
            className={inputKelas}
            aria-labelledby="label-semester"
            opsi={[
              { nilai: '1', label: '1' },
              { nilai: '2', label: '2' },
            ]}
          />
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="mikro">
          DAFTAR NAMA SISWA {jumlahNama > 0 ? `· ${jumlahNama} BARIS` : '· OPSIONAL'}
        </span>
        <textarea
          name="roster"
          rows={9}
          value={roster}
          onChange={(e) => setRoster(e.target.value)}
          placeholder={'ABDUL GHOFAR\nADINDA SYIFA KHAERUNNISA\nAKHMAD MUBAROK'}
          className={`${inputKelas} font-[inherit] leading-[1.6]`}
        />
        <span className="text-[0.6875rem] text-[color:var(--color-redup)]">
          Satu nama per baris. Boleh langsung disalin dari Excel — nomor urut di depan
          dan huruf L/P di belakang akan dikenali.
        </span>
      </label>

      {state?.galat ? (
        <p className="text-[0.75rem] font-semibold text-[color:var(--color-bahaya-pekat)] bg-[color:var(--color-basuh)] rounded-[var(--r-kendali)] px-4 py-3">
          {state.galat}
        </p>
      ) : null}

      <div>
        <Tombol />
      </div>
    </form>
  )
}
