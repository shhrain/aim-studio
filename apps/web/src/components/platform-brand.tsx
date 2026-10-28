import Link from 'next/link'
import { BrandMark } from './brand-mark'
export function PlatformBrand({ locale = 'zh-CN' }: { locale?: string }) {
  return (
    <Link href={`/${locale}`} className="platform-brand" aria-label="AIM Studio">
      <span className="brand-symbol">
        <BrandMark />
      </span>
      <span>
        AIM<span className="brand-studio"> Studio</span>
      </span>
    </Link>
  )
}
