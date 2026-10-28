'use client'
import { useEditorCopy } from '@/features/editor/lib/copy'
import { appPath } from '@/lib/platform'

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
  const ec = useEditorCopy()

  const isNew = id === 'new'
  const loaded = useEditor((s) => s.doc?.id)
  const [picked, setPicked] = useState(false)
  const query = editorHooks.useTemplate(isNew ? undefined : id)

  useEffect(() => {
    if (!isNew && query.data && loaded !== query.data.id)
      useEditor.getState().load(query.data.document)
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
        title={ec('e9aa5af9a8e')}
        action={
          <Button asChild>
            <Link href={appPath('templates')}>{ec('e4c45339799')}</Link>
          </Button>
        }
      />
    )
  if (!loaded || (!isNew && loaded !== id && !picked))
    return (
      <div className="flex h-dvh items-center justify-center">
        <Spinner label={ec('ed6ff65f37d')} />
      </div>
    )
  return <EditorWorkspace />
}
