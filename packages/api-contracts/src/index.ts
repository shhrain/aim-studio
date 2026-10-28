import { z } from 'zod'

/** 工作空间角色，服务端为权限判断的唯一依据。 */
export const roles = ['owner', 'admin', 'editor', 'reviewer', 'viewer'] as const
export type Role = (typeof roles)[number]
export const permissions = {
  owner: ['read', 'edit', 'review', 'send', 'team', 'manage', 'own'],
  admin: ['read', 'edit', 'review', 'send', 'team', 'manage'],
  editor: ['read', 'edit', 'send'],
  reviewer: ['read', 'review'],
  viewer: ['read'],
} as const
/** 检查角色能力，不接受未知角色。 */
export function can(role: string, action: string): boolean {
  return (permissions[role as Role] as readonly string[] | undefined)?.includes(action) ?? false
}
export const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
})
export const preferencesSchema = z.object({
  locale: z.enum(['zh-CN', 'en']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  timezone: z
    .string()
    .max(80)
    .refine((v) => {
      try {
        new Intl.DateTimeFormat('en', { timeZone: v })
        return true
      } catch {
        return false
      }
    })
    .optional(),
})
export const workspaceSchema = z.object({ name: z.string().trim().min(1).max(80) })
export const contactSchema = z.object({
  contactName: z.string().trim().min(1).max(80),
  mobile: z.string().regex(/^\+?\d{7,15}$/),
})
export const deliverySchema = z.object({
  templateId: z.string().min(1),
  mobiles: z
    .array(z.string().regex(/^\+?\d{7,15}$/))
    .min(1)
    .max(10),
  sendMode: z.enum(['priority', '1', '2', '3']).default('priority'),
})
export const API_CODE = {
  OK: 0,
  INVALID: 1001,
  RATE_LIMIT: 1003,
  NOT_FOUND: 2001,
  CONFLICT: 2002,
  UNAVAILABLE: 3001,
  SYSTEM: 5000,
  UNAUTHORIZED: 9001,
  FORBIDDEN: 9003,
} as const
/** 前后端共享的业务响应。认证接口保持 Better Auth 原生协议。 */
export interface Result<T> {
  subCode: number
  message: string
  data: T
  requestId?: string
  fieldErrors?: Record<string, string[]>
}
export interface Workspace {
  id: string
  name: string
  slug: string
  role: Role
}
export interface Preferences {
  locale: 'zh-CN' | 'en'
  theme: 'light' | 'dark' | 'system'
  timezone: string
}
export interface Capabilities {
  mode: 'simulated' | 'disabled'
  send: boolean
  ability: boolean
  ai: boolean
  vendorReview: boolean
  wechat: boolean
}
/** 仅允许应用自身路径作为回跳目标。 */
export function safeRedirect(value: string | null | undefined, fallback = '/zh-CN/app'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value))
    return fallback
  try {
    const u = new URL(value, 'https://aim.invalid')
    return u.origin === 'https://aim.invalid' ? u.pathname + u.search + u.hash : fallback
  } catch {
    return fallback
  }
}

/** 审核提交只接收草稿版本及逐元素补充链接，服务端生成协议。 */
export const submitSchema = z.object({
  revision: z.number().int().positive(),
  rcsFallbacks: z
    .record(
      z.string(),
      z
        .string()
        .url()
        .refine((value) => {
          const url = new URL(value)
          return url.protocol === 'https:' && !url.username && !url.password
        }, '请填写 HTTPS 替代链接'),
    )
    .default({}),
})
export type SubmitRequest = z.infer<typeof submitSchema>
/** 列表页码从 1 开始；旧适配器自行转换旧字段。 */
export interface PageInfo {
  page: number
  size: number
  total: number
}
export interface PagedResult<T> extends Result<T[]> {
  pageInfo: PageInfo
}
export interface VersionSummary {
  id: string
  revision: number
  status: string
  createdAt: string
}
export interface TaskResult {
  id: string
  kind: string
  status: 'pending' | 'running' | 'done' | 'failed'
  mode: string
  result: unknown
  error: string | null
}
