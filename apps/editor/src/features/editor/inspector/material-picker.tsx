'use client'

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
  const [type, setType] = useState<MaterialType>(initialType)
  const [keyword, setKeyword] = useState('')
  const { data, isLoading } = editorHooks.useMaterials(type, keyword || undefined)
  const upload = editorHooks.useUploadMaterial()
  const file = useRef<HTMLInputElement>(null)

  const onFile = async (f: File | undefined) => {
    if (!f) return
    if (f.size > LIMIT[type])
      return void toast.error(
        `文件过大：${type === 'image' ? '图片不超过 2MB' : type === 'video' ? '视频不超过 10MB' : '音频不超过 5MB'}`,
      )
    const meta = await readFile(f)
    const m = await upload.mutateAsync({
      type,
      name: f.name.replace(/\.[^.]+$/, ''),
      size: f.size,
      ...meta,
    })
    toast.success('上传成功')
    onPick(m)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>素材库</DialogTitle>
          <DialogDescription>
            图片支持 jpg / png / gif / webp，单张不超过 2MB；视频支持 mp4，不超过 10MB。
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <div className="flex items-center gap-2">
            <Tabs value={type} onValueChange={(v) => setType(v as MaterialType)}>
              <TabsList>
                <TabsTrigger value="image">图片</TabsTrigger>
                <TabsTrigger value="video">视频</TabsTrigger>
                <TabsTrigger value="audio">音频</TabsTrigger>
              </TabsList>
            </Tabs>
            <Input
              className="ml-auto w-52"
              placeholder="搜索素材"
              prefix={<SearchIcon className="size-4" />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Button onClick={() => file.current?.click()} loading={upload.isPending}>
              <UploadIcon />
              上传
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
            <Empty size="sm" title="暂无素材" description="点击右上角上传本地文件" />
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
