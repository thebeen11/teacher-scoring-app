"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useKelas } from "@/lib/store";
import {
  komponenOf,
  subOf,
  type HasilKolom,
  type JenisKomponen,
  type Komponen,
  type Rentang,
} from "@/lib/nilai";
import { n, nAuto } from "@/lib/format";
import { InputAngka, InputBand, navigasiSel } from "./kendali";
import { gayaKolom, KepalaBeku, Panah, SelBeku } from "./tabel";
import Halaman from "./halaman";
import TombolUnduh from "./tombol-unduh";
import KepalaHalaman from "./kepala-halaman";
import {
  HapusDuaLangkah,
  IkonPensil,
  IsianNama,
  MenuKolom,
  PenandaAksi,
  useAksiKolom,
} from "./sunting-kolom";
import {
  hapusKomponen,
  tambahKomponen,
  tambahSubKomponen,
  ubahNamaKomponen,
} from "@/app/kelas/actions";

/**
 * Tabel entri padat dengan panel tab per kolom.
 *
 * Tab "Ringkasan" menampilkan semua kolom tingkat atas sekaligus: kolom tanpa
 * sub bisa langsung diketik, kolom bersub hanya menampilkan hasilnya
 * (rerata → konversi). Tiap kolom juga punya tab sendiri; di tab itu seluruh
 * sub-nya tampil sebagai kolom ketik, lalu rerata dan konversinya.
 *
 * Dengan tab, tabel tidak pernah memuat lebih dari satu kolom bersub yang
 * terbuka, jadi lebarnya tetap terkendali tanpa kolom yang mekar dan melipat
 * di tengah tabel.
 *
 * Lebar kolom ditulis SEKALI sebagai daftar trek grid dan dibagikan ke kepala,
 * tiap baris, dan kaki lewat satu variabel `--kolom`.
 */

const RINGKASAN = "ringkasan";

// Semua kolom nilai selebar isinya; sisa lebar halaman jatuh ke kolom NAMA.
const LEBAR_SUB = "auto";
const LEBAR_HASIL = "auto";
const LEBAR_TUNGGAL = "auto";
const LEBAR_RT = "auto";

/** Isian nama yang sedang terbuka, bila ada — paling banyak satu sekaligus. */
type Sunting =
  | null
  | { mode: "tambah" }
  | { mode: "ubah"; id: string }
  | { mode: "tambahSub"; indukId: string }
  | { mode: "ubahSub"; id: string };

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

  const [tabPilih, setTabPilih] = useState<string>(RINGKASAN);
  const [sunting, setSunting] = useState<Sunting>(null);
  const { menyimpan, jalankan } = useAksiKolom();

  // Kolom yang tab-nya aktif bisa dihapus lewat menu pensil di tab-nya sendiri;
  // kembali ke Ringkasan alih-alih mengacu kolom yang hilang.
  const tab = kolom.some((k) => k.id === tabPilih) ? tabPilih : RINGKASAN;

  // Siswa yang selnya diklik di Ringkasan — karetnya menyusul setelah tab
  // kolomnya tergambar, supaya sekali klik langsung bisa mengetik.
  const menuju = useRef<string | null>(null);

  useEffect(() => {
    const siswaId = menuju.current;
    if (tab === RINGKASAN || !siswaId) return;
    menuju.current = null;
    document
      .querySelector<HTMLInputElement>(`[data-awal="${tab}:${siswaId}"]`)
      ?.focus();
  }, [tab]);

  const pilih = (id: string, siswaId?: string) => {
    menuju.current = siswaId ?? null;
    setTabPilih(id);
  };

  const labelRT = jenis === "formatif" ? "RT F" : "RT S";
  const daftarTab = [RINGKASAN, ...kolom.map((k) => k.id)];

  // ←/→ berpindah tab, Home/End ke ujung — pola tablist WAI-ARIA.
  const padaTabKey = (e: React.KeyboardEvent) => {
    const i = daftarTab.indexOf(tab);
    let j = -1;
    if (e.key === "ArrowRight") j = (i + 1) % daftarTab.length;
    else if (e.key === "ArrowLeft")
      j = (i - 1 + daftarTab.length) % daftarTab.length;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = daftarTab.length - 1;
    if (j < 0) return;
    e.preventDefault();
    pilih(daftarTab[j]);
    document
      .querySelector<HTMLButtonElement>(`[data-tab="${daftarTab[j]}"]`)
      ?.focus();
  };

  // ---------------------------------------------------- sunting kolom --
  // Setiap aksi menulis lewat aksi server; revalidasi layout membuat penyimpan
  // menyerap struktur baru, jadi tab dan tabel ikut berubah sendiri.
  const formatif = jenis === "formatif";
  const kelasId = kelas.id;
  const batal = () => setSunting(null);

  const tambahKolom = (nama: string) => {
    setSunting(null);
    if (!nama) return;
    jalankan(async () => {
      const id = await tambahKomponen(kelasId, jenis, nama);
      // Tab baru terbuka begitu penyimpan memuatnya; sebelum itu `tab` jatuh
      // ke Ringkasan lewat penjaga di atas.
      if (id) setTabPilih(id);
    });
  };
  const gantiNama = (id: string, nama: string) => {
    setSunting(null);
    jalankan(() => ubahNamaKomponen(kelasId, id, nama));
  };
  const tambahSub = (indukId: string, nama: string) => {
    setSunting(null);
    if (!nama) return;
    jalankan(() => tambahSubKomponen(kelasId, indukId, nama));
  };
  const hapus = (id: string) => jalankan(() => hapusKomponen(kelasId, id));

  // Tab kolom yang terbuka (bukan Ringkasan): RENTANG-nya pindah ke kartu
  // kepala. `+ Sub` hanya untuk formatif.
  const kolomTerbuka = kolom.find((k) => k.id === tab);
  const kolomAktif = formatif ? kolomTerbuka : undefined;
  const bdTerbuka = kolomTerbuka
    ? (hasil.bounds[kolomTerbuka.id] ?? [0, 0])
    : undefined;

  const barTab = (
    <div className="flex flex-wrap items-center gap-3 min-w-0">
      <div
        role="tablist"
        aria-label={`Kolom ${judul}`}
        className="segmen min-w-0 max-w-full overflow-x-auto"
        onKeyDown={padaTabKey}
      >
        {daftarTab.map((id) => {
          const k = kolom.find((x) => x.id === id);
          const jumlahSub = k ? subOf(kelas, k.id).length : 0;
          const aktif = id === tab;

          if (k && sunting?.mode === "ubah" && sunting.id === k.id) {
            return (
              <div
                key={id}
                className="flex flex-none items-center px-2 py-1.5 border-x border-[color:var(--color-garis)]"
              >
                <IsianNama
                  awal={k.nama}
                  placeholder={`Nama ${k.label}`}
                  onSimpan={(v) => gantiNama(k.id, v)}
                  onBatal={batal}
                  className="w-[160px]"
                />
              </div>
            );
          }

          return (
            <Fragment key={id}>
              <button
                role="tab"
                data-tab={id}
                aria-selected={aktif}
                tabIndex={aktif ? 0 : -1}
                onClick={() => pilih(id)}
                onDoubleClick={
                  k ? () => setSunting({ mode: "ubah", id: k.id }) : undefined
                }
                title={k ? "Klik dua kali untuk mengganti nama" : undefined}
                className={`flex flex-none items-center gap-1.5 whitespace-nowrap ${k ? "pr-1.5" : ""}`}
                style={{
                  background: aktif ? "var(--color-aksen)" : "transparent",
                  color: aktif ? "#ffffff" : "var(--color-redup)",
                }}
              >
                {k ? k.nama || k.label : "Ringkasan"}
                {jumlahSub > 0 && (
                  <span
                    className={`flex-none text-[9.5px] font-bold tracking-[0.06em] rounded-full px-1.5 py-px angka ${
                      aktif
                        ? "bg-white/25 text-white"
                        : "bg-[color:var(--color-keping)] text-[color:var(--color-redup)]"
                    }`}
                  >
                    {jumlahSub} SUB
                  </span>
                )}
              </button>
              {k && (
                <MenuKolom
                  label={k.nama || k.label}
                  aktif={aktif}
                  bisaHapus={kolom.length > 1}
                  onGantiNama={() => setSunting({ mode: "ubah", id: k.id })}
                  onHapus={() => hapus(k.id)}
                />
              )}
            </Fragment>
          );
        })}

        {sunting?.mode === "tambah" ? (
          <div className="flex flex-none items-center px-2 py-1.5 border-l border-[color:var(--color-garis)]">
            <IsianNama
              placeholder="Nama kolom baru…"
              onSimpan={tambahKolom}
              onBatal={batal}
              className="w-[180px]"
            />
          </div>
        ) : (
          <button
            type="button"
            tabIndex={-1}
            title="Tambah kolom — beri nama dulu, lalu Enter"
            onClick={() => setSunting({ mode: "tambah" })}
            className="flex-none whitespace-nowrap"
            style={{
              background: "transparent",
              color: "var(--color-aksen-gelap)",
            }}
          >
            + Bab Baru
          </button>
        )}
      </div>
      <PenandaAksi aktif={menyimpan} />
      {kolomTerbuka && bdTerbuka && (
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <span className="whitespace-nowrap text-[10.5px] font-medium text-[color:var(--color-redup)] angka">
            maks {nAuto(bdTerbuka[1])} · min {nAuto(bdTerbuka[0])}
          </span>
          <InputBand
            label="RENTANG"
            besar
            min={kolomTerbuka.bandMin}
            max={kolomTerbuka.bandMax}
            onUbah={(mn, mx) => setBand(kolomTerbuka.id, mn, mx)}
          />
          {kolomAktif && (
            <div className="flex-none">
              {sunting?.mode === "tambahSub" &&
              sunting.indukId === kolomAktif.id ? (
                <IsianNama
                  placeholder="Nama sub baru…"
                  onSimpan={(v) => tambahSub(kolomAktif.id, v)}
                  onBatal={batal}
                  className="w-[180px]"
                />
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setSunting({ mode: "tambahSub", indukId: kolomAktif.id })
                  }
                  title={
                    subOf(kelas, kolomAktif.id).length > 0
                      ? `Tambah sub ${kolomAktif.label}`
                      : `Tambah sub — ${kolomAktif.label} lalu menjadi rerata sub-subnya`
                  }
                  className="tombol whitespace-nowrap"
                >
                  + Sub {kolomAktif.nama || kolomAktif.label}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const kepalaHalaman = (
    <KepalaHalaman
      judul={judul}
      aksi={<TombolUnduh jenis={jenis} />}
      bawah={barTab}
    />
  );

  if (kolom.length === 0) {
    return (
      <Halaman>
        {kepalaHalaman}
        <div className="papan p-6">
          <div className="mikro">BELUM ADA KOLOM {jenis.toUpperCase()}</div>
          <p className="keterangan mt-2">
            Klik + Kolom di atas, beri nama kolom pertama, lalu tekan Enter.
          </p>
        </div>
      </Halaman>
    );
  }

  const nilaiRT = (b: (typeof hasil.baris)[number]) =>
    n(jenis === "formatif" ? b.rtF : b.rtNS);
  const selOf = (b: (typeof hasil.baris)[number]): HasilKolom[] =>
    jenis === "formatif" ? b.formatif : b.lingkup;

  const kepalaKolom = (k: Komponen, tanpaRentang = false) => (
    <KepalaKolom
      tanpaRentang={tanpaRentang}
      kolom={k}
      bounds={hasil.bounds[k.id] ?? [0, 0]}
      onBand={(mn, mx) => setBand(k.id, mn, mx)}
    />
  );

  // ------------------------------------------------------------- isi tab --
  let gaya: React.CSSProperties;
  let kepala: React.ReactNode;
  let barisan: React.ReactNode;
  let kaki: React.ReactNode;

  if (tab === RINGKASAN) {
    const anakOf = kolom.map((k) => subOf(kelas, k.id));
    gaya = gayaKolom(...kolom.map(() => LEBAR_TUNGGAL), LEBAR_RT);
    // Hanya kolom tanpa sub yang punya kotak ketik di Ringkasan.
    const selPerBaris = anakOf.filter((a) => a.length === 0).length;

    kepala = kolom.map((k) => (
      <div key={k.id} className="px-2.5 py-2 min-w-0 sekat-padat">
        {kepalaKolom(k)}
      </div>
    ));

    barisan = hasil.baris.map((baris) => {
      const sel = selOf(baris);
      return (
        <div key={baris.siswa.id} className="baris-padat">
          <SelBeku no={baris.siswa.noUrut} nama={baris.siswa.nama} />
          {kolom.map((k, i) => {
            const c = sel[i];
            if (!c) return <div key={k.id} />;
            const anak = anakOf[i];
            if (anak.length === 0) {
              return (
                <div key={k.id} className="sel-padat sekat-padat">
                  <InputAngka
                    data-sel="1"
                    nilai={c.mentah}
                    onUbah={(v) => setSkor(baris.siswa.id, c.komponen.id, v)}
                    onKeyDown={(e) => navigasiSel(e, selPerBaris)}
                    className="sel-input-padat w-[72px]"
                    aria-label={`${c.komponen.label} ${baris.siswa.nama}`}
                  />
                  <Panah />
                  <Konversi nilai={c.konversi} />
                </div>
              );
            }
            return (
              <button
                key={k.id}
                className="sel-padat sel-lipat sekat-padat"
                onClick={() => pilih(k.id, baris.siswa.id)}
                title={`Rerata ${anak.length} sub — klik untuk mengisi sub ${baris.siswa.nama}`}
                aria-label={`Buka tab ${k.nama || k.label} untuk ${baris.siswa.nama}`}
              >
                <Rerata nilai={c.mentah} />
                <Panah />
                <Konversi nilai={c.konversi} />
                <span
                  aria-hidden
                  className="ml-auto text-[11px] text-[color:var(--color-samar)]"
                >
                  ▶
                </span>
              </button>
            );
          })}
          <div className="sel-padat justify-end text-[15px] font-extrabold angka">
            {nilaiRT(baris)}
          </div>
        </div>
      );
    });

    kaki = kolom.map((k) => {
      const bd = hasil.bounds[k.id] ?? [0, 0];
      return (
        <div
          key={k.id}
          className="sel-padat sekat-padat text-[13px] font-semibold angka"
        >
          {nAuto(bd[1])} / {nAuto(bd[0])}
        </div>
      );
    });
  } else {
    const idx = kolom.findIndex((k) => k.id === tab);
    const k = kolom[idx];
    const anak = subOf(kelas, k.id);
    const bersub = anak.length > 0;

    const rentang = `3 / span ${anak.length + 1}`;

    gaya = bersub
      ? gayaKolom(...anak.map(() => LEBAR_SUB), LEBAR_HASIL, LEBAR_RT)
      : gayaKolom(LEBAR_HASIL, LEBAR_RT);
    const selPerBaris = bersub ? anak.length : 1;

    kepala = (
      <>
        {anak.map((s) =>
          sunting?.mode === "ubahSub" && sunting.id === s.id ? (
            <div key={s.id} className="sel-padat sekat-sub min-w-0">
              <IsianNama
                awal={s.nama}
                placeholder={`Nama ${s.label}`}
                onSimpan={(v) => gantiNama(s.id, v)}
                onBatal={batal}
                className="w-full min-w-0"
              />
            </div>
          ) : (
            <div
              key={s.id}
              className="sel-padat mikro sekat-sub min-w-0 gap-1"
              title={`${s.nama || s.label} — klik dua kali untuk mengganti nama`}
              onDoubleClick={() => setSunting({ mode: "ubahSub", id: s.id })}
            >
              <span className="truncate">{s.nama || s.label}</span>
              <button
                type="button"
                onClick={() => setSunting({ mode: "ubahSub", id: s.id })}
                aria-label={`Ganti nama ${s.label}`}
                className="ml-auto flex-none border-0 bg-transparent cursor-pointer px-0.5 text-[11px] leading-none text-[color:var(--color-samar)] hover:text-[color:var(--color-tinta)]"
              >
                <IkonPensil ukuran={11} />
              </button>
              <HapusDuaLangkah
                label={s.nama || s.label}
                onHapus={() => hapus(s.id)}
              />
            </div>
          ),
        )}
        <div className="px-2.5 py-2 min-w-0 sekat-padat">
          {kepalaKolom(k, true)}
          {bersub && <div className="mikro mt-1">RERATA → NILAI</div>}
        </div>
      </>
    );

    barisan = hasil.baris.map((baris) => {
      const c = selOf(baris)[idx];
      return (
        <div key={baris.siswa.id} className="baris-padat">
          <SelBeku no={baris.siswa.noUrut} nama={baris.siswa.nama} />
          {!c ? (
            <div style={{ gridColumn: rentang }} />
          ) : bersub ? (
            <>
              {c.sub.map((s, j) => (
                <div key={s.komponen.id} className="sel-padat sekat-sub">
                  <InputAngka
                    data-sel="1"
                    data-awal={
                      j === 0 ? `${k.id}:${baris.siswa.id}` : undefined
                    }
                    nilai={s.mentah}
                    onUbah={(v) => setSkor(baris.siswa.id, s.komponen.id, v)}
                    onKeyDown={(e) => navigasiSel(e, selPerBaris)}
                    className="sel-input-padat"
                    aria-label={`${s.komponen.label} ${baris.siswa.nama}`}
                  />
                </div>
              ))}
              <div
                className="sel-padat sekat-padat"
                title={`Rerata ${c.sub.length} sub, tidak bisa diketik`}
              >
                <Rerata nilai={c.mentah} />
                <Panah />
                <Konversi nilai={c.konversi} />
              </div>
            </>
          ) : (
            <>
              <div className="sel-padat sekat-padat">
                <InputAngka
                  data-sel="1"
                  data-awal={`${k.id}:${baris.siswa.id}`}
                  nilai={c.mentah}
                  onUbah={(v) => setSkor(baris.siswa.id, c.komponen.id, v)}
                  onKeyDown={(e) => navigasiSel(e, selPerBaris)}
                  className="sel-input-padat w-[72px]"
                  aria-label={`${c.komponen.label} ${baris.siswa.nama}`}
                />
                <Panah />
                <Konversi nilai={c.konversi} />
              </div>
            </>
          )}
          <div className="sel-padat justify-end text-[15px] font-extrabold angka">
            {nilaiRT(baris)}
          </div>
        </div>
      );
    });

    const bd = hasil.bounds[k.id] ?? [0, 0];
    kaki = (
      <div
        className="sel-padat sekat-padat text-[13px] font-semibold angka justify-end"
        style={{ gridColumn: rentang }}
      >
        {nAuto(bd[1])} / {nAuto(bd[0])}
      </div>
    );
  }

  return (
    <Halaman>
      {kepalaHalaman}

      {/* Tabel dan kakinya berbagi satu grid supaya trek `auto` sejajar. */}
      <div className="kisi-padat min-w-fit" style={gaya}>
        <div role="tabpanel" className="tabel-padat">
          {/* ------------------------------------------------ kepala kolom -- */}
          <div className="kepala-padat">
            <KepalaBeku />
            {kepala}
            <div className="sel-padat mikro justify-end">{labelRT}</div>
          </div>

          {/* -------------------------------------------- satu baris/siswa -- */}
          <div className="grup-padat">{barisan}</div>
        </div>

        {/* ---------------------------------------- kaki maks/min sekelas -- */}
        {tampilkanKaki && (
          <div className="papan-neu kaki-padat p-0 mt-3">
            <div
              className="sel-padat beku beku-tepi mikro"
              style={{ gridColumn: "1 / 3", left: 0 }}
            >
              MAKS / MIN KELAS
            </div>
            {kaki}
            <div />
          </div>
        )}
      </div>
    </Halaman>
  );
}

/** Kepala satu kolom tingkat atas: nama, rentang mentah, dan rentang tujuan. */
function KepalaKolom({
  kolom,
  bounds,
  onBand,
  tanpaRentang = false,
}: {
  kolom: Komponen;
  bounds: Rentang;
  onBand: (min: number, max: number) => void;
  /** Tab satu kolom: rentang dan maks/min sudah tampil di kartu kepala. */
  tanpaRentang?: boolean;
}) {
  if (tanpaRentang)
    return (
      <span
        className="block text-[12.5px] font-semibold text-[color:var(--color-redup)] truncate min-w-0"
        title={kolom.nama || kolom.label}
      >
        {kolom.nama || kolom.label}
      </span>
    );
  return (
    <>
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="text-[12.5px] font-semibold text-[color:var(--color-redup)] truncate min-w-0"
          title={kolom.nama || kolom.label}
        >
          {kolom.nama || kolom.label}
        </span>
        <span className="ml-auto flex-none whitespace-nowrap text-[10.5px] font-medium text-[color:var(--color-redup)] angka">
          maks {nAuto(bounds[1])} · min {nAuto(bounds[0])}
        </span>
      </div>
      <div className="mt-1">
        <InputBand
          label="RENTANG"
          padat
          min={kolom.bandMin}
          max={kolom.bandMax}
          onUbah={onBand}
        />
      </div>
    </>
  );
}

function Rerata({ nilai }: { nilai: number }) {
  return (
    <span className="text-[13px] font-semibold text-[color:var(--color-samar)] angka">
      {n(nilai)}
    </span>
  );
}

function Konversi({ nilai }: { nilai: number }) {
  return (
    <span
      className="text-[14px] font-bold angka"
      style={{
        color: nilai >= 90 ? "var(--color-aksen-gelap)" : "var(--color-tinta)",
      }}
    >
      {n(nilai)}
    </span>
  );
}
