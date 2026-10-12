import {
  CANVAS_WIDTH,
  REDPACKET_SIZE,
  REJECT_TEXT as REJECT,
  RMS_CANVAS_WIDTH as RMS_W,
} from '@aim/template-schema'

export const AIM_CANVAS_WIDTH = CANVAS_WIDTH
export const RMS_CANVAS_WIDTH = RMS_W
export const REDPACKET_WIDTH = REDPACKET_SIZE.width
export const REDPACKET_HEIGHT = REDPACKET_SIZE.height
export const REJECT_TEXT = REJECT

export const CARD_IDS = {
  IMAGE_TEXT: 'com.hbm.imageandtext',
  VIDEO: 'com.hbm.video',
  CAROUSEL_16_9: 'com.hbm.carouselImageSixteenToNine',
  CAROUSEL_SQUARE: 'com.hbm.carouselQuareImage',
  CAROUSEL_VERTICAL: 'com.hbm.carouselVerticalImage',
  REDPACKET: 'com.hbm.redpacket',
  REDPACKET_V2: 'com.hbm.redpacketAnimation.v2',
  NOTIFICATION: 'com.hbm.notification',
} as const

/** 支持三信融合转换的 cardId */
export const INTEGRATED_CARD_IDS: string[] = Object.values(CARD_IDS)
export const CAROUSEL_IDS: string[] = [
  CARD_IDS.CAROUSEL_16_9,
  CARD_IDS.CAROUSEL_SQUARE,
  CARD_IDS.CAROUSEL_VERTICAL,
]
export const REDPACKET_IDS: string[] = [CARD_IDS.REDPACKET, CARD_IDS.REDPACKET_V2]
export const CARD_TPL_IDS: string[] = [CARD_IDS.IMAGE_TEXT, CARD_IDS.NOTIFICATION]
export const SINGLE_MEDIA_IDS: string[] = [
  CARD_IDS.IMAGE_TEXT,
  CARD_IDS.NOTIFICATION,
  CARD_IDS.VIDEO,
]

/** RCS 不支持的事件：转换时置空链接，由用户补填 */
export const UNSUPPORTED_RCS_ACTIONS: Record<string, string> = {
  COPY_PARAMETER: 'COPY_PARAMETER',
  OPEN_APP: 'OPEN_APP',
  OPEN_SMS: 'OPEN_SMS',
  OPEN_EMAIL: 'OPEN_EMAIL',
  OPEN_SCHEDULE: 'OPEN_SCHEDULE',
  OPEN_POPUP: 'OPEN_POPUP',
}

export const RCS_ACTION_TYPE: Record<string, 'urlAction' | 'dialerAction'> = {
  OPEN_URL: 'urlAction',
  OPEN_BROWSER: 'urlAction',
  OPEN_DRAWER: 'urlAction',
  DIAL_PHONE: 'dialerAction',
}

export const RCS_URL_APPLICATION: Record<string, 'webview' | 'browser'> = {
  OPEN_URL: 'webview',
  OPEN_BROWSER: 'browser',
  OPEN_DRAWER: 'webview',
}

export const DEFAULT_LAYOUT =
  '{"height":"tall_height","alignment":"","orientation":"vertical","width":"medium_width"}'
export const DIALER_DETAIL =
  '{"height":"tall_height","alignment":"","orientation":"vertical","width":"medium_width"}'

export const REDPACKET_BG = {
  TYPE1:
    'https://aim6.oss-cn-beijing.aliyuncs.com/test_file/null/E01/S01/Fodder/1/20250403145724977HLipVR.png',
  TYPE23:
    'https://aim6.oss-cn-beijing.aliyuncs.com/test_file/null/E01/S01/Fodder/1/20250403145732834Xj0iJi.png',
}

/** 旧编辑器参数节点：<input value="{#x#}"> */
export const PARAM_INPUT_REG = /<input[^>]*\bvalue=\\?["'](\$)?{#.+?#}\\?["'][^>]*>/g
export const PARAM_NAME_REG = /<input[^>]*\bvalue=\\?["'](\$)?{#(.+?)#}\\?["'][^>]*>/g
/** 新文档参数占位：{#x#} */
export const PARAM_TOKEN_REG = /\{#([^#{}\s]{1,30})#\}/g
