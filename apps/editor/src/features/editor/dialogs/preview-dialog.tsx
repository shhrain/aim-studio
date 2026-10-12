'use client'

import { convertDocument, toLegacyPages } from '@aim/template-core'
import { MultiVendorPreview, TemplatePreview } from '@aim/template-preview'
import { ACTIONS, VENDORS, getLayout } from '@aim/template-schema'
import {
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Segmented,
  SimpleSelect,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@aim/ui'
import { useMemo, useState } from 'react'
import { copyText, renderJsonDownload } from '../lib/json'
import { createShareLink } from '../lib/share'
import { useEditor } from '../store'

export function PreviewDialog() {
  const open = useEditor((s) => s.previewOpen)
  const doc = useEditor((s) => s.doc)
  const set = useEditor((s) => s.set)
  const [vendor, setVendor] = useState<string>('huawei')
  const [log, setLog] = useState<string[]>([])
  const [jsonKind, setJsonKind] = useState<'document' | 'rcs' | 'rms' | 'legacy'>('document')
  const integrated = useMemo(() => (doc && open ? convertDocument(doc) : null), [doc, open])
  const layout = doc ? getLayout(doc.layoutId) : undefined

  const json = useMemo(() => {
    if (!doc || !open) return ''
    const value =
      jsonKind === 'document'
        ? doc
        : jsonKind === 'rcs'
          ? integrated?.rcsTplContent
          : jsonKind === 'rms'
            ? { content: integrated?.rmsTplContent, params: integrated?.rmsTplParams }
            : toLegacyPages(doc)
    return JSON.stringify(value ?? { message: '该版式不支持此协议' }, null, 2)
  }, [doc, jsonKind, integrated, open])

  if (!doc) return null
  return (
    <Dialog open={open} onOpenChange={(o) => set({ previewOpen: o })}>
      <DialogContent size="full" className="h-[min(860px,calc(100dvh-48px))]">
        <DialogHeader>
          <DialogTitle>预览 · {doc.name || '未命名模板'}</DialogTitle>
          <DialogDescription>
            多厂商真机效果；扫描二维码在手机上预览（30 分钟内有效）。
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="vendors" className="flex min-h-0 flex-col">
          <TabsList>
            <TabsTrigger value="vendors">多厂商</TabsTrigger>
            <TabsTrigger value="integrated" disabled={!integrated}>
              三信融合
            </TabsTrigger>
            <TabsTrigger value="interact">交互体验</TabsTrigger>
            <TabsTrigger value="json">数据</TabsTrigger>
          </TabsList>
          <DialogBody className="mt-3 min-h-0 flex-1">
            <TabsContent value="vendors">
              <MultiVendorPreview
                document={doc}
                vendors={layout?.vendors}
                paramDisplay="example"
                phoneWidth={230}
                qrcode={(v) =>
                  doc.vendors.includes(v as never) ? createShareLink(doc, v) : undefined
                }
              />
            </TabsContent>
            <TabsContent value="integrated">
              <div className="flex flex-wrap items-start justify-center gap-10 py-2">
                {(['aim', 'rcs', 'rms'] as const).map((p) => (
                  <div key={p} className="flex flex-col items-center gap-2">
                    <Badge variant="soft">
                      {{ aim: '安卓 · 阅信', rcs: '苹果 · 5G 消息', rms: '其他 · 视频短信' }[p]}
                    </Badge>
                    <TemplatePreview
                      document={doc}
                      protocol={p}
                      vendor={doc.vendors[0]}
                      width={260}
                      paramDisplay="example"
                    />
                  </div>
                ))}
              </div>
              {integrated && (
                <div className="text-muted-foreground mx-auto mt-4 max-w-2xl space-y-1.5 text-xs">
                  {integrated.editRcsBtns.length > 0 && (
                    <p>
                      · {integrated.editRcsBtns.length}{' '}
                      个按钮在苹果端不支持当前事件，提交审核时需补填替代链接。
                    </p>
                  )}
                  {integrated.needCapture && <p>· 红包将在提交时生成苹果 / 其他终端的审核图。</p>}
                  <p>· 视频短信标题：{integrated.rmsTitle || '（取首个标题）'}</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="interact">
              <div className="flex flex-wrap justify-center gap-8">
                <div className="flex flex-col items-center gap-3">
                  <SimpleSelect
                    value={vendor}
                    onValueChange={setVendor}
                    options={doc.vendors.map((v) => ({ value: v, label: VENDORS[v].name }))}
                    className="w-40"
                  />
                  <TemplatePreview
                    document={doc}
                    vendor={vendor}
                    width={320}
                    paramDisplay="example"
                    interactive="intercept"
                    onAction={(e) => {
                      const label = ACTIONS[e.event.action]?.label ?? e.event.action
                      setLog((l) =>
                        [
                          `${new Date().toLocaleTimeString()} 点击「${e.label ?? e.element?.type}」→ ${label} ${String(e.event.target ?? '')}`,
                          ...l,
                        ].slice(0, 20),
                      )
                    }}
                  />
                </div>
                <div className="w-[360px] space-y-2">
                  <div className="text-sm font-medium">事件日志</div>
                  <p className="text-muted-foreground text-xs">
                    点击预览中的按钮、图片、选项，查看触发的点击事件与参数。
                  </p>
                  <ul className="bg-muted/40 h-[420px] space-y-1 overflow-y-auto rounded-lg border p-2 font-mono text-xs">
                    {log.length === 0 ? (
                      <li className="text-muted-foreground">暂无事件</li>
                    ) : (
                      log.map((l, i) => <li key={i}>{l}</li>)
                    )}
                  </ul>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="json" className="space-y-2">
              <div className="flex items-center gap-2">
                <Segmented
                  size="sm"
                  value={jsonKind}
                  onValueChange={setJsonKind}
                  options={[
                    { value: 'document', label: '模板文档' },
                    { value: 'rcs', label: 'RCS tplContent', disabled: !integrated },
                    { value: 'rms', label: 'RMS content', disabled: !integrated },
                    { value: 'legacy', label: '旧版 pages' },
                  ]}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                  onClick={() => void copyText(json).then(() => toast.success('已复制'))}
                >
                  复制
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => renderJsonDownload(json, `${doc.name || doc.id}-${jsonKind}.json`)}
                >
                  下载
                </Button>
              </div>
              <pre className="bg-muted/40 h-[560px] overflow-auto rounded-lg border p-3 font-mono text-xs leading-relaxed">
                {json}
              </pre>
            </TabsContent>
          </DialogBody>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
