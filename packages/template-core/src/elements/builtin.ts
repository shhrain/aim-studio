import { CANVAS_WIDTH, type LinkButton, type Voucher } from '@aim/template-schema'
import { placeholderImage, sampleAvatar, sampleImage } from '../assets'
import { defineElement, type ElementPlugin } from '../registry'

const W = CANVAS_WIDTH
const btn = (text: string): LinkButton => ({ text, event: { action: 'OPEN_URL', target: '' } })
const voucher = (i = 0): Voucher => ({
  voucherType: 'fullMinus',
  amount: ['100', '50', '20', '10'][i % 4]!,
  threshold: ['满1000可用', '满500可用', '满199可用', '无门槛'][i % 4]!,
  tagName: '满减券',
  name: '编辑券名称，如：全场通用优惠券',
  dateType: 'fixed',
  dateRange: ['2026-01-01', '2026-12-31'],
  button: btn('去使用'),
})
const linesOf = (list: { label: string; value: string }[]) =>
  list.flatMap((i) => [i.label, i.value])

/** 32 种内置元素 */
const list = [
  defineElement({
    type: 'text',
    label: '文本',
    size: { w: W - 28, h: 22 },
    defaults: () => ({ text: '编辑文本' }),
    style: () => ({ fontSize: 14, color: '#1F2329', lineHeight: 1.5 }),
    texts: (el) => [el.props.text],
  }),
  defineElement({
    type: 'image',
    label: '图片',
    size: { w: W, h: 192 },
    defaults: () => ({
      src: placeholderImage(W, 192),
      ratio: [16, 9],
      fit: 'cover',
      role: 'content',
    }),
  }),
  defineElement({
    type: 'video',
    label: '视频',
    size: { w: W, h: 192 },
    defaults: () => ({ src: '', cover: placeholderImage(W, 192, '点击上传视频'), ratio: [16, 9] }),
  }),
  defineElement({
    type: 'audio',
    label: '音频',
    size: { w: W - 28, h: 64 },
    defaults: () => ({ src: '', title: '编辑音频标题', duration: 30_000 }),
    style: () => ({ backgroundColor: '#F2F5FA', color: '#1F2329', borderRadius: 10 }),
    texts: (el) => [el.props.title],
  }),
  defineElement({
    type: 'button',
    label: '按钮',
    size: { w: W - 28, h: 40 },
    defaults: () => ({ text: '编辑按钮', variant: 'primary' }),
    style: () => ({ borderRadius: 20, fontSize: 15 }),
    texts: (el) => [el.props.text],
  }),
  defineElement({
    type: 'hotZone',
    label: '热区',
    size: { w: 120, h: 60 },
    defaults: () => ({ label: '热区' }),
  }),
  defineElement({
    type: 'shape',
    label: '形状',
    size: { w: W - 28, h: 1 },
    defaults: () => ({ shape: 'line' }),
    style: () => ({ backgroundColor: '#E5E8EF' }),
  }),
  defineElement({
    type: 'qrCode',
    label: '二维码',
    size: { w: 120, h: 120 },
    defaults: () => ({ src: '', content: 'https://example.com' }),
  }),
  defineElement({
    type: 'swiper',
    label: '轮播',
    size: { w: W, h: 192 },
    defaults: () => ({
      items: [0, 1, 2].map((i) => ({
        src: sampleImage(i, W, 192, `轮播图 ${i + 1}`),
        event: { action: 'OPEN_URL' as const, target: '' },
      })),
      resourceType: 'image',
      ratio: [16, 9],
      loop: true,
      autoplay: true,
      interval: 3,
      indicator: true,
    }),
  }),
  defineElement({
    type: 'sideslip',
    label: '横滑卡片',
    size: { w: W, h: 300 },
    defaults: () => ({
      ratio: [16, 9],
      showContent: true,
      cards: [0, 1].map((i) => ({
        src: sampleImage(i + 2, 210, 118),
        title: '编辑标题，最多显示13个字',
        content: '编辑文本，最多显示30个字。编辑文本，最多显示30个字。',
        buttons: [btn('编辑按钮')],
      })),
    }),
    texts: (el) =>
      el.props.cards.flatMap((c) => [c.title, c.content, ...c.buttons.map((b) => b.text)]),
  }),
  defineElement({
    type: 'eCommerce',
    label: '电商商品',
    size: { w: W, h: 520 },
    defaults: () => ({
      media: 'image',
      images: [0, 1].map((i) => ({ src: sampleImage(i + 4, W, W, '商品主图') })),
      currency: '¥',
      price: '99.00',
      originalPrice: '199.00',
      tag: '限时特惠',
      title: '编辑商品标题，最多显示17个字',
      description: '编辑商品描述，最多显示69个字。突出卖点、优惠力度和适用人群，吸引用户点击。',
      buttons: [btn('加入购物车'), btn('立即购买')],
      themeColor: 1,
    }),
    texts: (el) => [
      el.props.title,
      el.props.description,
      el.props.tag ?? '',
      ...el.props.buttons.map((b) => b.text),
    ],
  }),
  defineElement({
    type: 'moreGoods',
    label: '多商品',
    size: { w: W, h: 420 },
    defaults: () => ({
      title: '编辑店铺名称',
      subtitle: '编辑副标题，最多20个中文字',
      showIcon: true,
      items: [0, 1, 2].map((i) => ({
        image: sampleImage(i + 1, 106, 106),
        name: '编辑商品名称，最多24个中文字',
        description: '编辑卖点',
        price: '100.00',
        originalPrice: '159.00',
        tag: '热卖',
        button: btn('立即购买'),
      })),
    }),
    texts: (el) => [
      el.props.title,
      el.props.subtitle,
      ...el.props.items.flatMap((i) => [i.name, i.description ?? '', i.button.text]),
    ],
  }),
  defineElement({
    type: 'ecommerceCoupon',
    label: '券+商品',
    size: { w: W, h: 460 },
    defaults: () => ({
      direction: 'vertical',
      logo: sampleAvatar(3, '店'),
      title: '编辑店铺名称',
      subtitle: '编辑副标题，最多17个中文字',
      coupon: {
        amount: '99',
        name: '编辑券名称',
        description: '编辑券说明，最多32个中文字',
        pickStyle: 'pick',
        event: { action: 'OPEN_URL', target: '' },
      },
      items: [0, 1, 2].map((i) => ({
        image: sampleImage(i + 5, 106, 106),
        name: '编辑商品名称，最多28个中文字',
        price: '100.00',
        tag: '券后价',
        button: btn('立即购买'),
      })),
    }),
    texts: (el) => [
      el.props.title,
      el.props.subtitle,
      el.props.coupon.name,
      el.props.coupon.description,
      ...el.props.items.map((i) => i.name),
    ],
  }),
  defineElement({
    type: 'cardVoucher',
    label: '单卡券',
    size: { w: W, h: 210 },
    defaults: () => ({
      ...voucher(0),
      name: '编辑券名称，最多40个中文字',
      button: btn('立即领取'),
      dynamicButton: false,
    }),
    texts: (el) => [
      el.props.name,
      el.props.tagName,
      el.props.threshold,
      el.props.button?.text ?? '',
    ],
  }),
  defineElement({
    type: 'cardVouchers',
    label: '多卡券',
    size: { w: W, h: 300 },
    defaults: () => ({
      title: '编辑标题，最多14个中文字',
      items: [voucher(0), voucher(1)].map((v) => ({ ...v, name: '编辑券名称，最多26个中文字' })),
      buttonMode: 'each',
      button: btn('一键领取'),
    }),
    texts: (el) => [el.props.title, ...el.props.items.flatMap((i) => [i.name, i.tagName])],
  }),
  defineElement({
    type: 'countdown',
    label: '倒计时',
    size: { w: W - 28, h: 44 },
    defaults: () => ({ endTime: Date.now() + 3 * 86400_000, label: '距活动结束' }),
    texts: (el) => [el.props.label],
  }),
  defineElement({
    type: 'ticketImage',
    label: '票据信息',
    size: { w: W, h: 230 },
    defaults: () => ({
      kind: 'train',
      from: { name: '北京南', time: '08:00', date: '10月12日' },
      to: { name: '上海虹桥', time: '12:28', date: '10月12日' },
      number: 'G1',
      duration: '4时28分',
      grid: [
        { label: '乘车人', value: '{#乘车人#}' },
        { label: '座位', value: '{#座位#}' },
        { label: '检票口', value: '{#检票口#}' },
      ],
      extra: [{ label: '订单号', value: '{#订单号#}' }],
      tip: '请携带有效身份证件，提前30分钟到达车站检票。',
    }),
    texts: (el) => [
      el.props.number,
      el.props.from.name,
      el.props.to.name,
      el.props.tip ?? '',
      ...linesOf(el.props.grid),
      ...linesOf(el.props.extra ?? []),
    ],
  }),
  defineElement({
    type: 'tel',
    label: '电话',
    size: { w: W - 28, h: 40 },
    defaults: () => ({ styleType: 'text', text: '客服热线', phone: '95188' }),
    texts: (el) => [el.props.text],
  }),
  defineElement({
    type: 'map',
    label: '地图',
    size: { w: W - 28, h: 150 },
    defaults: () => ({
      mode: 'card',
      title: '编辑门店名称',
      address: '北京市朝阳区建国路 88 号',
      longitude: 116.46,
      latitude: 39.91,
    }),
    texts: (el) => [el.props.title, el.props.address],
  }),
  defineElement({
    type: 'serviceNumber',
    label: '服务号',
    size: { w: W - 28, h: 56 },
    defaults: () => ({
      mode: 'profile',
      avatar: sampleAvatar(0, '阅'),
      name: '编辑服务号名称',
      description: '官方服务号',
    }),
    texts: (el) => [el.props.name, el.props.description ?? ''],
  }),
  defineElement({
    type: 'agreement',
    label: '协议',
    size: { w: W - 28, h: 36 },
    defaults: () => ({
      text: '我已阅读并同意',
      links: [
        { text: '《用户服务协议》', url: '' },
        { text: '《隐私政策》', url: '' },
      ],
    }),
    texts: (el) => [el.props.text, ...el.props.links.map((l) => l.text)],
  }),
  defineElement({
    type: 'form',
    label: '表单',
    size: { w: W, h: 300 },
    defaults: () => ({
      fields: [
        { label: '姓名', placeholder: '请输入姓名', type: 'input', required: true },
        { label: '手机号', placeholder: '请输入手机号', type: 'phone', required: true },
        {
          label: '城市',
          placeholder: '请选择城市',
          type: 'select',
          options: ['北京', '上海', '广州', '深圳'],
        },
        { label: '预约日期', placeholder: '请选择日期', type: 'date' },
      ],
      privacyText: '同意用户隐私协议',
      submitText: '立即提交',
    }),
    texts: (el) => [
      el.props.submitText,
      ...el.props.fields.flatMap((f) => [f.label, f.placeholder]),
    ],
  }),
  defineElement({
    type: 'input',
    label: '输入框',
    size: { w: W - 28, h: 64 },
    defaults: () => ({ label: '姓名', placeholder: '请输入', inputStyle: 'box' }),
  }),
  defineElement({
    type: 'textarea',
    label: '多行输入',
    size: { w: W - 28, h: 110 },
    defaults: () => ({ label: '留言', placeholder: '请输入内容', inputStyle: 'box' }),
  }),
  defineElement({
    type: 'radioGroup',
    label: '单选',
    size: { w: W - 28, h: 72 },
    defaults: () => ({ label: '性别', options: ['男', '女'] }),
  }),
  defineElement({
    type: 'checkboxGroup',
    label: '多选',
    size: { w: W - 28, h: 72 },
    defaults: () => ({ label: '感兴趣的内容', options: ['新品', '优惠', '活动'] }),
  }),
  defineElement({
    type: 'picker',
    label: '下拉选择',
    size: { w: W - 28, h: 64 },
    defaults: () => ({ label: '城市', placeholder: '请选择', options: ['北京', '上海', '广州'] }),
  }),
  defineElement({
    type: 'datePicker',
    label: '日期选择',
    size: { w: W - 28, h: 64 },
    defaults: () => ({ label: '日期', placeholder: '请选择日期' }),
  }),
  defineElement({
    type: 'timePicker',
    label: '时间选择',
    size: { w: W - 28, h: 64 },
    defaults: () => ({ label: '时间', placeholder: '请选择时间' }),
  }),
  defineElement({
    type: 'textSelect',
    label: '文本单选',
    size: { w: W - 28, h: 150 },
    defaults: () => ({
      options: ['选项1', '选项2', '选项3'].map((title) => ({
        title,
        event: { action: 'OPEN_URL' as const, target: '' },
      })),
      activeIndex: 0,
    }),
    texts: (el) => el.props.options.map((o) => o.title),
  }),
  defineElement({
    type: 'imgSelect',
    label: '图片单选',
    size: { w: W, h: 170 },
    defaults: () => ({
      options: [0, 1, 2].map((i) => ({
        title: `选项${i + 1}`,
        src: sampleImage(i + 2, 123, 123),
        event: { action: 'OPEN_URL' as const, target: '' },
      })),
      showTitle: true,
      activeIndex: 0,
    }),
    texts: (el) => el.props.options.map((o) => o.title),
  }),
  defineElement({
    type: 'submitButton',
    label: '提交按钮',
    size: { w: W - 28, h: 40 },
    defaults: () => ({ text: '提交' }),
    texts: (el) => [el.props.text],
  }),
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const builtinElements: ElementPlugin<any>[] = list
