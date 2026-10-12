'use client'

import { Alert, Button, Input, toast } from '@aim/ui'
import { isMobile } from '@aim/utils'
import { LockKeyholeIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { api, env } from '@/lib/api'
import { setAuth } from '@/lib/auth'

/** 无登录态 / 登录失效：正式环境引导回原系统登录；Mock 环境提供体验登录 */
export function AuthView() {
  const sp = useSearchParams()
  const redirect = sp.get('redirect') || '/template-list'
  const expired = sp.get('reason') === 'expired'
  const [phone, setPhone] = useState('13800138000')
  const [loading, setLoading] = useState(false)
  const login = async () => {
    if (!isMobile(phone)) return void toast.error('请输入正确的手机号')
    setLoading(true)
    try {
      const res = await api.mockLogin(phone)
      setAuth(res.token, res.phone)
      location.replace(redirect.startsWith('/') ? redirect : '/template-list')
    } finally {
      setLoading(false)
    }
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col items-center px-6 pt-[18vh] text-center">
      <span className="bg-accent text-accent-foreground flex size-16 items-center justify-center rounded-2xl">
        <LockKeyholeIcon className="size-7" />
      </span>
      <h1 className="mt-5 text-xl font-semibold">{expired ? '登录已失效' : '请先登录'}</h1>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        5G 阅信体验需在登录状态下使用。请从体验平台入口重新进入，链接会自动携带登录信息。
      </p>
      {env.mock ? (
        <div className="mt-8 w-full space-y-3 text-left">
          <Alert variant="info" title="本地 Mock 环境">
            输入任意手机号即可体验登录，数据保存在浏览器本地。
          </Alert>
          <Input
            value={phone}
            inputMode="numeric"
            maxLength={11}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            className="h-11 text-base"
            aria-label="手机号"
          />
          <Button block size="xl" loading={loading} onClick={() => void login()}>
            体验登录
          </Button>
        </div>
      ) : (
        <Button
          className="mt-8"
          size="lg"
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 跳转原体验系统登录页（非本应用路由）
          onClick={() => location.assign(`${location.origin}/aim/experience/#/login`)}
        >
          重新进入
        </Button>
      )}
    </main>
  )
}
