// @vitest-environment jsdom
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { convertToProtocols } from '../src'
// 5G 阅信体验平台原始实现（只读拷贝，作为行为基准）
// @ts-expect-error 参考实现为 JS
import { convertToProtocols as referenceConvert } from './reference/index.js'
import { legacyFixtures } from './fixtures'

beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-12T10:00:00+08:00'))
  // jsdom 未实现 innerText，参考实现依赖它
  if (!('innerText' in HTMLElement.prototype) || Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerText') === undefined) {
    Object.defineProperty(HTMLElement.prototype, 'innerText', {
      configurable: true,
      get(this: HTMLElement) {
        return this.textContent
      },
    })
  }
})

afterAll(() => {
  vi.useRealTimers()
})

describe('三信融合转换：与原实现逐字段一致', () => {
  for (const fixture of legacyFixtures) {
    it(fixture.name, () => {
      const input = { cardId: fixture.cardId, content: fixture.content, params: fixture.params }
      const expected = referenceConvert(JSON.parse(JSON.stringify(input)))
      const actual = convertToProtocols(JSON.parse(JSON.stringify(input)))
      expect(actual).toEqual(expected)
    })
  }
})

describe('转换关键规则', () => {
  const byName = (name: string) => legacyFixtures.find((f) => f.name.startsWith(name))!
  const run = (name: string) => {
    const f = byName(name)
    return convertToProtocols({ cardId: f.cardId, content: f.content, params: f.params })
  }

  it('fixed 模式修正多层转义的参数链接', () => {
    const f = byName('红包 type1')
    const legacy = convertToProtocols({ cardId: f.cardId, content: f.content, params: f.params })
    const fixed = convertToProtocols({ cardId: f.cardId, content: f.content, params: f.params, mode: 'fixed' })
    expect(JSON.stringify(legacy.rcsTplContent)).toContain('{#link#}')
    expect(JSON.stringify(fixed.rcsTplContent)).not.toContain('{#link#}')
    // 红包 type1 的按钮保留在 actionSheet
    expect(JSON.parse(fixed.rcsTplContent.actionSheet?.[0]?.actionDetail ?? '{}').url).toBe('${link}')
  })

  it('参数节点导出为 ${x}', () => {
    const r = run('图文')
    expect(JSON.stringify(r.rcsTplContent)).toContain('${name}')
    expect(r.rcsTplContent.tplType).toBe('card')
    expect(r.rcsTplContent.content[0]!.buttons).toHaveLength(2)
  })

  it('打开APP 在 RCS 降级为浏览器，RMS 转为中转链接', () => {
    const r = run('视频')
    const suggestion = r.rcsTplContent.content[0]!.buttons![0]!
    expect(JSON.parse(suggestion.actionDetail).application).toBe('browser')
    expect(JSON.stringify(r.rmsTplContent)).toContain('https://twise.cn/toApp.html?toApp=demo://home')
  })

  it('轮播为 multiCard，快应用转 hapjs.org，拒收文案被剔除', () => {
    const r = run('图片轮播')
    expect(r.sourceMaterial.tplType).toBe('multiCard')
    expect(r.sourceMaterial.content).toHaveLength(3)
    expect(JSON.stringify(r.rmsTplContent)).toContain('https://hapjs.org/app/com.demo/index')
    expect(JSON.stringify(r.rmsTplContent)).not.toContain('拒收请回复R')
  })

  it('红包类型判定', () => {
    expect(run('红包 type1').redpacketType).toBe(1)
    expect(run('红包 type1').rcsTplContent.tplType).toBe('media')
    expect(run('个性化红包').redpacketType).toBe(3)
    expect(run('个性化红包').needCapture).toBe(true)
  })

  it('通知：RCS 不支持的复制事件需补填，键值对拼入描述', () => {
    const r = run('通知')
    expect(r.actionShow).toBe(true)
    expect(r.editRcsBtns).toHaveLength(1)
    expect(r.sourceMaterial.content[0]!.description).toContain('订单号：')
  })
})
