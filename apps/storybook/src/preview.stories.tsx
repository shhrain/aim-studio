import { createDocument } from '@aim/template-core'
import { buildSampleTemplates } from '@aim/mock/fixtures'
import { IntegratedPreview, MultiVendorPreview, TemplatePreview, type TemplatePreviewProps } from '@aim/template-preview'
import { LAYOUTS, VENDOR_IDS, type Protocol, type VendorId } from '@aim/template-schema'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useMemo } from 'react'

const samples = buildSampleTemplates(Date.UTC(2026, 9, 12))
const layoutOptions = LAYOUTS.map((l) => l.id)

type Args = TemplatePreviewProps & { layout: string; sample: boolean }

const meta: Meta<Args> = {
  title: 'Preview/TemplatePreview',
  args: { layout: 'com.hbm.imageandtext', sample: true, vendor: 'huawei', mode: 'phone', protocol: 'aim', paramDisplay: 'example', interactive: 'intercept', theme: 'light', width: 300, showTime: false },
  argTypes: {
    layout: { control: 'select', options: layoutOptions },
    vendor: { control: 'select', options: [...VENDOR_IDS] },
    mode: { control: 'inline-radio', options: ['phone', 'bare', 'fluid', 'thumbnail'] },
    protocol: { control: 'inline-radio', options: ['aim', 'rcs', 'rms'] },
    paramDisplay: { control: 'inline-radio', options: ['value', 'example', 'token'] },
    interactive: { control: 'inline-radio', options: ['intercept', 'native', 'none'] },
    theme: { control: 'inline-radio', options: ['light', 'dark'] },
    onAction: { action: 'onAction' },
  },
  render: function Render({ layout, sample, ...props }) {
    const doc = useMemo(() => (sample && samples.find((s) => s.document.layoutId === layout)?.document) || createDocument({ layoutId: layout, name: '示例', now: 0 }), [layout, sample])
    return <TemplatePreview {...props} document={doc} ignoreVendorSupport />
  },
}
export default meta
type Story = StoryObj<Args>

export const Playground: Story = {}
export const Fluid: Story = { args: { mode: 'fluid', width: 375 } }
export const Rcs: Story = { name: '苹果 RCS', args: { protocol: 'rcs', layout: 'com.hbm.notification' } }
export const Rms: Story = { name: '其他终端 RMS', args: { protocol: 'rms', layout: 'com.hbm.carouselImageSixteenToNine' } }
export const Dark: Story = { name: '暗色', args: { theme: 'dark' } }
export const Editing: Story = { name: '编辑态（参数高亮）', args: { paramDisplay: 'token', layout: 'com.hbm.notificationPlus' } }

/** 全矩阵：版式 × 厂商（协议可切换） */
export const Matrix: StoryObj<{ protocol: Protocol; vendors: VendorId[]; sample: boolean }> = {
  name: '矩阵：版式 × 厂商 × 协议',
  parameters: { layout: 'padded' },
  args: { protocol: 'aim', vendors: ['huawei', 'xiaomi', 'vivo', 'oppo'], sample: false },
  argTypes: { protocol: { control: 'inline-radio', options: ['aim', 'rcs', 'rms'] }, vendors: { control: 'check', options: [...VENDOR_IDS] } },
  render: ({ protocol, vendors, sample }) => (
    <table className="border-separate border-spacing-4">
      <thead>
        <tr>
          <th />
          {vendors.map((v) => (
            <th key={v} className="text-sm font-medium">
              {v}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {LAYOUTS.map((l) => {
          const doc = (sample && samples.find((s) => s.document.layoutId === l.id)?.document) || createDocument({ layoutId: l.id, name: l.name, now: 0 })
          return (
            <tr key={l.id}>
              <th className="w-24 text-left align-top text-sm font-medium">{l.name}</th>
              {vendors.map((v) => (
                <td key={v} className="align-top">
                  <TemplatePreview document={doc} vendor={v} protocol={protocol} mode="bare" width={220} paramDisplay="example" showTime={false} />
                </td>
              ))}
            </tr>
          )
        })}
      </tbody>
    </table>
  ),
}

export const MultiVendor: StoryObj = {
  name: '多厂商并排',
  parameters: { layout: 'padded' },
  render: () => <MultiVendorPreview document={samples[0]!.document} phoneWidth={220} paramDisplay="example" qrcode={(v) => `https://m.example.com/preview/share?vendor=${v}`} />,
}

export const Integrated: StoryObj = {
  name: '三信融合',
  render: () => <IntegratedPreview document={samples.find((s) => s.document.layoutId === 'com.hbm.notification')!.document} width={300} paramDisplay="example" />,
}
