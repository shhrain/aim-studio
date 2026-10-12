'use client'

import { TemplatePreview } from '@aim/template-preview'
import { PROTOCOL_META, VENDORS, type Protocol, type VendorId } from '@aim/template-schema'
import { Alert, Badge, Button, Empty, Segmented, Skeleton, cn } from '@aim/ui'
import { NavBar, SafePage } from '@aim/ui/mobile'
import { SendIcon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SendFlow } from '@/components/send-flow'
import { hooks } from '@/lib/api'
import { loadDraft } from '@/lib/send-draft'

export function DetailView() {
  const router = useRouter()
  const sp = useSearchParams()
  const tplId = sp.get('tplId') ?? undefined
  const { data, isLoading, isError } = hooks.useTemplateDetail(tplId)
  const [protocol, setProtocol] = useState<Protocol>('aim')
  const [vendor, setVendor] = useState<VendorId>('huawei')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (data?.factories[0]) setVendor(data.factories[0])
  }, [data])
  // 从通讯录选号返回后自动打开发送面板
  useEffect(() => {
    if (tplId && sp.get('send') === '1' && loadDraft(tplId)) setSending(true)
  }, [tplId, sp])

  const disabled = !data || data.paramcnt > 0
  return (
    <SafePage
      footer={
        data && (
          <Button block size="xl" disabled={disabled} onClick={() => setSending(true)}>
            <SendIcon />
            {data.paramcnt > 0 ? '含动态参数，暂不支持体验发送' : '测试发送'}
          </Button>
        )
      }
    >
      <NavBar
        title={data?.tplName ?? '模板详情'}
        tone="primary"
        onBack={() => (history.length > 1 ? router.back() : router.push('/template-list'))}
      />
      {isLoading ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      ) : isError || !data ? (
        <Empty
          title="模板不存在或已下线"
          action={<Button onClick={() => router.push('/template-list')}>返回模板列表</Button>}
        />
      ) : (
        <div className="space-y-3 pb-4">
          <div className="bg-primary px-4 pt-1 pb-4">
            <Segmented
              block
              value={protocol}
              onValueChange={setProtocol}
              className="[&_[aria-checked=true]]:text-foreground bg-white/15 text-white/80"
              options={(['aim', 'rcs', 'rms'] as const).map((p) => ({
                value: p,
                label: `${PROTOCOL_META[p].terminal}`,
                disabled: p !== 'aim' && !data.integrated,
              }))}
            />
          </div>
          {protocol === 'aim' && (
            <div className="flex scrollbar-none gap-2 overflow-x-auto px-4">
              {data.factories.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVendor(v)}
                  className={cn(
                    'h-7 shrink-0 rounded-full px-3 text-xs',
                    vendor === v ? 'bg-foreground text-background' : 'bg-card',
                  )}
                >
                  {VENDORS[v].name}
                </button>
              ))}
            </div>
          )}
          <div className="px-4">
            <div className="shadow-panel overflow-hidden rounded-2xl">
              <TemplatePreview
                document={data.document}
                protocol={protocol}
                vendor={vendor}
                mode="fluid"
                paramDisplay="example"
                interactive="native"
                chatbotName="梦网5G阅信"
              />
            </div>
          </div>
          {data.paramcnt > 0 && (
            <div className="px-4">
              <Alert variant="warning" title="动态参数模板">
                该模板包含 {data.paramcnt}{' '}
                个动态参数，预览中显示示例值；正式下发时由业务系统传入真实参数。
              </Alert>
            </div>
          )}
          <dl className="bg-card mx-4 grid grid-cols-[80px_1fr] gap-y-2.5 rounded-xl p-4 text-sm">
            <dt className="text-muted-foreground">版式</dt>
            <dd className="flex items-center gap-1.5">
              {data.styleName}
              {data.integrated && <Badge variant="success">三信融合</Badge>}
            </dd>
            <dt className="text-muted-foreground">行业</dt>
            <dd>{data.industryName}</dd>
            <dt className="text-muted-foreground">支持厂商</dt>
            <dd>{data.factories.map((f) => VENDORS[f].name).join('、')}</dd>
            <dt className="text-muted-foreground">运营商</dt>
            <dd>{data.carriers.join('、')}</dd>
            <dt className="text-muted-foreground">标签</dt>
            <dd className="flex flex-wrap gap-1">
              {data.labels.map((l) => (
                <Badge key={l} variant="outline">
                  {l}
                </Badge>
              ))}
            </dd>
          </dl>
        </div>
      )}
      {data && <SendFlow open={sending} onOpenChange={setSending} template={data} />}
    </SafePage>
  )
}
