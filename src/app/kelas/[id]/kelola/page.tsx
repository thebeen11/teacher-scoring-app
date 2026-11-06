import { buatKlienServer } from "@/lib/supabase/server";
import { hapusSiswa, ubahSiswa } from "../../actions";
import Halaman from "@/components/halaman";
import KepalaHalaman from "@/components/kepala-halaman";
import FormSwaSimpan, { PenandaSimpan } from "@/components/swasimpan";
import { gayaKolom, KepalaBeku } from "@/components/tabel";
import TombolHapus from "@/components/tombol-hapus";
import {
  TombolAktifKelas,
  TombolHapusKelas,
  TombolTambahSiswa,
} from "@/components/aksi-kelola";

export default async function HalamanKelola({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await buatKlienServer();

  const [{ data: kelas }, { data: siswa }] = await Promise.all([
    supabase
      .from("kelas")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("siswa")
      .select("id, no_urut, nama, jk")
      .eq("kelas_id", id)
      .order("no_urut"),
  ]);

  const nama: string = kelas?.nama ?? "";
  // null bila migrasi kelas_aktif belum dijalankan: anggap aktif.
  const aktif = kelas?.aktif !== false;

  return (
    <Halaman lebar="sempit">
      <KepalaHalaman
        judul={<>Kelola Kelas</>}
        aksi={
          <>
            <TombolTambahSiswa kelasId={id} />
            <TombolAktifKelas kelasId={id} nama={nama} aktif={aktif} />
            <TombolHapusKelas kelasId={id} nama={nama} />
          </>
        }
      />

      {!aktif && (
        <div
          className="mb-4 px-4 py-3 rounded-[var(--r-kartu)] text-[0.75rem]"
          style={{ background: "var(--color-sorot)", color: "var(--color-aksen-gelap)" }}
          role="status"
        >
          <strong>Kelas ini nonaktif</strong> — tersembunyi dari Semua Kelas dan
          pemilih kelas. Data tetap bisa dibuka dan diubah.
        </div>
      )}

      {/* -------------------------------------------------- daftar siswa -- */}
      <div className="mikro flex mb-2 px-1">
        <span>DAFTAR SISWA</span>
        <span className="ml-auto angka">{siswa?.length ?? 0} ORANG</span>
      </div>

      {/* Kisi yang sama dengan tabel lain (lihat components/tabel.tsx): NO dan
          NAMA beku dengan lebar bersama, lalu JK dan AKSI selebar isinya.
          Tiap baris adalah <form> swasimpan yang sekaligus jadi subgrid.
          JANGAN dibungkus elemen ber-overflow: kepala lengketnya akan menempel
          di dalam pembungkus itu (bergeser `--atas-lengket`) dan menutupi baris. */}
      <div className="tabel-padat min-w-max" style={gayaKolom("auto", "auto")}>
        <div className="kepala-padat">
          <KepalaBeku />
          <div className="sel-padat mikro sekat-padat">JK</div>
          <div className="sel-padat mikro justify-end">AKSI</div>
        </div>

        <div className="grup-padat">
          {(siswa ?? []).length === 0 && (
            <div className="baris-padat">
              <div
                className="sel-padat text-[0.8125rem] text-[color:var(--color-redup)]"
                style={{ gridColumn: "1 / -1" }}
              >
                Belum ada siswa.
              </div>
            </div>
          )}
          {(siswa ?? []).map((s) => (
            <FormSwaSimpan
              key={s.id}
              action={ubahSiswa.bind(null, id, s.id)}
              className="baris-padat"
            >
              <div
                className="sel-padat beku sekat-sub text-[0.8125rem] font-semibold text-[color:var(--color-samar)] angka"
                style={{ left: 0 }}
              >
                {s.no_urut}
              </div>
              <div
                className="sel-padat beku beku-tepi"
                style={{ left: "var(--lebar-no)" }}
              >
                <input
                  name="nama"
                  defaultValue={s.nama}
                  aria-label={`Nama siswa nomor ${s.no_urut}`}
                  className="isian w-full min-w-0 px-3 py-1.5 text-[0.875rem] font-semibold"
                />
              </div>
              <div className="sel-padat sekat-padat">
                <select
                  name="jk"
                  defaultValue={s.jk ?? ""}
                  aria-label={`Jenis kelamin ${s.nama}`}
                  className="isian px-3 py-1.5 text-[0.8125rem]"
                >
                  <option value="">—</option>
                  <option value="L">L</option>
                  <option value="P">P</option>
                </select>
              </div>
              <div className="sel-padat justify-end">
                <PenandaSimpan />
                <TombolHapus
                  aksi={hapusSiswa.bind(null, id, s.id)}
                  judul="Hapus siswa?"
                  pesan={
                    <>
                      <strong>{s.nama}</strong> beserta seluruh nilainya akan
                      dihapus dari kelas ini. Tidak bisa dibatalkan.
                    </>
                  }
                  className="text-[0.75rem] font-semibold px-3 py-1.5 rounded-[var(--r-kecil)] border-0 bg-transparent text-[color:var(--color-bahaya)] cursor-pointer transition-colors hover:bg-[color:var(--color-basuh)]"
                />
              </div>
            </FormSwaSimpan>
          ))}
        </div>
      </div>
    </Halaman>
  );
}
