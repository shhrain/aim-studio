'use client'
import type { ExperienceTemplate, SendMode } from '@aim/api-client'
import { createHttpClient } from '@aim/api-client'
import { BottomSheet } from '@aim/ui/mobile'
import { Alert, Button, Textarea, SimpleSelect } from '@aim/ui'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getIdentity, canWrite } from '@/lib/auth'
export function SendFlow({
  open,
  onOpenChange,
  template,
  initialMobiles,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: ExperienceTemplate
  initialMobiles?: string[]
}) {
  const [text, setText] = useState('')
  const [mode, setMode] = useState<SendMode>('priority')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [key, setKey] = useState('')
  useEffect(() => {
    if (!open) return
    setText(initialMobiles?.join('\n') ?? '')
    setResult('')
    setError('')
    setKey(crypto.randomUUID())
    void createHttpClient()
      .get<{ send: boolean }>('/api/v1/capabilities')
      .then((c) => setEnabled(c.send && canWrite()))
      .catch(() => setEnabled(false))
  }, [open, initialMobiles])
  const send = async () => {
    const mobiles = [...new Set(text.split(/[\s,;，；]+/).filter(Boolean))]
    if (!mobiles.length || mobiles.length > 10 || mobiles.some((v) => !/^\+?\d{7,15}$/.test(v))) {
      setError('请输入 1–10 个有效号码')
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await api.sendExperience({
        whois: getIdentity(),
        tplId: template.tplId,
        sendMode: mode,
        items: mobiles.map((mobile) => ({ mobile })),
        imgCode: '',
        identity: key,
      })
      setResult(response.requestId)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="模板体验"
      description={template.tplName}
    >
      <div className="space-y-4 py-3">
        <Alert variant="info" title={enabled ? '模拟通道' : '通道未启用'}>
          {enabled
            ? '本次任务只模拟处理流程，不会向号码发送真实消息。'
            : canWrite()
              ? '请联系管理员配置发送通道。'
              : '当前角色只可查看模板，请联系管理员调整权限。'}
        </Alert>
        {result ? (
          <Alert variant="success" title="任务已受理">
            任务编号：{result}。可在发送记录中查看处理结果。
          </Alert>
        ) : (
          <>
            <Textarea
              aria-label="接收号码"
              placeholder="每行一个手机号，最多 10 个"
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setKey(crypto.randomUUID())
              }}
            />
            <SimpleSelect
              value={mode}
              onValueChange={(v) => {
                setMode(v as SendMode)
                setKey(crypto.randomUUID())
              }}
              options={[
                { value: 'priority', label: '融合优先' },
                { value: '1', label: 'AIM 阅信' },
                { value: '2', label: 'RCS 5G 消息' },
                { value: '3', label: 'RMS 彩信' },
              ]}
            />
            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}
            <Button
              block
              loading={busy}
              disabled={!enabled || template.paramcnt > 0}
              onClick={() => void send()}
            >
              创建模拟任务
            </Button>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
