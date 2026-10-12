'use client'

import type { TemplateSummary } from '@aim/api-client'
import { MultiVendorPreview, TemplateThumbnail } from '@aim/template-preview'
import {
  TEMPLATE_CATEGORY_LABEL,
  TEMPLATE_USAGE_LABEL,
  getLayout,
  type TemplateStatus,
} from '@aim/template-schema'
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Empty,
  Input,
  PageHeader,
  Segmented,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  toast,
} from '@aim/ui'
import { formatRelative } from '@aim/utils'
import {
  CopyIcon,
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDeferredValue, useState } from 'react'
import { AppHeader } from '@/components/app-header'
import { editorHooks } from '@/lib/api'
import { STATUS_BADGE } from './status'

type StatusFilter = TemplateStatus | 'all'
type CategoryFilter = 'all' | 'service' | 'notify'

export function TemplatesPage() {
  const [status, setStatus] = useState<StatusFilter>('all')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [keyword, setKeyword] = useState('')
  const deferred = useDeferredValue(keyword)
  const { data, isLoading } = editorHooks.useTemplates({
    status,
    category,
    keyword: deferred,
    size: 60,
  })
  const list = data?.data ?? []
  const [previewing, setPreviewing] = useState<TemplateSummary | null>(null)

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1440px] space-y-5 px-6 py-6">
          <PageHeader
            title="我的模板"
            description="管理阅信模板：编辑、复制、多厂商预览，提交审核后可用于短链 / 文本识别下发。"
            actions={
              <Button asChild>
                <Link href="/editor/new">
                  <PlusIcon />
                  新建模板
                </Link>
              </Button>
            }
          />
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <TabsList>
                <TabsTrigger value="all">全部</TabsTrigger>
                {(Object.keys(STATUS_BADGE) as TemplateStatus[]).map((s) => (
                  <TabsTrigger key={s} value={s}>
                    {STATUS_BADGE[s].label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Segmented
              value={category}
              onValueChange={setCategory}
              options={[
                { value: 'all', label: '全部分类' },
                { value: 'service', label: '服务类' },
                { value: 'notify', label: '通知类' },
              ]}
            />
            <Input
              className="ml-auto w-64"
              placeholder="搜索模板名称"
              prefix={<SearchIcon className="size-4" />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          {isLoading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-[360px] rounded-xl" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <Empty
              title={
                keyword || status !== 'all' || category !== 'all'
                  ? '没有符合条件的模板'
                  : '还没有模板'
              }
              description="从 33 种标准版式开始，几分钟即可完成一个阅信模板"
              action={
                <Button asChild>
                  <Link href="/editor/new">
                    <PlusIcon />
                    新建模板
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
              {list.map((t) => (
                <TemplateCard key={t.id} item={t} onPreview={() => setPreviewing(t)} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Dialog open={Boolean(previewing)} onOpenChange={(o) => !o && setPreviewing(null)}>
        <DialogContent size="full">
          <DialogHeader>
            <DialogTitle>预览 · {previewing?.name}</DialogTitle>
          </DialogHeader>
          <DialogBody className="max-h-[75vh]">
            {previewing && (
              <MultiVendorPreview
                document={previewing.document}
                paramDisplay="example"
                phoneWidth={220}
              />
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TemplateCard({ item, onPreview }: { item: TemplateSummary; onPreview: () => void }) {
  const router = useRouter()
  const del = editorHooks.useDeleteTemplate()
  const dup = editorHooks.useDuplicateTemplate()
  const [confirm, setConfirm] = useState(false)
  const layout = getLayout(item.layoutId)
  const status = STATUS_BADGE[item.status]
  return (
    <article className="group bg-card shadow-panel hover:border-primary/30 hover:shadow-float flex flex-col overflow-hidden rounded-xl border transition hover:-translate-y-0.5">
      <button
        type="button"
        onClick={() => router.push(`/editor/${item.id}`)}
        className="canvas-grid relative h-[260px] overflow-hidden px-6 pt-5 text-left"
        aria-label={`编辑 ${item.name}`}
      >
        <TemplateThumbnail document={item.document} paramDisplay="example" />
        <div className="from-card pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent" />
      </button>
      <div className="flex flex-1 flex-col gap-2 border-t px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-medium" title={item.name}>
            {item.name || '未命名模板'}
          </h3>
          <Badge variant={status.variant} dot>
            {status.label}
          </Badge>
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
          <span>{layout?.name}</span>
          <span>·</span>
          <span>{TEMPLATE_CATEGORY_LABEL[item.category]}</span>
          <span>·</span>
          <span>{TEMPLATE_USAGE_LABEL[item.usage]}</span>
          <span>·</span>
          <span>{item.vendors.length} 个厂商</span>
        </div>
        {item.status === 'rejected' && item.rejectReason && (
          <p className="bg-destructive/8 text-destructive line-clamp-2 rounded-md px-2 py-1 text-xs">
            驳回原因：{item.rejectReason}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-muted-foreground text-xs">
            更新于 {formatRelative(item.updatedAt)}
          </span>
          <div className="flex items-center gap-1">
            <Button size="icon-xs" variant="ghost" aria-label="预览" onClick={onPreview}>
              <EyeIcon />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="编辑"
              onClick={() => router.push(`/editor/${item.id}`)}
            >
              <PencilIcon />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon-xs" variant="ghost" aria-label="更多操作">
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() =>
                    dup.mutate(item.id, {
                      onSuccess: (copy) => toast.success(`已复制为「${copy.name}」`),
                    })
                  }
                >
                  <CopyIcon />
                  复制模板
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setConfirm(true)}>
                  <Trash2Icon />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        destructive
        title={`删除「${item.name || '未命名模板'}」？`}
        description="删除后不可恢复，已提交审核的模板将同时撤回。"
        confirmText="删除"
        onConfirm={async () => {
          await del.mutateAsync(item.id)
          toast.success('已删除')
        }}
      />
    </article>
  )
}
