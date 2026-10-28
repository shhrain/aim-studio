'use client'

import { ApiError, createHttpClient } from '@aim/api-client'
import { TemplatePreview } from '@aim/template-preview'
import {
  PROTOCOL_META,
  VENDORS,
  getLayout,
  type Protocol,
  type TemplateDocument,
  type VendorId,
} from '@aim/template-schema'
import { Empty, ScrollRow, Segmented, Spinner, cn } from '@aim/ui'
import { formatDate } from '@aim/utils'
import { ClockIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; doc: TemplateDocument; vendor?: string; expiresAt: number }

/** 扫码预览：/preview/{id}（服务端短链）或 /preview/share#d=...（离线编码） */
export function SharePreview({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [vendor, setVendor] = useState<string>('huawei')
  const [protocol, setProtocol] = useState<Protocol>('aim')

  useEffect(() => {
    void (async () => {
      const json = await createHttpClient().get<{
        document: TemplateDocument
        vendor?: string
        expiresAt: string
      }>('/api/v1/public/shares/' + encodeURIComponent(id))
      setState({
        status: 'ok',
        doc: json.document,
        vendor: json.vendor,
        expiresAt: new Date(json.expiresAt).getTime(),
      })
      setVendor(json.vendor ?? json.document.vendors[0] ?? 'huawei')
    })().catch((error) =>
      setState({
        status: 'error',
        message:
          error instanceof ApiError && error.status === 404
            ? '分享已过期、被撤销或不存在，请向分享者获取新链接。'
            : '加载失败，请检查网络后刷新重试。',
      }),
    )
  }, [id])

  if (state.status === 'loading')
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner label="正在加载预览…" />
      </div>
    )
  if (state.status === 'error')
    return (
      <Empty
        className="min-h-dvh"
        icon={<ClockIcon className="size-6" />}
        title="无法预览"
        description={state.message}
      />
    )

  const { doc } = state
  const layout = getLayout(doc.layoutId)
  return (
    <main className="mx-auto min-h-dvh max-w-screen-sm pb-[env(safe-area-inset-bottom)]">
      <header className="bg-card px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 shadow-sm">
        <h1 className="text-base font-semibold">{doc.name || '模板预览'}</h1>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {layout?.name} · 预览有效期至 {formatDate(state.expiresAt, 'HH:mm')}
        </p>
        {layout?.protocols.includes('rcs') && (
          <Segmented
            size="sm"
            block
            className="mt-3"
            value={protocol}
            onValueChange={setProtocol}
            options={(['aim', 'rcs', 'rms'] as const).map((p) => ({
              value: p,
              label: `${PROTOCOL_META[p].terminal} · ${PROTOCOL_META[p].name}`,
            }))}
          />
        )}
        {protocol === 'aim' && (
          <ScrollRow wrapperClassName="mt-3" className="gap-2">
            {doc.vendors.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVendor(v)}
                className={cn(
                  'h-7 shrink-0 rounded-full px-3 text-xs',
                  vendor === v ? 'bg-primary text-primary-foreground' : 'bg-muted',
                )}
              >
                {VENDORS[v as VendorId]?.name ?? v}
              </button>
            ))}
          </ScrollRow>
        )}
      </header>
      <TemplatePreview
        document={doc}
        vendor={vendor}
        protocol={protocol}
        mode="fluid"
        paramDisplay="example"
        interactive="native"
        chatbotName={doc.name}
      />
      <p className="text-muted-foreground px-4 py-4 text-center text-xs">
        此为模板效果预览，点击按钮将执行真实跳转
      </p>
    </main>
  )
}
