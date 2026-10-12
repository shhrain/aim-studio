'use client'

import { Button } from '@aim/ui'
import { NavBar } from '@aim/ui/mobile'
import { QRCodeSVG } from 'qrcode.react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const STEPS = [
  '使用微信「扫一扫」扫描二维码',
  '关注服务号并授权手机号',
  '约 10 秒后收到阅信体验消息',
]

export default function ScanExperiencePage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  useEffect(() => setUrl(`${location.origin}/template-list`), [])
  return (
    <main className="mx-auto min-h-dvh max-w-screen-sm">
      <NavBar title="扫码体验" onBack={() => router.push('/')} />
      <section className="hero-gradient shadow-float mx-3 mt-3 flex flex-col items-center rounded-3xl px-6 pt-8 pb-6 text-white">
        <h2 className="text-lg font-semibold">扫一扫，立即体验 5G 阅信</h2>
        <p className="mt-1 text-xs opacity-80">把二维码分享给同事，让 TA 也收到一条富媒体短信</p>
        <div className="mt-5 rounded-2xl bg-white p-3">
          {url && <QRCodeSVG value={url} size={180} marginSize={1} />}
        </div>
        <ol className="mt-6 w-full space-y-2.5">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2.5 text-sm">
              <span className="flex size-5 items-center justify-center rounded-full bg-white/20 text-xs">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </section>
      <div className="p-4">
        <Button block size="lg" variant="outline" onClick={() => router.push('/template-list')}>
          直接选择模板发送
        </Button>
      </div>
    </main>
  )
}
