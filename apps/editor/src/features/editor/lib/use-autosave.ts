'use client'

import { useCallback, useEffect, useRef } from 'react'
import { editorApi } from '@/lib/api'
import { useEditor } from '../store'

const DELAY = 1500

/** 自动保存：文档变化 1.5 秒后保存；首次保存时在服务端创建草稿 */
export function useAutosave() {
  const doc = useEditor((s) => s.doc)
  const saveState = useEditor((s) => s.saveState)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const saving = useRef(false)

  const saveNow = useCallback(async () => {
    const { doc: current, isNew, setSaveState, set } = useEditor.getState()
    if (!current || saving.current) return false
    if (current.meta.status === 'reviewing') return false
    saving.current = true
    setSaveState('saving')
    try {
      const res = isNew
        ? await editorApi.createTemplate(current)
        : await editorApi.saveTemplate(current)
      set({ isNew: false })
      // 保存期间若又有修改，保持 dirty
      const latest = useEditor.getState().doc
      setSaveState(latest === current ? 'saved' : 'dirty', res.updatedAt)
      if (isNew && typeof window !== 'undefined')
        window.history.replaceState(null, '', `/editor/${current.id}`)
      return true
    } catch {
      setSaveState('error')
      return false
    } finally {
      saving.current = false
    }
  }, [])

  useEffect(() => {
    if (saveState !== 'dirty' || !doc) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void saveNow(), DELAY)
    return () => clearTimeout(timer.current)
  }, [doc, saveState, saveNow])

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const s = useEditor.getState().saveState
      if (s === 'dirty' || s === 'saving') e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  return saveNow
}
