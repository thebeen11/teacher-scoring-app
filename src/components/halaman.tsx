/* Bingkai luar setiap halaman: sisipan 24px dan lebar maksimum yang terpusat.

   Sebelumnya tiap halaman menulis sendiri `p-6` dan `max-w-[…]`-nya, dan
   angkanya melenceng — enam lebar berbeda, tak satu pun terpusat, sehingga
   halaman bertutup lebar menempel ke tepi kiri sementara halaman lain
   melebar penuh. Semua itu sekarang berkumpul di sini. */

// Ditulis penuh, bukan dirangkai dari string: Tailwind memindai teks sumber
// dan tidak akan membuat kelas yang tidak terlihat utuh di berkas.
const LEBAR = {
  penuh: 'max-w-halaman', // tabel dan dasbor — butuh seluruh ruang yang ada
  sempit: 'max-w-sempit', // pengaturan dan formulir panjang
  fokus: 'max-w-fokus', // satu kartu tunggal
  // Tabel lebar: bingkai ikut melebar seukuran tabel (min-content-nya), tapi
  // tidak pernah lebih sempit dari bingkai baku. Dengan begitu kepala halaman
  // bisa lengket ke kiri sementara hanya tabel yang tergulir mendatar.
  tabel: 'w-min min-w-[min(100%,var(--container-halaman))]',
} as const

export default function Halaman({
  lebar = 'penuh',
  className = '',
  children,
}: {
  lebar?: keyof typeof LEBAR
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`${lebar === 'tabel' ? '' : 'w-full '}mx-auto p-4 sm:p-6 ${LEBAR[lebar]} ${className}`}>{children}</div>
  )
}
