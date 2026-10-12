export const AIM_CANVAS_WIDTH = 342
export const PREVIEW_WIDTH = 248
export const RMS_CANVAS_WIDTH = 260
export const REDPACKET_WIDTH = 242
export const REDPACKET_HEIGHT = 320

export const CARD_IDS = {
  IMAGE_TEXT: 'com.hbm.imageandtext',
  VIDEO: 'com.hbm.video',
  CAROUSEL_16_9: 'com.hbm.carouselImageSixteenToNine',
  CAROUSEL_SQUARE: 'com.hbm.carouselQuareImage',
  CAROUSEL_VERTICAL: 'com.hbm.carouselVerticalImage',
  REDPACKET: 'com.hbm.redpacket',
  REDPACKET_V2: 'com.hbm.redpacketAnimation.v2',
  NOTIFICATION: 'com.hbm.notification'
}

export const INTEGRATED_CARD_IDS = [
  CARD_IDS.IMAGE_TEXT,
  CARD_IDS.VIDEO,
  CARD_IDS.CAROUSEL_16_9,
  CARD_IDS.CAROUSEL_SQUARE,
  CARD_IDS.CAROUSEL_VERTICAL,
  CARD_IDS.REDPACKET,
  CARD_IDS.REDPACKET_V2,
  CARD_IDS.NOTIFICATION
]

export const CAROUSEL_IDS = [
  CARD_IDS.CAROUSEL_16_9,
  CARD_IDS.CAROUSEL_SQUARE,
  CARD_IDS.CAROUSEL_VERTICAL
]

export const REDPACKET_IDS = [CARD_IDS.REDPACKET, CARD_IDS.REDPACKET_V2]

export const CARD_TPL_IDS = [CARD_IDS.IMAGE_TEXT, CARD_IDS.NOTIFICATION]

export const SINGLE_MEDIA_IDS = [CARD_IDS.IMAGE_TEXT, CARD_IDS.NOTIFICATION, CARD_IDS.VIDEO]

export const UNSUPPORTED_RCS_ACTIONS = {
  COPY_PARAMETER: 'COPY_PARAMETER',
  OPEN_APP: 'OPEN_APP',
  OPEN_SMS: 'OPEN_SMS',
  OPEN_EMAIL: 'OPEN_EMAIL',
  OPEN_SCHEDULE: 'OPEN_SCHEDULE',
  OPEN_POPUP: 'OPEN_POPUP'
}

export const RCS_ACTION_TYPE = {
  OPEN_URL: 'urlAction',
  OPEN_BROWSER: 'urlAction',
  OPEN_DRAWER: 'urlAction',
  DIAL_PHONE: 'dialerAction'
}

export const RCS_URL_APPLICATION = {
  OPEN_URL: 'webview',
  OPEN_BROWSER: 'browser',
  OPEN_DRAWER: 'webview'
}

export const DEFAULT_LAYOUT = '{"height":"tall_height","alignment":"","orientation":"vertical","width":"medium_width"}'

export const DIALER_DETAIL = '{"height":"tall_height","alignment":"","orientation":"vertical","width":"medium_width"}'

export const REDPACKET_BG = {
  TYPE1: 'https://aim6.oss-cn-beijing.aliyuncs.com/test_file/null/E01/S01/Fodder/1/20250403145724977HLipVR.png',
  TYPE23: 'https://aim6.oss-cn-beijing.aliyuncs.com/test_file/null/E01/S01/Fodder/1/20250403145732834Xj0iJi.png'
}

export const PARAM_INPUT_REG = /<input[^>]*\bvalue=\\?["'](\$)?{#.+?#}\\?["'][^>]*>/g
export const PARAM_NAME_REG = /<input[^>]*\bvalue=\\?["'](\$)?{#(.+?)#}\\?["'][^>]*>/g
export const REJECT_TEXT = '拒收请回复R'
