'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { daftar, type HasilAuth } from '../actions'

function Tombol() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="tombol w-full text-center mt-1" disabled={pending}>
      {pending ? 'Mendaftarkan…' : 'Daftar'}
    </button>
  )
}

const kelasInput = 'isian'

export default function FormDaftar() {
  const [state, action] = useActionState<HasilAuth, FormData>(daftar, undefined)

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="mikro">NAMA GURU</span>
        <input name="nama" type="text" autoComplete="name" className={kelasInput} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="mikro">SEKOLAH</span>
        <input
          name="sekolah"
          type="text"
          placeholder="SMP Negeri 1 Wanasari"
          className={kelasInput}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="mikro">EMAIL</span>
        <input name="email" type="email" autoComplete="email" required className={kelasInput} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="mikro">KATA SANDI</span>
        <input
          name="sandi"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={kelasInput}
        />
        <span className="text-[0.8125rem] text-[color:var(--color-redup)]">Minimal 8 karakter.</span>
      </label>

      {state?.galat ? (
        <p className="text-[0.875rem] font-semibold text-[color:var(--color-bahaya-pekat)] bg-[color:var(--color-basuh)] rounded-[var(--r-kendali)] px-4 py-3">
          {state.galat}
        </p>
      ) : null}

      <Tombol />
    </form>
  )
}
