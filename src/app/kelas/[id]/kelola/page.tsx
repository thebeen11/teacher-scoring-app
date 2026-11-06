import { buatKlienServer } from '@/lib/supabase/server'
import {
  hapusKelas,
  hapusKomponen,
  hapusSiswa,
  tambahKomponen,
  tambahSiswa,
  tambahSubKomponen,
  ubahNamaKomponen,
  ubahSiswa,
} from '../../actions'
import Halaman from '@/components/halaman'
import FormSwaSimpan, { PenandaSimpan } from '@/components/swasimpan'

export default async function HalamanKelola({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await buatKlienServer()

  const [{ data: kelas }, { data: siswa }, { data: komponen }] = await Promise.all([
    supabase.from('kelas').select('nama, semester, tahun_ajaran').eq('id', id).maybeSingle(),
    supabase.from('siswa').select('id, no_urut, nama, jk').eq('kelas_id', id).order('no_urut'),
    supabase
      .from('komponen')
      .select('id, jenis, urutan, label, nama, induk_id')
      .eq('kelas_id', id)
      .order('urutan'),
  ])

  const semua = komponen ?? []
  const induk = semua.filter((k) => k.induk_id === null)
  const subDari = (indukId: string) => semua.filter((k) => k.induk_id === indukId)

  const formatif = induk.filter((k) => k.jenis === 'formatif')
  const lingkup = induk.filter((k) => k.jenis === 'lingkup')

  return (
    <Halaman lebar="sempit">
      <div className="judul">Kelola <span className="teks-gradien">Kelas</span></div>
      <p className="keterangan mt-[5px] mb-5 sm:mb-7">
        Daftar siswa dan kolom nilai. Suntingan tersimpan sendiri begitu kursor pindah — sama
        seperti layar entri nilai. Band tiap kolom diatur di layar Skala &amp; KKTP.
      </p>

      {/* ---------------------------------------------------- kolom nilai -- */}
      <div className="papan p-0 overflow-hidden mb-4 sm:mb-7">
        <div className="px-4 sm:px-6 py-3.5 border-b border-[color:var(--color-garis)] bg-[color:var(--color-kepala)] mikro">
          KOLOM NILAI
        </div>

        {(
          [
            ['formatif', 'Formatif', formatif],
            ['lingkup', 'Lingkup Materi', lingkup],
          ] as const
        ).map(([jenis, judul, daftar]) => (
          <div key={jenis} className="border-b border-[color:var(--color-garis)]">
            <div className="px-4 sm:px-6 pt-4 pb-2 flex items-center gap-3">
              <div className="text-[12px] font-bold">{judul}</div>
              <form action={tambahKomponen.bind(null, id, jenis)} className="ml-auto">
                <button type="submit" className="tombol-garis text-[11px] px-3 py-1.5">
                  + Kolom
                </button>
              </form>
            </div>

            {daftar.map((k) => {
              const sub = jenis === 'formatif' ? subDari(k.id) : []
              return (
                <div key={k.id} className="px-4 sm:px-6 py-2.5 border-t border-[color:var(--color-garis)]">
                  <FormSwaSimpan
                    action={ubahNamaKomponen.bind(null, id, k.id)}
                    className="flex items-center gap-2"
                  >
                    <span className="w-10 sm:w-14 flex-none text-[12px] font-bold angka">{k.label}</span>
                    <input
                      name="nama"
                      defaultValue={k.nama ?? ''}
                      placeholder="Beri nama kolom — misal Ulangan Bab 1"
                      className="isian flex-1 min-w-0 px-3 py-2 text-[12px]"
                    />
                    <PenandaSimpan />
                    <button
                      type="submit"
                      formAction={hapusKomponen.bind(null, id, k.id)}
                      title={daftar.length <= 1 ? 'Kolom terakhir tidak bisa dihapus' : `Hapus ${k.label}`}
                      disabled={daftar.length <= 1}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-[var(--r-kecil)] border-0 bg-transparent text-[color:var(--color-bahaya)] cursor-pointer transition-colors hover:bg-[color:var(--color-basuh)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Hapus
                    </button>
                  </FormSwaSimpan>

                  {jenis === 'formatif' && (
                    <div className="mt-1.5 ml-4 sm:ml-14 pl-3 border-l-2 border-[color:var(--color-garis)]">
                      {sub.map((s) => (
                        <FormSwaSimpan
                          key={s.id}
                          action={ubahNamaKomponen.bind(null, id, s.id)}
                          className="flex items-center gap-2 py-1"
                        >
                          <span className="w-10 sm:w-14 flex-none text-[11px] font-semibold text-[color:var(--color-redup)] angka">
                            {s.label}
                          </span>
                          <input
                            name="nama"
                            defaultValue={s.nama ?? ''}
                            placeholder="Nama sub — misal Tugas 1"
                            className="isian flex-1 min-w-0 px-3 py-1.5 text-[11.5px]"
                          />
                          <PenandaSimpan />
                          <button
                            type="submit"
                            formAction={hapusKomponen.bind(null, id, s.id)}
                            className="text-[10.5px] font-semibold px-2.5 py-1 rounded-[var(--r-kecil)] border-0 bg-transparent text-[color:var(--color-bahaya)] cursor-pointer transition-colors hover:bg-[color:var(--color-basuh)]"
                          >
                            Hapus
                          </button>
                        </FormSwaSimpan>
                      ))}
                      <form action={tambahSubKomponen.bind(null, id, k.id)} className="py-1">
                        <button type="submit" className="tombol-garis text-[10.5px] px-2.5 py-1">
                          + Sub {k.label}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}

        <p className="px-4 sm:px-6 py-4 keterangan text-[11px]">
          Jumlah kolom ikut menentukan nilai: rerata dihitung atas SEMUA kolom, termasuk yang
          masih kosong. Menambah satu kolom yang belum diisi langsung menurunkan RT F seisi
          kelas, jadi tambahkan kolom saat penilaiannya memang akan dikerjakan.
        </p>
        <p className="px-4 sm:px-6 pb-4 keterangan text-[11px]">
          Sub-formatif berlaku sama: begitu sebuah kolom punya sub, skornya tidak lagi diketik
          di layar Nilai Formatif melainkan menjadi rerata sub-subnya, sub kosong terhitung nol.
          Menghapus sub terakhir mengembalikan kolom itu jadi bisa diketik langsung, dengan skor
          lamanya masih utuh.
        </p>
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
              defaultValue={s.jk ?? ''}
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
            placeholder={'Satu nama per baris — boleh ditempel langsung dari spreadsheet.'}
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
        style={{ background: 'var(--color-basuh)' }}
      >
        <div>
          <div className="mikro text-[color:var(--color-bahaya)]">HAPUS KELAS</div>
          <p className="keterangan mt-1.5 text-[11px]">
            Menghapus {kelas?.nama} beserta seluruh siswa dan nilainya. Tidak bisa dibatalkan.
          </p>
        </div>
        <form action={hapusKelas.bind(null, id)} className="sm:ml-auto">
          <button
            type="submit"
            className="tombol-garis"
            style={{ borderColor: 'var(--color-bahaya)', color: 'var(--color-bahaya)' }}
          >
            Hapus kelas
          </button>
        </form>
      </div>
    </Halaman>
  )
}
