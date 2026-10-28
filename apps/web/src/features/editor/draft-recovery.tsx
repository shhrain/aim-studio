'use client'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { templateDocumentSchema, type TemplateDocument } from '@aim/template-schema'
import { Button } from '@aim/ui'
import { backupKey, subscribeDraftScope, getDraftScope } from './lib/save'
import { useEditor } from './store'
/** 恢复必须由用户主动选择，不静默覆盖服务端文档。 */
export function DraftRecovery() {
  const scope = useSyncExternalStore(subscribeDraftScope, getDraftScope, () => '')
  const current = useEditor((s) => s.doc)
  const currentId = current?.id
  const [backup, setBackup] = useState<TemplateDocument | null>(null)
  const en = usePathname().startsWith('/en/')
  useEffect(() => {
    setBackup(null)
    const current = useEditor.getState().doc
    if (!current || !scope || current.meta.status === 'reviewing') return
    const key = backupKey(current.id)
    if (!key) return
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const value = templateDocumentSchema.parse(JSON.parse(raw))
        if (value.meta.updatedAt > current.meta.updatedAt) setBackup(value)
      }
    } catch {
      /* 不加载格式错误或旧协议恢复副本。 */
    }
  }, [currentId, scope])
  if (!backup) return null
  return (
    <div className="mode-banner flex flex-wrap items-center gap-3" role="status">
      <span>{en ? 'A newer local draft is available.' : '发现未保存的本地草稿。'}</span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          useEditor.getState().update(() => backup)
          setBackup(null)
        }}
      >
        {en ? 'Restore draft' : '恢复草稿'}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const key = backupKey(backup.id)
          if (key) localStorage.removeItem(key)
          setBackup(null)
        }}
      >
        {en ? 'Use server version' : '使用服务端版本'}
      </Button>
    </div>
  )
}
