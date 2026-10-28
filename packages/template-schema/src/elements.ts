import { z } from 'zod'
import { actionEventSchema } from './actions'

/* ------------------------------------------------------------------ */
/* 元素类型                                                             */
/* ------------------------------------------------------------------ */

export const ELEMENT_TYPES = [
  // 基础
  'text',
  'image',
  'video',
  'audio',
  'button',
  'hotZone',
  'shape',
  'qrCode',
  // 媒体组合
  'swiper',
  'sideslip',
  // 营销
  'eCommerce',
  'moreGoods',
  'ecommerceCoupon',
  'cardVoucher',
  'cardVouchers',
  'countdown',
  // 服务
  'ticketImage',
  'tel',
  'map',
  'serviceNumber',
  'agreement',
  // 表单
  'form',
  'input',
  'textarea',
  'radioGroup',
  'checkboxGroup',
  'picker',
  'datePicker',
  'timePicker',
  'textSelect',
  'imgSelect',
  'submitButton',
] as const
export type ElementType = (typeof ELEMENT_TYPES)[number]
export const elementTypeSchema = z.enum(ELEMENT_TYPES)

export type ElementGroup = 'basic' | 'media' | 'marketing' | 'service' | 'form'

export const ELEMENT_META: Record<
  ElementType,
  { label: string; group: ElementGroup; clickable: boolean }
> = {
  text: { label: '文本', group: 'basic', clickable: true },
  image: { label: '图片', group: 'basic', clickable: true },
  video: { label: '视频', group: 'basic', clickable: false },
  audio: { label: '音频', group: 'basic', clickable: false },
  button: { label: '按钮', group: 'basic', clickable: true },
  hotZone: { label: '热区', group: 'basic', clickable: true },
  shape: { label: '形状', group: 'basic', clickable: false },
  qrCode: { label: '二维码', group: 'basic', clickable: false },
  swiper: { label: '轮播', group: 'media', clickable: true },
  sideslip: { label: '横滑卡片', group: 'media', clickable: true },
  eCommerce: { label: '电商商品', group: 'marketing', clickable: true },
  moreGoods: { label: '多商品', group: 'marketing', clickable: true },
  ecommerceCoupon: { label: '券+商品', group: 'marketing', clickable: true },
  cardVoucher: { label: '单卡券', group: 'marketing', clickable: true },
  cardVouchers: { label: '多卡券', group: 'marketing', clickable: true },
  countdown: { label: '倒计时', group: 'marketing', clickable: true },
  ticketImage: { label: '票据信息', group: 'service', clickable: false },
  tel: { label: '电话', group: 'service', clickable: true },
  map: { label: '地图', group: 'service', clickable: true },
  serviceNumber: { label: '服务号', group: 'service', clickable: true },
  agreement: { label: '协议', group: 'service', clickable: false },
  form: { label: '表单', group: 'form', clickable: false },
  input: { label: '输入框', group: 'form', clickable: false },
  textarea: { label: '多行输入', group: 'form', clickable: false },
  radioGroup: { label: '单选', group: 'form', clickable: false },
  checkboxGroup: { label: '多选', group: 'form', clickable: false },
  picker: { label: '下拉选择', group: 'form', clickable: false },
  datePicker: { label: '日期选择', group: 'form', clickable: false },
  timePicker: { label: '时间选择', group: 'form', clickable: false },
  textSelect: { label: '文本单选', group: 'form', clickable: true },
  imgSelect: { label: '图片单选', group: 'form', clickable: true },
  submitButton: { label: '提交按钮', group: 'form', clickable: true },
}

/* ------------------------------------------------------------------ */
/* 公共结构                                                             */
/* ------------------------------------------------------------------ */

export const ratioSchema = z.tuple([z.number().positive(), z.number().positive()])
export type Ratio = z.infer<typeof ratioSchema>

export const RATIO_OPTIONS: { value: string; label: string; ratio: Ratio }[] = [
  { value: '16:9', label: '16:9 横版', ratio: [16, 9] },
  { value: '1:1', label: '1:1 方图', ratio: [1, 1] },
  { value: '3:4', label: '3:4 竖版', ratio: [3, 4] },
  { value: '9:16', label: '9:16 全屏竖版', ratio: [9, 16] },
  { value: '21:9', label: '21:9 通栏', ratio: [21, 9] },
]

export const elementStyleSchema = z
  .object({
    color: z.string(),
    backgroundColor: z.string(),
    fontSize: z.number(),
    fontWeight: z.union([z.number(), z.string()]),
    lineHeight: z.number(),
    textAlign: z.enum(['left', 'center', 'right', 'justify']),
    letterSpacing: z.number(),
    lineClamp: z.number().int(),
    borderRadius: z.number(),
    borderWidth: z.number(),
    borderColor: z.string(),
    borderStyle: z.enum(['none', 'solid', 'dashed', 'dotted']),
    padding: z.number(),
    opacity: z.number().min(0).max(1),
  })
  .partial()
export type ElementStyle = z.infer<typeof elementStyleSchema>

export const linkButtonSchema = z.object({
  text: z.string(),
  event: actionEventSchema.optional(),
})
export type LinkButton = z.infer<typeof linkButtonSchema>

export const mediaItemSchema = z.object({
  src: z.string(),
  cover: z.string().optional(),
  title: z.string().optional(),
  event: actionEventSchema.optional(),
  /** 素材参数（图片可为动态参数，如 {#banner#}） */
  srcParam: z.string().optional(),
})
export type MediaItem = z.infer<typeof mediaItemSchema>

const labelValue = z.object({ label: z.string(), value: z.string() })

const voucherSchema = z.object({
  voucherType: z.enum(['fullMinus', 'discount', 'custom']).default('fullMinus'),
  /** 面额 / 折扣数值 */
  amount: z.string(),
  /** 使用门槛文案，如 满1000可用 */
  threshold: z.string(),
  /** 券类型标签，如 满减券 */
  tagName: z.string(),
  name: z.string(),
  dateType: z.enum(['fixed', 'days', 'custom']).default('fixed'),
  dateRange: z.tuple([z.string(), z.string()]).optional(),
  days: z.number().optional(),
  customDate: z.string().optional(),
  image: z.string().optional(),
  button: linkButtonSchema.optional(),
})
export type Voucher = z.infer<typeof voucherSchema>

/* ------------------------------------------------------------------ */
/* 各类型 props                                                          */
/* ------------------------------------------------------------------ */

export const elementPropsSchemas = {
  text: z.object({
    /** 文本（支持 {#参数#} 与有限的内联格式标签） */
    text: z.string(),
    /** 富文本（含 b/i/u/span 等） */
    rich: z.boolean().optional(),
  }),
  image: z.object({
    src: z.string(),
    srcParam: z.string().optional(),
    ratio: ratioSchema.optional(),
    fit: z.enum(['cover', 'contain', 'fill']).optional(),
    alt: z.string().optional(),
    /** 角色：背景图 / 头像（红包等版式使用） */
    role: z.enum(['content', 'background', 'avatar', 'logo']).optional(),
  }),
  video: z.object({
    src: z.string(),
    cover: z.string(),
    duration: z.number().optional(),
    size: z.number().optional(),
    ratio: ratioSchema.optional(),
  }),
  audio: z.object({
    src: z.string(),
    title: z.string(),
    /** 毫秒 */
    duration: z.number(),
    size: z.number().optional(),
  }),
  button: z.object({
    text: z.string(),
    variant: z.enum(['primary', 'secondary', 'text']).optional(),
  }),
  hotZone: z.object({ label: z.string().optional() }),
  shape: z.object({ shape: z.enum(['rect', 'line', 'circle']).default('rect') }),
  qrCode: z.object({ src: z.string(), content: z.string().optional() }),
  swiper: z.object({
    items: z.array(mediaItemSchema),
    resourceType: z.enum(['image', 'video']).default('image'),
    ratio: ratioSchema,
    loop: z.boolean().default(true),
    autoplay: z.boolean().default(true),
    interval: z.number().default(3),
    indicator: z.boolean().default(true),
  }),
  sideslip: z.object({
    ratio: ratioSchema,
    showContent: z.boolean().default(true),
    cards: z.array(
      z.object({
        src: z.string(),
        title: z.string(),
        content: z.string(),
        buttons: z.array(linkButtonSchema),
        event: actionEventSchema.optional(),
      }),
    ),
  }),
  eCommerce: z.object({
    media: z.enum(['image', 'video']).default('image'),
    images: z.array(mediaItemSchema),
    video: z.object({ src: z.string(), cover: z.string() }).optional(),
    currency: z.string().default('¥'),
    price: z.string(),
    originalPrice: z.string().optional(),
    tag: z.string().optional(),
    title: z.string(),
    description: z.string(),
    buttons: z.array(linkButtonSchema),
    /** 主题色索引 0-5 */
    themeColor: z.number().int().min(0).max(5).default(0),
  }),
  moreGoods: z.object({
    title: z.string(),
    subtitle: z.string(),
    showIcon: z.boolean().default(true),
    items: z.array(
      z.object({
        image: z.string(),
        name: z.string(),
        description: z.string().optional(),
        price: z.string(),
        originalPrice: z.string().optional(),
        tag: z.string().optional(),
        button: linkButtonSchema,
      }),
    ),
  }),
  ecommerceCoupon: z.object({
    direction: z.enum(['vertical', 'horizontal']),
    logo: z.string().optional(),
    title: z.string(),
    subtitle: z.string(),
    coupon: z.object({
      amount: z.string(),
      name: z.string(),
      description: z.string(),
      pickStyle: z.enum(['pick', 'grab']).default('pick'),
      event: actionEventSchema.optional(),
    }),
    items: z.array(
      z.object({
        image: z.string(),
        name: z.string(),
        price: z.string(),
        tag: z.string().optional(),
        button: linkButtonSchema.optional(),
      }),
    ),
  }),
  cardVoucher: voucherSchema.extend({ dynamicButton: z.boolean().optional() }),
  cardVouchers: z.object({
    title: z.string(),
    items: z.array(voucherSchema),
    buttonMode: z.enum(['bottom', 'each']).default('each'),
    button: linkButtonSchema.optional(),
  }),
  countdown: z.object({
    /** 结束时间戳（毫秒） */
    endTime: z.number(),
    label: z.string().default('距活动结束'),
  }),
  ticketImage: z.object({
    kind: z.enum(['train', 'bus', 'flight', 'direct']),
    from: z.object({ name: z.string(), time: z.string(), date: z.string().optional() }),
    to: z.object({ name: z.string(), time: z.string(), date: z.string().optional() }),
    /** 车次 / 航班号 */
    number: z.string(),
    duration: z.string().optional(),
    grid: z.array(labelValue),
    extra: z.array(labelValue).optional(),
    tip: z.string().optional(),
  }),
  tel: z.object({
    styleType: z.enum(['text', 'icon', 'pic']).default('text'),
    text: z.string(),
    phone: z.string(),
    image: z.string().optional(),
  }),
  map: z.object({
    mode: z.enum(['card', 'text']).default('card'),
    title: z.string(),
    address: z.string(),
    longitude: z.number(),
    latitude: z.number(),
  }),
  serviceNumber: z.object({
    mode: z.enum(['profile', 'guide']).default('profile'),
    avatar: z.string(),
    name: z.string(),
    description: z.string().optional(),
  }),
  agreement: z.object({
    text: z.string(),
    links: z.array(z.object({ text: z.string(), url: z.string() })),
  }),
  form: z.object({
    title: z.string().optional(),
    fields: z.array(
      z.object({
        label: z.string(),
        placeholder: z.string(),
        type: z.enum(['input', 'select', 'date', 'phone']).default('input'),
        required: z.boolean().optional(),
        options: z.array(z.string()).optional(),
      }),
    ),
    privacyText: z.string().default('同意用户隐私协议'),
    submitText: z.string().default('提交'),
  }),
  input: z.object({
    label: z.string(),
    placeholder: z.string(),
    inputStyle: z.enum(['line', 'box']).default('box'),
  }),
  textarea: z.object({
    label: z.string(),
    placeholder: z.string(),
    inputStyle: z.enum(['line', 'box']).default('box'),
  }),
  radioGroup: z.object({ label: z.string(), options: z.array(z.string()) }),
  checkboxGroup: z.object({ label: z.string(), options: z.array(z.string()) }),
  picker: z.object({ label: z.string(), placeholder: z.string(), options: z.array(z.string()) }),
  datePicker: z.object({ label: z.string(), placeholder: z.string() }),
  timePicker: z.object({ label: z.string(), placeholder: z.string() }),
  textSelect: z.object({
    options: z.array(z.object({ title: z.string(), event: actionEventSchema.optional() })),
    activeIndex: z.number().int().default(0),
  }),
  imgSelect: z.object({
    options: z.array(
      z.object({ title: z.string(), src: z.string(), event: actionEventSchema.optional() }),
    ),
    showTitle: z.boolean().default(true),
    activeIndex: z.number().int().default(0),
  }),
  submitButton: z.object({ text: z.string() }),
} satisfies Record<ElementType, z.ZodType>

export type ElementPropsMap = { [K in ElementType]: z.infer<(typeof elementPropsSchemas)[K]> }

/* ------------------------------------------------------------------ */
/* 元素                                                                 */
/* ------------------------------------------------------------------ */

export const elementBaseSchema = z.object({
  id: z.string().min(1),
  type: elementTypeSchema,
  /** 画布坐标（以 CANVAS_WIDTH=342 为基准） */
  x: z.number(),
  y: z.number(),
  w: z.number().nonnegative(),
  h: z.number().nonnegative(),
  z: z.number().int().default(0),
  angle: z.number().default(0),
  visible: z.boolean().default(true),
  locked: z.boolean().default(false),
  /** 结构化版式中的槽位 key（自由版式可为空） */
  slot: z.string().optional(),
  style: elementStyleSchema.default({}),
  event: actionEventSchema.optional(),
})
export type ElementBase = z.infer<typeof elementBaseSchema>

/** 指定类型的元素 */
export type TemplateElement<T extends ElementType = ElementType> = Omit<ElementBase, 'type'> & {
  type: T
  props: ElementPropsMap[T]
}

/** 任意元素（可通过 type 收窄） */
export type AnyElement = { [K in ElementType]: TemplateElement<K> }[ElementType]

/** 按 type 同时解析基础属性和 props，返回可收窄的联合类型。 */
export const templateElementSchema = z.discriminatedUnion('type', [
  elementBaseSchema.extend({ type: z.literal('text'), props: elementPropsSchemas.text }),
  elementBaseSchema.extend({ type: z.literal('image'), props: elementPropsSchemas.image }),
  elementBaseSchema.extend({ type: z.literal('video'), props: elementPropsSchemas.video }),
  elementBaseSchema.extend({ type: z.literal('audio'), props: elementPropsSchemas.audio }),
  elementBaseSchema.extend({ type: z.literal('button'), props: elementPropsSchemas.button }),
  elementBaseSchema.extend({ type: z.literal('hotZone'), props: elementPropsSchemas.hotZone }),
  elementBaseSchema.extend({ type: z.literal('shape'), props: elementPropsSchemas.shape }),
  elementBaseSchema.extend({ type: z.literal('qrCode'), props: elementPropsSchemas.qrCode }),
  elementBaseSchema.extend({ type: z.literal('swiper'), props: elementPropsSchemas.swiper }),
  elementBaseSchema.extend({ type: z.literal('sideslip'), props: elementPropsSchemas.sideslip }),
  elementBaseSchema.extend({ type: z.literal('eCommerce'), props: elementPropsSchemas.eCommerce }),
  elementBaseSchema.extend({ type: z.literal('moreGoods'), props: elementPropsSchemas.moreGoods }),
  elementBaseSchema.extend({
    type: z.literal('ecommerceCoupon'),
    props: elementPropsSchemas.ecommerceCoupon,
  }),
  elementBaseSchema.extend({
    type: z.literal('cardVoucher'),
    props: elementPropsSchemas.cardVoucher,
  }),
  elementBaseSchema.extend({
    type: z.literal('cardVouchers'),
    props: elementPropsSchemas.cardVouchers,
  }),
  elementBaseSchema.extend({ type: z.literal('countdown'), props: elementPropsSchemas.countdown }),
  elementBaseSchema.extend({
    type: z.literal('ticketImage'),
    props: elementPropsSchemas.ticketImage,
  }),
  elementBaseSchema.extend({ type: z.literal('tel'), props: elementPropsSchemas.tel }),
  elementBaseSchema.extend({ type: z.literal('map'), props: elementPropsSchemas.map }),
  elementBaseSchema.extend({
    type: z.literal('serviceNumber'),
    props: elementPropsSchemas.serviceNumber,
  }),
  elementBaseSchema.extend({ type: z.literal('agreement'), props: elementPropsSchemas.agreement }),
  elementBaseSchema.extend({ type: z.literal('form'), props: elementPropsSchemas.form }),
  elementBaseSchema.extend({ type: z.literal('input'), props: elementPropsSchemas.input }),
  elementBaseSchema.extend({ type: z.literal('textarea'), props: elementPropsSchemas.textarea }),
  elementBaseSchema.extend({
    type: z.literal('radioGroup'),
    props: elementPropsSchemas.radioGroup,
  }),
  elementBaseSchema.extend({
    type: z.literal('checkboxGroup'),
    props: elementPropsSchemas.checkboxGroup,
  }),
  elementBaseSchema.extend({ type: z.literal('picker'), props: elementPropsSchemas.picker }),
  elementBaseSchema.extend({
    type: z.literal('datePicker'),
    props: elementPropsSchemas.datePicker,
  }),
  elementBaseSchema.extend({
    type: z.literal('timePicker'),
    props: elementPropsSchemas.timePicker,
  }),
  elementBaseSchema.extend({
    type: z.literal('textSelect'),
    props: elementPropsSchemas.textSelect,
  }),
  elementBaseSchema.extend({ type: z.literal('imgSelect'), props: elementPropsSchemas.imgSelect }),
  elementBaseSchema.extend({
    type: z.literal('submitButton'),
    props: elementPropsSchemas.submitButton,
  }),
])

/** 类型守卫 */
export function isElementOf<T extends ElementType>(
  el: AnyElement | TemplateElement,
  type: T,
): el is TemplateElement<T> {
  return el.type === type
}
