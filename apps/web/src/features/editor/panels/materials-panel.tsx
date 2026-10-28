'use client'
import { useEditorCopy } from '@/features/editor/lib/copy'

import type { Material, MaterialType } from '@aim/api-client'
import { addElement, findElement, updateElement } from '@aim/template-core'
import { Button, Segmented, Skeleton, toast } from '@aim/ui'
import { PlayIcon, UploadIcon } from 'lucide-react'
import { useState } from 'react'
import { editorHooks } from '@/lib/api'
import { MaterialPicker } from '../inspector/material-picker'
import { useEditor } from '../store'

/** 素材面板：点击素材 → 替换选中的图片/视频，未选中则新增元素 */
export function MaterialsPanel() {
  const ec = useEditorCopy()

  const [type, setType] = useState<MaterialType>('image')
  const [open, setOpen] = useState(false)
  const { data, isLoading } = editorHooks.useMaterials(type)

  const apply = (m: Material) => {
    const { doc, selectedId, update, select } = useEditor.getState()
    if (!doc) return
    const el = selectedId ? findElement(doc, selectedId) : undefined
    if (el?.type === 'image' && m.type === 'image') {
      update((d) => updateElement(d, el.id, { props: { src: m.url } }))
      return toast.success(ec('e46f64340ac'))
    }
    if (el?.type === 'video' && m.type === 'video') {
      update((d) =>
        updateElement(d, el.id, {
          props: { src: m.url, cover: m.cover ?? '', duration: m.duration },
        }),
      )
      return toast.success(ec('eedbc9e55fa'))
    }
    let id: string | undefined
    update((d) => {
      const r =
        m.type === 'image'
          ? addElement(d, 'image', {
              props: { src: m.url },
              h: m.width && m.height ? Math.round((342 * m.height) / m.width) : 192,
              w: 342,
              x: 0,
            })
          : m.type === 'video'
            ? addElement(d, 'video', {
                props: { src: m.url, cover: m.cover ?? '', duration: m.duration },
                w: 342,
                x: 0,
              })
            : addElement(d, 'audio', {
                props: { src: m.url, title: m.name, duration: (m.duration ?? 30) * 1000 },
              })
      id = r.element.id
      return r.doc
    })
    if (id) select(id)
    toast.success(ec('e3e8b9b06b8'))
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Segmented
          size="sm"
          value={type}
          onValueChange={setType}
          options={[
            { value: 'image', label: ec('ed24c10d37d') },
            { value: 'video', label: ec('ec20f7618d3') },
            { value: 'audio', label: ec('e296c632ec8') },
          ]}
        />
        <Button size="sm" variant="outline" className="ml-auto" onClick={() => setOpen(true)}>
          <UploadIcon />
          {ec('e9e07e3c053')}
        </Button>
      </div>
      <p className="text-muted-foreground text-[11px]">{ec('e6bed1c98e2')}</p>
      <div className="grid grid-cols-2 gap-2">
        {isLoading
          ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-video" />)
          : data?.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => apply(m)}
                className="group hover:border-primary overflow-hidden rounded-lg border text-left transition"
                title={m.name}
              >
                <div className="bg-muted relative aspect-video">
                  {(m.cover || m.type === 'image') && (
                    <img src={m.cover ?? m.url} alt={m.name} className="size-full object-cover" />
                  )}
                  {m.type !== 'image' && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <PlayIcon className="size-5 text-white drop-shadow" />
                    </span>
                  )}
                </div>
                <div className="truncate px-2 py-1 text-[11px]">{m.name}</div>
              </button>
            ))}
      </div>
      <MaterialPicker open={open} onOpenChange={setOpen} type={type} onPick={apply} />
    </div>
  )
}
