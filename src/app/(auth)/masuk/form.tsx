'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { masuk, type HasilAuth } from '../actions'

function Tombol() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="tombol w-full text-center mt-1" disabled={pending}>
      {pending ? 'Memeriksa…' : 'Masuk'}
    </button>
  )
}

export default function FormMasuk({ lanjut }: { lanjut: string }) {
  const [state, action] = useActionState<HasilAuth, FormData>(masuk, undefined)

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="lanjut" value={lanjut} />

      <label className="flex flex-col gap-1.5">
        <span className="mikro">EMAIL</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="isian"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="mikro">KATA SANDI</span>
        <input
          name="sandi"
          type="password"
          autoComplete="current-password"
          required
          className="isian"
        />
      </label>

      {state?.galat ? (
        <p className="text-[0.75rem] font-semibold text-[color:var(--color-bahaya-pekat)] bg-[color:var(--color-basuh)] rounded-[var(--r-kendali)] px-4 py-3">
          {state.galat}
        </p>
      ) : null}

      <Tombol />
    </form>
  )
}
