import {
  createDocument,
  findBySlot,
  syncParams,
  updateElement,
  convertDocument,
  applyCapturedImage,
} from '@aim/template-core'
import { LAYOUTS, VENDOR_IDS } from '@aim/template-schema'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  MultiVendorPreview,
  TemplatePreview,
  TemplateThumbnail,
  buildFlowRows,
  renderTextHtml,
  sanitizeRich,
} from './index'

describe('sanitizeRich', () => {
  it('移除脚本、事件属性与危险标签，保留格式', () => {
    const out = sanitizeRich(
      '<b onclick="x()">粗</b><img src=x onerror=alert(1)><scr<script>ipt>alert(1)</script><span style="color:red;background:url(x)">红</span>',
    )
    expect(out).not.toMatch(/onerror|onclick|<script|<img|url\(/i)
    expect(out).toContain('<b>粗</b>')
    expect(out).toContain('<span style="color:red">红</span>')
  })

  it('参数：token 高亮 / 示例 / 传入值', () => {
    const r = { display: 'token' as const, values: {}, examples: { name: '张三' } }
    expect(renderTextHtml('你好{#name#}', r)).toContain('class="aim-param"')
    expect(renderTextHtml('你好{#name#}', { ...r, display: 'example' })).toBe('你好张三')
    expect(
      renderTextHtml('你好{#name#}', { ...r, display: 'value', values: { name: '李四' } }),
    ).toBe('你好李四')
    expect(
      renderTextHtml('<input type="button" value="{#name#}">', { ...r, display: 'example' }),
    ).toBe('张三')
  })
})

describe('TemplatePreview', () => {
  it('已审核的红包预览使用转换快照中的审核图片', () => {
    const doc = createDocument({ layoutId: 'com.hbm.redpacket' })
    const conversion = applyCapturedImage(convertDocument(doc)!, {
      rcsSrc: '/api/v1/files/captured',
      rmsSrc: '/api/v1/files/captured',
    })
    const { container, rerender } = render(
      <TemplatePreview document={doc} protocol="rcs" conversion={conversion} />,
    )
    expect(container.querySelector('.aim-rcs-media')).toHaveAttribute(
      'src',
      '/api/v1/files/captured',
    )
    rerender(<TemplatePreview document={doc} protocol="rms" conversion={conversion} />)
    expect(container.querySelector('.aim-rms-frame img')).toHaveAttribute(
      'src',
      '/api/v1/files/captured',
    )
  })
  it.each(LAYOUTS.map((l) => [l.name, l.id]))('%s 在全部厂商与模式下可渲染', (_n, id) => {
    const doc = createDocument({ layoutId: id, name: 'T' })
    for (const vendor of VENDOR_IDS) {
      const { unmount, container } = render(
        <TemplatePreview document={doc} vendor={vendor} mode="phone" />,
      )
      expect(container.querySelector('.aim-phone')).toBeTruthy()
      unmount()
    }
    for (const mode of ['bare', 'fluid', 'thumbnail'] as const) {
      const { unmount } = render(<TemplatePreview document={doc} mode={mode} />)
      unmount()
    }
  })

  it('缩略图不拦截点击，事件冒泡给外层卡片', () => {
    let doc = createDocument({ layoutId: 'com.hbm.imageandtext' })
    const btn = findBySlot(doc, 'button.0')!
    doc = updateElement(doc, btn.id, { props: { text: '立即查看' } })
    const onPick = vi.fn()
    const { container } = render(
      <div onClick={onPick}>
        <TemplateThumbnail document={doc} />
      </div>,
    )
    expect(container.querySelector('.aim-root.aim-thumbnail')).toBeTruthy()
    fireEvent.click(screen.getByText('立即查看'))
    expect(onPick).toHaveBeenCalledTimes(1)
  })

  it('编辑态卡片带 aim-editing 类名', () => {
    const doc = createDocument({ layoutId: 'com.hbm.imageandtext' })
    const { container } = render(
      <TemplatePreview document={doc} mode="bare" editor={{ onSelect: () => {} }} />,
    )
    expect(container.querySelector('.aim-card.aim-editing')).toBeTruthy()
  })

  it('不支持的厂商显示提示', () => {
    const doc = createDocument({ layoutId: 'com.hbm.shortVideo.v2' })
    render(<TemplatePreview document={doc} vendor="vivo" />)
    expect(screen.getByText('vivo暂不支持此模板')).toBeInTheDocument()
  })

  it('按钮点击回调事件（intercept 模式）', () => {
    let doc = createDocument({ layoutId: 'com.hbm.imageandtext' })
    const btn = findBySlot(doc, 'button.0')!
    doc = updateElement(doc, btn.id, {
      props: { text: '立即查看' },
      event: { action: 'OPEN_URL', target: 'https://a.example.com' },
    })
    const onAction = vi.fn()
    render(<TemplatePreview document={doc} mode="bare" onAction={onAction} />)
    fireEvent.click(screen.getByRole('button', { name: '立即查看' }))
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({
        label: '立即查看',
        event: expect.objectContaining({ target: 'https://a.example.com' }),
      }),
    )
  })

  it('编辑态点击选中元素而非触发事件', () => {
    const doc = createDocument({ layoutId: 'com.hbm.imageandtext' })
    const onSelect = vi.fn()
    const onAction = vi.fn()
    const { container } = render(
      <TemplatePreview document={doc} mode="bare" onAction={onAction} editor={{ onSelect }} />,
    )
    fireEvent.click(container.querySelector('[data-slot="button.0"]')!)
    expect(onSelect).toHaveBeenCalled()
    expect(onAction).not.toHaveBeenCalled()
  })

  it('参数按示例值显示', () => {
    let doc = createDocument({ layoutId: 'com.hbm.imageandtext' })
    doc = syncParams(
      updateElement(doc, findBySlot(doc, 'title')!.id, { props: { text: '您好{#姓名#}' } }),
    )
    doc = { ...doc, params: doc.params.map((p) => ({ ...p, example: '王五' })) }
    render(<TemplatePreview document={doc} mode="bare" paramDisplay="example" />)
    expect(screen.getByText('您好王五')).toBeInTheDocument()
  })

  it('RCS / RMS 协议预览', () => {
    const doc = createDocument({ layoutId: 'com.hbm.imageandtext' })
    const rcs = render(<TemplatePreview document={doc} protocol="rcs" mode="bare" />)
    expect(rcs.container.querySelector('.aim-rcs-card')).toBeTruthy()
    rcs.unmount()
    const rms = render(<TemplatePreview document={doc} protocol="rms" mode="bare" />)
    expect(rms.container.querySelector('.aim-rms')).toBeTruthy()
    rms.unmount()
    render(
      <TemplatePreview
        document={createDocument({ layoutId: 'com.hbm.sideslip' })}
        protocol="rcs"
        mode="bare"
      />,
    )
    expect(screen.getByText(/暂不支持5G 消息/)).toBeInTheDocument()
  })

  it('多厂商预览', () => {
    const doc = createDocument({
      layoutId: 'com.hbm.imageandtext',
      vendors: ['huawei', 'xiaomi', 'vivo'],
    })
    render(<MultiVendorPreview document={doc} />)
    expect(screen.getByText('华为手机')).toBeInTheDocument()
    expect(screen.getByText('小米手机')).toBeInTheDocument()
  })

  it('flow 分行：同 y 并排、水平重叠为叠加层', () => {
    const doc = createDocument({ layoutId: 'com.hbm.standardimageandtext' })
    const rows = buildFlowRows(doc.pages[0]!.elements)
    expect(rows[0]!.overlays.map((e) => e.slot)).toContain('title')
    expect(rows.some((r) => r.items.length === 2)).toBe(true)
  })
})
