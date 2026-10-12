import { describe, expect, it } from 'vitest'
import {
  charLength,
  decodeJson,
  encodeJson,
  formatDuration,
  maskMobile,
  parseMobiles,
  sanitizeHtml,
  stripTags,
} from './index'

describe('@aim/utils', () => {
  it('sanitizeHtml 移除脚本与事件属性', () => {
    const out = sanitizeHtml('<b>你好</b><img src=x onerror=alert(1)><script>alert(1)</script>')
    expect(out).toBe('<b>你好</b>')
  })

  it('stripTags 保留换行', () => {
    expect(stripTags('第一行<br>第二行&amp;')).toBe('第一行\n第二行&')
  })

  it('charLength 中文与 emoji 按 1 计', () => {
    expect(charLength('阅信👍')).toBe(3)
  })

  it('formatDuration', () => {
    expect(formatDuration(65_000)).toBe('01:05')
  })

  it('parseMobiles 拆分去重', () => {
    expect(parseMobiles('13800138000，13800138000 123\n13912345678')).toEqual({
      valid: ['13800138000', '13912345678'],
      invalid: ['123'],
    })
    expect(maskMobile('13800138000')).toBe('138****8000')
  })

  it('encodeJson / decodeJson 往返', async () => {
    const value = { title: '模板', list: [1, 2, 3] }
    expect(await decodeJson(await encodeJson(value))).toEqual(value)
  })
})
