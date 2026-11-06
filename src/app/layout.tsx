import type { Metadata } from 'next'
import { Archivo, Lora, Raleway } from 'next/font/google'
import './globals.css'
import { Locator } from '@/components/locator'

const raleway = Raleway({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-raleway',
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-lora',
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
  title: 'Olah Nilai',
  description:
    'Papan olah nilai: formatif, lingkup materi, dan asesmen sumatif yang bermuara ke daftar nilai — semua variabel skala terlihat.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${raleway.variable} ${lora.variable} ${archivo.variable}`}
    >
      <body>
        {children}
        {process.env.NODE_ENV === 'development' && <Locator />}
      </body>
    </html>
  )
}
