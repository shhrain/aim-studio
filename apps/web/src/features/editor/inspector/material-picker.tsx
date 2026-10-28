'use client'
import { useEditorCopy } from '@/features/editor/lib/copy'

import type { Material, MaterialType } from '@aim/api-client'
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Empty,
  Input,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  cn,
  toast,
} from '@aim/ui'
import { formatBytes, formatDuration } from '@aim/utils'
import { PlayIcon, SearchIcon, UploadIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { editorHooks } from '@/lib/api'

const LIMIT = { image: 2 * 1024 * 1024, video: 10 * 1024 * 1024, audio: 5 * 1024 * 1024 }
const ACCEPT = {
  image: 'image/png,image/jpeg,image/gif,image/webp',
  video: 'video/mp4',
  audio: 'audio/mpeg,audio/mp4,audio/aac',
}

function readFile(
  file: File,
): Promise<{ url: string; width?: number; height?: number; duration?: number; cover?: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const url = String(reader.result)
      if (file.type.startsWith('image/')) {
        const img = new Image()
        img.onload = () => resolve({ url, width: img.naturalWidth, height: img.naturalHeight })
        img.onerror = () => resolve({ url })
        img.src = url
      } else if (file.type.startsWith('video/')) {
        const v = document.createElement('video')
        v.preload = 'metadata'
        v.muted = true
        v.onloadeddata = () => {
          const c = document.createElement('canvas')
          c.width = v.videoWidth
          c.height = v.videoHeight
          c.getContext('2d')?.drawImage(v, 0, 0)
          resolve({
            url,
            width: v.videoWidth,
            height: v.videoHeight,
            duration: Math.round(v.duration),
            cover: c.toDataURL('image/jpeg', 0.8),
          })
        }
        v.onerror = () => resolve({ url })
        v.src = url
      } else resolve({ url })
    }
    reader.readAsDataURL(file)
  })
}

export interface MaterialPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: MaterialType
  onPick: (m: Material) => void
}

/** 素材库：浏览 / 搜索 / 本地上传（Mock 存为 data URL） */
export function MaterialPicker({
  open,
  onOpenChange,
  type: initialType,
  onPick,
}: MaterialPickerProps) {
  const ec = useEditorCopy()

  const [type, setType] = useState<MaterialType>(initialType)
  const [keyword, setKeyword] = useState('')
  const { data, isLoading } = editorHooks.useMaterials(type, keyword || undefined)
  const upload = editorHooks.useUploadMaterial()
  const file = useRef<HTMLInputElement>(null)

  const onFile = async (f: File | undefined) => {
    if (!f) return
    if (f.size > LIMIT[type])
      return void toast.error(
        `文件过大：${type === 'image' ? ec('e1b050d8182') : type === 'video' ? ec('e8182aecafb') : ec('ee4fcbcc0cf')}`,
      )
    const meta = await readFile(f)
    const m = await upload.mutateAsync({
      type,
      name: f.name.replace(/\.[^.]+$/, ''),
      size: f.size,
      ...meta,
    })
    toast.success(ec('e844759c9f5'))
    onPick(m)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{ec('e89e906481e')}</DialogTitle>
          <DialogDescription>{ec('e3106da9bc2')}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <div className="flex items-center gap-2">
            <Tabs value={type} onValueChange={(v) => setType(v as MaterialType)}>
              <TabsList>
                <TabsTrigger value="image">{ec('ed24c10d37d')}</TabsTrigger>
                <TabsTrigger value="video">{ec('ec20f7618d3')}</TabsTrigger>
                <TabsTrigger value="audio">{ec('e296c632ec8')}</TabsTrigger>
              </TabsList>
            </Tabs>
            <Input
              className="ml-auto w-52"
              placeholder={ec('ee4c3a0ab0b')}
              prefix={<SearchIcon className="size-4" />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Button onClick={() => file.current?.click()} loading={upload.isPending}>
              <UploadIcon />
              {ec('e9e07e3c053')}
            </Button>
            <input
              ref={file}
              type="file"
              hidden
              accept={ACCEPT[type]}
              onChange={(e) =>
                void onFile(e.target.files?.[0]).finally(() => (e.target.value = ''))
              }
            />
          </div>
          {isLoading ? (
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="aspect-video" />
              ))}
            </div>
          ) : !data?.length ? (
            <Empty size="sm" title={ec('ebc5bb26546')} description={ec('e4d5c4a2bb1')} />
          ) : (
            <div className="grid max-h-[52vh] grid-cols-4 gap-3 overflow-y-auto pr-1">
              {data.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onPick(m)
                    onOpenChange(false)
                  }}
                  className={cn(
                    'group bg-card hover:border-primary hover:shadow-panel overflow-hidden rounded-lg border text-left transition',
                  )}
                >
                  <div className="bg-muted relative aspect-video">
                    {(m.cover || m.type === 'image') && (
                      <img src={m.cover ?? m.url} alt={m.name} className="size-full object-cover" />
                    )}
                    {m.type !== 'image' && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="flex size-8 items-center justify-center rounded-full bg-black/50 text-white">
                          <PlayIcon className="size-4" />
                        </span>
                      </span>
                    )}
                    {m.duration ? (
                      <span className="absolute right-1 bottom-1 rounded bg-black/60 px-1 text-[10px] text-white">
                        {formatDuration(m.duration * 1000)}
                      </span>
                    ) : null}
                  </div>
                  <div className="px-2 py-1.5">
                    <div className="truncate text-xs font-medium">{m.name}</div>
                    <div className="text-muted-foreground text-[11px]">
                      {m.width ? `${m.width}×${m.height} · ` : ''}
                      {formatBytes(m.size)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
