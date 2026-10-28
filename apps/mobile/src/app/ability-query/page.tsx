'use client'

import type { AbilityResult } from '@aim/api-client'
import { VENDORS } from '@aim/template-schema'
import { Badge, Button, Textarea, toast } from '@aim/ui'
import { NavBar } from '@aim/ui/mobile'
import { parseMobiles } from '@aim/utils'
import {
  CheckCircle2Icon,
  HistoryIcon,
  MessageSquareTextIcon,
  SmartphoneIcon,
  Trash2Icon,
  XCircleIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getPhone, getIdentity, canWrite } from '@/lib/auth'

const ABILITY_LEVELS = [
  {
    icon: SmartphoneIcon,
    tone: 'bg-success/10 text-success',
    title: '支持阅信',
    desc: '华为、荣耀、小米、vivo、OPPO 等安卓机型的系统短信可直接展示富媒体卡片。',
  },
  {
    icon: MessageSquareTextIcon,
    tone: 'bg-info/10 text-info',
    title: '支持 5G 消息',
    desc: '苹果及开通 5G 消息的终端，三信融合模板会自动降级为 5G 消息卡片。',
  },
  {
    icon: XCircleIcon,
    tone: 'bg-muted text-muted-foreground',
    title: '暂不支持',
    desc: '可查看「开启指引」检查短信设置；三信融合模板仍会以视频短信送达。',
  },
]

export default function AbilityQueryPage() {
  const router = useRouter()
  const HISTORY_KEY = 'aim:ability-history:' + getIdentity()
  const writable = canWrite()
  const [myPhone, setMyPhone] = useState<string>()
  useEffect(() => setMyPhone(getPhone() || undefined), [])
  const [input, setInput] = useState('')
  const [results, setResults] = useState<AbilityResult[] | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    try {
      setHistory(JSON.parse(sessionStorage.getItem(HISTORY_KEY) ?? '[]'))
    } catch {
      sessionStorage.removeItem(HISTORY_KEY)
    }
  }, [HISTORY_KEY])

  const query = async (source = input) => {
    const { valid } = parseMobiles(source)
    if (!valid.length) return void toast.error('请输入正确的 11 位手机号')
    setLoading(true)
    try {
      const res = await api.abilityQuery(valid.join(','))
      setResults(res.mobiles)
      const next = [...new Set([...valid, ...history])].slice(0, 10)
      setHistory(next)
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(next))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '查询失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-screen-sm">
      <NavBar title="阅信能力查询" onBack={() => router.push('/')} />
      <section className="space-y-3 p-4">
        <div className="bg-card shadow-panel rounded-2xl p-4">
          <Textarea
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入要查询的手机号"
            className="bg-muted/60 border-0 shadow-none"
          />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {parseMobiles(input).valid.length
                ? `已识别 ${parseMobiles(input).valid.length} 个号码`
                : '支持逗号、空格或换行分隔'}
            </span>
            {myPhone && !input.includes(myPhone) && (
              <button
                type="button"
                className="text-primary"
                onClick={() => setInput(input ? `${input.trim()}\n${myPhone}` : myPhone)}
              >
                填入本机号码
              </button>
            )}
          </div>
          {!writable && (
            <p className="text-muted-foreground text-xs">
              当前角色只可查看，请联系管理员开通能力查询权限。
            </p>
          )}
          <Button
            block
            size="lg"
            className="mt-3"
            disabled={!writable}
            loading={loading}
            onClick={() => void query()}
          >
            立即查询
          </Button>
        </div>
        {!results && (
          <div className="bg-card shadow-panel rounded-2xl p-4">
            <h3 className="mb-3 text-sm font-medium">查询结果说明</h3>
            <ul className="space-y-3 text-xs">
              {ABILITY_LEVELS.map((l) => (
                <li key={l.title} className="flex gap-3">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${l.tone}`}
                  >
                    <l.icon className="size-4" />
                  </span>
                  <div>
                    <div className="text-foreground text-sm">{l.title}</div>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed">{l.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {history.length > 0 && (
          <div>
            <div className="text-muted-foreground mb-2 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <HistoryIcon className="size-3.5" />
                查询历史
              </span>
              <button
                type="button"
                className="flex items-center gap-1"
                onClick={() => (setHistory([]), sessionStorage.removeItem(HISTORY_KEY))}
              >
                <Trash2Icon className="size-3.5" />
                清空
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => (setInput(m), void query(m))}
                  className="bg-card h-7 rounded-full px-3 text-xs tabular-nums"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
        {results && (
          <ul className="space-y-2">
            {results.map((r) => (
              <li
                key={r.mobile}
                className="bg-card shadow-panel flex items-center gap-3 rounded-xl p-3.5"
              >
                {r.receiveState ? (
                  <CheckCircle2Icon className="text-success size-6" />
                ) : (
                  <XCircleIcon className="text-destructive size-6" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium tabular-nums">{r.mobile}</div>
                  <div className="mt-0.5 flex flex-wrap gap-1 text-xs">
                    <Badge variant={r.receiveState ? 'success' : 'destructive'}>
                      {r.receiveState ? '支持阅信' : '暂不支持阅信'}
                    </Badge>
                    <Badge variant={r.rcs ? 'info' : 'secondary'}>
                      {r.rcs ? '支持5G消息' : '不支持5G消息'}
                    </Badge>
                    {r.factory && <Badge variant="outline">{VENDORS[r.factory].name}</Badge>}
                    {r.carrier && <Badge variant="outline">{r.carrier}</Badge>}
                  </div>
                </div>
                {!r.receiveState && (
                  <Link
                    href={`/ability-guide${r.factory ? `?factory=${r.factory}` : ''}`}
                    className="text-primary shrink-0 text-xs"
                  >
                    开启指引
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
