export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-10 sm:px-6 sm:py-16">
      <div className="w-full max-w-otentikasi">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold tracking-[0.04em] text-[color:var(--color-aksen-gelap)] bg-[color:var(--color-sorot)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-aksen)]" />
          SMP · Olah nilai
        </div>
        <h1 className="text-[28px] sm:text-[34px] leading-[1.15] font-semibold tracking-[-0.01em] mt-5 mb-2">
          Papan Olah <span className="teks-gradien">Nilai</span>
        </h1>
        <p className="keterangan mb-7">
          Formatif, nilai sumatif, dan asesmen sumatif dalam satu rantai — dengan setiap
          variabel skala terlihat, bukan tersembunyi di baris kaki.
        </p>
        {children}
      </div>
    </div>
  )
}
