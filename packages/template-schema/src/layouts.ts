import type { Protocol, TemplateCategory } from './constants'
import type { ElementType, Ratio } from './elements'
import { VENDOR_SETS, type VendorId } from './vendors'

export const LAYOUT_GROUPS = {
  imageText: { label: '图文', category: 'service' },
  video: { label: '视频图文', category: 'service' },
  ecommerce: { label: '电商', category: 'service' },
  survey: { label: '问卷表单', category: 'service' },
  select: { label: '单选表单', category: 'service' },
  notice: { label: '通知', category: 'notify' },
  trip: { label: '行程通知', category: 'notify' },
  custom: { label: '自由版式', category: 'service' },
} as const satisfies Record<string, { label: string; category: TemplateCategory }>
export type LayoutGroup = keyof typeof LAYOUT_GROUPS

/**
 * 槽位：版式中可编辑的结构化位置。
 * - 简单槽位：对应一个元素（element.slot === key）
 * - 复合槽位：对应一个复合元素，`limits` 以 props 路径约束字数（`[]` 表示数组每一项）
 * - 重复槽位：key 中的 `{i}` 由 `repeat.setting` 决定数量
 */
export interface SlotDefinition {
  key: string
  label: string
  elementType: ElementType
  required?: boolean
  /** 文本最大字数（text / button） */
  maxLength?: number
  /** 复合元素字段字数约束：{ 'cards[].title': 13 } */
  limits?: Record<string, number>
  /** 列表数量范围（复合元素 items/cards/options） */
  count?: { min: number; max: number; path: string }
  /** 可选图片比例 */
  ratios?: Ratio[]
  repeat?: { setting: string }
  hint?: string
}

export interface LayoutSettingDefinition {
  key: string
  label: string
  kind: 'radio' | 'switch' | 'select'
  options?: { value: string | number | boolean; label: string }[]
  defaultValue: string | number | boolean
  help?: string
}

export interface LayoutDefinition {
  /** 主 cardId */
  id: string
  /** 兼容的历史 cardId */
  aliases?: string[]
  name: string
  group: LayoutGroup
  category: TemplateCategory
  description: string
  vendors: VendorId[]
  /** 支持的下发协议（AIM 全部支持；RCS/RMS 由三信融合转换支持） */
  protocols: Protocol[]
  slots: SlotDefinition[]
  settings?: LayoutSettingDefinition[]
  /** 根据设置解析实际 cardId（如轮播比例变体） */
  variants?: { setting: string; map: Record<string, string> }
  /** 自由版式：允许增删任意元素、拖拽定位 */
  free?: boolean
  isNew?: boolean
  tags?: string[]
}

const R169: Ratio = [16, 9]
const R11: Ratio = [1, 1]
const R34: Ratio = [3, 4]
const R916: Ratio = [9, 16]

const BUTTON_COUNT: LayoutSettingDefinition = {
  key: 'buttonCount',
  label: '按钮数量',
  kind: 'radio',
  options: [
    { value: 1, label: '1个' },
    { value: 2, label: '2个' },
  ],
  defaultValue: 1,
}
const button = (i = 0, label = '按钮'): SlotDefinition => ({
  key: `button.${i}`,
  label: i ? `${label}${i + 1}` : label,
  elementType: 'button',
  maxLength: 10,
  required: i === 0,
})
const buttons = (): SlotDefinition => ({
  key: 'button.{i}',
  label: '按钮',
  elementType: 'button',
  maxLength: 10,
  required: true,
  repeat: { setting: 'buttonCount' },
})
const title = (max: number, required = true): SlotDefinition => ({
  key: 'title',
  label: '标题',
  elementType: 'text',
  maxLength: max,
  required,
})
const description = (max: number): SlotDefinition => ({
  key: 'description',
  label: '描述',
  elementType: 'text',
  maxLength: max,
})
const image = (ratios: Ratio[] = [R169, R11, R34], key = 'media', label = '图片'): SlotDefinition => ({
  key,
  label,
  elementType: 'image',
  required: true,
  ratios,
  hint: '支持 jpg/png/gif，单张不超过 2MB',
})
const video = (ratios: Ratio[] = [R169]): SlotDefinition => ({
  key: 'media',
  label: '视频',
  elementType: 'video',
  required: true,
  ratios,
  hint: '支持 mp4，不超过 10MB，时长不超过 60 秒',
})

export const LAYOUTS: LayoutDefinition[] = [
  /* ---------------------------- 图文 ---------------------------- */
  {
    id: 'com.hbm.imageandtext',
    name: '图文',
    group: 'imageText',
    category: 'service',
    description: '大图 + 标题 + 描述 + 按钮，最通用的营销与服务版式',
    vendors: VENDOR_SETS.main,
    protocols: ['aim', 'rcs', 'rms'],
    slots: [image(), title(17), description(69), button()],
  },
  {
    id: 'com.hbm.sideslip',
    name: '横滑',
    group: 'imageText',
    category: 'service',
    description: '多张卡片横向滑动浏览，每张卡片含图、标题、正文与按钮',
    vendors: VENDOR_SETS.core,
    protocols: ['aim'],
    settings: [
      {
        key: 'cardCount',
        label: '卡片数量',
        kind: 'radio',
        options: [2, 3, 4, 5, 6].map((n) => ({ value: n, label: `${n}张` })),
        defaultValue: 2,
      },
      {
        key: 'ratio',
        label: '图片比例',
        kind: 'radio',
        options: [
          { value: '16:9', label: '16:9' },
          { value: '1:1', label: '1:1' },
        ],
        defaultValue: '16:9',
      },
    ],
    slots: [
      {
        key: 'cards',
        label: '横滑卡片',
        elementType: 'sideslip',
        required: true,
        limits: { 'cards[].title': 13, 'cards[].content': 30, 'cards[].buttons[].text': 10 },
        count: { min: 2, max: 6, path: 'cards' },
      },
    ],
  },
  {
    id: 'com.hbm.standardimageandtext',
    name: '多图文',
    group: 'imageText',
    category: 'service',
    description: '头条大图 + 多条图文列表，适合资讯、活动合集',
    vendors: VENDOR_SETS.main,
    protocols: ['aim'],
    settings: [
      {
        key: 'itemCount',
        label: '列表条数',
        kind: 'radio',
        options: [1, 2, 3].map((n) => ({ value: n, label: `${n}条` })),
        defaultValue: 2,
      },
    ],
    slots: [
      image([R169], 'media', '头条图片'),
      { key: 'title', label: '头条标题', elementType: 'text', maxLength: 30, required: true },
      { key: 'item.{i}.text', label: '列表标题', elementType: 'text', maxLength: 30, required: true, repeat: { setting: 'itemCount' } },
      { key: 'item.{i}.image', label: '列表缩略图', elementType: 'image', required: true, ratios: [R11], repeat: { setting: 'itemCount' } },
    ],
  },
  {
    id: 'com.hbm.standardimageandtext2.v2',
    name: '多图文(新)',
    group: 'imageText',
    category: 'service',
    isNew: true,
    description: '左文右图的多条资讯列表，信息密度更高',
    vendors: VENDOR_SETS.core,
    protocols: ['aim'],
    settings: [
      {
        key: 'itemCount',
        label: '列表条数',
        kind: 'radio',
        options: [2, 3, 4].map((n) => ({ value: n, label: `${n}条` })),
        defaultValue: 2,
      },
    ],
    slots: [
      { key: 'item.{i}.text', label: '列表标题', elementType: 'text', maxLength: 30, required: true, repeat: { setting: 'itemCount' } },
      { key: 'item.{i}.image', label: '列表缩略图', elementType: 'image', required: true, ratios: [R11], repeat: { setting: 'itemCount' } },
    ],
  },
  {
    id: 'com.hbm.carouselImageSixteenToNine',
    aliases: ['com.hbm.carouselQuareImage', 'com.hbm.carouselVerticalImage'],
    name: '图片轮播',
    group: 'imageText',
    category: 'service',
    description: '多图自动轮播 + 标题 + 长描述 + 按钮',
    vendors: VENDOR_SETS.main,
    protocols: ['aim', 'rcs', 'rms'],
    settings: [
      {
        key: 'ratio',
        label: '图片比例',
        kind: 'radio',
        options: [
          { value: '16:9', label: '16:9' },
          { value: '1:1', label: '1:1' },
          { value: '3:4', label: '3:4' },
        ],
        defaultValue: '16:9',
      },
    ],
    variants: {
      setting: 'ratio',
      map: {
        '16:9': 'com.hbm.carouselImageSixteenToNine',
        '1:1': 'com.hbm.carouselQuareImage',
        '3:4': 'com.hbm.carouselVerticalImage',
      },
    },
    slots: [
      { key: 'media', label: '轮播图', elementType: 'swiper', required: true, count: { min: 2, max: 5, path: 'items' } },
      title(17),
      description(253),
      button(),
    ],
  },
  {
    id: 'com.hbm.carouselImage.v2',
    name: '图片轮播(新)',
    group: 'imageText',
    category: 'service',
    isNew: true,
    description: '轮播图 + 双按钮，适合多商品/多活动露出',
    vendors: VENDOR_SETS.core,
    protocols: ['aim'],
    settings: [{ ...BUTTON_COUNT, defaultValue: 2 }],
    slots: [
      { key: 'media', label: '轮播图', elementType: 'swiper', required: true, count: { min: 2, max: 5, path: 'items' } },
      title(19),
      description(130),
      buttons(),
    ],
  },
  {
    id: 'com.hbm.pureText',
    name: '长文本',
    group: 'imageText',
    category: 'service',
    description: '标题 + 长正文（最多 350 字），适合公告、说明类内容',
    vendors: VENDOR_SETS.main,
    protocols: ['aim'],
    slots: [title(15), description(350), button()],
  },
  {
    id: 'com.hbm.poster',
    name: '海报',
    group: 'imageText',
    category: 'service',
    description: '整张竖版海报，可配置点击跳转',
    vendors: VENDOR_SETS.main,
    protocols: ['aim'],
    slots: [image([R34, R916], 'media', '海报图片')],
  },

  /* --------------------------- 视频图文 --------------------------- */
  {
    id: 'com.hbm.video',
    name: '视频图文',
    group: 'video',
    category: 'service',
    description: '视频 + 标题 + 描述 + 按钮',
    vendors: VENDOR_SETS.main,
    protocols: ['aim', 'rcs', 'rms'],
    slots: [video(), title(17), description(69), button()],
  },
  {
    id: 'com.hbm.imageVideo',
    name: '图文视频',
    group: 'video',
    category: 'service',
    description: '先文字后视频，突出文案',
    vendors: VENDOR_SETS.core,
    protocols: ['aim'],
    slots: [title(17), description(69), video(), button()],
  },
  {
    id: 'com.hbm.pureVideo',
    name: '视频',
    group: 'video',
    category: 'service',
    description: '大尺寸视频 + 简短文字',
    vendors: VENDOR_SETS.core,
    protocols: ['aim'],
    slots: [video([R169, R11]), title(17), description(69), button()],
  },
  {
    id: 'com.hbm.shortVideoImage.v2',
    name: '短剧图片',
    group: 'video',
    category: 'service',
    isNew: true,
    description: '竖版剧照 + 双按钮（立即观看 / 追剧）',
    vendors: VENDOR_SETS.huaweiFamily,
    protocols: ['aim'],
    settings: [{ ...BUTTON_COUNT, defaultValue: 2 }],
    slots: [image([R34], 'media', '剧照'), title(17), description(69), buttons()],
  },
  {
    id: 'com.hbm.shortVideo.v2',
    name: '短剧视频',
    group: 'video',
    category: 'service',
    isNew: true,
    description: '竖版短剧视频 + 双按钮',
    vendors: VENDOR_SETS.huaweiFamily,
    protocols: ['aim'],
    settings: [{ ...BUTTON_COUNT, defaultValue: 2 }],
    slots: [video([R34]), title(17), description(69), buttons()],
  },
  {
    id: 'com.hbm.carouselVideo',
    name: '视频轮播',
    group: 'video',
    category: 'service',
    description: '多个视频轮播展示',
    vendors: VENDOR_SETS.core,
    protocols: ['aim'],
    slots: [
      { key: 'media', label: '视频轮播', elementType: 'swiper', required: true, count: { min: 2, max: 4, path: 'items' } },
      title(17),
      description(253),
      button(),
    ],
  },

  /* ----------------------------- 电商 ----------------------------- */
  {
    id: 'com.hbm.ecommerce',
    name: '电商',
    group: 'ecommerce',
    category: 'service',
    description: '商品主图 + 价格 + 卖点 + 双按钮',
    vendors: VENDOR_SETS.core,
    protocols: ['aim'],
    settings: [
      {
        key: 'themeColor',
        label: '按钮配色',
        kind: 'select',
        options: ['活力橙', '经典红', '清新绿', '湖水蓝', '尊享紫', '高级黑'].map((label, value) => ({ value, label })),
        defaultValue: 1,
      },
    ],
    slots: [
      {
        key: 'goods',
        label: '商品',
        elementType: 'eCommerce',
        required: true,
        limits: { title: 17, description: 69, 'buttons[].text': 6, tag: 8 },
        count: { min: 1, max: 5, path: 'images' },
      },
    ],
  },
  {
    id: 'com.hbm.ecommerce.v2',
    name: '电商(新)',
    group: 'ecommerce',
    category: 'service',
    isNew: true,
    description: '支持图片或视频主图的电商卡片',
    vendors: VENDOR_SETS.core,
    protocols: ['aim'],
    settings: [
      {
        key: 'media',
        label: '主图类型',
        kind: 'radio',
        options: [
          { value: 'image', label: '图片' },
          { value: 'video', label: '视频' },
        ],
        defaultValue: 'image',
      },
    ],
    slots: [
      {
        key: 'goods',
        label: '商品',
        elementType: 'eCommerce',
        required: true,
        limits: { title: 17, description: 69, 'buttons[].text': 6, tag: 8 },
        count: { min: 1, max: 5, path: 'images' },
      },
    ],
  },
  {
    id: 'com.hbm.moreGoods',
    name: '电商(多商品)',
    group: 'ecommerce',
    category: 'service',
    description: '店铺头部 + 多个商品列表',
    vendors: VENDOR_SETS.core,
    protocols: ['aim'],
    slots: [
      {
        key: 'goods',
        label: '商品列表',
        elementType: 'moreGoods',
        required: true,
        limits: { title: 12, subtitle: 20, 'items[].name': 24, 'items[].button.text': 4 },
        count: { min: 2, max: 4, path: 'items' },
      },
    ],
  },
  {
    id: 'com.hbm.ecommerceCoupon.vertical',
    name: '券+商品(竖版)',
    group: 'ecommerce',
    category: 'service',
    description: '优惠券 + 竖向商品列表',
    vendors: VENDOR_SETS.huaweiFamily,
    protocols: ['aim'],
    slots: [
      {
        key: 'goods',
        label: '券与商品',
        elementType: 'ecommerceCoupon',
        required: true,
        limits: { title: 12, subtitle: 17, 'coupon.name': 11, 'coupon.description': 32, 'items[].name': 28 },
        count: { min: 1, max: 3, path: 'items' },
      },
    ],
  },
  {
    id: 'com.hbm.ecommerceCoupon.horizontal',
    name: '券+商品(横版)',
    group: 'ecommerce',
    category: 'service',
    description: '优惠券 + 横向三列商品',
    vendors: VENDOR_SETS.huaweiFamily,
    protocols: ['aim'],
    slots: [
      {
        key: 'goods',
        label: '券与商品',
        elementType: 'ecommerceCoupon',
        required: true,
        limits: { title: 12, subtitle: 17, 'coupon.name': 11, 'coupon.description': 32, 'items[].name': 8, 'items[].tag': 4 },
        count: { min: 3, max: 3, path: 'items' },
      },
    ],
  },
  {
    id: 'com.hbm.redpacket',
    name: '红包',
    group: 'ecommerce',
    category: 'service',
    description: '红包封面：发送方名称 + 祝福语 + 领取按钮',
    vendors: VENDOR_SETS.main,
    protocols: ['aim', 'rcs', 'rms'],
    slots: [
      image([[242, 320]], 'background', '红包底图'),
      image([R11], 'avatar', '头像'),
      { key: 'name', label: '发送方名称', elementType: 'text', maxLength: 18, required: true },
      { key: 'title', label: '红包标题', elementType: 'text', maxLength: 11, required: true },
      description(54),
      { ...button(), label: '领取按钮' },
    ],
  },
  {
    id: 'com.hbm.redpacketAnimation.v2',
    aliases: ['com.hbm.redpacketPersonal'],
    name: '个性化红包',
    group: 'ecommerce',
    category: 'service',
    isNew: true,
    description: '支持动效与个性化参数的红包',
    vendors: VENDOR_SETS.core,
    protocols: ['aim', 'rcs', 'rms'],
    slots: [
      image([[242, 320]], 'background', '红包底图'),
      image([R11], 'avatar', '头像'),
      { key: 'name', label: '发送方名称', elementType: 'text', maxLength: 13, required: true },
      { key: 'title', label: '红包标题', elementType: 'text', maxLength: 11, required: true },
      description(36),
      { ...button(), label: '领取按钮' },
    ],
  },
  {
    id: 'com.hbm.cardVoucher',
    name: '单卡券',
    group: 'ecommerce',
    category: 'service',
    description: '单张优惠券：面额、门槛、有效期、领取按钮',
    vendors: VENDOR_SETS.core,
    protocols: ['aim'],
    slots: [
      {
        key: 'voucher',
        label: '卡券',
        elementType: 'cardVoucher',
        required: true,
        limits: { name: 40, tagName: 6, threshold: 12, 'button.text': 6 },
      },
    ],
  },
  {
    id: 'com.hbm.cardVouchers',
    name: '多卡券',
    group: 'ecommerce',
    category: 'service',
    description: '多张优惠券列表，支持每张单独领取或底部统一按钮',
    vendors: VENDOR_SETS.core,
    protocols: ['aim'],
    slots: [
      {
        key: 'vouchers',
        label: '卡券列表',
        elementType: 'cardVouchers',
        required: true,
        limits: { title: 14, 'items[].name': 26, 'items[].tagName': 6 },
        count: { min: 2, max: 4, path: 'items' },
      },
    ],
  },

  /* ----------------------------- 通知 ----------------------------- */
  {
    id: 'com.hbm.notification',
    name: '一般通知类',
    group: 'notice',
    category: 'notify',
    description: '标题 + 描述 + 键值对信息 + 按钮，适合账单、物流、预约提醒',
    vendors: VENDOR_SETS.main,
    protocols: ['aim', 'rcs', 'rms'],
    settings: [
      {
        key: 'pairCount',
        label: '参数对数量',
        kind: 'radio',
        options: [2, 3, 4, 5, 6, 7, 8].map((n) => ({ value: n, label: `${n}对` })),
        defaultValue: 2,
      },
      { ...BUTTON_COUNT, defaultValue: 2 },
    ],
    slots: [
      image([[342, 120]], 'media', '顶部图片'),
      title(15),
      description(20),
      { key: 'kv.{i}.label', label: '参数名称', elementType: 'text', maxLength: 6, required: true, repeat: { setting: 'pairCount' } },
      { key: 'kv.{i}.value', label: '参数值', elementType: 'text', maxLength: 20, required: true, repeat: { setting: 'pairCount' } },
      buttons(),
    ],
  },
  {
    id: 'com.hbm.notificationPlus',
    name: '增强通知类',
    group: 'notice',
    category: 'notify',
    description: '突出关键数值（金额、验证码等）的增强通知',
    vendors: VENDOR_SETS.core,
    protocols: ['aim'],
    settings: [
      {
        key: 'pairCount',
        label: '参数对数量',
        kind: 'radio',
        options: [2, 3, 4, 5, 6, 7, 8].map((n) => ({ value: n, label: `${n}对` })),
        defaultValue: 2,
      },
      { ...BUTTON_COUNT, defaultValue: 2 },
    ],
    slots: [
      title(15),
      description(20),
      { key: 'highlight', label: '重点数值', elementType: 'text', maxLength: 12, required: true, hint: '建议使用参数，如 {#金额#}' },
      { key: 'highlightUnit', label: '数值说明', elementType: 'text', maxLength: 8 },
      { key: 'kv.{i}.label', label: '参数名称', elementType: 'text', maxLength: 6, required: true, repeat: { setting: 'pairCount' } },
      { key: 'kv.{i}.value', label: '参数值', elementType: 'text', maxLength: 20, required: true, repeat: { setting: 'pairCount' } },
      buttons(),
      image([[342, 120]], 'media', '底部图片'),
    ],
  },

  /* --------------------------- 行程通知 --------------------------- */
  ...(
    [
      ['com.hbm.ticket.train', '火车票类', 'train', '车次、出发/到达站与时间、座位信息'],
      ['com.hbm.ticket.bus', '汽车票类', 'bus', '班次、上车点、检票口等信息'],
      ['com.hbm.ticket.flight', '机票类', 'flight', '航班、航站楼、登机口与座位信息'],
      ['com.hbm.ticket.direct', '直飞', 'direct', '直飞航线行程与值机提醒'],
    ] as const
  ).map(
    ([id, name, kind, desc]): LayoutDefinition => ({
      id,
      name,
      group: 'trip',
      category: 'notify',
      description: desc,
      vendors: kind === 'direct' ? VENDOR_SETS.huaweiFamily : VENDOR_SETS.core,
      protocols: ['aim'],
      settings: [{ ...BUTTON_COUNT, defaultValue: 2 }],
      tags: [kind],
      slots: [
        title(15),
        {
          key: 'ticket',
          label: '行程信息',
          elementType: 'ticketImage',
          required: true,
          limits: { number: 10, 'from.name': 10, 'to.name': 10, 'grid[].label': 6, 'grid[].value': 12, tip: 60 },
        },
        buttons(),
      ],
    }),
  ),

  /* ----------------------------- 表单 ----------------------------- */
  {
    id: 'com.hbm.form.41',
    name: '两层表单_4-1',
    group: 'survey',
    category: 'service',
    description: '4 个信息项 + 1 个提交按钮，用于预约、报名',
    vendors: VENDOR_SETS.huaweiFamily,
    protocols: ['aim'],
    slots: [
      title(15),
      {
        key: 'form',
        label: '表单',
        elementType: 'form',
        required: true,
        limits: { 'fields[].label': 6, 'fields[].placeholder': 15, submitText: 6 },
        count: { min: 4, max: 4, path: 'fields' },
      },
    ],
  },
  {
    id: 'com.hbm.form.23',
    name: '两层表单_2-3',
    group: 'survey',
    category: 'service',
    description: '2 个填写项 + 3 个选择项的调研表单',
    vendors: VENDOR_SETS.huaweiFamily,
    protocols: ['aim'],
    slots: [
      title(15),
      {
        key: 'form',
        label: '表单',
        elementType: 'form',
        required: true,
        limits: { 'fields[].label': 6, 'fields[].placeholder': 15, submitText: 6 },
        count: { min: 5, max: 5, path: 'fields' },
      },
    ],
  },
  {
    id: 'com.hbm.textSelect',
    name: '文本单选',
    group: 'select',
    category: 'service',
    description: '问题 + 文本选项，点击选项触发对应事件',
    vendors: VENDOR_SETS.core,
    protocols: ['aim'],
    slots: [
      title(15),
      description(30),
      {
        key: 'options',
        label: '选项',
        elementType: 'textSelect',
        required: true,
        limits: { 'options[].title': 10 },
        count: { min: 2, max: 4, path: 'options' },
      },
      button(),
    ],
  },
  {
    id: 'com.hbm.imgSelect',
    name: '图片单选',
    group: 'select',
    category: 'service',
    description: '问题 + 图片选项（横向滑动）',
    vendors: VENDOR_SETS.core,
    protocols: ['aim'],
    slots: [
      title(15),
      {
        key: 'options',
        label: '图片选项',
        elementType: 'imgSelect',
        required: true,
        limits: { 'options[].title': 8 },
        count: { min: 2, max: 4, path: 'options' },
      },
      button(),
    ],
  },

  /* ---------------------------- 自由版式 ---------------------------- */
  {
    id: 'com.hbm.custom',
    name: '自由版式',
    group: 'custom',
    category: 'service',
    description: '从空白画布开始，自由添加、拖拽与组合 32 种元素',
    vendors: VENDOR_SETS.huaweiFamily,
    protocols: ['aim'],
    free: true,
    slots: [],
  },
]

const LAYOUT_INDEX = new Map<string, LayoutDefinition>()
for (const layout of LAYOUTS) {
  LAYOUT_INDEX.set(layout.id, layout)
  for (const alias of layout.aliases ?? []) LAYOUT_INDEX.set(alias, layout)
  for (const v of Object.values(layout.variants?.map ?? {})) LAYOUT_INDEX.set(v, layout)
}

/** 通过 cardId（含历史别名/变体）查找版式 */
export function getLayout(id: string): LayoutDefinition | undefined {
  return LAYOUT_INDEX.get(id)
}

export function requireLayout(id: string): LayoutDefinition {
  const layout = getLayout(id)
  if (!layout) throw new Error(`未知版式：${id}`)
  return layout
}

/** 版式默认设置 */
export function defaultLayoutSettings(layout: LayoutDefinition): Record<string, unknown> {
  return Object.fromEntries((layout.settings ?? []).map((s) => [s.key, s.defaultValue]))
}

/** 根据设置解析实际下发 cardId */
export function resolveCardId(layout: LayoutDefinition, settings: Record<string, unknown>): string {
  if (!layout.variants) return layout.id
  return layout.variants.map[String(settings[layout.variants.setting])] ?? layout.id
}

/** 版式是否支持某厂商 */
export function layoutSupportsVendor(layoutId: string, vendor: VendorId): boolean {
  return getLayout(layoutId)?.vendors.includes(vendor) ?? false
}

/** 按分类 → 分组 组织版式（编辑器版式库） */
export function groupLayouts(category?: TemplateCategory) {
  const groups = Object.entries(LAYOUT_GROUPS) as [LayoutGroup, (typeof LAYOUT_GROUPS)[LayoutGroup]][]
  return groups
    .filter(([, g]) => !category || g.category === category)
    .map(([key, g]) => ({ key, label: g.label, layouts: LAYOUTS.filter((l) => l.group === key) }))
    .filter((g) => g.layouts.length > 0)
}

/** 展开重复槽位：`kv.{i}.label` + pairCount=3 → kv.0.label, kv.1.label, kv.2.label */
export function expandSlots(layout: LayoutDefinition, settings: Record<string, unknown>): SlotDefinition[] {
  const out: SlotDefinition[] = []
  const slots = layout.slots
  for (let s = 0; s < slots.length; s++) {
    const slot = slots[s]!
    if (!slot.repeat) {
      out.push(slot)
      continue
    }
    // 相邻且共用同一设置的重复槽位按“条目”交错展开
    const group = [slot]
    while (slots[s + 1]?.repeat?.setting === slot.repeat.setting) group.push(slots[++s]!)
    const n = Number(settings[slot.repeat.setting] ?? 1)
    for (let i = 0; i < n; i++) {
      for (const g of group) {
        out.push({ ...g, key: g.key.replace('{i}', String(i)), label: `${g.label}${n > 1 ? i + 1 : ''}`, repeat: undefined })
      }
    }
  }
  return out
}
