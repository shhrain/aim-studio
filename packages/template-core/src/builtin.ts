import type { IntegratedResult, TemplateDocument } from '@aim/template-schema'
import { convertDocument, fromLegacyPages, htmlParamsToTpl, toLegacyPages } from './convert'
import { builtinElements } from './elements/builtin'
import { builtinBlueprints } from './layouts/blueprints'
import { builtinRules } from './precheck/rules'
import { defineConverter, definePlugin } from './registry'

/** 内置插件：32 种元素、34 个版式蓝图、6 组预检规则、5 个转换器 */
export const builtinPlugin = definePlugin({
  name: '@aim/template-core/builtin',
  elements: builtinElements,
  blueprints: builtinBlueprints,
  rules: builtinRules,
  converters: [
    defineConverter<TemplateDocument, IntegratedResult | null>({
      from: 'aim',
      to: 'integrated',
      description: 'AIM 文档 → RCS + RMS（三信融合）',
      convert: convertDocument,
    }),
    defineConverter<TemplateDocument, IntegratedResult['rcsTplContent'] | null>({
      from: 'aim',
      to: 'rcs',
      description: 'AIM 文档 → RCS tplContent',
      convert: (doc) => convertDocument(doc)?.rcsTplContent ?? null,
    }),
    defineConverter<TemplateDocument, IntegratedResult['rmsTplContent'] | null>({
      from: 'aim',
      to: 'rms',
      description: 'AIM 文档 → RMS content',
      convert: (doc) => convertDocument(doc)?.rmsTplContent ?? null,
    }),
    defineConverter<TemplateDocument, ReturnType<typeof toLegacyPages>>({
      from: 'document',
      to: 'legacy',
      description: '新文档 → 旧编辑器 pages',
      convert: toLegacyPages,
    }),
    defineConverter<
      { pages: string | unknown[]; cardId?: string; name?: string },
      TemplateDocument
    >({
      from: 'legacy',
      to: 'document',
      description: '旧编辑器 pages → 新文档',
      convert: ({ pages, ...rest }) => fromLegacyPages(pages as never, rest),
    }),
    defineConverter<string, string>({
      from: 'paramsHtml',
      to: 'tpl',
      description: '参数节点 / {#x#} → ${x}',
      convert: htmlParamsToTpl,
    }),
  ],
})
