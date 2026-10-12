import { z } from 'zod'
import {
  RECOGNITION_TYPES,
  SCHEMA_VERSION,
  TEMPLATE_CATEGORIES,
  TEMPLATE_STATUSES,
  TEMPLATE_USAGES,
} from './constants'
import { templateElementSchema, type AnyElement } from './elements'
import { templateParamSchema } from './params'
import { vendorIdSchema } from './vendors'

export const pageStyleSchema = z.object({
  /** 卡片高度（画布坐标） */
  height: z.number().positive(),
  backgroundColor: z.string().optional(),
  backgroundImage: z.string().optional(),
  backgroundOpacity: z.number().min(0).max(1).optional(),
  borderRadius: z.number().optional(),
})
export type PageStyle = z.infer<typeof pageStyleSchema>

/**
 * 页面排版模式：
 * - flow：结构化版式。元素按 y 排序纵向流式排布，y 相同的相邻元素并排成一行；文本高度随内容自适应（贴近真机）
 * - absolute：自由版式。元素按 x/y/w/h 绝对定位，卡片高度取 style.height
 */
export const PAGE_MODES = ['flow', 'absolute'] as const
export type PageMode = (typeof PAGE_MODES)[number]

export const templatePageSchema = z.object({
  id: z.string(),
  mode: z.enum(PAGE_MODES).default('flow'),
  style: pageStyleSchema,
  elements: z.array(templateElementSchema),
})
export interface TemplatePage {
  id: string
  mode: PageMode
  style: PageStyle
  elements: AnyElement[]
}

export const templateMetaSchema = z.object({
  status: z.enum(TEMPLATE_STATUSES).default('draft'),
  industry: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  submittedAt: z.number().optional(),
  rejectReason: z.string().optional(),
  /** 后端模板 ID（提交审核后分配） */
  tplId: z.string().optional(),
})
export type TemplateMeta = z.infer<typeof templateMetaSchema>

export const templateDocumentSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: z.string(),
  name: z.string().max(20, '模板名称最多 20 个字'),
  usage: z.enum(TEMPLATE_USAGES),
  category: z.enum(TEMPLATE_CATEGORIES),
  /** 版式 ID（= 旧系统 cardId 主值） */
  layoutId: z.string(),
  /** 实际下发 cardId（部分版式按设置切换变体，如轮播比例） */
  cardId: z.string(),
  vendors: z.array(vendorIdSchema),
  recognition: z.enum(RECOGNITION_TYPES).default('shortLink'),
  /** 是否在文本前自动拼接签名 */
  sign: z.string().optional(),
  params: z.array(templateParamSchema),
  settings: z.record(z.string(), z.unknown()),
  pages: z.array(templatePageSchema).min(1),
  meta: templateMetaSchema,
})

export interface TemplateDocument extends Omit<z.infer<typeof templateDocumentSchema>, 'pages'> {
  pages: TemplatePage[]
}

/** 结构校验（字数、链接等质量规则见 @aim/template-core 的 precheck） */
export function parseTemplateDocument(input: unknown) {
  return templateDocumentSchema.safeParse(input)
}
