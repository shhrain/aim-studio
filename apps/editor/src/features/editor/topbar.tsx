'use client'

import { TEMPLATE_NAME_MAX, TEMPLATE_STATUS_LABEL, TEMPLATE_USAGE_LABEL } from '@aim/template-schema'
import { Badge, Button, Hint, Kbd, cn } from '@aim/ui'
import { formatDate } from '@aim/utils'
import { ArrowLeftIcon, CheckIcon, CloudOffIcon, CommandIcon, EyeIcon, LoaderIcon, SendIcon } from 'lucide-react'
import Link from 'next/link'
import { Brand } from '@/components/brand'
import { STATUS_BADGE } from '../templates/status'
import { ScoreRing } from './dialogs/score-ring'
import { useEditor } from './store'

function SaveIndicator({ onRetry }: { onRetry: () => void }) {
  const state = useEditor((s) => s.saveState)
  const at = useEditor((s) => s.lastSavedAt)
  if (state === 'saving')
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <LoaderIcon className="size-3.5 animate-spin" />
        保存中…
      </span>
    )
  if (state === 'error')
    return (
      <button type="button" onClick={onRetry} className="flex items-center gap-1 text-xs text-destructive">
        <CloudOffIcon className="size-3.5" />
        保存失败，点击重试
      </button>
    )
  if (state === 'dirty') return <span className="text-xs text-muted-foreground">有未保存的修改</span>
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <CheckIcon className="size-3.5 text-success" />
      已自动保存{at ? ` ${formatDate(at, 'HH:mm')}` : ''}
    </span>
  )
}

export function TopBar({ saveNow }: { saveNow: () => Promise<boolean> }) {
  const doc = useEditor((s) => s.doc)!
  const report = useEditor((s) => s.report)
  const update = useEditor((s) => s.update)
  const set = useEditor((s) => s.set)
  const status = STATUS_BADGE[doc.meta.status]
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-3">
      <Brand compact />
      <Hint content="返回模板列表">
        <Button size="icon-sm" variant="ghost" asChild aria-label="返回">
          <Link href="/templates">
            <ArrowLeftIcon />
          </Link>
        </Button>
      </Hint>
      <div className="flex min-w-0 items-center gap-2">
        <input
          value={doc.name}
          maxLength={TEMPLATE_NAME_MAX}
          placeholder="未命名模板"
          aria-label="模板名称"
          onChange={(e) => update((d) => ({ ...d, name: e.target.value }))}
          className={cn(
            'h-8 w-56 rounded-md border border-transparent bg-transparent px-2 text-[15px] font-semibold transition outline-none hover:border-border focus:border-primary focus:bg-card',
            !doc.name && 'placeholder:text-destructive/70',
          )}
        />
        <Badge variant={status.variant} dot title={TEMPLATE_STATUS_LABEL[doc.meta.status]}>
          {status.label}
        </Badge>
        <Badge variant="outline">{TEMPLATE_USAGE_LABEL[doc.usage]}</Badge>
        <SaveIndicator onRetry={() => void saveNow()} />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => set({ paletteOpen: true })}>
          <CommandIcon />
          命令
          <Kbd>Ctrl K</Kbd>
        </Button>
        {report && (
          <Hint content={report.passed ? '快速检测通过' : `${report.errors.length} 个问题待修复`}>
            <button type="button" onClick={() => set({ reviewOpen: true })} className="flex items-center gap-2 rounded-md px-2 py-1 transition hover:bg-muted" aria-label="查看检测结果">
              <ScoreRing score={report.score} passed={report.passed} />
              <span className="text-left text-xs leading-tight">
                <span className="block font-medium">质量分</span>
                <span className={report.passed ? 'text-success' : 'text-destructive'}>{report.passed ? '可提交' : `${report.errors.length} 个问题`}</span>
              </span>
            </button>
          </Hint>
        )}
        <Button variant="outline" size="sm" onClick={() => set({ previewOpen: true })}>
          <EyeIcon />
          预览
        </Button>
        <Button size="sm" onClick={() => set({ reviewOpen: true })} disabled={doc.meta.status === 'reviewing'}>
          <SendIcon />
          提交审核
        </Button>
      </div>
    </header>
  )
}
