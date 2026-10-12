import { Button } from '@aim/ui'
import { ActionSheet, BottomSheet, Cell, CellGroup, NavBar, PullRefresh, TabBar } from '@aim/ui/mobile'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { BarChart3Icon, ContactIcon, HistoryIcon, LayoutGridIcon, SettingsIcon } from 'lucide-react'
import { useState } from 'react'

const meta: Meta = {
  title: 'Mobile/组件',
  parameters: { layout: 'fullscreen', viewport: { defaultViewport: 'mobile1' } },
}
export default meta

export const Overview: StoryObj = {
  render: function Render() {
    const [tab, setTab] = useState('/template-list')
    const [sheet, setSheet] = useState(false)
    const [actions, setActions] = useState(false)
    return (
      <div className="relative mx-auto min-h-[720px] max-w-[390px] bg-muted">
        <NavBar title="模板详情" tone="primary" onBack={() => {}} />
        <PullRefresh onRefresh={() => new Promise((r) => setTimeout(r, 800))}>
          <CellGroup title="设置">
            <Cell icon={<SettingsIcon />} title="发送方式" value="融合优先" arrow onClick={() => setActions(true)} />
            <Cell title="接收号码" label="最多 10 个" value="2 个" arrow onClick={() => setSheet(true)} />
          </CellGroup>
        </PullRefresh>
        <TabBar
          className="absolute"
          activeKey={tab}
          onChange={setTab}
          items={[
            { key: '/template-list', label: '模板', icon: <LayoutGridIcon /> },
            { key: '/send-records', label: '发送记录', icon: <HistoryIcon />, badge: 3 },
            { key: '/send-objects', label: '通讯录', icon: <ContactIcon /> },
            { key: '/statistics', label: '统计', icon: <BarChart3Icon /> },
          ]}
        />
        <BottomSheet open={sheet} onOpenChange={setSheet} title="测试发送" description="国庆出游季" footer={<Button block size="lg">下一步</Button>}>
          <p className="text-sm text-muted-foreground">底部抽屉支持手势下拉关闭，并处理安全区。</p>
        </BottomSheet>
        <ActionSheet
          open={actions}
          onOpenChange={setActions}
          title="选择发送方式"
          onSelect={() => {}}
          actions={[
            { key: 'priority', label: '融合优先', description: '阅信 → 5G 消息 → 视频短信' },
            { key: '1', label: '仅阅信' },
            { key: '2', label: '仅 5G 消息' },
          ]}
        />
      </div>
    )
  },
}
