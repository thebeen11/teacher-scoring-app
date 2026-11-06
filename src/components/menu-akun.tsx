"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { keluar } from "@/app/(auth)/actions";

export type Pengguna = { nama: string; email: string };

/** Huruf awal untuk avatar: dua kata pertama nama, atau huruf pertama email. */
export function inisial({ nama, email }: Pengguna): string {
  const kata = nama.trim().split(/\s+/).filter(Boolean);
  if (kata.length)
    return kata
      .slice(0, 2)
      .map((k) => k[0])
      .join("")
      .toUpperCase();
  return (email[0] ?? "?").toUpperCase();
}

/** Lingkaran berisi inisial pengguna. */
export function Avatar({
  pengguna,
  className = "w-9 h-9",
}: {
  pengguna: Pengguna;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`kotak-ikon flex-none rounded-full bg-gradient-to-br from-[color:var(--color-langit)] to-[color:var(--color-daun)] text-[0.75rem] font-bold text-white ${className}`}
    >
      {inisial(pengguna)}
    </span>
  );
}

const BUTIR =
  "flex items-center gap-2 px-3 py-2 rounded-[var(--r-kendali)] text-[0.7812rem] font-semibold no-underline";

/** Pemicu avatar + nama di kepala beranda, membuka menu akun ke bawah. */
export default function MenuAkun({ pengguna }: { pengguna: Pengguna }) {
  const [buka, setBuka] = useState(false);
  const akar = useRef<HTMLDivElement>(null);
  const pemicu = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!buka) return;
    const kunci = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setBuka(false);
        pemicu.current?.focus();
      }
    };
    const luar = (e: PointerEvent) => {
      if (!akar.current?.contains(e.target as Node)) setBuka(false);
    };
    window.addEventListener("keydown", kunci);
    document.addEventListener("pointerdown", luar);
    return () => {
      window.removeEventListener("keydown", kunci);
      document.removeEventListener("pointerdown", luar);
    };
  }, [buka]);

  return (
    <div ref={akar} className="relative min-w-0">
      <button
        ref={pemicu}
        type="button"
        onClick={() => setBuka((b) => !b)}
        aria-haspopup="menu"
        aria-expanded={buka}
        className="flex items-center gap-2.5 min-w-0 px-2 py-1.5 rounded-[var(--r-kendali)] border-0 bg-transparent cursor-pointer text-left transition-colors hover:bg-[color:var(--color-sorot)]"
        style={{ background: buka ? "var(--color-sorot)" : undefined }}
      >
        <Avatar pengguna={pengguna} />
        <span className="hidden sm:block min-w-0 max-w-[14rem] truncate text-[0.7812rem] font-semibold text-[color:var(--color-tinta)]">
          {pengguna.nama || pengguna.email || "Guru"}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="w-3.5 h-3.5 flex-none text-[color:var(--color-samar)] transition-transform"
          style={{ transform: buka ? "rotate(180deg)" : "none" }}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {buka && (
        <div
          role="menu"
          aria-label="Akun"
          className="menu-samping absolute right-0 top-full mt-2 w-64"
        >
          <div className="px-3 pt-2 pb-2.5">
            <div className="text-[0.7812rem] font-semibold leading-tight truncate text-[color:var(--color-tinta)]">
              {pengguna.nama || "Guru"}
            </div>
            {pengguna.email && (
              <div className="mt-0.5 text-[0.6875rem] truncate text-[color:var(--color-samar)]">
                {pengguna.email}
              </div>
            )}
          </div>
          <div className="pt-1 border-t border-[color:var(--color-garis)] flex flex-col">
            <Link
              href="/akun"
              role="menuitem"
              onClick={() => setBuka(false)}
              className={BUTIR}
              style={{ color: "var(--color-redup)" }}
            >
              Pengaturan akun
            </Link>
            <form action={keluar}>
              <button
                type="submit"
                role="menuitem"
                className={`${BUTIR} w-full text-left border-0 bg-transparent cursor-pointer text-[color:var(--color-bahaya-pekat)]`}
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
