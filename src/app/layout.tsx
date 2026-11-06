import type { Metadata } from 'next'
import { Archivo, Outfit, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Locator } from '@/components/locator'

// Badan teks: geometris netral, terbaca jelas di ukuran tabel 11–13px.
const badan = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-badan',
  display: 'swap',
})

// Judul: sans geometris membulat, senada dengan huruf logo nilaiHub.
const judul = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-judul',
  display: 'swap',
})

// Archivo tetap dipakai khusus untuk angka (`.angka`): figurnya tabular, jadi
// kolom skor tetap rata walau isinya berganti tiap ketukan.
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-archivo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'nilaiHub by dodeclass',
  applicationName: 'nilaiHub',
  creator: 'dodeclass',
  publisher: 'dodeclass',
  description:
    'Papan olah nilai: formatif, nilai sumatif, dan asesmen sumatif yang bermuara ke daftar nilai — semua variabel skala terlihat.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Ekstensi peramban LocatorJS menulis `data-locator-target` ke <html>
    // sebelum React hidrasi. suppressHydrationWarning hanya meredam atribut
    // elemen ini sendiri (satu tingkat), bukan anak-anaknya.
    <html
      lang="id"
      className={`${badan.variable} ${judul.variable} ${archivo.variable}`}
      suppressHydrationWarning
    >
      <body>
        {children}
        {process.env.NODE_ENV === 'development' && <Locator />}
      </body>
    </html>
  )
}
