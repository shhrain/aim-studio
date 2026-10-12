'use client'

import type { AbilityResult } from '@aim/api-client'
import { VENDORS } from '@aim/template-schema'
import { Badge, Button, Textarea, toast } from '@aim/ui'
import { NavBar } from '@aim/ui/mobile'
import { local, parseMobiles } from '@aim/utils'
import { CheckCircle2Icon, HistoryIcon, Trash2Icon, XCircleIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const HISTORY_KEY = 'abilityQueryHistory'

export default function AbilityQueryPage() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [results, setResults] = useState<AbilityResult[] | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => setHistory(local.get<string[]>(HISTORY_KEY, [])), [])

  const query = async (source = input) => {
    const { valid } = parseMobiles(source)
    if (!valid.length) return void toast.error('请输入正确的 11 位手机号')
    setLoading(true)
    try {
      const res = await api.abilityQuery(valid.join(','))
      setResults(res.mobiles)
      const next = [...new Set([...valid, ...history])].slice(0, 10)
      setHistory(next)
      local.set(HISTORY_KEY, next)
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
            placeholder="输入手机号，支持多个（逗号 / 换行分隔）"
            className="bg-muted/60 border-0 shadow-none"
          />
          <Button block size="lg" className="mt-3" loading={loading} onClick={() => void query()}>
            立即查询
          </Button>
        </div>
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
                onClick={() => (setHistory([]), local.remove(HISTORY_KEY))}
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
