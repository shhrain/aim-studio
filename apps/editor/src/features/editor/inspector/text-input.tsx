'use client'

import { displayLength } from '@aim/template-core'
import { PARAM_NAME_REG, paramToken } from '@aim/template-schema'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Hint,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Segmented,
  Spinner,
  Textarea,
  cn,
  toast,
} from '@aim/ui'
import { BracesIcon, PlusIcon, SparklesIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { editorApi } from '@/lib/api'
import { useEditor } from '../store'

export interface TextInputProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
  multiline?: boolean
  placeholder?: string
  /** 允许插入参数 */
  params?: boolean
  /** AI 文案字段类型 */
  ai?: 'title' | 'description' | 'button'
  id?: string
}

export function TextInput({
  value,
  onChange,
  maxLength,
  multiline,
  placeholder,
  params = true,
  ai,
  id,
}: TextInputProps) {
  const doc = useEditor((s) => s.doc)
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const len = doc ? displayLength(value ?? '', doc) : [...(value ?? '')].length
  const over = maxLength != null && len > maxLength

  const insert = (token: string) => {
    const el = ref.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const next = value.slice(0, start) + token + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  const common = {
    id,
    ref,
    value: value ?? '',
    placeholder,
    'aria-invalid': over || undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) =>
      onChange(e.target.value),
  }

  return (
    <div className="space-y-1">
      {multiline ? (
        <Textarea {...common} rows={3} className="min-h-16 resize-y" />
      ) : (
        <Input {...common} />
      )}
      <div className="flex items-center gap-1">
        {params && doc && <ParamMenu onInsert={insert} />}
        {ai && <AiPopover field={ai} maxLength={maxLength ?? 30} onApply={onChange} />}
        {maxLength != null && (
          <span
            className={cn(
              'ml-auto text-[11px] tabular-nums',
              over ? 'text-destructive font-medium' : 'text-muted-foreground',
            )}
          >
            {len}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
}

function ParamMenu({ onInsert }: { onInsert: (token: string) => void }) {
  const params = useEditor((s) => s.doc?.params ?? [])
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="xs" variant="ghost" className="text-muted-foreground">
          <BracesIcon />
          插入参数
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel>已定义参数</DropdownMenuLabel>
        {params.length === 0 && (
          <div className="text-muted-foreground px-2 pb-1.5 text-xs">暂无参数</div>
        )}
        {params.map((p) => (
          <DropdownMenuItem key={p.name} onSelect={() => onInsert(paramToken(p.name))}>
            <span className="bg-accent text-accent-foreground rounded px-1 text-xs">{p.name}</span>
            <span className="text-muted-foreground ml-auto truncate text-xs">{p.example}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            const name = window
              .prompt('参数名（中英文、数字、下划线）', `param${params.length + 1}`)
              ?.trim()
            if (!name) return
            if (!PARAM_NAME_REG.test(name))
              return void toast.error('参数名仅支持中英文、数字、下划线')
            onInsert(paramToken(name))
          }}
        >
          <PlusIcon />
          新建参数
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AiPopover({
  field,
  maxLength,
  onApply,
}: {
  field: 'title' | 'description' | 'button'
  maxLength: number
  onApply: (v: string) => void
}) {
  const doc = useEditor((s) => s.doc)
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [tone, setTone] = useState<'promotion' | 'friendly' | 'formal'>('promotion')
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<string[]>([])
  const run = async () => {
    setLoading(true)
    try {
      const res = await editorApi.aiCopywriting({
        field,
        maxLength,
        prompt: prompt || doc?.name || '品牌活动',
        tone,
        layoutName: doc?.layoutId ?? '',
        count: 4,
      })
      setList(res.candidates)
    } finally {
      setLoading(false)
    }
  }
  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o && !prompt) setPrompt(doc?.name ?? '')
      }}
    >
      <Hint content="AI 生成文案">
        <PopoverTrigger asChild>
          <Button size="xs" variant="ghost" className="text-primary">
            <SparklesIcon />
            AI
          </Button>
        </PopoverTrigger>
      </Hint>
      <PopoverContent align="start" className="w-80 space-y-3">
        <div className="text-sm font-medium">AI 文案助手</div>
        <Input
          placeholder="描述活动 / 场景，如：国庆出游特惠"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void run()}
        />
        <Segmented
          size="sm"
          block
          value={tone}
          onValueChange={setTone}
          options={[
            { value: 'promotion', label: '促销' },
            { value: 'friendly', label: '亲和' },
            { value: 'formal', label: '正式' },
          ]}
        />
        <Button size="sm" block onClick={() => void run()} loading={loading}>
          <SparklesIcon />
          生成（≤{maxLength}字）
        </Button>
        {loading && <Spinner label="正在生成…" />}
        {list.length > 0 && (
          <ul className="space-y-1.5">
            {list.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  className="hover:border-primary/50 hover:bg-accent w-full rounded-md border px-2.5 py-2 text-left text-sm transition"
                  onClick={() => {
                    onApply(c)
                    setOpen(false)
                  }}
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-muted-foreground text-[11px]">
          本地 Mock 生成，可在 api-client 中替换为真实大模型服务。
        </p>
      </PopoverContent>
    </Popover>
  )
}
