import Link from 'next/link'

export function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link href="/templates" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4 4v-4.2A2.5 2.5 0 0 1 4 13.5z" />
          <path d="M8.5 9h7M8.5 12h4" />
        </svg>
      </span>
      {!compact && (
        <span className="text-[15px]">
          AIM <span className="text-primary">Studio</span>
        </span>
      )}
    </Link>
  )
}
