'use client'

import { duplicateElement, findElement, removeElement, updateElement } from '@aim/template-core'
import { useEffect } from 'react'
import { redo, undo, useEditor } from '../store'

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))

/** 编辑器快捷键 */
export function useHotkeys(saveNow: () => Promise<boolean>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()
      const s = useEditor.getState()
      if (mod && key === 'k') {
        e.preventDefault()
        s.set({ paletteOpen: !s.paletteOpen })
        return
      }
      if (mod && key === 's') {
        e.preventDefault()
        void saveNow()
        return
      }
      if (mod && key === 'p') {
        e.preventDefault()
        s.set({ previewOpen: true })
        return
      }
      if (isTyping(e.target)) return
      if (s.doc?.meta.status === 'reviewing') return
      if (mod && key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (mod && (key === 'y' || (key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      } else if (key === 'escape') {
        s.select(null)
      } else if (s.doc && s.selectedId) {
        const el = findElement(s.doc, s.selectedId)
        if (!el) return
        const free = s.doc.pages[0]?.mode === 'absolute'
        if ((key === 'delete' || key === 'backspace') && (!el.slot || free) && !el.locked) {
          e.preventDefault()
          s.update((d) => removeElement(d, el.id))
          s.select(null)
        } else if (mod && key === 'd' && free) {
          e.preventDefault()
          let newId: string | undefined
          s.update((d) => {
            const r = duplicateElement(d, el.id)
            newId = r.element?.id
            return r.doc
          })
          if (newId) s.select(newId)
        } else if (free && !el.locked && key.startsWith('arrow')) {
          e.preventDefault()
          const step = e.shiftKey ? 10 : 1
          const dx = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0
          const dy = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0
          s.update((d) => updateElement(d, el.id, { x: el.x + dx, y: el.y + dy }))
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [saveNow])
}
