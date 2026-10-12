/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  AnyElement,
  ElementPropsMap,
  ElementStyle,
  ElementType,
  LayoutDefinition,
  TemplateDocument,
  TemplateElement,
  TemplatePage,
} from '@aim/template-schema'
import type { PrecheckIssue } from './precheck/types'

/* ------------------------------------------------------------------ */
/* 元素插件                                                             */
/* ------------------------------------------------------------------ */

export interface ElementPlugin<T extends ElementType = ElementType> {
  type: T
  label: string
  /** 默认尺寸（画布坐标） */
  size: { w: number; h: number }
  defaults: () => ElementPropsMap[T]
  style?: () => ElementStyle
  /** 元素级校验（预检时调用） */
  validate?: (el: TemplateElement<T>, doc: TemplateDocument) => PrecheckIssue[]
  /** 返回元素内所有可见文本（参数收集、敏感词检测） */
  texts?: (el: TemplateElement<T>) => string[]
}

/* ------------------------------------------------------------------ */
/* 版式蓝图插件                                                          */
/* ------------------------------------------------------------------ */

export interface LayoutBlueprintContext {
  layout: LayoutDefinition
  settings: Record<string, unknown>
}

export type LayoutBlueprint = (ctx: LayoutBlueprintContext) => Omit<TemplatePage, 'id'>

/* ------------------------------------------------------------------ */
/* 转换器插件                                                            */
/* ------------------------------------------------------------------ */

export interface ConverterPlugin<I = unknown, O = unknown> {
  from: string
  to: string
  description?: string
  convert: (input: I) => O
}

/* ------------------------------------------------------------------ */
/* 预检规则插件                                                          */
/* ------------------------------------------------------------------ */

export interface PrecheckRule {
  code: string
  description: string
  run: (doc: TemplateDocument) => PrecheckIssue[]
}

/* ------------------------------------------------------------------ */
/* 插件集合                                                             */
/* ------------------------------------------------------------------ */

export interface TemplatePlugin {
  name: string
  elements?: ElementPlugin<any>[]
  blueprints?: Record<string, LayoutBlueprint>
  converters?: ConverterPlugin<any, any>[]
  rules?: PrecheckRule[]
}

const elements = new Map<ElementType, ElementPlugin<any>>()
const blueprints = new Map<string, LayoutBlueprint>()
const converters = new Map<string, ConverterPlugin<any, any>>()
const rules = new Map<string, PrecheckRule>()
const plugins: string[] = []

export function defineElement<T extends ElementType>(plugin: ElementPlugin<T>): ElementPlugin<T> {
  return plugin
}

export function defineBlueprint(blueprint: LayoutBlueprint): LayoutBlueprint {
  return blueprint
}

export function defineConverter<I, O>(plugin: ConverterPlugin<I, O>): ConverterPlugin<I, O> {
  return plugin
}

export function defineRule(rule: PrecheckRule): PrecheckRule {
  return rule
}

export function definePlugin(plugin: TemplatePlugin): TemplatePlugin {
  return plugin
}

/** 注册插件（同名覆盖，便于业务方替换内置能力） */
export function registerPlugin(plugin: TemplatePlugin) {
  for (const el of plugin.elements ?? []) elements.set(el.type, el)
  for (const [id, bp] of Object.entries(plugin.blueprints ?? {})) blueprints.set(id, bp)
  for (const c of plugin.converters ?? []) converters.set(`${c.from}->${c.to}`, c)
  for (const r of plugin.rules ?? []) rules.set(r.code, r)
  if (!plugins.includes(plugin.name)) plugins.push(plugin.name)
}

export const registry = {
  element<T extends ElementType>(type: T): ElementPlugin<T> {
    const p = elements.get(type)
    if (!p) throw new Error(`未注册的元素类型：${type}`)
    return p as ElementPlugin<T>
  },
  hasElement: (type: ElementType) => elements.has(type),
  elements: () => [...elements.values()],
  blueprint: (layoutId: string) => blueprints.get(layoutId),
  converter<I, O>(from: string, to: string): ConverterPlugin<I, O> {
    const c = converters.get(`${from}->${to}`)
    if (!c) throw new Error(`未注册的转换器：${from}->${to}`)
    return c as ConverterPlugin<I, O>
  },
  converters: () => [...converters.values()],
  rules: () => [...rules.values()],
  plugins: () => [...plugins],
}

/** 收集元素的全部文本 */
export function elementTexts(el: AnyElement): string[] {
  const p = elements.get(el.type)
  return p?.texts ? p.texts(el as never) : []
}
