'use client'
import { useEditorCopy } from '@/features/editor/lib/copy'

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
  const ec = useEditorCopy()

  const params = useEditor((s) => s.doc?.params ?? [])
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="xs" variant="ghost" className="text-muted-foreground">
          <BracesIcon />
          {ec('eba7ee1cb3b')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel>{ec('edf768c6b1a')}</DropdownMenuLabel>
        {params.length === 0 && (
          <div className="text-muted-foreground px-2 pb-1.5 text-xs">{ec('e847e2724d3')}</div>
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
            const name = window.prompt(ec('e9f198d00ac'), `param${params.length + 1}`)?.trim()
            if (!name) return
            if (!PARAM_NAME_REG.test(name)) return void toast.error(ec('e407d6244e2'))
            onInsert(paramToken(name))
          }}
        >
          <PlusIcon />
          {ec('e66f1c0b6b3')}
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
  const ec = useEditorCopy()

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
        prompt: prompt || doc?.name || ec('e8daeb972b4'),
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
      <Hint content={ec('ee7b081597b')}>
        <PopoverTrigger asChild>
          <Button size="xs" variant="ghost" className="text-primary">
            <SparklesIcon />
            AI
          </Button>
        </PopoverTrigger>
      </Hint>
      <PopoverContent align="start" className="w-80 space-y-3">
        <div className="text-sm font-medium">{ec('eaf1020369b')}</div>
        <Input
          placeholder={ec('e8335e08804')}
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
            { value: 'promotion', label: ec('ee008fed0fa') },
            { value: 'friendly', label: ec('e0bb529a703') },
            { value: 'formal', label: ec('ef4df56debb') },
          ]}
        />
        <Button size="sm" block onClick={() => void run()} loading={loading}>
          <SparklesIcon />
          {ec('e2fd59ce606')}
          {maxLength}
          {ec('e09f97c823b')}
        </Button>
        {loading && <Spinner label={ec('ea8b8730c96')} />}
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
        <p className="text-muted-foreground text-[11px]">{ec('e7a912b2efa')}</p>
      </PopoverContent>
    </Popover>
  )
}
