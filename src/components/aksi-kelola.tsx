"use client";

import { useState, useTransition } from "react";
import { aturAktifKelas, hapusKelas, tambahSiswa } from "@/app/kelas/actions";
import Dialog, { KELAS_TOMBOL_BAHAYA } from "./dialog";
import { IkonSampah } from "./tombol-hapus";

/**
 * Tiga aksi tingkat kelas di kepala layar Kelola Kelas: tambah siswa,
 * nonaktifkan/aktifkan, dan hapus kelas. Masing-masing membuka dialognya
 * sendiri; tidak ada yang langsung mengubah data dengan satu klik.
 */

// Ikon garis dari set Lucide (lisensi ISC), digambar inline.
function Ikon({ children, className = "w-3.5 h-3.5" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`flex-none ${className}`}
    >
      {children}
    </svg>
  );
}

// user-plus
const jalurTambah = (
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" x2="19" y1="8" y2="14" />
    <line x1="22" x2="16" y1="11" y2="11" />
  </>
);
// archive
const jalurArsip = (
  <>
    <rect width="20" height="5" x="2" y="3" rx="1" />
    <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
    <path d="M10 12h4" />
  </>
);
// archive-restore
const jalurPulih = (
  <>
    <rect width="20" height="5" x="2" y="3" rx="1" />
    <path d="M4 8v11a2 2 0 0 0 2 2h2" />
    <path d="M20 8v11a2 2 0 0 1-2 2h-2" />
    <path d="m9 15 3-3 3 3" />
    <path d="M12 12v9" />
  </>
);

const TOMBOL_UTAMA =
  "tombol inline-flex items-center gap-1.5 whitespace-nowrap shadow-none hover:shadow-none hover:translate-y-0";
const TOMBOL_GARIS = "tombol-garis inline-flex items-center gap-1.5 whitespace-nowrap";

function Galat({ teks }: { teks: string | null }) {
  if (!teks) return null;
  return (
    <p className="keterangan mt-3 text-[0.6875rem]" style={{ color: "var(--color-bahaya)" }} role="alert">
      {teks}
    </p>
  );
}

/* ------------------------------------------------------------ tambah siswa -- */

export function TombolTambahSiswa({ kelasId }: { kelasId: string }) {
  const [buka, setBuka] = useState(false);
  const [roster, setRoster] = useState("");
  const [sibuk, mulai] = useTransition();

  const jumlah = roster.split("\n").filter((b) => b.trim()).length;

  const tambahkan = () =>
    mulai(async () => {
      const fd = new FormData();
      fd.set("roster", roster);
      await tambahSiswa(kelasId, fd);
      setRoster("");
      setBuka(false);
    });

  return (
    <>
      <button type="button" className={TOMBOL_UTAMA} onClick={() => setBuka(true)}>
        <Ikon>{jalurTambah}</Ikon>
        Tambah siswa
      </button>

      {buka && (
        <Dialog
          ikon={<Ikon className="w-4 h-4">{jalurTambah}</Ikon>}
          judul="Tambah siswa"
          keterangan="Siswa baru diberi nomor urut setelah siswa terakhir."
          lebar="max-w-[30rem]"
          sibuk={sibuk}
          onTutup={() => setBuka(false)}
          kaki={
            <>
              <button type="button" className="tombol-garis" onClick={() => setBuka(false)} disabled={sibuk}>
                Batal
              </button>
              <button
                type="button"
                className={`${TOMBOL_UTAMA} disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={tambahkan}
                disabled={sibuk || jumlah === 0}
              >
                {sibuk ? "Menambahkan…" : jumlah > 0 ? `Tambahkan (${jumlah})` : "Tambahkan"}
              </button>
            </>
          }
        >
          <textarea
            name="roster"
            rows={8}
            autoFocus
            value={roster}
            onChange={(e) => setRoster(e.target.value)}
            placeholder={"Satu nama per baris — boleh disalin langsung dari Excel."}
            aria-label="Daftar nama siswa"
            className="isian w-full text-[0.75rem] leading-[1.6]"
          />
        </Dialog>
      )}
    </>
  );
}

/* ------------------------------------------------------ nonaktif / aktif -- */

export function TombolAktifKelas({ kelasId, nama, aktif }: { kelasId: string; nama: string; aktif: boolean }) {
  const [buka, setBuka] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, mulai] = useTransition();

  const ubah = (jadi: boolean) =>
    mulai(async () => {
      setGalat(null);
      const hasil = await aturAktifKelas(kelasId, jadi);
      if (hasil?.galat) {
        setGalat(hasil.galat);
        return;
      }
      setBuka(false);
    });

  // Mengaktifkan lagi tidak berisiko apa pun — langsung jalan, tanpa dialog.
  if (!aktif) {
    return (
      <span className="inline-flex flex-col items-end">
        <button type="button" className={TOMBOL_GARIS} onClick={() => ubah(true)} disabled={sibuk}>
          <Ikon>{jalurPulih}</Ikon>
          {sibuk ? "Mengaktifkan…" : "Aktifkan lagi"}
        </button>
        <Galat teks={galat} />
      </span>
    );
  }

  return (
    <>
      <button type="button" className={TOMBOL_GARIS} onClick={() => setBuka(true)}>
        <Ikon>{jalurArsip}</Ikon>
        Nonaktifkan
      </button>

      {buka && (
        <Dialog
          ikon={<Ikon className="w-4 h-4">{jalurArsip}</Ikon>}
          judul="Nonaktifkan kelas?"
          keterangan={
            <>
              Kelas <strong>{nama}</strong> akan disembunyikan dari Semua Kelas dan pemilih kelas. Siswa dan
              nilainya tetap tersimpan. Kelas tetap bisa dibuka dari bagian Kelas Nonaktif di halaman depan dan
              diaktifkan lagi kapan saja dari layar ini.
            </>
          }
          sibuk={sibuk}
          onTutup={() => setBuka(false)}
          kaki={
            <>
              <button type="button" className="tombol-garis" onClick={() => setBuka(false)} disabled={sibuk} autoFocus>
                Batal
              </button>
              <button type="button" className={TOMBOL_UTAMA} onClick={() => ubah(false)} disabled={sibuk}>
                <Ikon>{jalurArsip}</Ikon>
                {sibuk ? "Menonaktifkan…" : "Nonaktifkan"}
              </button>
            </>
          }
        >
          {galat && <Galat teks={galat} />}
        </Dialog>
      )}
    </>
  );
}

/* ------------------------------------------------------------ hapus kelas -- */

export function TombolHapusKelas({ kelasId, nama }: { kelasId: string; nama: string }) {
  const [buka, setBuka] = useState(false);
  const [ketik, setKetik] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, mulai] = useTransition();

  const cocok = ketik.trim() === nama.trim();

  const tutup = () => {
    setBuka(false);
    setKetik("");
    setGalat(null);
  };

  const hapus = () =>
    mulai(async () => {
      setGalat(null);
      // Berhasil = server mengalihkan ke halaman depan; yang kembali ke sini
      // hanya galat.
      const hasil = await hapusKelas(kelasId, ketik);
      if (hasil?.galat) setGalat(hasil.galat);
    });

  return (
    <>
      <button
        type="button"
        className={TOMBOL_GARIS}
        style={{ borderColor: "var(--color-bahaya)", color: "var(--color-bahaya)" }}
        onClick={() => setBuka(true)}
      >
        <IkonSampah className="w-3.5 h-3.5 flex-none" />
        Hapus kelas
      </button>

      {buka && (
        <Dialog
          nada="bahaya"
          ikon={<IkonSampah className="w-4 h-4" />}
          judul="Hapus kelas?"
          keterangan={
            <>
              Kelas <strong>{nama}</strong> beserta seluruh siswa, kolom, dan nilainya akan dihapus permanen. Tidak
              bisa dibatalkan.
            </>
          }
          lebar="max-w-[28rem]"
          sibuk={sibuk}
          onTutup={tutup}
          kaki={
            <>
              <button type="button" className="tombol-garis" onClick={tutup} disabled={sibuk}>
                Batal
              </button>
              <button
                type="button"
                className={KELAS_TOMBOL_BAHAYA}
                style={{ background: "var(--color-bahaya)" }}
                onClick={hapus}
                disabled={!cocok || sibuk}
              >
                <IkonSampah className="w-3.5 h-3.5" />
                {sibuk ? "Menghapus…" : "Hapus kelas"}
              </button>
            </>
          }
        >
          <label className="block">
            <span className="text-[0.75rem] text-[color:var(--color-redup)]">
              Ketik <strong className="text-[color:var(--color-tinta)] select-all">{nama}</strong> untuk
              mengonfirmasi.
            </span>
            <input
              value={ketik}
              onChange={(e) => setKetik(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && cocok && !sibuk) hapus();
              }}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder={nama}
              aria-label={`Ketik ${nama} untuk mengonfirmasi`}
              className="isian w-full mt-2 text-[0.8125rem]"
            />
          </label>
          <Galat teks={galat} />
        </Dialog>
      )}
    </>
  );
}
