import { penggunaSaatIni } from "@/lib/supabase/server";
import Halaman from "@/components/halaman";
import TombolKembali from "@/components/tombol-kembali";
import { FormProfil, FormSandi } from "./form";

export default async function HalamanAkun() {
  const pengguna = await penggunaSaatIni();
  const meta = (pengguna?.user_metadata ?? {}) as { nama?: string };

  return (
    <Halaman lebar="fokus" className="min-h-screen">
      <TombolKembali className="mikro" />
      <h1 className="judul my-4">Pengaturan akun</h1>

      <div className="flex flex-col gap-5">
        <FormProfil email={pengguna?.email ?? ""} nama={meta.nama ?? ""} />
        <FormSandi />
      </div>
    </Halaman>
  );
}
