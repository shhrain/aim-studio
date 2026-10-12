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
    <header className="bg-card/90 sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-8 px-6">
        <Brand />
        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'text-muted-foreground hover:bg-accent hover:text-accent-foreground flex h-8 items-center gap-1.5 rounded-md px-3 text-sm transition',
                pathname.startsWith(href) && 'bg-accent text-accent-foreground font-medium',
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
          <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs">
            {env.mock ? '本地 Mock 数据' : '已连接服务'}
          </span>
        </div>
      </div>
    </header>
  )
}
