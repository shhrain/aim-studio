import Link from 'next/link'
import { BrandMark } from './brand-mark'

export function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link href="/templates" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg shadow-sm">
        <BrandMark />
      </span>
      {!compact && (
        <span className="text-[15px]">
          AIM <span className="text-primary">Studio</span>
        </span>
      )}
    </Link>
  )
}
