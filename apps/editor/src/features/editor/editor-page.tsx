'use client'

import { createDocument } from '@aim/template-core'
import { Button, Empty, Spinner } from '@aim/ui'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { editorHooks } from '@/lib/api'
import { LayoutGallery } from './layout-gallery'
import { useEditor } from './store'
import { EditorWorkspace } from './workspace'

/** /editor/new：先选版式；/editor/[id]：加载模板 */
export function EditorPage({ id, initialLayout }: { id: string; initialLayout?: string }) {
  const isNew = id === 'new'
  const loaded = useEditor((s) => s.doc?.id)
  const [picked, setPicked] = useState(false)
  const query = editorHooks.useTemplate(isNew ? undefined : id)

  useEffect(() => {
    if (!isNew && query.data && loaded !== query.data.id) useEditor.getState().load(query.data.document)
  }, [isNew, query.data, loaded])

  useEffect(() => {
    if (isNew && initialLayout && !picked) {
      useEditor.getState().load(createDocument({ layoutId: initialLayout }), true)
      setPicked(true)
    }
  }, [isNew, initialLayout, picked])

  if (isNew && !picked) {
    return (
      <LayoutGallery
        onPick={(layout) => {
          useEditor.getState().load(createDocument({ layoutId: layout.id }), true)
          setPicked(true)
        }}
      />
    )
  }
  if (!isNew && query.isError)
    return (
      <Empty
        className="h-dvh"
        title="模板不存在或已被删除"
        action={
          <Button asChild>
            <Link href="/templates">返回模板列表</Link>
          </Button>
        }
      />
    )
  if (!loaded || (!isNew && loaded !== id && !picked))
    return (
      <div className="flex h-dvh items-center justify-center">
        <Spinner label="正在加载模板…" />
      </div>
    )
  return <EditorWorkspace />
}
