"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useKelas } from "@/lib/store";
import {
  komponenOf,
  subOf,
  type HasilKolom,
  type JenisKomponen,
  type Komponen,
} from "@/lib/nilai";
import { n, nAuto } from "@/lib/format";
import { InputAngka, InputBand, navigasiSel } from "./kendali";
import { gayaKolom, KepalaBeku, Panah, SelBeku } from "./tabel";
import Halaman from "./halaman";

/**
 * Tabel entri padat dengan kolom bersub yang bisa dilipat.
 *
 * Dua masalah yang diperbaiki dari `tabel-komponen.tsx`:
 *
 *  1. LEBAR. Di sana semua sub selalu tergambar, jadi satu kolom bersub tiga
 *     memakan 330px dan lima kolom semacam itu sudah melewati 2000px — tabel
 *     tergulir mendatar sebelum satu angka pun diketik, dan nama siswa serta
 *     RT F yang justru sedang dikemudikan hilang dari layar. Di sini kolom
 *     bersub terlipat: yang tampil hanya hasilnya (rerata → konversi), dan
 *     sub-nya mekar ke kanan hanya ketika kolomnya diklik. Satu kolom terbuka
 *     pada satu waktu, jadi tabel tidak pernah melebar lebih dari satu kolom.
 *
 *  2. TINGGI. Di sana tiap siswa adalah kartu tersendiri (padding 12/24,
 *     jarak 14px, bayangan, dan angkat saat disentuh tetikus) dan kepala
 *     kolomnya tiga baris. Satu kelas tiga puluhan siswa butuh lima layar.
 *     Di sini satu kartu membungkus seluruh tabel, tiap siswa jadi baris
 *     bergaris setinggi 28px, kepalanya lengket, dan kolom nomor serta nama
 *     membeku saat digulir mendatar.
 *
 * Lebar kolom ditulis SEKALI sebagai daftar trek grid dan dibagikan ke kepala,
 * tiap baris, dan kaki lewat satu variabel `--kolom`. Pendahulunya menghitung
 * ulang lebar di tiga tempat terpisah; dengan pelipatan, tiap lebar juga
 * bergantung pada kolom mana yang sedang terbuka, dan tiga salinan rumus itu
 * pasti melenceng.
 */

const LEBAR_SUB = "72px";
const LEBAR_RERATA = "minmax(104px, 1fr)";
const LEBAR_TUNGGAL = "minmax(176px, 1fr)";
const LEBAR_RT = 92;

/** Satu kolom tingkat atas beserta letaknya di grid. */
type Grup = {
  kolom: Komponen;
  anak: Komponen[];
  /** Punya sub DAN sedang terbuka. */
  buka: boolean;
  /** Indeks trek grid pertama, berbasis 1. */
  awal: number;
  /** Jumlah trek yang dipakai grup ini. */
  trek: number;
};

export default function TabelPadat({
  jenis,
  judul,
  keterangan,
  tampilkanRumus = false,
  tampilkanKaki = false,
}: {
  jenis: JenisKomponen;
  judul: string;
  keterangan: React.ReactNode;
  tampilkanRumus?: boolean;
  tampilkanKaki?: boolean;
}) {
  const { kelas, hasil, setSkor, setBand } = useKelas();
  const kolom = komponenOf(kelas, jenis);

  const [terbuka, setTerbuka] = useState<string | null>(null);

  // Kolom yang terbuka bisa dihapus dari layar Kelola Kelas sementara layar ini
  // hidup; jangan biarkan grid mengacu pada kolom yang sudah tidak ada.
  const buka = kolom.some((k) => k.id === terbuka) ? terbuka : null;

  // Siswa yang barisnya diklik saat kolom masih terlipat — karetnya menyusul
  // setelah kolomnya mekar, supaya sekali klik langsung bisa mengetik.
  const menuju = useRef<string | null>(null);

  useEffect(() => {
    const siswaId = menuju.current;
    if (!buka || !siswaId) return;
    menuju.current = null;
    document
      .querySelector<HTMLInputElement>(`[data-awal="${buka}:${siswaId}"]`)
      ?.focus();
  }, [buka]);

  const lipat = useCallback((komponenId: string, siswaId?: string) => {
    menuju.current = siswaId ?? null;
    setTerbuka((lama) => (lama === komponenId ? null : komponenId));
  }, []);

  // Escape menutup kolom yang terbuka dan mengembalikan fokus ke tombolnya,
  // supaya keyboard tidak tertinggal di sel yang baru saja lenyap.
  const padaTombolEsc = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape" || !buka) return;
    e.stopPropagation();
    setTerbuka(null);
    document
      .querySelector<HTMLButtonElement>(`[data-lipat="${buka}"]`)
      ?.focus();
  };

  if (kolom.length === 0) {
    return (
      <Halaman lebar="fokus">
        <div className="papan p-6">
          <div className="mikro">TIDAK ADA KOLOM {jenis.toUpperCase()}</div>
          <p className="keterangan mt-2">
            Tambahkan kolom di layar Skala &amp; KKTP.
          </p>
        </div>
      </Halaman>
    );
  }

  const labelRT = jenis === "formatif" ? "RT F" : "RT LM";

  // ------------------------------------------------------- tata letak grid --
  // Trek 1 = NO, trek 2 = NAMA, lalu tiap grup, lalu satu trek RT di ujung.
  const grup: Grup[] = [];
  let kursor = 3;
  for (const k of kolom) {
    const anak = subOf(kelas, k.id);
    const terbukaIni = anak.length > 0 && k.id === buka;
    const trek = terbukaIni ? anak.length + 1 : 1;
    grup.push({ kolom: k, anak, buka: terbukaIni, awal: kursor, trek });
    kursor += trek;
  }
  const trekRT = kursor;

  const gaya = gayaKolom(
    ...grup.flatMap((g) =>
      g.buka ? [...g.anak.map(() => LEBAR_SUB), LEBAR_RERATA] : [LEBAR_TUNGGAL],
    ),
    `${LEBAR_RT}px`,
  );

  const adaSub = grup.some((g) => g.anak.length > 0);

  // Lompatan ↓ / ↑ / Enter harus sepanjang satu baris penuh. Kolom bersub yang
  // TERLIPAT tidak menggambar satu kotak ketik pun, jadi ia menyumbang nol —
  // inilah yang diam-diam rusak kalau pelipatan ditambahkan tanpa menghitung
  // ulang langkahnya.
  const selPerBaris = grup.reduce(
    (t, g) => t + (g.anak.length === 0 ? 1 : g.buka ? g.anak.length : 0),
    0,
  );

  return (
    <Halaman>
      <div className="flex flex-wrap items-end gap-4 mb-5">
        <div className="min-w-0">
          <div className="judul">{judul}</div>
          <p className="keterangan mt-[6px] max-w-[680px]">{keterangan}</p>
        </div>
        {tampilkanRumus && (
          <div className="w-full sm:w-auto sm:ml-auto text-[10.5px] leading-[1.7] font-medium text-[color:var(--color-redup)] sm:text-right border-l-2 border-[color:var(--color-garis)] pl-3.5 angka">
            (NA − NA min) × (NK maks − NK min)
            <br />÷ (NA maks − NA min) + NK min
          </div>
        )}
      </div>

      <div
        className="tabel-padat min-w-fit"
        style={gaya}
        onKeyDown={padaTombolEsc}
      >
        {/* ------------------------------------------------ kepala kolom -- */}
        <div className="kepala-padat">
          <KepalaBeku duaBaris />

          {grup.map((g) => {
            const bd = hasil.bounds[g.kolom.id] ?? [0, 0];
            const bersub = g.anak.length > 0;
            return (
              <div
                key={g.kolom.id}
                className="px-2 py-1.5 min-w-0 sekat-padat"
                style={{ gridColumn: `${g.awal} / span ${g.trek}`, gridRow: 1 }}
              >
                {/* Baris 1 — identitas kolom dan rentang mentahnya. Band turun
                    ke baris 2: satu kolom hanya selebar ~180px, dan sepasang
                    kotak band di baris yang sama pasti melimpah ke kolom
                    sebelahnya. */}
                <div className="flex items-center gap-2 min-w-0">
                  {bersub ? (
                    <button
                      data-lipat={g.kolom.id}
                      onClick={() => lipat(g.kolom.id)}
                      aria-expanded={g.buka}
                      title={`${g.anak.length} sub — klik untuk ${g.buka ? "melipat" : "membuka"}`}
                      className="flex items-center gap-1.5 min-w-0 border-0 bg-transparent p-0 cursor-pointer font-[inherit] text-left"
                    >
                      <span
                        aria-hidden
                        className="flex-none text-[9px] text-[color:var(--color-redup)] transition-transform"
                        style={{
                          transform: g.buka ? "rotate(90deg)" : undefined,
                        }}
                      >
                        ▶
                      </span>
                      <LabelKolom kolom={g.kolom} />
                      <span className="flex-none text-[9px] font-bold tracking-[0.06em] text-[color:var(--color-redup)] bg-[color:var(--color-keping)] rounded-full px-1.5 py-px angka">
                        {g.anak.length} SUB
                      </span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 min-w-0">
                      <LabelKolom kolom={g.kolom} />
                    </span>
                  )}
                  <span className="ml-auto flex-none whitespace-nowrap text-[9.5px] font-medium text-[color:var(--color-redup)] angka">
                    maks {nAuto(bd[1])} · min {nAuto(bd[0])}
                  </span>
                </div>

                <div className="mt-1">
                  <InputBand
                    label="BAND"
                    padat
                    min={g.kolom.bandMin}
                    max={g.kolom.bandMax}
                    onUbah={(mn, mx) => setBand(g.kolom.id, mn, mx)}
                  />
                </div>
              </div>
            );
          })}

          <div
            className="sel-padat mikro justify-end"
            style={{ gridColumn: trekRT, gridRow: "1 / 3" }}
          >
            {labelRT}
          </div>

          {/* Baris kedua hanya ada untuk kolom yang sedang terbuka; kolom lain
              membiarkan treknya kosong, jadi baris ini setinggi nol saat semua
              kolom terlipat. */}
          {grup
            .filter((g) => g.buka)
            .flatMap((g) => [
              ...g.anak.map((s, i) => (
                <div
                  key={s.id}
                  className="mekar px-2 pb-1 mikro text-[9px] tracking-[0.06em] truncate sekat-sub"
                  style={{ gridColumn: g.awal + i, gridRow: 2 }}
                  title={s.nama || s.label}
                >
                  {s.nama || s.label}
                </div>
              )),
              <div
                key={`${g.kolom.id}-rerata`}
                className="mekar px-2 pb-1 mikro text-[9px] tracking-[0.06em] sekat-padat"
                style={{ gridColumn: g.awal + g.anak.length, gridRow: 2 }}
              >
                RERATA
              </div>,
            ])}
        </div>

        {/* -------------------------------------------- satu baris/siswa -- */}
        <div>
          {hasil.baris.map((baris) => {
            const sel: HasilKolom[] =
              jenis === "formatif" ? baris.formatif : baris.lingkup;
            return (
              <div key={baris.siswa.id} className="baris-padat">
                <SelBeku no={baris.siswa.noUrut} nama={baris.siswa.nama} />

                {grup.map((g, i) => {
                  const c = sel[i];
                  if (!c) return null;

                  // Kolom tanpa sub — satu kotak ketik, seperti sebelumnya.
                  if (g.anak.length === 0) {
                    return (
                      <div key={g.kolom.id} className="sel-padat sekat-padat">
                        <InputAngka
                          data-sel="1"
                          nilai={c.mentah}
                          onUbah={(v) =>
                            setSkor(baris.siswa.id, c.komponen.id, v)
                          }
                          onKeyDown={(e) => navigasiSel(e, selPerBaris)}
                          className="sel-input-padat max-w-[62px]"
                          aria-label={`${c.komponen.label} ${baris.siswa.nama}`}
                        />
                        <Panah />
                        <Konversi nilai={c.konversi} />
                      </div>
                    );
                  }

                  // Kolom bersub yang terlipat — hasilnya saja, dan sekali klik
                  // membukanya lalu menaruh karet di sub pertama siswa ini.
                  if (!g.buka) {
                    return (
                      <button
                        key={g.kolom.id}
                        className="sel-padat sel-lipat sekat-padat"
                        onClick={() => lipat(g.kolom.id, baris.siswa.id)}
                        title={`Rerata ${g.anak.length} sub — klik untuk mengisi sub ${baris.siswa.nama}`}
                        aria-label={`Buka sub ${c.komponen.label} untuk ${baris.siswa.nama}`}
                      >
                        <span className="text-[11.5px] font-semibold text-[color:var(--color-samar)] angka">
                          {n(c.mentah)}
                        </span>
                        <Panah />
                        <Konversi nilai={c.konversi} />
                        <span
                          aria-hidden
                          className="ml-auto text-[10px] text-[color:var(--color-samar)]"
                        >
                          ▶
                        </span>
                      </button>
                    );
                  }

                  // Kolom bersub yang terbuka — satu kotak ketik per sub, lalu
                  // rerata yang memang tidak boleh diketik.
                  return (
                    <Fragmen key={g.kolom.id}>
                      {c.sub.map((s, j) => (
                        <div
                          key={s.komponen.id}
                          className="sel-padat mekar sekat-sub"
                        >
                          <InputAngka
                            data-sel="1"
                            data-awal={
                              j === 0
                                ? `${g.kolom.id}:${baris.siswa.id}`
                                : undefined
                            }
                            nilai={s.mentah}
                            onUbah={(v) =>
                              setSkor(baris.siswa.id, s.komponen.id, v)
                            }
                            onKeyDown={(e) => navigasiSel(e, selPerBaris)}
                            className="sel-input-padat"
                            aria-label={`${s.komponen.label} ${baris.siswa.nama}`}
                          />
                        </div>
                      ))}
                      <div
                        className="sel-padat mekar sekat-padat"
                        title={`Rerata ${c.sub.length} sub, tidak bisa diketik`}
                      >
                        <span className="text-[11.5px] font-semibold text-[color:var(--color-samar)] angka">
                          {n(c.mentah)}
                        </span>
                        <Panah />
                        <Konversi nilai={c.konversi} />
                      </div>
                    </Fragmen>
                  );
                })}

                <div className="sel-padat justify-end text-[13px] font-extrabold angka">
                  {n(jenis === "formatif" ? baris.rtF : baris.rtLM)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------- kaki maks/min sekelas -- */}
      {tampilkanKaki && (
        <div className="papan-neu kaki-padat p-0 mt-3 min-w-fit" style={gaya}>
          <div
            className="sel-padat beku beku-tepi mikro"
            style={{ gridColumn: "1 / 3", left: 0 }}
          >
            MAKS / MIN {kelas.sumberMinMaks === "kelas" ? "KELAS" : "ANGKATAN"}
          </div>
          {grup.map((g) => {
            const bd = hasil.bounds[g.kolom.id] ?? [0, 0];
            return (
              <div
                key={g.kolom.id}
                className="sel-padat sekat-padat text-[11.5px] font-semibold angka"
                style={{ gridColumn: `${g.awal} / span ${g.trek}` }}
              >
                {nAuto(bd[1])} / {nAuto(bd[0])}
              </div>
            );
          })}
          <div style={{ gridColumn: trekRT }} />
        </div>
      )}
    </Halaman>
  );
}

/** Kode kolom dan nama bebasnya, satu baris. */
function LabelKolom({ kolom }: { kolom: Komponen }) {
  return (
    <>
      <span className="flex-none text-[12px] font-bold text-[color:var(--color-tinta)]">
        {kolom.label}
      </span>
      {kolom.nama && (
        <span
          className="text-[11px] font-semibold text-[color:var(--color-redup)] truncate min-w-0"
          title={kolom.nama}
        >
          {kolom.nama}
        </span>
      )}
    </>
  );
}

function Konversi({ nilai }: { nilai: number }) {
  return (
    <span
      className="text-[12.5px] font-bold angka"
      style={{
        color: nilai >= 90 ? "var(--color-aksen-gelap)" : "var(--color-tinta)",
      }}
    >
      {n(nilai)}
    </span>
  );
}

/* Sub dan reratanya adalah sel-sel sejajar di grid yang sama, bukan satu grup
   bersarang — pembungkus apa pun akan memutus keselarasannya dengan label di
   kepala. Fragment dipakai supaya keduanya tetap anak langsung barisnya. */
function Fragmen({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
