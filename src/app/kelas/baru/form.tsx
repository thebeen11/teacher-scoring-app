'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { buatKelas, type HasilAksi } from '../actions'

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
          <select name="mapel_id" className={inputKelas} required defaultValue={mapel[0]?.id}>
            {mapel.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nama}
              </option>
            ))}
          </select>
        )}
        <p className="keterangan mt-2 text-[11px]">
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
        <label className="flex flex-col gap-1.5">
          <span className="mikro">SEMESTER</span>
          <select name="semester" defaultValue="1" className={inputKelas}>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </label>
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
        <span className="text-[11px] text-[color:var(--color-redup)]">
          Satu nama per baris. Boleh langsung ditempel dari spreadsheet — nomor urut di depan
          dan huruf L/P di belakang akan dikenali.
        </span>
      </label>

      {state?.galat ? (
        <p className="text-[12px] font-semibold text-[color:var(--color-bahaya-pekat)] bg-[color:var(--color-basuh)] rounded-[var(--r-kendali)] px-4 py-3">
          {state.galat}
        </p>
      ) : null}

      <div>
        <Tombol />
      </div>
    </form>
  )
}
