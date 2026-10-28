import type { PrecheckIssue } from '@aim/template-core'
import type {
  IntegratedResult,
  TemplateDocument,
  TemplateStatus,
  VendorId,
} from '@aim/template-schema'

/* ================================================================== */
/* 移动端体验接口（/rcs/aim-experience/api/v1）                           */
/* ================================================================== */

export const EXPERIENCE_PREFIX = '/rcs/aim-experience/api/v1'

export interface Option {
  id: string
  name: string
}

export interface FilterOptions {
  industries: Option[]
  styles: Option[]
  labels: Option[]
  carriers: Option[]
  factories: { id: VendorId; name: string }[]
}

export interface TemplateListQuery {
  pageIndex: number
  pageSize: number
  industryIds?: string[]
  styleIds?: string[]
  labelIds?: string[]
  carriers?: string[]
  factories?: VendorId[]
  keyword?: string
  /** 仅三信融合模板；在服务端过滤以保持分页准确。 */
  integrated?: boolean
}

export interface ExperienceTemplate {
  tplId: string
  tplName: string
  cardId: string
  styleName: string
  industryId: string
  industryName: string
  labels: string[]
  factories: VendorId[]
  carriers: string[]
  /** 动态参数个数：>0 的模板不可直接体验发送 */
  paramcnt: number
  /** 是否支持三信融合 */
  integrated: boolean
  hot?: number
  document: TemplateDocument
  /** 已发布版本的转换快照，包含服务端审核图与 RCS 替代链接。 */
  conversion?: IntegratedResult | null
}

/** 审核/发送时的不可变渲染快照；预览不能重新读取当前草稿。 */
export interface TemplateSnapshot {
  document: TemplateDocument
  conversion: IntegratedResult | null
}

/** 1=AIM 阅信 2=RCS 5G消息 3=RMS 视频短信 */
export type MessageType = 1 | 2 | 3

export const MESSAGE_TYPE_LABEL: Record<MessageType, string> = {
  1: '阅信',
  2: '5G消息',
  3: '视频短信',
}

export interface SendPreviewItem {
  mobile: string
  contactName?: string
  sendable: boolean
  messageType: MessageType
  availableTypes: MessageType[]
  factory?: VendorId
  carrier?: string
  reason?: string
}

/** 发送模式：priority=融合优先；'1'|'2'|'3' 为定向发送 */
export type SendMode = 'priority' | '1' | '2' | '3'

export interface SendExperienceBody {
  whois: string
  tplId: string
  sendMode: SendMode
  items: { mobile: string; canSendType?: MessageType }[]
  imgCode: string
  identity: string
}

export type SendStatus = 'SENDING' | 'SUCCESS' | 'FAILED'

export interface SendRecord {
  mode?: 'simulated' | 'disabled' | 'live'
  id: string
  requestId: string
  tplId: string
  tplName: string
  cardId: string
  mobile: string
  contactName?: string
  messageType: MessageType
  /** 发生降级（阅信 → 5G 消息 / 视频短信） */
  degraded?: { from: MessageType; reason: string }
  carrier: string
  factory?: VendorId
  status: SendStatus
  failReason?: string
  sendTime: number
}

export interface SendRecordQuery {
  whois: string
  startDate?: string
  endDate?: string
  mobile?: string
  status?: SendStatus
  pageNum: number
  pageSize: number
}

export interface SendStatistics {
  total: number
  byStatus: Record<SendStatus, number>
  byType: Record<MessageType, number>
  byFactory: { factory: string; count: number }[]
}

export interface Contact {
  id: string
  contactName: string
  mobile: string
  createdAt: number
}

export interface PageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
  pages: number
}

export interface AbilityResult {
  mobile: string
  /** 1=可接收阅信 0=不可接收 */
  receiveState: 0 | 1
  factory?: VendorId
  carrier?: string
  rcs: boolean
}

export interface WechatSignature {
  appId: string
  timestamp: number
  nonceStr: string
  signature: string
}

export interface MockLoginResult {
  token: string
  phone: string
}

/* ================================================================== */
/* 编辑器接口（/api/editor/v1）                                          */
/* ================================================================== */

export const EDITOR_PREFIX = '/api/editor/v1'

export interface TemplateSummary {
  id: string
  name: string
  layoutId: string
  cardId: string
  category: TemplateDocument['category']
  usage: TemplateDocument['usage']
  status: TemplateStatus
  vendors: VendorId[]
  updatedAt: number
  createdAt: number
  rejectReason?: string
  document: TemplateDocument
}

export interface TemplateQuery {
  keyword?: string
  status?: TemplateStatus | 'all'
  category?: TemplateDocument['category'] | 'all'
  page?: number
  size?: number
}

export interface SubmitTemplateBody {
  /** 三信转换缺失动作的替代链接，以稳定元素 ID 为键。 */
  rcsFallbacks?: Record<string, string>
  document: TemplateDocument
  integrated?: IntegratedResult | null
  /** 提交前快速预检结果（服务端复核） */
  precheckPassed: boolean
}

export type MaterialType = 'image' | 'video' | 'audio'

export interface Material {
  id: string
  type: MaterialType
  name: string
  url: string
  cover?: string
  width?: number
  height?: number
  size: number
  duration?: number
  createdAt: number
  tags?: string[]
}

export interface UploadMaterialBody {
  type: MaterialType
  name: string
  /** data URL（Mock）或对象存储地址 */
  url: string
  cover?: string
  width?: number
  height?: number
  size: number
  duration?: number
}

export interface DeepPrecheckTask {
  taskId: string
  status: 'running' | 'done' | 'failed'
  progress: number
  issues: PrecheckIssue[]
  /** 图片质量 / 链接可达性 / 文案合规等维度得分 */
  dimensions?: { key: string; label: string; score: number; passed: boolean }[]
}

export interface LinkCheckResult {
  url: string
  reachable: boolean
  https: boolean
  status?: number
  message: string
}

export interface AiCopyRequest {
  /** 字段用途：title / description / button */
  field: 'title' | 'description' | 'button'
  layoutName: string
  maxLength: number
  /** 行业 / 场景 / 关键词 */
  prompt: string
  tone?: 'formal' | 'friendly' | 'promotion'
  count?: number
}

export interface AiCopyResult {
  candidates: string[]
}

export interface FeedbackBody {
  content: string
  contact?: string
  page?: string
}
