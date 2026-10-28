'use client'
import { getRcsFallbackTargets } from '@aim/template-core'
import { useEditorCopy, usePrecheckText } from '@/features/editor/lib/copy'
import { appPath } from '@/lib/platform'

import type { DeepPrecheckTask } from '@aim/api-client'
import { convertDocument, type PrecheckIssue } from '@aim/template-core'
import { RECOGNITION_LABEL, TEMPLATE_USAGE_LABEL, VENDORS, getLayout } from '@aim/template-schema'
import {
  Alert,
  Badge,
  Button,
  Input,
  Progress,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  cn,
  toast,
} from '@aim/ui'
import { isHttpsUrl } from '@aim/utils'
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  InfoIcon,
  RadarIcon,
  SendIcon,
  XCircleIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { editorApi, editorHooks } from '@/lib/api'
import { useEditor } from '../store'
import { ScoreRing } from './score-ring'

const LEVEL_ICON = { error: XCircleIcon, warning: AlertTriangleIcon, info: InfoIcon }
const LEVEL_COLOR = { error: 'text-destructive', warning: 'text-warning', info: 'text-info' }

export function ReviewSheet({
  saveNow,
  onLocate,
}: {
  saveNow: () => Promise<boolean>
  onLocate: (i: PrecheckIssue) => void
}) {
  const ec = useEditorCopy()
  const issueText = usePrecheckText()

  const open = useEditor((s) => s.reviewOpen)
  const doc = useEditor((s) => s.doc)
  const report = useEditor((s) => s.report)
  const set = useEditor((s) => s.set)
  const router = useRouter()
  const [taskId, setTaskId] = useState<string>()
  const [links, setLinks] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const deep = editorHooks.useDeepPrecheck(taskId)
  const integrated = useMemo(() => (doc && open ? convertDocument(doc) : null), [doc, open])
  if (!doc || !report) return null

  const layout = getLayout(doc.layoutId)
  const missing = getRcsFallbackTargets(doc)
  const linksOk = missing.every((b) => isHttpsUrl(links[b.elementId]))
  const deepErrors =
    deep.data?.status === 'done' ? deep.data.issues.filter((i) => i.level === 'error') : []
  const reviewing = doc.meta.status === 'reviewing'
  const canSubmit = report.passed && linksOk && deepErrors.length === 0 && !reviewing

  const submit = async () => {
    setSubmitting(true)
    try {
      if (!(await saveNow())) return
      const res = await editorApi.submitTemplate(doc.id, {
        document: doc,
        rcsFallbacks: links,
        precheckPassed: report.passed,
      })
      useEditor.getState().load(res.document)
      set({ reviewOpen: false })
      toast.success(ec('ea13f5da574'), {
        description: ec('e593590db6c'),
        action: { label: ec('ee9d5ca6c14'), onClick: () => router.push(appPath('templates')) },
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : ec('ea11e65666b'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => set({ reviewOpen: o })}>
      <SheetContent className="w-[560px] gap-0 p-0 sm:max-w-[560px]">
        <SheetHeader className="border-b">
          <div className="flex items-center gap-4">
            <ScoreRing score={report.score} passed={report.passed} size={56} />
            <div>
              <SheetTitle>{ec('e126878adc0')}</SheetTitle>
              <SheetDescription>
                {report.passed
                  ? ec('ee3aa2ed9a3')
                  : `发现 ${report.errors.length} 个必须修复的问题。`}
                {report.warnings.length ? ` ${report.warnings.length} 条优化建议。` : ''}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 p-5">
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">{ec('e3c5567cc87')}</h3>
              {report.issues.length === 0 ? (
                <Alert variant="success">{ec('ee5e8b8f318')}</Alert>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {[...report.errors, ...report.warnings, ...report.infos].map((i, idx) => {
                    const Icon = LEVEL_ICON[i.level]
                    return (
                      <li key={idx}>
                        <button
                          type="button"
                          disabled={!i.elementId}
                          onClick={() => onLocate(i)}
                          className="enabled:hover:bg-muted/60 flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-sm transition"
                        >
                          <Icon className={cn('mt-0.5 size-4 shrink-0', LEVEL_COLOR[i.level])} />
                          <span className="flex-1">
                            {issueText(i)}
                            {i.suggestion && (
                              <span className="text-muted-foreground mt-0.5 block text-xs">
                                {ec(i.suggestion)}
                              </span>
                            )}
                          </span>
                          {i.elementId && (
                            <ChevronRightIcon className="text-muted-foreground mt-0.5 size-4" />
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{ec('ee421945067')}</h3>
                <Button
                  size="xs"
                  variant="outline"
                  loading={deep.data?.status === 'running'}
                  onClick={async () => setTaskId((await editorApi.startDeepPrecheck(doc)).taskId)}
                >
                  <RadarIcon />
                  {deep.data ? ec('ea13550662f') : ec('eaab6c5f641')}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">{ec('e582c10c29f')}</p>
              {deep.data?.status === 'running' && <Progress value={deep.data.progress} />}
              {deep.data?.status === 'done' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2">
                    {deep.data.dimensions?.map((d) => (
                      <div key={d.key} className="rounded-lg border p-2 text-center">
                        <div
                          className={cn(
                            'text-lg font-semibold tabular-nums',
                            d.passed ? 'text-success' : 'text-destructive',
                          )}
                        >
                          {d.score}
                        </div>
                        <div className="text-muted-foreground text-[11px]">{d.label}</div>
                      </div>
                    ))}
                  </div>
                  {deep.data.issues.map((i: DeepPrecheckTask['issues'][number], idx: number) => (
                    <Alert
                      key={idx}
                      variant={i.level === 'error' ? 'destructive' : 'warning'}
                      className="py-2 text-xs"
                    >
                      {issueText(i)}
                    </Alert>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">{ec('ee0b0e8a473')}</h3>
              {integrated ? (
                <>
                  <p className="text-muted-foreground text-xs">{ec('e1adc36c263')}</p>
                  {missing.length > 0 && (
                    <div className="border-warning/40 bg-warning/8 space-y-2 rounded-lg border p-3">
                      <div className="text-xs font-medium">{ec('e267bb1dcdd')}</div>
                      {missing.map((b) => (
                        <div key={b.elementId} className="flex items-center gap-2">
                          <span className="w-24 shrink-0 truncate text-sm">「{b.name}」</span>
                          <Input
                            placeholder="https://"
                            value={links[b.elementId] ?? ''}
                            onChange={(e) => setLinks({ ...links, [b.elementId]: e.target.value })}
                            aria-invalid={
                              Boolean(links[b.elementId]) && !isHttpsUrl(links[b.elementId])
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-xs">
                  「{ec(layout?.name ?? '')}
                  {ec('e0e0640ff01')}
                </p>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">{ec('eb230817fa9')}</h3>
              <dl className="grid grid-cols-[88px_1fr] gap-y-2 rounded-lg border p-3 text-sm">
                <dt className="text-muted-foreground">{ec('ef7816a356d')}</dt>
                <dd>{doc.name || <span className="text-destructive">{ec('e7f05190592')}</span>}</dd>
                <dt className="text-muted-foreground">{ec('ed9c4466427')}</dt>
                <dd>{ec(layout?.name ?? '')}</dd>
                <dt className="text-muted-foreground">{ec('e05b36669c4')}</dt>
                <dd>{ec(TEMPLATE_USAGE_LABEL[doc.usage])}</dd>
                <dt className="text-muted-foreground">{ec('e399a491843')}</dt>
                <dd>{RECOGNITION_LABEL[doc.recognition]}</dd>
                <dt className="text-muted-foreground">{ec('e03b2dd5a1e')}</dt>
                <dd className="flex flex-wrap gap-1">
                  {doc.vendors.map((v) => (
                    <Badge key={v} variant="outline">
                      {ec(VENDORS[v].name)}
                    </Badge>
                  ))}
                </dd>
                <dt className="text-muted-foreground">{ec('edc0189a649')}</dt>
                <dd>
                  {doc.params.length ? doc.params.map((p) => p.name).join('、') : ec('e484d556139')}
                </dd>
              </dl>
              <p className="text-muted-foreground text-xs">{ec('ede9a5960a0')}</p>
            </section>
          </div>
        </ScrollArea>
        <SheetFooter className="flex-row items-center border-t">
          {reviewing ? (
            <span className="text-muted-foreground text-sm">{ec('e5c19b65a2e')}</span>
          ) : canSubmit ? (
            <span className="text-success flex items-center gap-1.5 text-sm">
              <CheckCircle2Icon className="size-4" />
              {ec('e486e5b33d8')}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">
              {!report.passed
                ? ec('ea11e65666b')
                : !linksOk
                  ? ec('e28eea5cb81')
                  : ec('ef189874138')}
            </span>
          )}
          <Button
            className="ml-auto"
            disabled={!canSubmit}
            loading={submitting}
            onClick={() => void submit()}
          >
            <SendIcon />
            {ec('e034829aca8')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
