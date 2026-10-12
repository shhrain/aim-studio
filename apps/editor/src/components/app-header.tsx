'use client'

import { Button, cn } from '@aim/ui'
import { BookOpenIcon, LayoutGridIcon, SmartphoneIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { env } from '@/lib/api'
import { Brand } from './brand'

const NAV = [
  { href: '/templates', label: '模板管理', icon: LayoutGridIcon },
  { href: '/gallery', label: '版式画廊', icon: SmartphoneIcon },
]

export function AppHeader() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-8 px-6">
        <Brand />
        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex h-8 items-center gap-1.5 rounded-md px-3 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground',
                pathname.startsWith(href) && 'bg-accent font-medium text-accent-foreground',
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <a href={env.docsUrl} target="_blank" rel="noreferrer">
              <BookOpenIcon />
              帮助文档
            </a>
          </Button>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{env.mock ? '本地 Mock 数据' : '已连接服务'}</span>
        </div>
      </div>
    </header>
  )
}
