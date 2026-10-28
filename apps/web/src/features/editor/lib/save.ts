'use client'
import { editorApi } from '@/lib/api'
import { appPath, workspacePath } from '@/lib/platform'
import { useEditor } from '../store'
import { ApiError } from '@aim/api-client'

let flight: Promise<boolean> | undefined
let owner = ''
const scopeListeners = new Set<() => void>()
/** 订阅恢复副本作用域，等待账号和工作空间均已就绪。 */
export function subscribeDraftScope(listener: () => void) {
  scopeListeners.add(listener)
  return () => {
    scopeListeners.delete(listener)
  }
}
export function getDraftScope() {
  return owner
}
/** 将恢复副本按账号、工作空间和文档隔离。 */
export function setDraftOwner(userId: string, workspaceId: string) {
  const next = `${userId}:${workspaceId}`
  if (next !== owner) {
    owner = next
    for (const listener of scopeListeners) listener()
  }
}
export function backupKey(id: string) {
  return owner ? `aim:draft:${owner}:${id}` : undefined
}
export function backupDraft() {
  const { doc, saveState } = useEditor.getState()
  if (!doc || !['dirty', 'saving', 'error'].includes(saveState)) return
  const key = backupKey(doc.id)
  if (key)
    try {
      localStorage.setItem(key, JSON.stringify(doc))
    } catch {
      /* 存储配额不足时仍保留内存文档和导出入口。 */
    }
}
export function clearDrafts() {
  for (const key of Object.keys(localStorage))
    if (key.startsWith('aim:draft:')) localStorage.removeItem(key)
  owner = ''
}
/** 串行排空保存期间的新编辑；失败后停止自动重试，保留本地副本。 */
export function saveCurrent(): Promise<boolean> {
  if (flight) return flight
  flight = (async () => {
    const initial = useEditor.getState().doc
    if (!initial || initial.meta.status === 'reviewing') return false
    const scope = process.env.NEXT_PUBLIC_API_MOCK === 'true' ? 'mock' : workspacePath()
    for (;;) {
      const { doc, isNew, saveState, setSaveState, set } = useEditor.getState()
      if (!doc || doc.id !== initial.id) return false
      if (!isNew && saveState === 'saved') return true
      backupDraft()
      setSaveState('saving')
      set({ saveFailure: undefined })
      try {
        const result = isNew
          ? await editorApi.createTemplate(doc)
          : await editorApi.saveTemplate(doc)
        if (
          useEditor.getState().doc?.id !== doc.id ||
          (scope !== 'mock' && workspacePath() !== scope)
        )
          return false
        set({ isNew: false })
        if (isNew) window.history.replaceState(null, '', appPath(`create/${doc.id}`))
        if (useEditor.getState().doc === doc) {
          setSaveState('saved', result.updatedAt)
          const key = backupKey(doc.id)
          if (key) localStorage.removeItem(key)
          return true
        }
        setSaveState('dirty', result.updatedAt)
      } catch (error) {
        if (useEditor.getState().doc?.id === doc.id) {
          set({
            saveFailure: error instanceof ApiError && error.status === 409 ? 'conflict' : 'network',
          })
          setSaveState('error')
          backupDraft()
        }
        return false
      }
    }
  })().finally(() => {
    flight = undefined
  })
  return flight
}
