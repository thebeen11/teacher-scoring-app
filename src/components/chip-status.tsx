/**
 * Chip status ketuntasan: hijau bercentang untuk TUNTAS, merah bersilang untuk
 * BELUM. Ikon diambil dari set Lucide (lisensi ISC) dan digambar inline.
 */
export function ChipStatus({
  tuntas,
  className = '',
}: {
  tuntas: boolean
  className?: string
}) {
  return (
    <span
      className={`tag inline-flex items-center gap-1 ${className}`}
      style={{
        background: tuntas ? 'var(--color-lulus)' : 'var(--color-basuh)',
        color: tuntas ? 'var(--color-lulus-pekat)' : 'var(--color-bahaya-pekat)',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="1.1em"
        height="1.1em"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="flex-none"
      >
        {tuntas ? (
          // check
          <path d="M20 6 9 17l-5-5" />
        ) : (
          // x
          <>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </>
        )}
      </svg>
      {tuntas ? 'TUNTAS' : 'BELUM'}
    </span>
  )
}
