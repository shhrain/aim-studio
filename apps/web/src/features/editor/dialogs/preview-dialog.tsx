'use client'
import { useEditorCopy } from '@/features/editor/lib/copy'

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
  const ec = useEditorCopy()

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
    return JSON.stringify(value ?? { message: ec('e38c417614a') }, null, 2)
  }, [doc, jsonKind, integrated, open])

  if (!doc) return null
  return (
    <Dialog open={open} onOpenChange={(o) => set({ previewOpen: o })}>
      <DialogContent size="full" className="h-[min(860px,calc(100dvh-48px))]">
        <DialogHeader>
          <DialogTitle>
            {ec('ecb207dda94')}
            {doc.name || ec('eb9c8a471e0')}
          </DialogTitle>
          <DialogDescription>{ec('e83f81c2f77')}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="vendors" className="flex min-h-0 flex-col">
          <TabsList>
            <TabsTrigger value="vendors">{ec('eb797dfcc8d')}</TabsTrigger>
            <TabsTrigger value="integrated" disabled={!integrated}>
              {ec('ee0b0e8a473')}
            </TabsTrigger>
            <TabsTrigger value="interact">{ec('ec24c4a704a')}</TabsTrigger>
            <TabsTrigger value="json">{ec('e5440f7424f')}</TabsTrigger>
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
                      {
                        { aim: ec('e4d535eca51'), rcs: ec('ececb324a4f'), rms: ec('e12dd3cb4d2') }[
                          p
                        ]
                      }
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
                      · {integrated.editRcsBtns.length} {ec('efecd475107')}
                    </p>
                  )}
                  {integrated.needCapture && <p>{ec('e4082052363')}</p>}
                  <p>
                    {ec('e056ec34464')}
                    {integrated.rmsTitle || ec('eb6d0bebe39')}
                  </p>
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
                  <div className="text-sm font-medium">{ec('ef77e28e6ce')}</div>
                  <p className="text-muted-foreground text-xs">{ec('e0b3286789b')}</p>
                  <ul className="bg-muted/40 h-[420px] space-y-1 overflow-y-auto rounded-lg border p-2 font-mono text-xs">
                    {log.length === 0 ? (
                      <li className="text-muted-foreground">{ec('e7de14a9bf0')}</li>
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
                    { value: 'document', label: ec('ecbff61afc5') },
                    { value: 'rcs', label: 'RCS tplContent', disabled: !integrated },
                    { value: 'rms', label: 'RMS content', disabled: !integrated },
                    { value: 'legacy', label: ec('ea9054060af') },
                  ]}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                  onClick={() => void copyText(json).then(() => toast.success(ec('e8f6f8d979c')))}
                >
                  {ec('e63d90d9773')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => renderJsonDownload(json, `${doc.name || doc.id}-${jsonKind}.json`)}
                >
                  {ec('e4673a23061')}
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
