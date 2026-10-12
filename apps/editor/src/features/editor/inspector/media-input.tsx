'use client'

import type { Material, MaterialType } from '@aim/api-client'
import { isPlaceholderSrc } from '@aim/template-core'
import { Button, Input } from '@aim/ui'
import { ImageIcon, LinkIcon } from 'lucide-react'
import { useState } from 'react'
import { MaterialPicker } from './material-picker'

export function MediaInput({
  value,
  onChange,
  type = 'image',
  onPickMaterial,
}: {
  value: string
  onChange: (url: string) => void
  type?: MaterialType
  /** 选择视频素材时同时回填封面 / 时长 */
  onPickMaterial?: (m: Material) => void
}) {
  const [open, setOpen] = useState(false)
  const [editUrl, setEditUrl] = useState(false)
  const placeholder = isPlaceholderSrc(value)
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground transition hover:border-primary"
          aria-label="选择素材"
        >
          {value && type === 'image' && !placeholder ? <img src={value} alt="" className="size-full object-cover" /> : <ImageIcon className="size-5" />}
        </button>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            {placeholder || !value ? '选择素材' : '更换素材'}
          </Button>
          <Button size="xs" variant="ghost" className="text-muted-foreground" onClick={() => setEditUrl(!editUrl)}>
            <LinkIcon />
            使用链接
          </Button>
        </div>
      </div>
      {editUrl && <Input value={value.startsWith('data:') ? '' : value} placeholder="https://" onChange={(e) => onChange(e.target.value)} />}
      <MaterialPicker
        open={open}
        onOpenChange={setOpen}
        type={type}
        onPick={(m) => {
          if (onPickMaterial) onPickMaterial(m)
          else onChange(m.url)
        }}
      />
    </div>
  )
}
