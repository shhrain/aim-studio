import { VENDORS, type VendorId } from '@aim/template-schema'

export function VendorTags({ vendors, max = 4 }: { vendors: VendorId[]; max?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {vendors.slice(0, max).map((v) => (
        <span
          key={v}
          className="inline-flex h-4 items-center rounded px-1 text-[10px] text-white"
          style={{ background: VENDORS[v].brandColor }}
        >
          {VENDORS[v].name}
        </span>
      ))}
      {vendors.length > max && (
        <span className="text-muted-foreground text-[10px]">+{vendors.length - max}</span>
      )}
    </div>
  )
}
