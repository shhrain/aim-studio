import { CANVAS_WIDTH, type Ratio, type TemplatePage } from '@aim/template-schema'
import { placeholderImage, redpacketBackground, sampleAvatar, sampleImage } from '../assets'
import { createElement } from '../elements/factory'
import { defineBlueprint, type LayoutBlueprint } from '../registry'
import { FlowBuilder, INNER, PAD, textHeight } from './flow'

const W = CANVAS_WIDTH
const TITLE_STYLE = { fontSize: 17, fontWeight: 600, color: '#1F2329', lineHeight: 1.45 }
const DESC_STYLE = { fontSize: 13, color: '#646A73', lineHeight: 1.6 }

export function parseRatio(value: unknown, fallback: Ratio = [16, 9]): Ratio {
  if (Array.isArray(value) && value.length === 2) return value as Ratio
  if (typeof value === 'string' && value.includes(':')) {
    const [a, b] = value.split(':').map(Number)
    if (a && b) return [a, b]
  }
  return fallback
}

const heightOf = (ratio: Ratio, width = W) => Math.round((width * ratio[1]) / ratio[0])

function page(
  b: FlowBuilder,
  extra: Partial<TemplatePage['style']> = {},
  bottom = PAD,
): Omit<TemplatePage, 'id'> {
  return {
    mode: 'flow',
    style: { height: b.height + bottom, backgroundColor: '#FFFFFF', borderRadius: 12, ...extra },
    elements: b.elements,
  }
}

function title(b: FlowBuilder, max: number, slot = 'title', gapAfter = 6) {
  return b.add('text', {
    slot,
    x: PAD,
    w: INNER,
    h: textHeight(max, 17, INNER, 1.45),
    props: { text: `编辑标题，最多显示${max}个字` },
    style: { ...TITLE_STYLE, lineClamp: max > 17 ? 2 : 1 },
    gapAfter,
  })
}

function desc(b: FlowBuilder, max: number, slot = 'description', gapAfter = 12) {
  return b.add('text', {
    slot,
    x: PAD,
    w: INNER,
    h: textHeight(max, 13, INNER, 1.6),
    props: { text: `编辑文本描述，最多显示${max}个字。` },
    style: { ...DESC_STYLE, lineClamp: Math.ceil(max / Math.floor(INNER / 13)) },
    gapAfter,
  })
}

function buttons(b: FlowBuilder, count: number, labels = ['编辑按钮', '编辑按钮']) {
  if (count <= 1) {
    b.add('button', {
      slot: 'button.0',
      x: PAD,
      w: INNER,
      h: 40,
      props: { text: labels[0]!, variant: 'primary' },
    })
    return
  }
  b.row(
    'button',
    Array.from({ length: count }, (_, i) => ({
      slot: `button.${i}`,
      props: {
        text: labels[i] ?? '编辑按钮',
        variant: i === count - 1 ? ('primary' as const) : ('secondary' as const),
      },
    })),
    { h: 40, gap: 12 },
  )
}

function media(b: FlowBuilder, ratio: Ratio, label = '点击替换图片', gapAfter = 12) {
  const h = heightOf(ratio)
  return b.add('image', {
    slot: 'media',
    x: 0,
    w: W,
    h,
    props: { src: placeholderImage(W, h, label), ratio, fit: 'cover', role: 'content' },
    style: { borderRadius: 0 },
    gapAfter,
  })
}

function video(b: FlowBuilder, ratio: Ratio, gapAfter = 12) {
  const h = heightOf(ratio)
  return b.add('video', {
    slot: 'media',
    x: 0,
    w: W,
    h,
    props: { src: '', cover: placeholderImage(W, h, '点击上传视频'), ratio },
    gapAfter,
  })
}

function swiper(b: FlowBuilder, ratio: Ratio, resourceType: 'image' | 'video', count = 3) {
  const h = heightOf(ratio)
  return b.add('swiper', {
    slot: 'media',
    x: 0,
    w: W,
    h,
    props: {
      items: Array.from({ length: count }, (_, i) => ({
        src: resourceType === 'video' ? '' : sampleImage(i, W, h, `轮播图 ${i + 1}`),
        cover: resourceType === 'video' ? sampleImage(i + 3, W, h, `视频 ${i + 1}`) : undefined,
        event: { action: 'OPEN_URL' as const, target: '' },
      })),
      resourceType,
      ratio,
    },
    gapAfter: 12,
  })
}

/** 键值对行（通知类） */
function pairs(b: FlowBuilder, count: number) {
  for (let i = 0; i < count; i++) {
    const y = b.y
    b.add('text', {
      slot: `kv.${i}.label`,
      x: PAD,
      y,
      w: 84,
      h: 21,
      props: { text: '编辑名称' },
      style: { fontSize: 13, color: '#8F959E', lineHeight: 1.6, lineClamp: 1 },
    })
    b.add('text', {
      slot: `kv.${i}.value`,
      x: PAD + 92,
      y,
      w: INNER - 92,
      h: 21,
      props: { text: `{#param${i + 2}#}` },
      style: { fontSize: 13, color: '#1F2329', lineHeight: 1.6, lineClamp: 1 },
      gapAfter: 6,
    })
  }
  b.gap(8)
}

const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d)

export const builtinBlueprints: Record<string, LayoutBlueprint> = {
  /* ---------------- 图文 ---------------- */
  'com.hbm.imageandtext': defineBlueprint(() => {
    const b = new FlowBuilder()
    media(b, [16, 9])
    title(b, 17)
    desc(b, 69)
    buttons(b, 1)
    return page(b)
  }),

  'com.hbm.sideslip': defineBlueprint(({ settings }) => {
    const b = new FlowBuilder().gap(PAD)
    const ratio = parseRatio(settings.ratio)
    const n = num(settings.cardCount, 2)
    const el = createElement('sideslip', { slot: 'cards', x: 0, y: b.y, w: W, h: 0 })
    el.props.ratio = ratio
    el.props.cards = Array.from({ length: n }, (_, i) => ({
      src: sampleImage(i + 2, 210, heightOf(ratio, 210)),
      title: '编辑标题，最多显示13个字',
      content: '编辑文本，最多显示30个字。编辑文本，最多显示30个字。',
      buttons: [{ text: '编辑按钮', event: { action: 'OPEN_URL', target: '' } }],
    }))
    el.h = heightOf(ratio, 210) + 150
    b.elements.push(el)
    b.y += el.h
    return page(b, { backgroundColor: 'transparent' }, 0)
  }),

  'com.hbm.standardimageandtext': defineBlueprint(({ settings }) => {
    const b = new FlowBuilder()
    const h = heightOf([16, 9])
    const cover = media(b, [16, 9], '头条图片', 0)
    b.add('text', {
      slot: 'title',
      x: PAD,
      y: cover.y + h - 52,
      w: INNER,
      h: 44,
      props: { text: '编辑文本，最多显示30个字。编辑文本，最多显示30个字。' },
      style: { fontSize: 15, fontWeight: 600, color: '#FFFFFF', lineHeight: 1.45, lineClamp: 2 },
      gapAfter: 16,
    })
    b.y = cover.y + h + 12
    for (let i = 0; i < num(settings.itemCount, 2); i++) {
      const y = b.y
      b.add('text', {
        slot: `item.${i}.text`,
        x: PAD,
        y,
        w: INNER - 72,
        h: 44,
        props: { text: '编辑文本，最多显示30个字。编辑，最多显示30个字。' },
        style: { fontSize: 14, color: '#1F2329', lineHeight: 1.55, lineClamp: 2 },
      })
      b.add('image', {
        slot: `item.${i}.image`,
        x: W - PAD - 60,
        y,
        w: 60,
        h: 60,
        props: { src: sampleImage(i + 1, 60, 60), ratio: [1, 1], fit: 'cover' },
        style: { borderRadius: 6 },
        gapAfter: 12,
      })
    }
    return page(b, {}, 2)
  }),

  'com.hbm.standardimageandtext2.v2': defineBlueprint(({ settings }) => {
    const b = new FlowBuilder().gap(PAD)
    for (let i = 0; i < num(settings.itemCount, 2); i++) {
      const y = b.y
      b.add('text', {
        slot: `item.${i}.text`,
        x: PAD,
        y,
        w: INNER - 96,
        h: 66,
        props: { text: '编辑文本，最多显示30个字。编辑文本，最多显示30个字。' },
        style: { fontSize: 15, color: '#1F2329', lineHeight: 1.5, lineClamp: 3 },
      })
      b.add('image', {
        slot: `item.${i}.image`,
        x: W - PAD - 84,
        y,
        w: 84,
        h: 66,
        props: { src: sampleImage(i + 4, 84, 66), ratio: [4, 3], fit: 'cover' },
        style: { borderRadius: 8 },
        gapAfter: 14,
      })
    }
    return page(b, {}, 0)
  }),

  'com.hbm.carouselImageSixteenToNine': defineBlueprint(({ settings }) => {
    const b = new FlowBuilder()
    swiper(b, parseRatio(settings.ratio), 'image')
    title(b, 17)
    desc(b, 253)
    buttons(b, 1)
    return page(b)
  }),

  'com.hbm.carouselImage.v2': defineBlueprint(({ settings }) => {
    const b = new FlowBuilder()
    swiper(b, [16, 9], 'image')
    title(b, 19)
    desc(b, 130)
    buttons(b, num(settings.buttonCount, 2))
    return page(b)
  }),

  'com.hbm.pureText': defineBlueprint(() => {
    const b = new FlowBuilder().gap(PAD)
    title(b, 15, 'title', 8)
    desc(b, 350)
    buttons(b, 1)
    return page(b)
  }),

  'com.hbm.poster': defineBlueprint(() => {
    const b = new FlowBuilder()
    media(b, [3, 4], '点击上传海报', 0)
    return page(b, {}, 0)
  }),

  /* ---------------- 视频图文 ---------------- */
  'com.hbm.video': defineBlueprint(() => {
    const b = new FlowBuilder()
    video(b, [16, 9])
    title(b, 17)
    desc(b, 69)
    buttons(b, 1)
    return page(b)
  }),

  'com.hbm.imageVideo': defineBlueprint(() => {
    const b = new FlowBuilder().gap(PAD)
    title(b, 17)
    desc(b, 69)
    video(b, [16, 9])
    buttons(b, 1)
    return page(b)
  }),

  'com.hbm.pureVideo': defineBlueprint(() => {
    const b = new FlowBuilder()
    video(b, [1, 1])
    title(b, 17)
    desc(b, 69)
    buttons(b, 1)
    return page(b)
  }),

  'com.hbm.shortVideoImage.v2': defineBlueprint(({ settings }) => {
    const b = new FlowBuilder()
    media(b, [3, 4], '上传剧照')
    title(b, 17)
    desc(b, 69)
    buttons(b, num(settings.buttonCount, 2), ['加入追剧', '立即观看'])
    return page(b)
  }),

  'com.hbm.shortVideo.v2': defineBlueprint(({ settings }) => {
    const b = new FlowBuilder()
    video(b, [3, 4])
    title(b, 17)
    desc(b, 69)
    buttons(b, num(settings.buttonCount, 2), ['加入追剧', '立即观看'])
    return page(b)
  }),

  'com.hbm.carouselVideo': defineBlueprint(() => {
    const b = new FlowBuilder()
    swiper(b, [16, 9], 'video')
    title(b, 17)
    desc(b, 253)
    buttons(b, 1)
    return page(b)
  }),

  /* ---------------- 电商 ---------------- */
  'com.hbm.ecommerce': defineBlueprint(({ settings }) => {
    const b = new FlowBuilder()
    const el = b.add('eCommerce', { slot: 'goods', x: 0, w: W, h: 520 })
    el.props.themeColor = num(settings.themeColor, 1)
    return page(b, {}, 0)
  }),

  'com.hbm.ecommerce.v2': defineBlueprint(({ settings }) => {
    const b = new FlowBuilder()
    const el = b.add('eCommerce', { slot: 'goods', x: 0, w: W, h: 520 })
    el.props.media = settings.media === 'video' ? 'video' : 'image'
    el.props.video = { src: '', cover: sampleImage(6, W, W, '商品视频') }
    el.props.themeColor = 4
    return page(b, {}, 0)
  }),

  'com.hbm.moreGoods': defineBlueprint(() => {
    const b = new FlowBuilder()
    b.add('moreGoods', { slot: 'goods', x: 0, w: W, h: 440 })
    return page(b, { backgroundColor: '#F5F6F8' }, 0)
  }),

  'com.hbm.ecommerceCoupon.vertical': defineBlueprint(() => {
    const b = new FlowBuilder()
    b.add('ecommerceCoupon', { slot: 'goods', x: 0, w: W, h: 520 })
    return page(b, { backgroundColor: '#FFF3EC' }, 0)
  }),

  'com.hbm.ecommerceCoupon.horizontal': defineBlueprint(() => {
    const b = new FlowBuilder()
    const el = b.add('ecommerceCoupon', { slot: 'goods', x: 0, w: W, h: 360 })
    el.props.direction = 'horizontal'
    el.props.items = el.props.items.map((i) => ({ ...i, name: '编辑文本', tag: '编辑标签' }))
    return page(b, { backgroundColor: '#FFF3EC' }, 0)
  }),

  'com.hbm.redpacket': defineBlueprint(() => redpacket(18, 54)),
  'com.hbm.redpacketAnimation.v2': defineBlueprint(() => redpacket(13, 36)),

  'com.hbm.cardVoucher': defineBlueprint(() => {
    const b = new FlowBuilder()
    b.add('cardVoucher', { slot: 'voucher', x: 0, w: W, h: 210 })
    return page(b, { backgroundColor: 'transparent' }, 0)
  }),

  'com.hbm.cardVouchers': defineBlueprint(() => {
    const b = new FlowBuilder()
    b.add('cardVouchers', { slot: 'vouchers', x: 0, w: W, h: 300 })
    return page(b, { backgroundColor: '#FFF6F0' }, 0)
  }),

  /* ---------------- 通知 ---------------- */
  'com.hbm.notification': defineBlueprint(({ settings }) => {
    const b = new FlowBuilder()
    media(b, [342, 120], '顶部图片（可选）')
    title(b, 15)
    desc(b, 20, 'description', 10)
    pairs(b, num(settings.pairCount, 2))
    buttons(b, num(settings.buttonCount, 2))
    return page(b)
  }),

  'com.hbm.notificationPlus': defineBlueprint(({ settings }) => {
    const b = new FlowBuilder().gap(PAD)
    title(b, 15)
    desc(b, 20, 'description', 10)
    const y = b.y
    b.add('text', {
      slot: 'highlight',
      x: PAD,
      y,
      w: 150,
      h: 36,
      props: { text: '{#param1#}' },
      style: { fontSize: 26, fontWeight: 700, color: '#E8A33D', lineHeight: 1.35, lineClamp: 1 },
    })
    b.add('text', {
      slot: 'highlightUnit',
      x: PAD + 156,
      y: y + 10,
      w: INNER - 156,
      h: 20,
      props: { text: '编辑文本' },
      style: { fontSize: 13, color: '#646A73', lineHeight: 1.5, lineClamp: 1 },
    })
    b.y = y + 36 + 12
    pairs(b, num(settings.pairCount, 2))
    buttons(b, num(settings.buttonCount, 2))
    b.gap(14)
    b.add('image', {
      slot: 'media',
      x: PAD,
      w: INNER,
      h: 110,
      props: {
        src: placeholderImage(INNER, 110, '底部图片（可选）'),
        ratio: [INNER, 110],
        fit: 'cover',
      },
      style: { borderRadius: 8 },
    })
    return page(b)
  }),

  /* ---------------- 行程通知 ---------------- */
  ...Object.fromEntries(
    (['train', 'bus', 'flight', 'direct'] as const).map((kind) => [
      `com.hbm.ticket.${kind}`,
      defineBlueprint(({ settings }) => {
        const b = new FlowBuilder().gap(PAD)
        title(b, 15, 'title', 10)
        const ticket = b.add('ticketImage', { slot: 'ticket', x: 0, w: W, h: 230, gapAfter: 12 })
        ticket.props.kind = kind
        if (kind === 'bus') {
          Object.assign(ticket.props, {
            from: { name: '杭州汽车客运中心', time: '09:30', date: '10月12日' },
            to: { name: '宁波南站', time: '11:40', date: '10月12日' },
            number: '班次 K215',
            duration: '约2小时10分',
            grid: [
              { label: '乘车人', value: '{#乘车人#}' },
              { label: '座位', value: '{#座位#}' },
              { label: '检票口', value: '{#检票口#}' },
            ],
          })
        }
        if (kind === 'flight' || kind === 'direct') {
          Object.assign(ticket.props, {
            from: { name: '北京首都 T3', time: '07:45', date: '10月12日' },
            to: { name: '深圳宝安 T3', time: '11:05', date: '10月12日' },
            number: kind === 'direct' ? 'CA1301 直飞' : 'CA1301',
            duration: '3时20分',
            grid: [
              { label: '乘机人', value: '{#乘机人#}' },
              { label: '登机口', value: '{#登机口#}' },
              { label: '座位', value: '{#座位#}' },
            ],
            tip: '请于起飞前 45 分钟完成值机，登机口关闭时间为起飞前 20 分钟。',
          })
        }
        buttons(b, num(settings.buttonCount, 2), ['查看订单', '在线值机'])
        return page(b)
      }),
    ]),
  ),

  /* ---------------- 表单 ---------------- */
  'com.hbm.form.41': defineBlueprint(() => {
    const b = new FlowBuilder().gap(PAD)
    title(b, 15, 'title', 10)
    b.add('form', { slot: 'form', x: 0, w: W, h: 320 })
    return page(b, {}, 0)
  }),

  'com.hbm.form.23': defineBlueprint(() => {
    const b = new FlowBuilder().gap(PAD)
    title(b, 15, 'title', 10)
    const form = b.add('form', { slot: 'form', x: 0, w: W, h: 380 })
    form.props.fields = [
      { label: '姓名', placeholder: '请输入姓名', type: 'input', required: true },
      { label: '手机号', placeholder: '请输入手机号', type: 'phone', required: true },
      {
        label: '年龄段',
        placeholder: '请选择',
        type: 'select',
        options: ['18岁以下', '18-30岁', '31-45岁', '45岁以上'],
      },
      {
        label: '关注内容',
        placeholder: '请选择',
        type: 'select',
        options: ['新品', '优惠', '服务'],
      },
      { label: '到店日期', placeholder: '请选择日期', type: 'date' },
    ]
    return page(b, {}, 0)
  }),

  'com.hbm.textSelect': defineBlueprint(() => {
    const b = new FlowBuilder().gap(PAD)
    title(b, 15)
    desc(b, 30, 'description', 10)
    b.add('textSelect', { slot: 'options', x: PAD, w: INNER, h: 150, gapAfter: 12 })
    buttons(b, 1, ['提交'])
    return page(b)
  }),

  'com.hbm.imgSelect': defineBlueprint(() => {
    const b = new FlowBuilder().gap(PAD)
    title(b, 15, 'title', 10)
    b.add('imgSelect', { slot: 'options', x: 0, w: W, h: 170, gapAfter: 12 })
    buttons(b, 1, ['提交'])
    return page(b)
  }),

  /* ---------------- 自由版式 ---------------- */
  'com.hbm.custom': defineBlueprint(() => {
    const els = [
      createElement('image', {
        x: 0,
        y: 0,
        w: W,
        h: 192,
        props: { src: placeholderImage(W, 192) },
      }),
      createElement('text', {
        x: PAD,
        y: 206,
        w: INNER,
        h: 26,
        props: { text: '自由版式：拖拽元素自由布局' },
        style: TITLE_STYLE,
      }),
      createElement('text', {
        x: PAD,
        y: 236,
        w: INNER,
        h: 42,
        props: { text: '从左侧元素面板添加文本、图片、按钮、表单等 32 种元素。' },
        style: DESC_STYLE,
      }),
      createElement('button', { x: PAD, y: 292, w: INNER, h: 40, props: { text: '编辑按钮' } }),
    ]
    return {
      mode: 'absolute',
      style: { height: 346, backgroundColor: '#FFFFFF', borderRadius: 12 },
      elements: els,
    }
  }),
}

/** 红包：绝对定位，底图 + 头像 + 文案叠加 */
function redpacket(nameMax: number, descMax: number): Omit<TemplatePage, 'id'> {
  const H = 452
  const elements = [
    createElement('image', {
      slot: 'background',
      x: 0,
      y: 0,
      w: W,
      h: H,
      locked: true,
      props: { src: redpacketBackground(W, H), ratio: [W, H], fit: 'cover', role: 'background' },
      style: { borderRadius: 16 },
    }),
    createElement('image', {
      slot: 'avatar',
      x: W / 2 - 22,
      y: 34,
      w: 44,
      h: 44,
      props: { src: sampleAvatar(1, '品'), ratio: [1, 1], fit: 'cover', role: 'avatar' },
      style: { borderRadius: 22 },
    }),
    createElement('text', {
      slot: 'name',
      x: PAD,
      y: 86,
      w: INNER,
      h: 20,
      props: { text: `编辑名称，最多显示${nameMax}个字` },
      style: { fontSize: 13, color: '#FFE3C2', textAlign: 'center', lineClamp: 1 },
    }),
    createElement('text', {
      slot: 'title',
      x: PAD,
      y: 114,
      w: INNER,
      h: 34,
      props: { text: '编辑文本，最多11个字' },
      style: { fontSize: 24, fontWeight: 700, color: '#FFFFFF', textAlign: 'center', lineClamp: 1 },
    }),
    createElement('text', {
      slot: 'description',
      x: 34,
      y: 154,
      w: W - 68,
      h: 40,
      props: { text: `编辑文本，最多显示${descMax}个字。` },
      style: { fontSize: 13, color: '#FFE9D6', textAlign: 'center', lineHeight: 1.5, lineClamp: 2 },
    }),
    createElement('button', {
      slot: 'button.0',
      x: 71,
      y: H - 78,
      w: W - 142,
      h: 42,
      props: { text: '立即领取', variant: 'primary' },
      style: { backgroundColor: '#FFD27A', color: '#C2261B', borderRadius: 21, fontWeight: 600 },
    }),
  ]
  return {
    mode: 'absolute',
    style: { height: H, backgroundColor: 'transparent', borderRadius: 16 },
    elements,
  }
}
