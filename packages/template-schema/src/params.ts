import { z } from 'zod'

/**
 * 模板参数（变量）语法：`{#参数名#}`
 * - 编辑器与文档内统一使用该占位
 * - 导出 RCS / RMS 协议时转为 `${参数名}`
 */
export const PARAM_TOKEN_REG = /\{#([^#{}\s]{1,30})#\}/g
export const PARAM_NAME_REG = /^[A-Za-z0-9_\u4e00-\u9fa5]{1,30}$/

export const PARAM_TYPES = ['text', 'number', 'amount', 'date', 'time', 'phone', 'url', 'code'] as const
export type ParamType = (typeof PARAM_TYPES)[number]

export const PARAM_TYPE_META: Record<ParamType, { label: string; example: string; maxLength: number }> = {
  text: { label: '文本', example: '张三', maxLength: 30 },
  number: { label: '数字', example: '100', maxLength: 20 },
  amount: { label: '金额', example: '99.00', maxLength: 12 },
  date: { label: '日期', example: '2026-10-12', maxLength: 20 },
  time: { label: '时间', example: '10:30', maxLength: 20 },
  phone: { label: '电话号码', example: '13800138000', maxLength: 20 },
  url: { label: '链接', example: 'https://example.com/a', maxLength: 3000 },
  code: { label: '验证码/券码', example: '826431', maxLength: 20 },
}

export const templateParamSchema = z.object({
  name: z.string().regex(PARAM_NAME_REG, '参数名仅支持中英文、数字、下划线，最多30个字符'),
  type: z.enum(PARAM_TYPES).default('text'),
  example: z.string().default(''),
  minLength: z.number().int().min(0).default(1),
  maxLength: z.number().int().min(1).default(30),
  description: z.string().optional(),
})
export type TemplateParam = z.infer<typeof templateParamSchema>

/** 生成参数占位：paramToken('name') → {#name#} */
export function paramToken(name: string): string {
  return `{#${name}#}`
}

/** 协议变量：toTplVariable('name') → ${name} */
export function toTplVariable(name: string): string {
  return '${' + name + '}'
}

/** 提取文本中的参数名（去重，保持出现顺序） */
export function extractParams(input: string | null | undefined): string[] {
  if (!input) return []
  const names: string[] = []
  for (const m of input.matchAll(PARAM_TOKEN_REG)) {
    const name = m[1]!
    if (!names.includes(name)) names.push(name)
  }
  return names
}

/** 替换参数占位 */
export function replaceParams(input: string, replacer: (name: string) => string): string {
  return input.replace(PARAM_TOKEN_REG, (_, name: string) => replacer(name))
}

/** 将 {#x#} 转为协议变量 ${x} */
export function paramsToTplVariables(input: string): string {
  return replaceParams(input, toTplVariable)
}

/** 移除所有参数占位（RMS 标题等不允许变量的位置） */
export function stripParams(input: string): string {
  return input.replace(PARAM_TOKEN_REG, '')
}

/** 创建参数定义 */
export function createParam(name: string, type: ParamType = 'text'): TemplateParam {
  const meta = PARAM_TYPE_META[type]
  return { name, type, example: meta.example, minLength: 1, maxLength: meta.maxLength }
}
