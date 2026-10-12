'use client'

import { TabBar, TabBarSpacer } from '@aim/ui/mobile'
import { BarChart3Icon, ContactIcon, HistoryIcon, LayoutGridIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

const ITEMS = [
  { key: '/template-list', label: '模板', icon: <LayoutGridIcon /> },
  { key: '/send-records', label: '发送记录', icon: <HistoryIcon /> },
  { key: '/send-objects', label: '通讯录', icon: <ContactIcon /> },
  { key: '/send-records/statistics', label: '统计', icon: <BarChart3Icon /> },
]

export function AppTabBar() {
  const pathname = usePathname()
  const router = useRouter()
  const active = [...ITEMS].sort((a, b) => b.key.length - a.key.length).find((i) => pathname.startsWith(i.key))?.key ?? ''
  return (
    <>
      <TabBarSpacer />
      <TabBar items={ITEMS} activeKey={active} onChange={(k) => router.push(k)} />
    </>
  )
}
