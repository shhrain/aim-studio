'use client'

import { VENDOR_LIST, type VendorId } from '@aim/template-schema'
import { Alert, cn } from '@aim/ui'
import { NavBar } from '@aim/ui/mobile'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ABILITY_GUIDE } from '@/lib/ability-guide'

export function GuideView() {
  const router = useRouter()
  const initial = (useSearchParams().get('factory') as VendorId | null) ?? 'huawei'
  const [vendor, setVendor] = useState<VendorId>(ABILITY_GUIDE[initial] ? initial : 'huawei')
  const guide = ABILITY_GUIDE[vendor]
  return (
    <main className="mx-auto min-h-dvh max-w-screen-sm">
      <NavBar
        title="阅信开启指引"
        onBack={() => (history.length > 1 ? router.back() : router.push('/'))}
      />
      <div className="flex scrollbar-none gap-2 overflow-x-auto px-3 py-3">
        {VENDOR_LIST.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setVendor(v.id)}
            className={cn(
              'h-8 shrink-0 rounded-full px-3.5 text-sm',
              vendor === v.id ? 'text-white' : 'bg-card',
            )}
            style={vendor === v.id ? { background: v.brandColor } : undefined}
          >
            {v.name}
          </button>
        ))}
      </div>
      <section className="bg-card shadow-panel mx-3 rounded-2xl p-4">
        <p className="text-muted-foreground text-xs">适用系统：{guide.system}</p>
        <ol className="mt-4 space-y-4">
          {guide.steps.map((s, i) => (
            <li key={s} className="flex gap-3">
              <span className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                {i + 1}
              </span>
              <span className="pt-0.5 text-[15px] leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
        {guide.tip && (
          <Alert variant="info" className="mt-4">
            {guide.tip}
          </Alert>
        )}
      </section>
      <p className="text-muted-foreground px-5 py-4 text-xs leading-relaxed">
        阅信依赖手机厂商的系统短信能力，部分老旧机型或第三方短信 App 可能无法展示卡片，此时将以 5G
        消息或普通短信形式接收。
      </p>
    </main>
  )
}
