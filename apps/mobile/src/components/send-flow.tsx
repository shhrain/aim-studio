'use client'

import { MESSAGE_TYPE_LABEL, type ApiError, type ExperienceTemplate, type MessageType, type SendMode, type SendPreviewItem } from '@aim/api-client'
import { VENDORS } from '@aim/template-schema'
import { Alert, Badge, Button, Input, Segmented, Textarea, cn, toast } from '@aim/ui'
import { BottomSheet } from '@aim/ui/mobile'
import { maskMobile, parseMobiles, uid } from '@aim/utils'
import { ContactIcon, RefreshCwIcon, XIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { getPhone } from '@/lib/auth'
import { MAX_SEND, clearDraft, loadDraft, saveDraft } from '@/lib/send-draft'

type Step = 'input' | 'preview' | 'captcha' | 'done'

export function SendFlow({ open, onOpenChange, template, initialMobiles }: { open: boolean; onOpenChange: (o: boolean) => void; template: ExperienceTemplate; initialMobiles?: string[] }) {
  const router = useRouter()
  const whois = getPhone()
  const [step, setStep] = useState<Step>('input')
  const [text, setText] = useState('')
  const [mobiles, setMobiles] = useState<string[]>([])
  const [mode, setMode] = useState<SendMode>('priority')
  const [preview, setPreview] = useState<SendPreviewItem[]>([])
  const [overrides, setOverrides] = useState<Record<string, MessageType>>({})
  const [identity, setIdentity] = useState(() => uid('cap'))
  // 验证码地址按 identity 固定，避免每次渲染（输入时）刷新图片
  const captchaUrl = useMemo(() => api.imageCodeUrl(identity), [identity])
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const draft = loadDraft(template.tplId)
    setMobiles(initialMobiles ?? draft?.mobiles ?? (whois ? [whois] : []))
    setStep('input')
    setError('')
  }, [open, template.tplId, initialMobiles, whois])

  const addFromText = () => {
    const { valid, invalid } = parseMobiles(text)
    if (invalid.length) toast.error(`已忽略无效号码：${invalid.slice(0, 3).join('、')}`)
    const next = [...new Set([...mobiles, ...valid])]
    if (next.length > MAX_SEND) toast.error(`每次最多发送 ${MAX_SEND} 个号码`)
    setMobiles(next.slice(0, MAX_SEND))
    setText('')
  }

  const goPreview = async () => {
    if (text.trim()) addFromText()
    const list = text.trim() ? [...new Set([...mobiles, ...parseMobiles(text).valid])].slice(0, MAX_SEND) : mobiles
    if (!list.length) return toast.error('请输入接收号码')
    setLoading(true)
    try {
      const res = await api.sendPreview({ whois, tplId: template.tplId, phones: list })
      setPreview(res.items)
      setOverrides({})
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }

  const sendable = preview.filter((p) => p.sendable)
  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      await api.sendExperience({
        whois,
        tplId: template.tplId,
        sendMode: mode,
        identity,
        imgCode: code,
        items: sendable.map((p) => ({ mobile: p.mobile, ...(overrides[p.mobile] ? { canSendType: overrides[p.mobile] } : {}) })),
      })
      clearDraft()
      setStep('done')
    } catch (e) {
      setError((e as ApiError).message)
      setIdentity(uid('cap'))
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  const modes = useMemo(
    () =>
      template.integrated
        ? [
            { value: 'priority' as const, label: '融合优先' },
            { value: '1' as const, label: '阅信' },
            { value: '2' as const, label: '5G消息' },
            { value: '3' as const, label: '视频短信' },
          ]
        : [{ value: '1' as const, label: '阅信' }],
    [template.integrated],
  )
  useEffect(() => {
    if (!template.integrated) setMode('1')
  }, [template.integrated])

  const footer =
    step === 'input' ? (
      <Button block size="lg" loading={loading} onClick={() => void goPreview()}>
        下一步：确认号码
      </Button>
    ) : step === 'preview' ? (
      <div className="flex gap-3">
        <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep('input')}>
          上一步
        </Button>
        <Button size="lg" className="flex-[2]" disabled={!sendable.length} onClick={() => setStep('captcha')}>
          发送 {sendable.length} 个号码
        </Button>
      </div>
    ) : step === 'captcha' ? (
      <Button block size="lg" loading={loading} disabled={code.length < 4} onClick={() => void submit()}>
        确认发送
      </Button>
    ) : (
      <div className="flex gap-3">
        <Button variant="outline" size="lg" className="flex-1" onClick={() => onOpenChange(false)}>
          继续浏览
        </Button>
        <Button size="lg" className="flex-1" onClick={() => router.push('/send-records')}>
          查看发送记录
        </Button>
      </div>
    )

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={step === 'done' ? '提交成功' : '测试发送'} description={step === 'done' ? undefined : template.tplName} footer={footer}>
      {step === 'input' && (
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">
                接收号码 <span className="text-xs text-muted-foreground">（{mobiles.length}/{MAX_SEND}）</span>
              </span>
              <button
                type="button"
                className="flex items-center gap-1 text-sm text-primary"
                onClick={() => {
                  saveDraft({ tplId: template.tplId, mobiles })
                  router.push(`/send-objects?mode=select&tplId=${template.tplId}`)
                }}
              >
                <ContactIcon className="size-4" />
                从通讯录选择
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {mobiles.map((m) => (
                <span key={m} className="flex h-7 items-center gap-1 rounded-full bg-accent pr-1.5 pl-2.5 text-xs text-accent-foreground">
                  {m}
                  <button type="button" aria-label={`移除 ${m}`} onClick={() => setMobiles(mobiles.filter((x) => x !== m))}>
                    <XIcon className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} onBlur={() => text.trim() && addFromText()} placeholder="输入手机号，多个号码用逗号、空格或换行分隔" />
          <div>
            <div className="mb-2 text-sm font-medium">发送方式</div>
            <Segmented block value={mode} onValueChange={setMode} options={modes} />
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {mode === 'priority' ? '优先阅信，终端不支持时自动降级为 5G 消息 / 视频短信。' : `仅以${MESSAGE_TYPE_LABEL[Number(mode) as MessageType]}形式发送，不支持的号码将跳过。`}
            </p>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <ul className="space-y-2">
          {preview.map((p) => {
            const type = overrides[p.mobile] ?? (mode === 'priority' ? p.messageType : (Number(mode) as MessageType))
            const ok = p.sendable && (mode === 'priority' || p.availableTypes.includes(Number(mode) as MessageType))
            return (
              <li key={p.mobile} className={cn('rounded-xl border p-3', !ok && 'opacity-60')}>
                <div className="flex items-center gap-2">
                  <span className="font-medium tabular-nums">{p.mobile}</span>
                  {p.contactName && <span className="text-xs text-muted-foreground">{p.contactName}</span>}
                  {ok ? <Badge variant="success" className="ml-auto">可发送</Badge> : <Badge variant="destructive" className="ml-auto">不可发送</Badge>}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  {p.factory && <span>{VENDORS[p.factory].name}</span>}
                  {p.carrier && <span>· {p.carrier}</span>}
                  {!ok && <span className="text-destructive">· {p.reason ?? '终端不支持该发送方式'}</span>}
                </div>
                {ok && mode === 'priority' && p.availableTypes.length > 1 && (
                  <div className="mt-2 flex gap-1.5">
                    {p.availableTypes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setOverrides({ ...overrides, [p.mobile]: t })}
                        className={cn('h-7 rounded-full border px-2.5 text-xs', type === t ? 'border-primary bg-accent text-accent-foreground' : '')}
                      >
                        {MESSAGE_TYPE_LABEL[t]}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {step === 'captcha' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">为防止恶意发送，请输入图形验证码。</p>
          <div className="flex items-center gap-3">
            <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="4 位验证码" className="h-11 flex-1 text-base tracking-widest" autoFocus />
            <button type="button" onClick={() => setIdentity(uid('cap'))} className="relative h-11 w-28 overflow-hidden rounded-md border bg-muted" aria-label="刷新验证码">
              <img src={captchaUrl} alt="图形验证码" className="size-full object-cover" />
              <RefreshCwIcon className="absolute right-1 bottom-1 size-3 text-muted-foreground" />
            </button>
          </div>
          {error && <Alert variant="destructive">{error}</Alert>}
          <p className="text-xs text-muted-foreground">将向 {sendable.map((p) => maskMobile(p.mobile)).join('、')} 发送测试消息。</p>
        </div>
      )}

      {step === 'done' && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-success/12 text-2xl text-success">✓</span>
          <p className="font-medium">已提交发送</p>
          <p className="text-sm text-muted-foreground">消息通常在 10 秒内到达，可在发送记录中查看状态。</p>
        </div>
      )}
    </BottomSheet>
  )
}
