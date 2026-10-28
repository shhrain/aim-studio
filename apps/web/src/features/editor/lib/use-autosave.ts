'use client'
import { useEffect } from 'react'
import { useEditor } from '../store'
import { backupDraft, saveCurrent } from './save'
/** 防抖触发；实际保存由共享串行队列完成。 */
export function useAutosave() {
  const doc = useEditor((s) => s.doc)
  const state = useEditor((s) => s.saveState)
  useEffect(() => {
    backupDraft()
    if (state !== 'dirty' || !doc) return
    const timer = setTimeout(() => void saveCurrent(), 1500)
    return () => clearTimeout(timer)
  }, [doc, state])
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (['dirty', 'saving', 'error'].includes(useEditor.getState().saveState)) {
        backupDraft()
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [])
  return saveCurrent
}
