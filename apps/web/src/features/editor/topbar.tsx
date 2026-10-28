'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useEditorCopy } from '@/features/editor/lib/copy'
import { appPath } from '@/lib/platform'

import {
  TEMPLATE_NAME_MAX,
  TEMPLATE_STATUS_LABEL,
  TEMPLATE_USAGE_LABEL,
} from '@aim/template-schema'
import { Badge, Button, Hint, Kbd, cn, ConfirmDialog } from '@aim/ui'
import { formatDate } from '@aim/utils'
import {
  ArrowLeftIcon,
  CheckIcon,
  CloudOffIcon,
  CommandIcon,
  EyeIcon,
  LoaderIcon,
  SendIcon,
} from 'lucide-react'
import Link from 'next/link'
import { Brand } from '@/components/brand'
import { STATUS_BADGE } from '../templates/status'
import { ScoreRing } from './dialogs/score-ring'
import { useEditor } from './store'

function SaveIndicator({ onRetry }: { onRetry: () => void }) {
  const ec = useEditorCopy()

  const t = useTranslations()
  const [reload, setReload] = useState(false)
  const failure = useEditor((s) => s.saveFailure)
  const state = useEditor((s) => s.saveState)
  const at = useEditor((s) => s.lastSavedAt)
  if (state === 'saving')
    return (
      <span className="text-muted-foreground flex items-center gap-1 text-xs">
        <LoaderIcon className="size-3.5 animate-spin" />
        {ec('eff509c9ba0')}
      </span>
    )
  if (state === 'error' && failure === 'conflict')
    return (
      <div className="flex max-w-96 flex-wrap items-center gap-1 text-xs" role="alert">
        <span className="text-destructive">{t('saveConflict')}</span>
        <Button
          size="xs"
          variant="outline"
          onClick={() => {
            const doc = useEditor.getState().doc
            if (!doc) return
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' }),
            )
            const a = document.createElement('a')
            a.href = url
            a.download = doc.name + '.json'
            a.click()
            URL.revokeObjectURL(url)
          }}
        >
          {t('export')}
        </Button>
        <Button size="xs" variant="outline" onClick={() => setReload(true)}>
          {t('reloadLatest')}
        </Button>
        <ConfirmDialog
          open={reload}
          onOpenChange={setReload}
          title={t('reloadLatest')}
          description={t('reloadConfirm')}
          confirmText={t('reloadLatest')}
          onConfirm={() => {
            useEditor.getState().setSaveState('saved')
            location.reload()
          }}
        />
      </div>
    )
  if (state === 'error')
    return (
      <button
        type="button"
        onClick={onRetry}
        className="text-destructive flex items-center gap-1 text-xs"
      >
        <CloudOffIcon className="size-3.5" />
        {ec('e11080ae080')}
      </button>
    )
  if (state === 'dirty')
    return <span className="text-muted-foreground text-xs">{ec('ec2277872cd')}</span>
  return (
    <span className="text-muted-foreground flex items-center gap-1 text-xs">
      <CheckIcon className="text-success size-3.5" />
      {ec('ee5932f6644')}
      {at ? ` ${formatDate(at, 'HH:mm')}` : ''}
    </span>
  )
}

export function TopBar({ saveNow }: { saveNow: () => Promise<boolean> }) {
  const ec = useEditorCopy()

  const doc = useEditor((s) => s.doc)!
  const report = useEditor((s) => s.report)
  const update = useEditor((s) => s.update)
  const set = useEditor((s) => s.set)
  const status = STATUS_BADGE[doc.meta.status]
  return (
    <header className="bg-card flex h-14 shrink-0 items-center gap-3 border-b px-3">
      <Brand compact />
      <Hint content={ec('e4c45339799')}>
        <Button size="icon-sm" variant="ghost" asChild aria-label={ec('e572cf45ba4')}>
          <Link href={appPath('templates')}>
            <ArrowLeftIcon />
          </Link>
        </Button>
      </Hint>
      <div className="flex min-w-0 items-center gap-2">
        <input
          disabled={doc.meta.status === 'reviewing'}
          value={doc.name}
          maxLength={TEMPLATE_NAME_MAX}
          placeholder={ec('eb9c8a471e0')}
          aria-label={ec('ef7816a356d')}
          onChange={(e) => update((d) => ({ ...d, name: e.target.value }))}
          className={cn(
            'hover:border-border focus:border-primary focus:bg-card placeholder:text-muted-foreground h-8 w-56 rounded-md border border-transparent bg-transparent px-2 text-[15px] font-semibold transition outline-none placeholder:font-normal',
            !doc.name && 'border-border border-dashed',
          )}
        />
        <Badge variant={status.variant} dot title={TEMPLATE_STATUS_LABEL[doc.meta.status]}>
          {ec(status.label)}
        </Badge>
        <Badge variant="outline">{ec(TEMPLATE_USAGE_LABEL[doc.usage])}</Badge>
        <SaveIndicator onRetry={() => void saveNow()} />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => set({ paletteOpen: true })}
        >
          <CommandIcon />
          {ec('e928f87d450')}
          <Kbd>Ctrl K</Kbd>
        </Button>
        {report && (
          <Hint
            content={report.passed ? ec('eb40e059b6d') : `${report.errors.length} 个问题待修复`}
          >
            <button
              type="button"
              onClick={() => set({ reviewOpen: true })}
              className="hover:bg-muted flex items-center gap-2 rounded-md px-2 py-1 transition"
              aria-label={ec('ef8b953570a')}
            >
              <ScoreRing score={report.score} passed={report.passed} />
              <span className="text-left text-xs leading-tight">
                <span className="block font-medium">{ec('e89dc4bc45d')}</span>
                <span className={report.passed ? 'text-success' : 'text-destructive'}>
                  {report.passed ? ec('e6baf25574a') : `${report.errors.length} 个问题`}
                </span>
              </span>
            </button>
          </Hint>
        )}
        <Button variant="outline" size="sm" onClick={() => set({ previewOpen: true })}>
          <EyeIcon />
          {ec('e13d61fea9f')}
        </Button>
        <Button
          size="sm"
          onClick={() => set({ reviewOpen: true })}
          disabled={doc.meta.status === 'reviewing'}
        >
          <SendIcon />
          {ec('e034829aca8')}
        </Button>
      </div>
    </header>
  )
}
