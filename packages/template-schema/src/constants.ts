/** 当前模板文档协议版本 */
export const SCHEMA_VERSION = 1 as const

/** AIM 画布基准宽度（px）。所有元素坐标以此为参照，预览时按容器宽度等比换算。 */
export const CANVAS_WIDTH = 342

/** 旧版预览内容宽度（px），兼容旧数据中的缩放约定 */
export const LEGACY_PREVIEW_WIDTH = 248

/** RMS（彩信）画布宽度（px） */
export const RMS_CANVAS_WIDTH = 260

/** 红包截图尺寸（RCS 审核图） */
export const REDPACKET_SIZE = { width: 242, height: 320 } as const

/** 默认卡片高度 */
export const DEFAULT_PAGE_HEIGHT = 420

/** 卡片高度范围 */
export const PAGE_HEIGHT_RANGE = { min: 120, max: 1600 } as const

/** 链接最大长度 */
export const URL_MAX_LENGTH = 3000

/** 模板名称最大长度 */
export const TEMPLATE_NAME_MAX = 20

/** 扫码预览链接有效期（毫秒） */
export const SHARE_TTL_MS = 30 * 60 * 1000

/** RMS 拒收文案（导出时剔除） */
export const REJECT_TEXT = '拒收请回复R'

/** 协议：AIM（安卓阅信）/ RCS（5G 消息，iPhone）/ RMS（彩信，其他终端） */
export const PROTOCOLS = ['aim', 'rcs', 'rms'] as const
export type Protocol = (typeof PROTOCOLS)[number]

export const PROTOCOL_META: Record<
  Protocol,
  { name: string; terminal: string; sendType: 1 | 2 | 3 }
> = {
  aim: { name: '阅信（AIM）', terminal: '安卓', sendType: 1 },
  rcs: { name: '5G 消息（RCS）', terminal: '苹果', sendType: 2 },
  rms: { name: '视频短信（RMS）', terminal: '其他', sendType: 3 },
}

/** 模板用途 */
export const TEMPLATE_USAGES = ['commercial', 'test'] as const
export type TemplateUsage = (typeof TEMPLATE_USAGES)[number]
export const TEMPLATE_USAGE_LABEL: Record<TemplateUsage, string> = {
  commercial: '商用',
  test: '测试',
}

/** 模板分类 */
export const TEMPLATE_CATEGORIES = ['service', 'notify'] as const
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number]
export const TEMPLATE_CATEGORY_LABEL: Record<TemplateCategory, string> = {
  service: '服务类',
  notify: '通知类',
}

/** 识别类型 */
export const RECOGNITION_TYPES = ['shortLink', 'text'] as const
export type RecognitionType = (typeof RECOGNITION_TYPES)[number]
export const RECOGNITION_LABEL: Record<RecognitionType, string> = {
  shortLink: '短链识别',
  text: '文本识别',
}

/** 审核状态 */
export const TEMPLATE_STATUSES = ['draft', 'reviewing', 'approved', 'rejected'] as const
export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number]
export const TEMPLATE_STATUS_LABEL: Record<TemplateStatus, string> = {
  draft: '草稿',
  reviewing: '审核中',
  approved: '已通过',
  rejected: '已驳回',
}
