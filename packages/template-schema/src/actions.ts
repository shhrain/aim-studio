import { z } from 'zod'

/** 15 种点击事件（与旧系统 action 值保持一致，便于数据互通） */
export const ACTION_TYPES = [
  'VIEW_IMAGE',
  'OPEN_URL',
  'OPEN_APP',
  'OPEN_QUICK',
  'OPEN_BROWSER',
  'OPEN_DRAWER',
  'OPEN_WECHAT_SHOP',
  'OPEN_HMOS',
  'OPEN_MAP',
  'DIAL_PHONE',
  'COPY_PARAMETER',
  'OPEN_SMS',
  'OPEN_EMAIL',
  'OPEN_SCHEDULE',
  'OPEN_POPUP',
] as const
export type ActionType = (typeof ACTION_TYPES)[number]
export const actionTypeSchema = z.enum(ACTION_TYPES)

/** 点击事件数据：action + 各事件自有字段（字段定义见 ACTIONS[action].fields） */
export const actionEventSchema = z.looseObject({
  action: actionTypeSchema,
  target: z.string().optional(),
})
export type ActionEvent = z.infer<typeof actionEventSchema>

/** 兜底类型（打开 APP / 快应用失败后的降级方式） */
export const FALLBACK_TYPES = [
  { value: 'market', label: '打开应用市场' },
  { value: 'quick', label: '打开快应用' },
  { value: 'h5', label: '直接打开H5' },
  { value: 'browser', label: '外部浏览器打开H5' },
] as const

export type ActionFieldKind =
  | 'text'
  | 'textarea'
  | 'url'
  | 'phone'
  | 'email'
  | 'select'
  | 'radio'
  | 'datetime'
  | 'number'
  | 'keyValue'

export interface ActionFieldDefinition {
  key: string
  label: string
  kind: ActionFieldKind
  required?: boolean
  maxLength?: number
  placeholder?: string
  help?: string
  /** 允许插入 {#参数#} */
  allowParams?: boolean
  options?: readonly { value: string; label: string }[]
  /** 仅当另一个字段等于指定值时显示 */
  visibleWhen?: { key: string; equals: string | number }
  defaultValue?: string | number
}

/** RCS 映射：urlAction（webview / browser）、dialerAction、降级为浏览器、不支持 */
export type RcsActionMapping =
  | { kind: 'urlAction'; application: 'webview' | 'browser' }
  | { kind: 'dialerAction' }
  | { kind: 'asBrowser' }
  | { kind: 'unsupported' }

export interface ActionDefinition {
  type: ActionType
  label: string
  description: string
  /** 可配置在哪些元素上（未设置 = 全部可点击元素） */
  appliesTo?: readonly string[]
  fields: readonly ActionFieldDefinition[]
  rcs: RcsActionMapping
  /** 在 RMS（彩信）中的呈现方式 */
  rms: 'link' | 'text' | 'none'
  /** 仅特定系统支持 */
  platformNote?: string
}

const URL_FIELD: ActionFieldDefinition = {
  key: 'target',
  label: '链接',
  kind: 'url',
  required: true,
  maxLength: 3000,
  placeholder: 'https://开头，字符长度<=3000',
  allowParams: true,
}
const PAGE_NAME: ActionFieldDefinition = {
  key: 'pageName',
  label: '页面名称',
  kind: 'text',
  maxLength: 10,
  placeholder: '最多10个字',
}
const FALLBACK: ActionFieldDefinition[] = [
  {
    key: 'floorType',
    label: '兜底类型',
    kind: 'select',
    options: FALLBACK_TYPES,
    defaultValue: 'h5',
  },
  {
    key: 'floorUrl',
    label: '兜底链接',
    kind: 'url',
    maxLength: 3000,
    placeholder: 'https://',
    allowParams: true,
  },
]

export const ACTIONS: Record<ActionType, ActionDefinition> = {
  VIEW_IMAGE: {
    type: 'VIEW_IMAGE',
    label: '查看大图',
    description: '点击图片全屏查看原图',
    appliesTo: ['image', 'swiper'],
    fields: [],
    rcs: { kind: 'unsupported' },
    rms: 'none',
  },
  OPEN_URL: {
    type: 'OPEN_URL',
    label: '打开链接',
    description: '在应用内 WebView 打开 H5 页面；跳转小程序请使用“打开链接”',
    fields: [URL_FIELD, PAGE_NAME],
    rcs: { kind: 'urlAction', application: 'webview' },
    rms: 'link',
  },
  OPEN_APP: {
    type: 'OPEN_APP',
    label: '打开APP',
    description: '通过 DeepLink 拉起已安装应用，未安装时按兜底类型处理',
    fields: [
      {
        key: 'target',
        label: 'DeepLink',
        kind: 'text',
        required: true,
        placeholder: 'scheme://path',
        allowParams: true,
      },
      {
        key: 'packageName',
        label: 'APK包名',
        kind: 'text',
        required: true,
        placeholder: 'com.example.app',
      },
      ...FALLBACK,
    ],
    rcs: { kind: 'asBrowser' },
    rms: 'link',
  },
  OPEN_QUICK: {
    type: 'OPEN_QUICK',
    label: '打开快应用',
    description: '拉起快应用（hap://），RCS/RMS 自动转为 hapjs.org 链接',
    fields: [
      { ...URL_FIELD, label: '快应用链接', kind: 'text', placeholder: 'hap://app/包名/页面' },
      ...FALLBACK,
    ],
    rcs: { kind: 'asBrowser' },
    rms: 'link',
  },
  OPEN_BROWSER: {
    type: 'OPEN_BROWSER',
    label: '打开浏览器',
    description: '使用系统浏览器打开链接',
    fields: [URL_FIELD],
    rcs: { kind: 'urlAction', application: 'browser' },
    rms: 'link',
  },
  OPEN_DRAWER: {
    type: 'OPEN_DRAWER',
    label: '打开浮窗',
    description: '以半屏浮窗形式打开 H5',
    fields: [URL_FIELD, PAGE_NAME],
    rcs: { kind: 'urlAction', application: 'webview' },
    rms: 'link',
  },
  OPEN_WECHAT_SHOP: {
    type: 'OPEN_WECHAT_SHOP',
    label: '打开微信小店',
    description: '跳转微信小店 / 自定义小程序落地页',
    fields: [
      { key: 'shopId', label: '微信小店ID', kind: 'text', required: true },
      {
        key: 'landingPage',
        label: '小程序落地页',
        kind: 'text',
        placeholder: 'pages/index/index',
        help: '自定义小程序落地页',
      },
    ],
    rcs: { kind: 'unsupported' },
    rms: 'none',
  },
  OPEN_HMOS: {
    type: 'OPEN_HMOS',
    label: '打开元服务',
    description: '拉起华为鸿蒙元服务',
    platformNote: '仅支持投放华为鸿蒙操作系统 ≥6.0',
    fields: [
      {
        key: 'jumpMode',
        label: '动作类型',
        kind: 'radio',
        options: [
          { value: 'embedded', label: '嵌入式跳转' },
          { value: 'external', label: '跳出式跳转' },
        ],
        defaultValue: 'embedded',
      },
      { key: 'appId', label: '华为元服务APPID', kind: 'text', required: true },
      {
        key: 'target',
        label: '链接',
        kind: 'text',
        placeholder: '元服务页面路径',
        allowParams: true,
      },
      { key: 'parameters', label: '元服务动态参数', kind: 'keyValue' },
    ],
    rcs: { kind: 'unsupported' },
    rms: 'none',
  },
  OPEN_MAP: {
    type: 'OPEN_MAP',
    label: '打开地图',
    description: '打开地图并定位到指定地点',
    fields: [
      { key: 'address', label: '地点名称', kind: 'text', required: true, maxLength: 30 },
      { key: 'longitude', label: '经度', kind: 'number', required: true },
      { key: 'latitude', label: '纬度', kind: 'number', required: true },
    ],
    rcs: { kind: 'unsupported' },
    rms: 'text',
  },
  DIAL_PHONE: {
    type: 'DIAL_PHONE',
    label: '拨打电话',
    description: '调起系统拨号盘',
    fields: [
      {
        key: 'target',
        label: '电话号码',
        kind: 'phone',
        required: true,
        allowParams: true,
        placeholder: '如 95588 / 13800138000',
        help: '电话号码设置为参数时，参数示例要按照正确的格式填写',
      },
    ],
    rcs: { kind: 'dialerAction' },
    rms: 'link',
  },
  COPY_PARAMETER: {
    type: 'COPY_PARAMETER',
    label: '复制内容',
    description: '复制验证码、券码等内容到剪贴板',
    fields: [
      {
        key: 'copyType',
        label: '复制类型',
        kind: 'radio',
        options: [
          { value: 'param', label: '复制参数' },
          { value: 'fixed', label: '固定内容' },
        ],
        defaultValue: 'param',
      },
      {
        key: 'content',
        label: '复制内容',
        kind: 'text',
        required: true,
        allowParams: true,
        placeholder: '请输入要复制的内容',
      },
    ],
    rcs: { kind: 'unsupported' },
    rms: 'text',
  },
  OPEN_SMS: {
    type: 'OPEN_SMS',
    label: '发送短信',
    description: '调用系统发送短信功能，自动填写号码与正文',
    fields: [
      {
        key: 'target',
        label: '短信号码',
        kind: 'phone',
        required: true,
        placeholder: '131****4321，1069****1234',
        allowParams: true,
      },
      {
        key: 'body',
        label: '短信正文',
        kind: 'textarea',
        maxLength: 70,
        placeholder: '例如：2000积分兑换话费',
        allowParams: true,
      },
    ],
    rcs: { kind: 'unsupported' },
    rms: 'text',
  },
  OPEN_EMAIL: {
    type: 'OPEN_EMAIL',
    label: '跳转邮箱',
    description: '打开邮件客户端并预填收件人、标题、正文',
    fields: [
      { key: 'target', label: '邮箱地址', kind: 'email', required: true },
      { key: 'subject', label: '邮件标题', kind: 'text', maxLength: 50 },
      { key: 'body', label: '邮件正文', kind: 'textarea', maxLength: 500 },
    ],
    rcs: { kind: 'unsupported' },
    rms: 'text',
  },
  OPEN_SCHEDULE: {
    type: 'OPEN_SCHEDULE',
    label: '跳转日程',
    description: '在系统日历中创建日程提醒',
    fields: [
      { key: 'title', label: '日程标题', kind: 'text', required: true, maxLength: 30 },
      { key: 'description', label: '日程描述', kind: 'textarea', maxLength: 200 },
      { key: 'startTime', label: '开始时间', kind: 'datetime', required: true },
      { key: 'endTime', label: '结束时间', kind: 'datetime', required: true },
    ],
    rcs: { kind: 'unsupported' },
    rms: 'text',
  },
  OPEN_POPUP: {
    type: 'OPEN_POPUP',
    label: '打开弹窗',
    description: '点击后弹出说明弹窗（活动规则、温馨提示等）',
    fields: [
      { key: 'title', label: '弹窗标题', kind: 'text', required: true, maxLength: 15 },
      { key: 'content', label: '弹窗内容', kind: 'textarea', required: true, maxLength: 500 },
      {
        key: 'buttonText',
        label: '弹窗按钮名称',
        kind: 'text',
        maxLength: 6,
        defaultValue: '我知道了',
      },
    ],
    rcs: { kind: 'unsupported' },
    rms: 'text',
  },
}

export const ACTION_LIST: ActionDefinition[] = ACTION_TYPES.map((t) => ACTIONS[t])

/** 某元素类型可选的事件 */
export function actionsFor(elementType: string): ActionDefinition[] {
  return ACTION_LIST.filter((a) => !a.appliesTo || a.appliesTo.includes(elementType))
}

/** 创建事件默认值 */
export function createActionEvent(type: ActionType): ActionEvent {
  const event: ActionEvent = { action: type, target: '' }
  for (const f of ACTIONS[type].fields) {
    if (f.defaultValue !== undefined) event[f.key] = f.defaultValue
    else if (!(f.key in event)) event[f.key] = ''
  }
  return event
}
