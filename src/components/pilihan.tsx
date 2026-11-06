"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export type Opsi = { nilai: string; label: React.ReactNode; teks?: string };

/**
 * Kotak pilih buatan sendiri, pengganti <select> bawaan peramban.
 *
 * Daftar <select> yang terbuka digambar oleh sistem operasi — tidak bisa diberi
 * sudut, bayangan, maupun warna aplikasi. Komponen ini menggambar daftarnya
 * sendiri (peran combobox + listbox) dan menyimpan nilainya di <input hidden>
 * supaya FormData dan server action tetap bekerja tanpa perubahan.
 *
 * Daftar dirender lewat portal dengan posisi `fixed`, jadi tidak terpotong oleh
 * wadah tabel yang bergulir. Daftar membalik ke atas bila ruang di bawah sempit.
 *
 * `kirimOtomatis` mengirim form induk begitu pilihan berganti — dipakai di
 * baris swasimpan (lihat swasimpan.tsx).
 */
export default function Pilihan({
  opsi,
  name,
  value,
  defaultValue,
  onUbah,
  kirimOtomatis = false,
  className = "isian",
  id,
  required,
  disabled,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: {
  opsi: Opsi[];
  name?: string;
  value?: string;
  defaultValue?: string;
  onUbah?: (nilai: string) => void;
  kirimOtomatis?: boolean;
  className?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) {
  const terkendali = value !== undefined;
  const [lokal, setLokal] = useState(defaultValue ?? opsi[0]?.nilai ?? "");
  const nilai = terkendali ? value : lokal;

  const [buka, setBuka] = useState(false);
  const [aktif, setAktif] = useState(0);
  const [posisi, setPosisi] = useState<{
    left: number;
    width: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  } | null>(null);

  const pemicu = useRef<HTMLButtonElement>(null);
  const daftar = useRef<HTMLUListElement>(null);
  const tersembunyi = useRef<HTMLInputElement>(null);
  const ketikan = useRef({ teks: "", jam: 0 });
  const perluKirim = useRef(false);
  const idDasar = useId();
  const idDaftar = `${idDasar}-daftar`;
  const idOpsi = (i: number) => `${idDasar}-opsi-${i}`;

  const indeksTerpilih = Math.max(
    0,
    opsi.findIndex((o) => o.nilai === nilai),
  );
  const terpilih = opsi.find((o) => o.nilai === nilai);

  const ukur = useCallback(() => {
    const el = pemicu.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const celah = 6;
    const bawah = window.innerHeight - r.bottom - celah - 8;
    const atas = r.top - celah - 8;
    const ingin = 264;
    const keAtas = bawah < Math.min(ingin, 160) && atas > bawah;
    setPosisi({
      left: r.left,
      width: r.width,
      ...(keAtas
        ? { bottom: window.innerHeight - r.top + celah }
        : { top: r.bottom + celah }),
      maxHeight: Math.max(120, Math.min(ingin, keAtas ? atas : bawah)),
    });
  }, []);

  const tutup = useCallback((fokusKembali = true) => {
    setBuka(false);
    if (fokusKembali) pemicu.current?.focus();
  }, []);

  const bukaDaftar = () => {
    if (disabled) return;
    setAktif(indeksTerpilih);
    ukur();
    setBuka(true);
  };

  const pilih = (i: number) => {
    const o = opsi[i];
    if (!o) return;
    if (o.nilai !== nilai) {
      if (!terkendali) setLokal(o.nilai);
      onUbah?.(o.nilai);
      if (kirimOtomatis) perluKirim.current = true;
    }
    tutup();
  };

  // Kirim form setelah nilai baru sudah tertulis ke input tersembunyi.
  useEffect(() => {
    if (!perluKirim.current) return;
    perluKirim.current = false;
    tersembunyi.current?.form?.requestSubmit();
  }, [nilai]);

  // Ikuti gulir/ubah ukuran selama terbuka; klik di luar menutup.
  useLayoutEffect(() => {
    if (!buka) return;
    const luar = (e: PointerEvent) => {
      const t = e.target as Node;
      if (pemicu.current?.contains(t) || daftar.current?.contains(t)) return;
      tutup(false);
    };
    window.addEventListener("scroll", ukur, true);
    window.addEventListener("resize", ukur);
    document.addEventListener("pointerdown", luar);
    return () => {
      window.removeEventListener("scroll", ukur, true);
      window.removeEventListener("resize", ukur);
      document.removeEventListener("pointerdown", luar);
    };
  }, [buka, ukur, tutup]);

  // Opsi aktif selalu terlihat.
  useEffect(() => {
    if (!buka) return;
    document
      .getElementById(idOpsi(aktif))
      ?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buka, aktif]);

  const cariKetikan = (huruf: string) => {
    const k = ketikan.current;
    const kini = Date.now();
    k.teks = kini - k.jam > 600 ? huruf : k.teks + huruf;
    k.jam = kini;
    const teksOpsi = (o: Opsi) =>
      (o.teks ?? (typeof o.label === "string" ? o.label : o.nilai)).toLowerCase();
    const mulai = buka ? aktif : indeksTerpilih;
    for (let n = 1; n <= opsi.length; n++) {
      const i = (mulai + (k.teks.length > 1 ? n - 1 : n)) % opsi.length;
      if (teksOpsi(opsi[i]).startsWith(k.teks)) return i;
    }
    return -1;
  };

  const tombol = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const akhir = opsi.length - 1;
    if (!buka) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        bukaDaftar();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const i = cariKetikan(e.key.toLowerCase());
        if (i >= 0) pilih(i);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setAktif((a) => Math.min(akhir, a + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setAktif((a) => Math.max(0, a - 1));
        break;
      case "Home":
        e.preventDefault();
        setAktif(0);
        break;
      case "End":
        e.preventDefault();
        setAktif(akhir);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        pilih(aktif);
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        tutup();
        break;
      case "Tab":
        tutup(false);
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const i = cariKetikan(e.key.toLowerCase());
          if (i >= 0) setAktif(i);
        }
    }
  };

  return (
    <>
      <button
        ref={pemicu}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={buka}
        aria-controls={buka ? idDaftar : undefined}
        aria-activedescendant={buka ? idOpsi(aktif) : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-required={required}
        disabled={disabled}
        data-buka={buka || undefined}
        onClick={() => (buka ? tutup() : bukaDaftar())}
        onKeyDown={tombol}
        className={`${className} pilihan-pemicu`}
      >
        <span className="min-w-0 truncate text-left">
          {terpilih?.label ?? "—"}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="pilihan-panah"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      {name && (
        <input ref={tersembunyi} type="hidden" name={name} value={nilai} />
      )}
      {!name && kirimOtomatis && (
        <input ref={tersembunyi} type="hidden" value={nilai} />
      )}
      {buka &&
        posisi &&
        createPortal(
          <ul
            ref={daftar}
            id={idDaftar}
            role="listbox"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledby}
            className="pilihan-daftar tanpa-cetak"
            style={{
              position: "fixed",
              left: posisi.left,
              top: posisi.top,
              bottom: posisi.bottom,
              minWidth: posisi.width,
              maxWidth: `max(${posisi.width}px, min(24rem, calc(100vw - ${posisi.left + 8}px)))`,
              maxHeight: posisi.maxHeight,
            }}
            // Jangan curi fokus dari pemicu saat opsi diklik.
            onPointerDown={(e) => e.preventDefault()}
          >
            {opsi.map((o, i) => {
              const dipilih = o.nilai === nilai;
              return (
                <li
                  key={o.nilai}
                  id={idOpsi(i)}
                  role="option"
                  aria-selected={dipilih}
                  data-aktif={i === aktif || undefined}
                  className="pilihan-opsi"
                  onPointerEnter={() => setAktif(i)}
                  onClick={() => pilih(i)}
                >
                  <span className="min-w-0 flex-1">{o.label}</span>
                  {dipilih && (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 16 16"
                      className="w-3.5 h-3.5 flex-none"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3.5 8.5l3 3 6-7" />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </>
  );
}
