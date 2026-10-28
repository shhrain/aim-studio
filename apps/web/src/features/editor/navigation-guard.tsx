'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button, Dialog, DialogContent, DialogTitle, DialogDescription } from '@aim/ui'
import { backupDraft, saveCurrent } from './lib/save'
import { useEditor } from './store'

/** 拦截创作页内的离开操作，让失败和冲突时仍能保留、导出当前内容。 */
export function EditorNavigationGuard() {
  const t = useTranslations(),
    router = useRouter(),
    pathname = usePathname()
  const [target, setTarget] = useState(''),
    [busy, setBusy] = useState(false),
    [failed, setFailed] = useState(false)
  useEffect(() => {
    const dirty = () => ['dirty', 'saving', 'error'].includes(useEditor.getState().saveState)
    const source = location.href
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !dirty()
      )
        return
      const link = (event.target as Element).closest('a[href]') as HTMLAnchorElement | null
      if (
        !link ||
        link.target === '_blank' ||
        link.hasAttribute('download') ||
        link.origin !== location.origin ||
        link.href === location.href ||
        (link.pathname === location.pathname && link.search === location.search)
      )
        return
      event.preventDefault()
      event.stopImmediatePropagation()
      backupDraft()
      setFailed(false)
      setTarget(link.pathname + link.search + link.hash)
    }
    const back = (event: PopStateEvent) => {
      if (!dirty()) return
      const next = location.pathname + location.search + location.hash
      event.stopImmediatePropagation()
      history.pushState(null, '', source)
      backupDraft()
      setFailed(false)
      setTarget(next)
    }
    document.addEventListener('click', click, true)
    window.addEventListener('popstate', back, true)
    return () => {
      document.removeEventListener('click', click, true)
      window.removeEventListener('popstate', back, true)
    }
  }, [pathname])
  const leave = () => {
    setTarget('')
    router.push(target)
  }
  const exportBackup = () => {
    const doc = useEditor.getState().doc
    if (!doc) return
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = (doc.name || 'template') + '.json'
    link.click()
    URL.revokeObjectURL(url)
  }
  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => {
        if (!open && !busy) setTarget('')
      }}
    >
      <DialogContent aria-describedby="leave-description">
        <DialogTitle>{t('unsavedTitle')}</DialogTitle>
        <DialogDescription id="leave-description">
          {t(failed ? 'saveError' : 'unsavedHint')}
        </DialogDescription>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={exportBackup}>
            {t('export')}
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => setTarget('')}>
            {t('keepEditing')}
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => {
              backupDraft()
              leave()
            }}
          >
            {t('discardLeave')}
          </Button>
          <Button
            loading={busy}
            onClick={async () => {
              setBusy(true)
              const saved = await saveCurrent()
              setBusy(false)
              if (saved) leave()
              else setFailed(true)
            }}
          >
            {t('saveLeave')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
