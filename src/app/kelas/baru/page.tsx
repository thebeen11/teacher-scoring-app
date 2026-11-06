import { buatKlienServer } from "@/lib/supabase/server";
import FormKelasBaru from "./form";
import Halaman from "@/components/halaman";
import TombolKembali from "@/components/tombol-kembali";

export default async function HalamanKelasBaru() {
  const supabase = await buatKlienServer();
  const { data: mapel } = await supabase
    .from("mapel")
    .select("id, nama")
    .order("nama");

  return (
    <Halaman lebar="fokus" className="min-h-screen">
      <TombolKembali className="mikro" />

      <h1 className="judul my-4">Kelas baru</h1>

      <FormKelasBaru mapel={mapel ?? []} />
    </Halaman>
  );
}
