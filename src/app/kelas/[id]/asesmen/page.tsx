import { redirect } from "next/navigation";

/** Tautan lama `/asesmen` mendarat di sub-layar pertama. */
export default async function HalamanAsesmen({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/kelas/${id}/asesmen/tengah`);
}
