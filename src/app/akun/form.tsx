'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { ubahNama, ubahSandi, type HasilAkun } from './actions'

function Tombol({ label, memuat }: { label: string; memuat: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="tombol w-fit" disabled={pending}>
      {pending ? memuat : label}
    </button>
  )
}

function Pesan({ hasil }: { hasil: HasilAkun }) {
  if (hasil?.galat)
    return (
      <p
        role="alert"
        className="text-[0.875rem] font-semibold text-[color:var(--color-bahaya-pekat)] bg-[color:var(--color-basuh)] rounded-[var(--r-kendali)] px-4 py-3"
      >
        {hasil.galat}
      </p>
    )
  if (hasil?.sukses)
    return (
      <p
        role="status"
        className="text-[0.875rem] font-semibold text-[color:var(--color-aksen-gelap)] bg-[color:var(--color-sorot)] rounded-[var(--r-kendali)] px-4 py-3"
      >
        {hasil.sukses}
      </p>
    )
  return null
}

const catatan = 'text-[0.8125rem] text-[color:var(--color-redup)]'

export function FormProfil({ email, nama }: { email: string; nama: string }) {
  const [hasil, action] = useActionState<HasilAkun, FormData>(ubahNama, undefined)

  return (
    <form action={action} className="papan p-5 sm:p-7 flex flex-col gap-4">
      <div className="mikro">PROFIL</div>

      <label className="flex flex-col gap-1.5">
        <span className="mikro">EMAIL</span>
        <input
          type="email"
          value={email}
          readOnly
          aria-readonly="true"
          tabIndex={-1}
          className="isian w-full cursor-not-allowed text-[color:var(--color-redup)] bg-[color:var(--color-kertas)]"
        />
        <span className={catatan}>Email tidak dapat diubah.</span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="mikro">NAMA GURU</span>
        <input
          name="nama"
          type="text"
          autoComplete="name"
          defaultValue={nama}
          maxLength={100}
          required
          className="isian w-full"
        />
      </label>

      <Pesan hasil={hasil} />
      <Tombol label="Simpan nama" memuat="Menyimpan…" />
    </form>
  )
}

export function FormSandi() {
  const [hasil, action] = useActionState<HasilAkun, FormData>(ubahSandi, undefined)

  return (
    // React mengosongkan isian setelah aksi selesai, jadi kata sandi tidak tertinggal.
    <form action={action} className="papan p-5 sm:p-7 flex flex-col gap-4">
      <div className="mikro">KATA SANDI</div>

      <label className="flex flex-col gap-1.5">
        <span className="mikro">KATA SANDI LAMA</span>
        <input
          name="sandi_lama"
          type="password"
          autoComplete="current-password"
          required
          className="isian w-full"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="mikro">KATA SANDI BARU</span>
        <input
          name="sandi_baru"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="isian w-full"
        />
        <span className={catatan}>Minimal 8 karakter.</span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="mikro">ULANGI KATA SANDI BARU</span>
        <input
          name="sandi_ulang"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="isian w-full"
        />
      </label>

      <Pesan hasil={hasil} />
      <Tombol label="Ganti kata sandi" memuat="Mengganti…" />
    </form>
  )
}
