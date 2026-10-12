'use client'

import type { DeepPrecheckTask } from '@aim/api-client'
import { applyCapturedImage, convertDocument, type PrecheckIssue } from '@aim/template-core'
import { RECOGNITION_LABEL, TEMPLATE_USAGE_LABEL, VENDORS, getLayout, type IntegratedResult } from '@aim/template-schema'
import { Alert, Badge, Button, Input, Progress, ScrollArea, Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, cn, toast } from '@aim/ui'
import { isHttpsUrl } from '@aim/utils'
import { AlertTriangleIcon, CheckCircle2Icon, ChevronRightIcon, InfoIcon, RadarIcon, SendIcon, XCircleIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { editorApi, editorHooks } from '@/lib/api'
import { useEditor } from '../store'
import { ScoreRing } from './score-ring'

const LEVEL_ICON = { error: XCircleIcon, warning: AlertTriangleIcon, info: InfoIcon }
const LEVEL_COLOR = { error: 'text-destructive', warning: 'text-warning', info: 'text-info' }

/** 将补填的 RCS 链接写回协议数据 */
function patchRcs(result: IntegratedResult, links: Record<number, string>): IntegratedResult {
  const next: IntegratedResult = JSON.parse(JSON.stringify(result))
  const fix = (list: IntegratedResult['rcsTplContent']['actionSheet']) =>
    list?.forEach((b, i) => {
      const url = links[i]
      if (!url || b.action) return
      b.type = 'urlAction'
      b.action = url
      b.actionDetail = JSON.stringify({ url, application: 'webview' })
    })
  fix(next.rcsTplContent.actionSheet)
  next.rcsTplContent.content.forEach((c) => fix(c.buttons))
  return next
}

export function ReviewSheet({ saveNow, onLocate }: { saveNow: () => Promise<boolean>; onLocate: (i: PrecheckIssue) => void }) {
  const open = useEditor((s) => s.reviewOpen)
  const doc = useEditor((s) => s.doc)
  const report = useEditor((s) => s.report)
  const set = useEditor((s) => s.set)
  const router = useRouter()
  const [taskId, setTaskId] = useState<string>()
  const [links, setLinks] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const deep = editorHooks.useDeepPrecheck(taskId)
  const integrated = useMemo(() => (doc && open ? convertDocument(doc) : null), [doc, open])
  if (!doc || !report) return null

  const layout = getLayout(doc.layoutId)
  const missing = integrated?.editRcsBtns ?? []
  const linksOk = missing.every((b) => isHttpsUrl(links[b.btIndex]))
  const deepErrors = deep.data?.status === 'done' ? deep.data.issues.filter((i) => i.level === 'error') : []
  const reviewing = doc.meta.status === 'reviewing'
  const canSubmit = report.passed && linksOk && deepErrors.length === 0 && !reviewing

  const submit = async () => {
    setSubmitting(true)
    try {
      if (!(await saveNow()) && useEditor.getState().isNew) return
      let result = integrated ? patchRcs(integrated, links) : null
      // 红包审核图：Mock 环境直接使用 RCS 标准底图
      if (result?.needCapture) result = applyCapturedImage(result, { rcsSrc: result.sourceMaterial.content[0]?.media.mtalAddress, rmsSrc: result.mediaContent[0]?.src as string | undefined })
      const res = await editorApi.submitTemplate(doc.id, { document: doc, integrated: result, precheckPassed: report.passed })
      useEditor.getState().load(res.document)
      set({ reviewOpen: false })
      toast.success('已提交审核', { description: '运营商与厂商审核通常在 2-6 小时内完成，可在模板列表查看进度。', action: { label: '返回列表', onClick: () => router.push('/templates') } })
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
              <SheetTitle>提交前检查</SheetTitle>
              <SheetDescription>
                {report.passed ? '快速检测通过，可以提交审核。' : `发现 ${report.errors.length} 个必须修复的问题。`}
                {report.warnings.length ? ` ${report.warnings.length} 条优化建议。` : ''}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 p-5">
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">质量检测</h3>
              {report.issues.length === 0 ? (
                <Alert variant="success">未发现问题</Alert>
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
                          className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-sm transition enabled:hover:bg-muted/60"
                        >
                          <Icon className={cn('mt-0.5 size-4 shrink-0', LEVEL_COLOR[i.level])} />
                          <span className="flex-1">
                            {i.message}
                            {i.suggestion && <span className="mt-0.5 block text-xs text-muted-foreground">{i.suggestion}</span>}
                          </span>
                          {i.elementId && <ChevronRightIcon className="mt-0.5 size-4 text-muted-foreground" />}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">深度检测</h3>
                <Button size="xs" variant="outline" loading={deep.data?.status === 'running'} onClick={async () => setTaskId((await editorApi.startDeepPrecheck(doc)).taskId)}>
                  <RadarIcon />
                  {deep.data ? '重新检测' : '开始检测'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">检测图片清晰度、链接可达性、文案合规与加载性能，提升审核通过率（约 4 秒）。</p>
              {deep.data?.status === 'running' && <Progress value={deep.data.progress} />}
              {deep.data?.status === 'done' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2">
                    {deep.data.dimensions?.map((d) => (
                      <div key={d.key} className="rounded-lg border p-2 text-center">
                        <div className={cn('text-lg font-semibold tabular-nums', d.passed ? 'text-success' : 'text-destructive')}>{d.score}</div>
                        <div className="text-[11px] text-muted-foreground">{d.label}</div>
                      </div>
                    ))}
                  </div>
                  {deep.data.issues.map((i: DeepPrecheckTask['issues'][number], idx: number) => (
                    <Alert key={idx} variant={i.level === 'error' ? 'destructive' : 'warning'} className="py-2 text-xs">
                      {i.message}
                    </Alert>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">三信融合</h3>
              {integrated ? (
                <>
                  <p className="text-xs text-muted-foreground">提交后将同时生成苹果端（5G 消息）与其他终端（视频短信）模板，用户终端不支持阅信时自动降级。</p>
                  {missing.length > 0 && (
                    <div className="space-y-2 rounded-lg border border-warning/40 bg-warning/8 p-3">
                      <div className="text-xs font-medium">以下按钮在苹果端不支持，请补填替代链接：</div>
                      {missing.map((b) => (
                        <div key={b.btIndex} className="flex items-center gap-2">
                          <span className="w-24 shrink-0 truncate text-sm">「{b.name}」</span>
                          <Input placeholder="https://" value={links[b.btIndex] ?? ''} onChange={(e) => setLinks({ ...links, [b.btIndex]: e.target.value })} aria-invalid={Boolean(links[b.btIndex]) && !isHttpsUrl(links[b.btIndex])} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">「{layout?.name}」仅支持阅信（安卓厂商）下发。</p>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">下发信息</h3>
              <dl className="grid grid-cols-[88px_1fr] gap-y-2 rounded-lg border p-3 text-sm">
                <dt className="text-muted-foreground">模板名称</dt>
                <dd>{doc.name || <span className="text-destructive">未填写</span>}</dd>
                <dt className="text-muted-foreground">版式</dt>
                <dd>{layout?.name}</dd>
                <dt className="text-muted-foreground">用途</dt>
                <dd>{TEMPLATE_USAGE_LABEL[doc.usage]}</dd>
                <dt className="text-muted-foreground">识别类型</dt>
                <dd>{RECOGNITION_LABEL[doc.recognition]}</dd>
                <dt className="text-muted-foreground">发送厂商</dt>
                <dd className="flex flex-wrap gap-1">
                  {doc.vendors.map((v) => (
                    <Badge key={v} variant="outline">
                      {VENDORS[v].name} · {VENDORS[v].reviewTime}
                    </Badge>
                  ))}
                </dd>
                <dt className="text-muted-foreground">动态参数</dt>
                <dd>{doc.params.length ? doc.params.map((p) => p.name).join('、') : '无'}</dd>
              </dl>
              <p className="text-xs text-muted-foreground">审核流程：用户提交 → 初审 → 运营商审核 → 厂商审核。</p>
            </section>
          </div>
        </ScrollArea>
        <SheetFooter className="flex-row items-center border-t">
          {reviewing ? (
            <span className="text-sm text-muted-foreground">模板审核中，暂不可重复提交</span>
          ) : canSubmit ? (
            <span className="flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2Icon className="size-4" />
              已满足提交条件
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">{!report.passed ? '请先修复上方错误' : !linksOk ? '请补填苹果端替代链接' : '深度检测存在错误'}</span>
          )}
          <Button className="ml-auto" disabled={!canSubmit} loading={submitting} onClick={() => void submit()}>
            <SendIcon />
            提交审核
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
