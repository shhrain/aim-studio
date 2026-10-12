import { LAYOUTS, ACTION_TYPES } from '@aim/template-schema'
import { describe, expect, it } from 'vitest'
import { buildPrompt, buildSpecDocs } from './index'

describe('ai-kit', () => {
  it('提示词覆盖全部版式与事件', () => {
    const prompt = buildPrompt('{}')
    for (const l of LAYOUTS) expect(prompt).toContain(l.id)
    for (const a of ACTION_TYPES) expect(prompt).toContain(a)
  })

  it('规范文档生成 6 个文件且 MDX 中无裸花括号', () => {
    const docs = buildSpecDocs()
    expect(Object.keys(docs)).toHaveLength(6)
    for (const [name, content] of Object.entries(docs)) {
      if (!name.endsWith('.mdx')) continue
      // 去掉行内代码与 MDX 注释后不应再有花括号
      const stripped = content.replace(/`[^`]*`/g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      expect(stripped, name).not.toMatch(/[{}]/)
    }
  })
})
