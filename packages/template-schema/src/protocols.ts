/**
 * 三信融合下发协议结构（与 5G 阅信适配层接口保持一致）
 * - RCS：rcsTplRequest.tplContent（苹果 / 5G 消息）
 * - RMS：rmsTplRequest.content（视频短信 / 其他终端）
 */

export interface RcsMedia {
  mtalType: 'image' | 'video' | 'audio' | string
  mtalName?: string
  mtalSize?: number
  mtalAddress?: string
  coverUrl?: string
  avatarUrl?: string
  contentType?: string
  mtalHeight?: number
  mtalWidth?: number
}

export interface RcsSuggestion {
  type: 'urlAction' | 'dialerAction' | undefined
  name: string
  /** JSON 字符串：urlAction → { url, application }；dialerAction → 布局信息 */
  actionDetail: string
  action: string
}

export interface RcsRedpacketOverlayBox {
  x: number
  y: number
  w: number
  h: number
  fontSize: number
  color: string
  fontWeight: number | string
  textAlign: string
  fontFamily: string
}

export interface RcsCardContent {
  media: RcsMedia
  title: string
  description: string
  /** 卡片布局 JSON：{"height":"tall_height","orientation":"vertical","width":"medium_width"} */
  layout: string
  avatartitle?: string
  buttons?: RcsSuggestion[]
  overlay?: Record<'avatar' | 'name' | 'title' | 'description', RcsRedpacketOverlayBox | null>
  overlayCaptured?: boolean
}

export interface RcsParam {
  pName: string
  pType: 'TEXT'
  pLen: number
  pDesc: string
  indices: number[]
}

export interface RcsSourceMaterial {
  tplType: 'card' | 'multiCard' | 'media'
  actionSheet?: RcsSuggestion[]
  params?: RcsParam[]
  content: RcsCardContent[]
}

export type RmsFrameType = 'text' | 'image' | 'video' | 'audio'

export interface RmsFrame {
  type: RmsFrameType
  text?: string
  src?: string
  w?: number
  h?: number
  width?: number
  height?: number
  duration?: number
  size?: number
  title?: string
  fistFramePath?: string
  textPosition?: 'top' | 'bottom'
  [key: string]: unknown
}

export interface RmsTplFrame {
  type: 'txt' | 'image' | 'video' | 'audio'
  content?: string
  mtalAddress?: string
  mtalSize?: number
  mtalWidth?: number
  mtalHeight?: number
  duration?: number
  mtalName?: string
  fistFramePath?: string
  textPosition?: string
}

export interface RmsParam {
  paramName: string
  paramType: 'TEXT'
  paramLen: number
  paramDesc: string
  paramRule: string
}

export interface IntegratedResult {
  /** RCS 预览对象 */
  sourceMaterial: RcsSourceMaterial
  /** RMS 预览帧 */
  mediaContent: RmsFrame[]
  rmsTitle: string
  redpacketType: 1 | 2 | 3
  /** 存在 RCS 不支持的按钮事件，需要用户补填 */
  actionShow: boolean
  /** 需要补填链接的 RCS 按钮 */
  editRcsBtns: (RcsSuggestion & { btIndex: number })[]
  /** 红包需截图生成审核图 */
  needCapture: boolean
  rcsTplContent: RcsSourceMaterial
  rmsTplContent: RmsTplFrame[]
  rmsTplParams?: RmsParam[]
}

export interface SubmitPayload {
  rcsTplRequest: {
    tplName: string
    chatbotNameId: string
    chatbotName: string
    tplContent: RcsSourceMaterial
  }
  rmsTplRequest: { tplName: string; signature: string; content: RmsTplFrame[]; params?: RmsParam[] }
}
