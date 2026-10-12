'use client'

import { findElement, precheck, syncParams, type PrecheckReport } from '@aim/template-core'
import type { AnyElement, TemplateDocument, VendorId } from '@aim/template-schema'
import { produce, type Draft } from 'immer'
import { temporal } from 'zundo'
import { create } from 'zustand'

export type RailPanel = 'layouts' | 'elements' | 'materials' | 'params' | 'layers'
export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

interface EditorState {
  doc: TemplateDocument | null
  /** 尚未在服务端创建 */
  isNew: boolean
  selectedId: string | null
  editingId: string | null
  vendor: VendorId
  paramDisplay: 'token' | 'example'
  /** 'fit'：按画布可视高度自适应 */
  zoom: number | 'fit'
  panel: RailPanel | null
  saveState: SaveState
  lastSavedAt?: number
  report: PrecheckReport | null
  reviewOpen: boolean
  previewOpen: boolean
  paletteOpen: boolean

  load: (doc: TemplateDocument, isNew?: boolean) => void
  /** 以纯函数方式更新文档（@aim/template-core 的文档操作） */
  update: (fn: (doc: TemplateDocument) => TemplateDocument) => void
  /** 以 immer 方式修改元素（深层 props / 数组项） */
  mutateElement: (id: string, recipe: (draft: Draft<AnyElement>) => void) => void
  select: (id: string | null) => void
  setEditing: (id: string | null) => void
  set: (
    patch: Partial<
      Pick<
        EditorState,
        | 'vendor'
        | 'paramDisplay'
        | 'zoom'
        | 'panel'
        | 'reviewOpen'
        | 'previewOpen'
        | 'paletteOpen'
        | 'isNew'
      >
    >,
  ) => void
  setSaveState: (state: SaveState, at?: number) => void
}

const check = (doc: TemplateDocument | null) => (doc ? precheck(doc) : null)

let groupTimer: ReturnType<typeof setTimeout> | undefined

export const useEditor = create<EditorState>()(
  temporal(
    (set, get) => ({
      doc: null,
      isNew: false,
      selectedId: null,
      editingId: null,
      vendor: 'huawei',
      paramDisplay: 'token',
      zoom: 'fit',
      panel: 'layouts',
      saveState: 'idle',
      report: null,
      reviewOpen: false,
      previewOpen: false,
      paletteOpen: false,

      load: (doc, isNew = false) => {
        set({
          doc,
          isNew,
          selectedId: null,
          editingId: null,
          vendor: doc.vendors[0] ?? 'huawei',
          saveState: isNew ? 'dirty' : 'saved',
          lastSavedAt: isNew ? undefined : doc.meta.updatedAt,
          report: check(doc),
        })
        useEditor.temporal.getState().clear()
      },
      update: (fn) => {
        const doc = get().doc
        if (!doc) return
        const next = syncParams(fn(doc))
        set({ doc: next, saveState: 'dirty', report: check(next) })
      },
      mutateElement: (id, recipe) => {
        const doc = get().doc
        if (!doc) return
        const next = produce(doc, (draft) => {
          for (const page of draft.pages) {
            const el = page.elements.find((e) => e.id === id)
            if (el) recipe(el as Draft<AnyElement>)
          }
          draft.meta.updatedAt = Date.now()
        })
        const synced = syncParams(next)
        set({ doc: synced, saveState: 'dirty', report: check(synced) })
      },
      select: (id) =>
        set({ selectedId: id, editingId: get().editingId === id ? get().editingId : null }),
      setEditing: (id) => set({ editingId: id, selectedId: id ?? get().selectedId }),
      set: (patch) => set(patch),
      setSaveState: (saveState, at) => set({ saveState, ...(at ? { lastSavedAt: at } : {}) }),
    }),
    {
      // 仅文档进入历史；连续输入 400ms 内合并为一步
      partialize: (s) => ({ doc: s.doc }),
      equality: (a, b) => a.doc === b.doc,
      limit: 100,
      handleSet: (handleSet) => (state) => {
        if (groupTimer) {
          clearTimeout(groupTimer)
          groupTimer = setTimeout(() => (groupTimer = undefined), 400)
          return
        }
        handleSet(state)
        groupTimer = setTimeout(() => (groupTimer = undefined), 400)
      },
    },
  ),
)

/** 撤销 / 重做后重新计算预检 */
export function undo() {
  useEditor.temporal.getState().undo()
  const { doc } = useEditor.getState()
  useEditor.setState({ report: check(doc), saveState: 'dirty' })
}
export function redo() {
  useEditor.temporal.getState().redo()
  const { doc } = useEditor.getState()
  useEditor.setState({ report: check(doc), saveState: 'dirty' })
}

export function useSelectedElement(): AnyElement | undefined {
  return useEditor((s) => (s.doc && s.selectedId ? findElement(s.doc, s.selectedId) : undefined))
}
