"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { buatKelas, type HasilAksi } from "../actions";
import IsianKelas from "@/components/isian-kelas";

const inputKelas = "isian w-full";

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="tombol" disabled={pending}>
      {pending ? "Membuat…" : "Buat kelas"}
    </button>
  );
}

export default function FormKelasBaru({
  mapel,
}: {
  mapel: { id: string; nama: string }[];
}) {
  const [state, action] = useActionState<HasilAksi, FormData>(
    buatKelas,
    undefined,
  );
  const [roster, setRoster] = useState("");

  const jumlahNama = roster.split("\n").filter((b) => b.trim()).length;

  return (
    <form action={action} className="papan p-5 sm:p-7 flex flex-col gap-5">
      <IsianKelas mapel={mapel} />

      <label className="flex flex-col gap-1.5">
        <span className="mikro">
          DAFTAR NAMA SISWA{" "}
          {jumlahNama > 0 ? `· ${jumlahNama} BARIS` : "· OPSIONAL"}
        </span>
        <textarea
          name="roster"
          rows={9}
          value={roster}
          onChange={(e) => setRoster(e.target.value)}
          placeholder={"ABDUL GHOFAR\nADINDA SYIFA KHAERUNNISA\nAKHMAD MUBAROK"}
          className={`${inputKelas} font-[inherit] leading-[1.6]`}
        />
        <span className="text-[0.8125rem] text-[color:var(--color-redup)]">
          Satu nama per baris. Boleh langsung disalin dari Excel — nomor urut di
          depan dan huruf L/P di belakang akan dikenali.
        </span>
      </label>

      {state?.galat ? (
        <p className="text-[0.875rem] font-semibold text-[color:var(--color-bahaya-pekat)] bg-[color:var(--color-basuh)] rounded-[var(--r-kendali)] px-4 py-3">
          {state.galat}
        </p>
      ) : null}

      <div>
        <Tombol />
      </div>
    </form>
  );
}
