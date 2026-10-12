import type { VendorId } from '@aim/template-schema'

/** 各品牌手机开启阅信（智能短信）能力的设置指引（前端静态配置） */
export const ABILITY_GUIDE: Record<VendorId, { system: string; steps: string[]; tip?: string }> = {
  huawei: {
    system: 'HarmonyOS / EMUI 10+',
    steps: ['打开「信息」App', '点击右上角「⋮」→「设置」', '进入「高级」→ 开启「智能短信」', '返回收件箱，等待新消息即可看到富媒体卡片'],
    tip: '如仍无法显示，请在「设置 → 应用 → 信息」中清除缓存后重试。',
  },
  honor: {
    system: 'MagicOS 6+',
    steps: ['打开「信息」App', '点击右上角「⋮」→「设置」', '开启「增强服务」与「智能短信」'],
  },
  xiaomi: {
    system: 'MIUI 12+ / HyperOS',
    steps: ['打开「短信」App', '点击右上角「设置」', '开启「短信智能识别」与「富媒体消息」'],
    tip: '部分机型需在「设置 → 应用设置 → 系统应用设置 → 短信」中开启。',
  },
  vivo: {
    system: 'OriginOS / Funtouch OS 10+',
    steps: ['打开「信息」App', '点击右上角「设置」', '开启「智能服务卡片」'],
  },
  oppo: {
    system: 'ColorOS 11+',
    steps: ['打开「信息」App', '点击右上角「⋮」→「设置」', '开启「智能卡片」与「服务号消息」'],
  },
  samsung: {
    system: 'One UI 4+',
    steps: ['打开「信息」App', '点击「⋮」→「设置」→「更多设置」', '开启「富媒体通讯（RCS）」'],
  },
  asus: { system: 'ZenUI 8+', steps: ['打开「信息」App', '进入「设置」', '开启「智能消息」'] },
  coolpad: { system: 'COOL OS', steps: ['打开「信息」App', '进入「设置」', '开启「智能短信」'] },
}
