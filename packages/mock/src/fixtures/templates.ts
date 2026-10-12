import { applySettings, createDocument, findBySlot, sampleAvatar, sampleImage, syncParams, updateElement } from '@aim/template-core'
import { CANVAS_WIDTH, type ActionEvent, type TemplateDocument, type VendorId } from '@aim/template-schema'

const W = CANVAS_WIDTH
/** 公开 CC0 示例视频（MDN） */
export const SAMPLE_VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
const url = (path: string): ActionEvent => ({ action: 'OPEN_URL', target: `https://aim.example.com/${path}` })

type SlotPatch = { props?: Record<string, unknown>; event?: ActionEvent; style?: Record<string, unknown> }

function fill(doc: TemplateDocument, patches: Record<string, SlotPatch>): TemplateDocument {
  let next = doc
  for (const [slot, patch] of Object.entries(patches)) {
    const el = findBySlot(next, slot)
    if (!el) throw new Error(`示例模板 ${doc.name} 缺少槽位 ${slot}`)
    next = updateElement(next, el.id, patch)
  }
  return next
}

function make(
  id: string,
  layoutId: string,
  name: string,
  patches: Record<string, SlotPatch>,
  options: { settings?: Record<string, unknown>; vendors?: VendorId[]; examples?: Record<string, string>; now: number },
): TemplateDocument {
  let doc = createDocument({ id, layoutId, name, now: options.now, vendors: options.vendors })
  if (options.settings) doc = applySettings(doc, options.settings)
  doc = syncParams(fill(doc, patches))
  if (options.examples) doc = { ...doc, params: doc.params.map((p) => ({ ...p, example: options.examples![p.name] ?? p.example })) }
  return { ...doc, meta: { ...doc.meta, updatedAt: options.now, createdAt: options.now } }
}

export interface SampleTemplate {
  document: TemplateDocument
  industryId: string
  labels: string[]
  carriers: string[]
  hot: number
}

/** 示例模板库（编辑器“我的模板”与移动端体验列表共用） */
export function buildSampleTemplates(now = Date.now()): SampleTemplate[] {
  const day = 86_400_000
  const t = (i: number) => now - i * day * 0.7
  const all: [TemplateDocument, string, string[], number][] = [
    [
      make('tpl_travel', 'com.hbm.imageandtext', '国庆出游季', {
        media: { props: { src: sampleImage(5, W, 192, '国庆出游季', '精选线路 限时直降') }, event: url('travel') },
        title: { props: { text: '国庆出游季 · 精选线路直降' } },
        description: { props: { text: '海岛、古镇、亲子乐园 300+ 线路限时特惠，提前预订再享早鸟立减，名额有限先到先得。' } },
        'button.0': { props: { text: '立即抢购' }, event: url('travel/buy') },
      }, { now: t(0) }),
      'travel', ['节日营销', '限时特惠'], 986,
    ],
    [
      make('tpl_launch', 'com.hbm.video', '新品发布会直播', {
        media: { props: { cover: sampleImage(0, W, 192, '新品发布会', '10月20日 19:30'), src: SAMPLE_VIDEO, duration: 5 } },
        title: { props: { text: '旗舰新品发布会 · 今晚见' } },
        description: { props: { text: '影像、续航、性能全面升级，直播间预约即可参与抽奖，赢取新品首发资格。' } },
        'button.0': { props: { text: '预约直播' }, event: url('live') },
      }, { now: t(1) }),
      'digital', ['新品发布', '直播'], 812,
    ],
    [
      make('tpl_fashion', 'com.hbm.carouselImageSixteenToNine', '秋装上新', {
        media: {
          props: {
            items: [1, 4, 6].map((s, i) => ({ src: sampleImage(s, W, 192, ['秋装上新', '针织系列', '会员专享'][i]!, '全场 8 折起'), event: url(`fashion/${i}`) })),
          },
        },
        title: { props: { text: '秋季新品 全场 8 折起' } },
        description: { props: { text: '温柔针织、复古风衣、经典牛仔，百款新品同步上架。会员下单额外再享 95 折，满 299 包邮。' } },
        'button.0': { props: { text: '进店逛逛' }, event: url('fashion') },
      }, { now: t(2) }),
      'retail', ['上新', '服饰'], 640,
    ],
    [
      make('tpl_redpacket', 'com.hbm.redpacket', '品牌回馈红包', {
        avatar: { props: { src: sampleAvatar(2, '梦') } },
        name: { props: { text: '梦网商城' } },
        title: { props: { text: '恭喜发财 大吉大利' } },
        description: { props: { text: '感谢您一直以来的支持，送您一个专属红包，下单立减。' } },
        'button.0': { props: { text: '立即领取' }, event: url('redpacket') },
      }, { now: t(3) }),
      'finance', ['红包', '会员关怀'], 1203,
    ],
    [
      make('tpl_bill', 'com.hbm.notification', '账单提醒', {
        media: { props: { src: sampleImage(5, W, 120, '本月账单已出') } },
        title: { props: { text: '您的 10 月账单已出' } },
        description: { props: { text: '请于到期日前完成还款' } },
        'kv.0.label': { props: { text: '账单金额' } },
        'kv.0.value': { props: { text: '{#金额#} 元' } },
        'kv.1.label': { props: { text: '到期日' } },
        'kv.1.value': { props: { text: '{#到期日#}' } },
        'kv.2.label': { props: { text: '最低还款' } },
        'kv.2.value': { props: { text: '{#最低还款#} 元' } },
        'button.0': { props: { text: '账单明细' }, event: url('bill/detail') },
        'button.1': { props: { text: '立即还款' }, event: url('bill/pay') },
      }, { now: t(4), settings: { pairCount: 3 }, examples: { 金额: '3,280.00', 到期日: '2026-11-05', 最低还款: '328.00' } }),
      'finance', ['账单', '通知'], 534,
    ],
    [
      make('tpl_express', 'com.hbm.notification', '物流发货通知', {
        media: { props: { src: sampleImage(2, W, 120, '您的包裹已发出') } },
        title: { props: { text: '您的订单已发货' } },
        description: { props: { text: '预计 2 天内送达' } },
        'kv.0.label': { props: { text: '快递公司' } },
        'kv.0.value': { props: { text: '顺丰速运' } },
        'kv.1.label': { props: { text: '运单号' } },
        'kv.1.value': { props: { text: 'SF1234567890' } },
        'button.0': { props: { text: '联系客服' }, event: { action: 'DIAL_PHONE', target: '95338' } },
        'button.1': { props: { text: '查看物流' }, event: url('express') },
      }, { now: t(5) }),
      'logistics', ['物流', '通知'], 455,
    ],
    [
      make('tpl_sideslip', 'com.hbm.sideslip', '精选好物推荐', {
        cards: {
          props: {
            cards: [
              ['降噪耳机 Pro', '主动降噪 48dB，续航 36 小时'],
              ['智能手表 S3', '血氧心率全天候监测'],
              ['便携充电宝', '22.5W 快充，口袋大小'],
            ].map(([title, content], i) => ({
              src: sampleImage(i + 3, 210, 118, title!),
              title,
              content,
              buttons: [{ text: '立即购买', event: url(`goods/${i}`) }],
            })),
          },
        },
      }, { now: t(6), settings: { cardCount: 3 } }),
      'digital', ['种草', '多商品'], 388,
    ],
    [
      make('tpl_ecommerce', 'com.hbm.ecommerce', '爆款耳机限时购', {
        goods: {
          props: {
            images: [3, 0].map((s) => ({ src: sampleImage(s, W, W, '降噪耳机 Pro', '限时 5 折') })),
            price: '399.00',
            originalPrice: '799.00',
            tag: '限时5折',
            title: '降噪耳机 Pro 无线蓝牙',
            description: '48dB 深度降噪，36 小时超长续航，佩戴轻至 4.5g，通勤运动都适用。',
            buttons: [
              { text: '加入购物车', event: url('cart') },
              { text: '立即购买', event: url('buy') },
            ],
          },
        },
      }, { now: t(7) }),
      'retail', ['电商', '爆款'], 721,
    ],
    [
      make('tpl_moregoods', 'com.hbm.moreGoods', '店铺上新', {
        goods: {
          props: {
            title: '梦网优选旗舰店',
            subtitle: '本周新品 满 199 减 30',
            items: [
              ['有机燕麦片 1kg 早餐即食', '19.90', '29.90'],
              ['冷压橄榄油 750ml 特级初榨', '89.00', '128.00'],
              ['坚果礼盒 每日坚果 30 包', '69.00', '99.00'],
            ].map(([name, price, originalPrice], i) => ({
              image: sampleImage(i + 2, 106, 106),
              name,
              description: '新品尝鲜价',
              price,
              originalPrice,
              tag: '新品',
              button: { text: '购买', event: url(`shop/${i}`) },
            })),
          },
        },
      }, { now: t(8) }),
      'retail', ['店铺', '多商品'], 302,
    ],
    [
      make('tpl_voucher', 'com.hbm.cardVoucher', '满减券发放', {
        voucher: {
          props: {
            amount: '50',
            threshold: '满299可用',
            tagName: '满减券',
            name: '全场通用满减券，部分特价商品除外',
            dateRange: ['2026-10-12', '2026-10-31'],
            button: { text: '立即领取', event: url('coupon') },
          },
        },
      }, { now: t(9) }),
      'retail', ['卡券', '会员'], 610,
    ],
    [
      make('tpl_vouchers', 'com.hbm.cardVouchers', '会员券包', {
        vouchers: {
          props: {
            title: '您的会员专属券包',
            items: [
              ['100', '满1000可用', '家电品类券'],
              ['30', '满199可用', '生鲜品类券'],
              ['10', '无门槛', '全场通用券'],
            ].map(([amount, threshold, name]) => ({
              voucherType: 'fullMinus',
              amount,
              threshold,
              tagName: '满减券',
              name,
              dateType: 'days',
              days: 7,
              button: { text: '去使用', event: url('coupons') },
            })),
          },
        },
      }, { now: t(10) }),
      'retail', ['卡券', '会员关怀'], 276,
    ],
    [
      make('tpl_train', 'com.hbm.ticket.train', '火车出行提醒', {
        title: { props: { text: '您的行程即将出发' } },
        'button.0': { props: { text: '查看订单' }, event: url('order') },
        'button.1': { props: { text: '车站导航' }, event: { action: 'OPEN_MAP', address: '北京南站', longitude: 116.379, latitude: 39.865 } },
      }, { now: t(11), examples: { 乘车人: '张*三', 座位: '05车 12F', 检票口: 'B12', 订单号: 'E1234567890' } }),
      'travel', ['出行', '通知'], 498,
    ],
    [
      make('tpl_flight', 'com.hbm.ticket.flight', '航班值机提醒', {
        title: { props: { text: '航班值机已开放' } },
        'button.0': { props: { text: '查看订单' }, event: url('flight/order') },
        'button.1': { props: { text: '在线值机' }, event: url('flight/checkin') },
      }, { now: t(12), examples: { 乘机人: '李*四', 登机口: 'C28', 座位: '32A' } }),
      'travel', ['航旅', '通知'], 365,
    ],
    [
      make('tpl_notice', 'com.hbm.pureText', '系统升级公告', {
        title: { props: { text: '系统升级服务公告' } },
        description: {
          props: {
            text: '尊敬的用户：\n为提供更稳定的服务，我们将于 10 月 25 日 00:00-06:00 进行系统升级。升级期间网上营业厅、App 部分功能将暂停使用，给您带来的不便敬请谅解。\n升级完成后将自动恢复，无需任何操作。如有疑问请拨打客服热线。',
          },
        },
        'button.0': { props: { text: '联系客服' }, event: { action: 'DIAL_PHONE', target: '10086' } },
      }, { now: t(13) }),
      'telecom', ['公告', '服务'], 211,
    ],
    [
      make('tpl_survey', 'com.hbm.textSelect', '满意度调查', {
        title: { props: { text: '您对本次服务满意吗？' } },
        description: { props: { text: '选择后即可提交，感谢您的反馈' } },
        options: { props: { options: ['非常满意', '比较满意', '有待改进'].map((title, i) => ({ title, event: url(`survey/${i}`) })) } },
        'button.0': { props: { text: '提交' }, event: url('survey/submit') },
      }, { now: t(14) }),
      'telecom', ['问卷', '互动'], 187,
    ],
    [
      make('tpl_form', 'com.hbm.form.41', '预约试驾', {
        title: { props: { text: '预约试驾 赢取好礼' } },
      }, { now: t(15) }),
      'auto', ['表单', '留资'], 166,
    ],
    [
      make('tpl_code', 'com.hbm.notificationPlus', '登录验证码', {
        title: { props: { text: '登录验证码' } },
        description: { props: { text: '5 分钟内有效，请勿泄露' } },
        highlight: { props: { text: '{#验证码#}' } },
        highlightUnit: { props: { text: '点击按钮一键复制' } },
        'kv.0.label': { props: { text: '登录设备' } },
        'kv.0.value': { props: { text: '{#设备#}' } },
        'kv.1.label': { props: { text: '登录时间' } },
        'kv.1.value': { props: { text: '{#时间#}' } },
        'button.0': { props: { text: '不是我本人' }, event: url('security') },
        'button.1': { props: { text: '复制验证码' }, event: { action: 'COPY_PARAMETER', copyType: 'param', content: '{#验证码#}' } },
        media: { props: { src: sampleImage(7, 314, 110, '账户安全中心') } },
      }, { now: t(16), examples: { 验证码: '826431', 设备: 'iPhone 16', 时间: '10:28' } }),
      'internet', ['验证码', '安全'], 902,
    ],
    [
      make('tpl_poster', 'com.hbm.poster', '双十一主会场海报', {
        media: { props: { src: sampleImage(4, W, 456, '双十一狂欢', '主会场 10.31 20:00 开抢') }, event: url('1111') },
      }, { now: t(17) }),
      'retail', ['大促', '海报'], 590,
    ],
  ]
  return all.map(([document, industryId, labels, hot], i) => ({
    document,
    industryId,
    labels,
    carriers: [['移动', '联通', '电信'], ['移动', '电信'], ['移动']][i % 3]!,
    hot,
  }))
}
