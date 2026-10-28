'use client'

import { Button } from '@aim/ui'
import { NavBar } from '@aim/ui/mobile'
import { QRCodeSVG } from 'qrcode.react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const STEPS = [
  '使用手机扫描二维码打开模板列表',
  '使用已验证的邮箱账号登录工作空间',
  '浏览已发布模板，预览不同终端的效果',
]

export default function ScanExperiencePage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  useEffect(() => setUrl(`${location.origin}/m/template-list`), [])
  return (
    <main className="mx-auto min-h-dvh max-w-screen-sm">
      <NavBar title="扫码体验" onBack={() => router.push('/')} />
      <section className="hero-gradient shadow-float mx-3 mt-3 flex flex-col items-center rounded-3xl px-6 pt-8 pb-6 text-white">
        <h2 className="text-lg font-semibold">在手机上预览阅信模板</h2>
        <p className="mt-1 text-xs opacity-80">
          扫描二维码进入工作空间。模拟任务不会发送真实短信。
        </p>
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
          浏览已发布模板
        </Button>
      </div>
    </main>
  )
}
