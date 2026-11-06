import { buatKlienServer } from "@/lib/supabase/server";
import { hapusKelas, hapusSiswa, tambahSiswa, ubahSiswa } from "../../actions";
import Halaman from "@/components/halaman";
import FormSwaSimpan, { PenandaSimpan } from "@/components/swasimpan";

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
      .select("nama, semester, tahun_ajaran")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("siswa")
      .select("id, no_urut, nama, jk")
      .eq("kelas_id", id)
      .order("no_urut"),
  ]);

  return (
    <Halaman lebar="sempit">
      <div className="judul">
        Kelola <span className="teks-gradien">Kelas</span>
      </div>
      {/* -------------------------------------------------- daftar siswa -- */}
      <div className="papan p-0 overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 border-b border-[color:var(--color-garis)] bg-[color:var(--color-kepala)] mikro flex">
          <span>DAFTAR SISWA</span>
          <span className="ml-auto angka">{siswa?.length ?? 0} ORANG</span>
        </div>

        {(siswa ?? []).map((s) => (
          <FormSwaSimpan
            key={s.id}
            action={ubahSiswa.bind(null, id, s.id)}
            className="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-[color:var(--color-garis)]"
          >
            <span className="w-6 sm:w-8 flex-none text-[11.5px] text-[color:var(--color-redup)] angka">
              {s.no_urut}
            </span>
            <input
              name="nama"
              defaultValue={s.nama}
              className="isian flex-1 min-w-0 px-3 py-2 text-[12px]"
            />
            <select
              name="jk"
              defaultValue={s.jk ?? ""}
              className="isian px-3 py-2 text-[12px]"
            >
              <option value="">—</option>
              <option value="L">L</option>
              <option value="P">P</option>
            </select>
            <PenandaSimpan />
            <button
              type="submit"
              formAction={hapusSiswa.bind(null, id, s.id)}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-[var(--r-kecil)] border-0 bg-transparent text-[color:var(--color-bahaya)] cursor-pointer transition-colors hover:bg-[color:var(--color-basuh)]"
            >
              Hapus
            </button>
          </FormSwaSimpan>
        ))}

        <form action={tambahSiswa.bind(null, id)} className="px-4 sm:px-6 py-5">
          <div className="mikro mb-2">TAMBAH SISWA</div>
          <textarea
            name="roster"
            rows={4}
            placeholder={
              "Satu nama per baris — boleh ditempel langsung dari spreadsheet."
            }
            className="isian w-full text-[12px] leading-[1.6]"
          />
          <button type="submit" className="tombol mt-2.5">
            Tambahkan
          </button>
        </form>
      </div>

      {/* -------------------------------------------------------- hapus -- */}
      <div
        className="papan mt-4 sm:mt-7 p-5 sm:p-6 flex flex-col items-start sm:flex-row sm:items-center gap-4"
        style={{ background: "var(--color-basuh)" }}
      >
        <div>
          <div className="mikro text-[color:var(--color-bahaya)]">
            HAPUS KELAS
          </div>
          <p className="keterangan mt-1.5 text-[11px]">
            Menghapus {kelas?.nama} beserta seluruh siswa dan nilainya. Tidak
            bisa dibatalkan.
          </p>
        </div>
        <form action={hapusKelas.bind(null, id)} className="sm:ml-auto">
          <button
            type="submit"
            className="tombol-garis"
            style={{
              borderColor: "var(--color-bahaya)",
              color: "var(--color-bahaya)",
            }}
          >
            Hapus kelas
          </button>
        </form>
      </div>
    </Halaman>
  );
}
