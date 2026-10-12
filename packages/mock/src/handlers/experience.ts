import {
  EXPERIENCE_PREFIX,
  SUB_CODE,
  type AbilityResult,
  type Contact,
  type ExperienceTemplate,
  type MessageType,
  type SendExperienceBody,
  type SendPreviewItem,
  type SendRecord,
  type SendRecordQuery,
  type TemplateListQuery,
} from '@aim/api-client'
import { collectUsedParams, supportsIntegrated } from '@aim/template-core'
import { VENDOR_IDS, getLayout, type VendorId } from '@aim/template-schema'
import { formatDate, isMobile, parseMobiles, uid } from '@aim/utils'
import { HttpResponse, http } from 'msw'
import { commit, getDb } from '../db'
import { INDUSTRIES, buildSampleTemplates, filterOptions } from '../fixtures'
import { fail, hashOf, latency, ok, paginate } from '../utils'

const P = `*${EXPERIENCE_PREFIX}`
const captchas = new Map<string, string>()
const sendLog: number[] = []

let catalog: ExperienceTemplate[] | null = null
function templates(): ExperienceTemplate[] {
  catalog ??= buildSampleTemplates().map((s) => {
    const layout = getLayout(s.document.layoutId)
    return {
      tplId: s.document.id,
      tplName: s.document.name,
      cardId: s.document.cardId,
      styleName: layout?.name ?? '',
      industryId: s.industryId,
      industryName: INDUSTRIES.find((i) => i.id === s.industryId)?.name ?? '',
      labels: s.labels,
      factories: s.document.vendors,
      carriers: s.carriers,
      paramcnt: collectUsedParams(s.document).length,
      integrated: supportsIntegrated(s.document.cardId),
      hot: s.hot,
      document: s.document,
    }
  })
  return catalog
}

function auth(request: Request): { whois: string } | Response {
  const token = request.headers.get('AuthorizationCode')
  if (!token || token === 'expired') return fail(SUB_CODE.UNAUTHORIZED)
  return { whois: token.split('.')[1] ?? '' }
}

/** 号码能力（确定性）：末位决定厂商，哈希决定是否支持阅信 / 5G 消息 */
export function abilityOf(mobile: string): AbilityResult & { types: MessageType[] } {
  const h = hashOf(mobile)
  const factory = VENDOR_IDS[h % 6] as VendorId
  const aim = h % 5 !== 0
  const rcs = h % 3 !== 0
  const types: MessageType[] = [...(aim ? [1 as const] : []), ...(rcs ? [2 as const] : []), 3]
  return {
    mobile,
    receiveState: aim ? 1 : 0,
    factory,
    carrier: ['移动', '联通', '电信'][h % 3],
    rcs,
    types,
  }
}

function svgCaptcha(code: string) {
  const chars = code
    .split('')
    .map(
      (c, i) =>
        `<text x="${14 + i * 22}" y="${28 + ((i * 7) % 6)}" font-size="22" font-family="monospace" font-weight="700" fill="${['#2563eb', '#16a34a', '#dc2626', '#9333ea'][i % 4]}" transform="rotate(${(i % 2 ? 1 : -1) * 8} ${14 + i * 22} 24)">${c}</text>`,
    )
    .join('')
  const noise = Array.from(
    { length: 5 },
    (_, i) =>
      `<line x1="${i * 22}" y1="${(i * 13) % 40}" x2="${100 - i * 9}" y2="${(i * 29) % 40}" stroke="#94a3b8" stroke-width="1"/>`,
  ).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40" viewBox="0 0 100 40"><rect width="100" height="40" fill="#f1f5f9"/>${noise}${chars}</svg>`
}

export const experienceHandlers = [
  http.post(`${P}/auth/mock-login`, async ({ request }) => {
    const blocked = await latency('/auth/mock-login')
    if (blocked) return blocked
    const { phone } = (await request.json()) as { phone: string }
    if (!isMobile(phone)) return fail(SUB_CODE.PARAM, '请输入正确的手机号')
    return ok({ token: `mock.${phone}.${uid()}`, phone })
  }),

  http.get(`${P}/auth/image-code`, ({ request }) => {
    const identity = new URL(request.url).searchParams.get('identity') ?? 'default'
    const code = String(1000 + (Math.floor(Math.random() * 9000) % 9000))
    captchas.set(identity, code)
    return new HttpResponse(svgCaptcha(code), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' },
    })
  }),

  http.post(`${P}/template/filter-options`, async ({ request }) => {
    const blocked = await latency('/template/filter-options')
    if (blocked) return blocked
    const a = auth(request)
    if (a instanceof Response) return a
    return ok(filterOptions())
  }),

  http.post(`${P}/template/list`, async ({ request }) => {
    const blocked = await latency('/template/list')
    if (blocked) return blocked
    const a = auth(request)
    if (a instanceof Response) return a
    const q = (await request.json()) as TemplateListQuery
    let list = templates()
    if (q.industryIds?.length) list = list.filter((t) => q.industryIds!.includes(t.industryId))
    if (q.styleIds?.length)
      list = list.filter((t) => q.styleIds!.includes(getLayout(t.cardId)?.id ?? t.cardId))
    if (q.labelIds?.length) list = list.filter((t) => t.labels.some((l) => q.labelIds!.includes(l)))
    if (q.carriers?.length)
      list = list.filter((t) => t.carriers.some((c) => q.carriers!.includes(c)))
    if (q.factories?.length)
      list = list.filter((t) => t.factories.some((f) => q.factories!.includes(f)))
    if (q.keyword)
      list = list.filter((t) => t.tplName.includes(q.keyword!) || t.styleName.includes(q.keyword!))
    const start = q.pageIndex * q.pageSize
    return ok(list.slice(start, start + q.pageSize), {
      total: list.length,
      pageIndex: q.pageIndex,
      pageSize: q.pageSize,
    })
  }),

  http.post(`${P}/template/detail`, async ({ request }) => {
    const blocked = await latency('/template/detail')
    if (blocked) return blocked
    const a = auth(request)
    if (a instanceof Response) return a
    const { tplId } = (await request.json()) as { tplId: string }
    const tpl = templates().find((t) => t.tplId === tplId)
    return tpl ? ok(tpl) : fail(SUB_CODE.NOT_FOUND, '模板不存在或已下线')
  }),

  http.post(`${P}/send/preview`, async ({ request }) => {
    const blocked = await latency('/send/preview')
    if (blocked) return blocked
    const a = auth(request)
    if (a instanceof Response) return a
    const body = (await request.json()) as { whois: string; tplId: string; phones: string[] }
    const db = await getDb()
    const contacts = db.contacts[body.whois] ?? []
    const tpl = templates().find((t) => t.tplId === body.tplId)
    const items: SendPreviewItem[] = body.phones.map((mobile) => {
      const ab = abilityOf(mobile)
      const types = ab.types.filter((t) => t === 1 || tpl?.integrated)
      return {
        mobile,
        contactName: contacts.find((c) => c.mobile === mobile)?.contactName,
        sendable: isMobile(mobile) && types.length > 0,
        messageType: types[0] ?? 3,
        availableTypes: types,
        factory: ab.factory,
        carrier: ab.carrier,
        reason: !isMobile(mobile)
          ? '号码格式错误'
          : types.length
            ? undefined
            : '该号码暂不支持接收此模板',
      }
    })
    return ok({ items })
  }),

  http.post(`${P}/send/experience`, async ({ request }) => {
    const blocked = await latency('/send/experience')
    if (blocked) return blocked
    const a = auth(request)
    if (a instanceof Response) return a
    const body = (await request.json()) as SendExperienceBody
    const expected = captchas.get(body.identity)
    if (!expected || expected !== body.imgCode.trim())
      return fail(SUB_CODE.CAPTCHA, '图形验证码错误，请重新输入')
    captchas.delete(body.identity)
    const now = Date.now()
    while (sendLog.length && now - sendLog[0]! > 60_000) sendLog.shift()
    if (sendLog.length >= 5) return fail(SUB_CODE.RATE_LIMIT, '发送过于频繁，请 1 分钟后再试')
    sendLog.push(now)
    const tpl = templates().find((t) => t.tplId === body.tplId)
    if (!tpl) return fail(SUB_CODE.NOT_FOUND, '模板不存在')
    if (!body.items.length || body.items.length > 10)
      return fail(SUB_CODE.PARAM, '每次最多发送 10 个号码')
    const db = await getDb()
    const requestId = uid('req')
    for (const item of body.items) {
      const ab = abilityOf(item.mobile)
      const wanted: MessageType =
        item.canSendType ??
        (body.sendMode === 'priority' ? 1 : (Number(body.sendMode) as MessageType))
      const supported = ab.types.includes(wanted) && (wanted === 1 || tpl.integrated)
      const actual: MessageType = supported
        ? wanted
        : (ab.types.find((t) => t > wanted && (t === 1 || tpl.integrated)) ?? 3)
      const failed = hashOf(item.mobile + requestId) % 11 === 0
      const record: SendRecord = {
        id: uid('rec'),
        requestId,
        tplId: tpl.tplId,
        tplName: tpl.tplName,
        cardId: tpl.cardId,
        mobile: item.mobile,
        contactName: (db.contacts[a.whois] ?? []).find((c) => c.mobile === item.mobile)
          ?.contactName,
        messageType: actual,
        degraded:
          actual !== wanted
            ? { from: wanted, reason: wanted === 1 ? '终端未开启阅信能力' : '终端不支持 5G 消息' }
            : undefined,
        carrier: ab.carrier ?? '移动',
        factory: ab.factory,
        status: failed ? 'FAILED' : 'SUCCESS',
        failReason: failed ? '运营商网关返回失败（模拟）' : undefined,
        sendTime: now,
      }
      db.sendRecords.unshift(record)
    }
    commit()
    return ok({ requestId, status: 'ACCEPTED' as const })
  }),

  http.post(`${P}/send/detail`, async ({ request }) => {
    const blocked = await latency('/send/detail')
    if (blocked) return blocked
    const a = auth(request)
    if (a instanceof Response) return a
    const q = (await request.json()) as SendRecordQuery
    const db = await getDb()
    let list = db.sendRecords
    if (q.mobile) list = list.filter((r) => r.mobile.includes(q.mobile!))
    if (q.status) list = list.filter((r) => r.status === q.status)
    if (q.startDate) list = list.filter((r) => formatDate(r.sendTime, 'YYYY-MM-DD') >= q.startDate!)
    if (q.endDate) list = list.filter((r) => formatDate(r.sendTime, 'YYYY-MM-DD') <= q.endDate!)
    return ok(paginate(list, q.pageNum, q.pageSize))
  }),

  http.post(`${P}/send/recent`, async ({ request }) => {
    const a = auth(request)
    if (a instanceof Response) return a
    const db = await getDb()
    return ok({ mobiles: [...new Set(db.sendRecords.map((r) => r.mobile))].slice(0, 10) })
  }),

  http.post(`${P}/send/statistics`, async ({ request }) => {
    const blocked = await latency('/send/statistics')
    if (blocked) return blocked
    const a = auth(request)
    if (a instanceof Response) return a
    const db = await getDb()
    const list = db.sendRecords
    const byFactory = new Map<string, number>()
    for (const r of list)
      byFactory.set(r.factory ?? 'unknown', (byFactory.get(r.factory ?? 'unknown') ?? 0) + 1)
    return ok({
      total: list.length,
      byStatus: {
        SENDING: list.filter((r) => r.status === 'SENDING').length,
        SUCCESS: list.filter((r) => r.status === 'SUCCESS').length,
        FAILED: list.filter((r) => r.status === 'FAILED').length,
      },
      byType: {
        1: list.filter((r) => r.messageType === 1).length,
        2: list.filter((r) => r.messageType === 2).length,
        3: list.filter((r) => r.messageType === 3).length,
      },
      byFactory: [...byFactory].map(([factory, count]) => ({ factory, count })),
    })
  }),

  http.post(`${P}/wechat/signature`, async () =>
    ok({
      appId: 'wx_mock_appid',
      timestamp: Math.floor(Date.now() / 1000),
      nonceStr: uid(),
      signature: 'mock-signature',
    }),
  ),

  http.post(`${P}/ability/query`, async ({ request }) => {
    const blocked = await latency('/ability/query')
    if (blocked) return blocked
    const a = auth(request)
    if (a instanceof Response) return a
    const { source } = (await request.json()) as { source: string }
    const { valid } = parseMobiles(source)
    if (!valid.length) return fail(SUB_CODE.PARAM, '请输入正确的手机号')
    return ok({
      mobiles: valid.map((m) => {
        const { types: _t, ...rest } = abilityOf(m)
        return rest
      }),
    })
  }),

  http.get(`${P}/contacts/page`, async ({ request }) => {
    const blocked = await latency('/contacts/page')
    if (blocked) return blocked
    const a = auth(request)
    if (a instanceof Response) return a
    const sp = new URL(request.url).searchParams
    const db = await getDb()
    const list = db.contacts[sp.get('whois') ?? a.whois] ?? []
    return ok(paginate(list, Number(sp.get('pageNum') ?? 1), Number(sp.get('pageSize') ?? 20)))
  }),

  http.post(`${P}/contacts`, async ({ request }) => {
    const blocked = await latency('/contacts')
    if (blocked) return blocked
    const a = auth(request)
    if (a instanceof Response) return a
    const body = (await request.json()) as { whois: string; contactName: string; mobile: string }
    if (!isMobile(body.mobile)) return fail(SUB_CODE.PARAM, '手机号格式不正确')
    if (!body.contactName.trim()) return fail(SUB_CODE.PARAM, '请输入联系人姓名')
    const db = await getDb()
    const list = (db.contacts[body.whois] ??= [])
    if (list.some((c) => c.mobile === body.mobile))
      return fail(SUB_CODE.DUPLICATE, '该号码已在通讯录中')
    if (list.length >= 200) return fail(SUB_CODE.PARAM, '通讯录最多 200 个联系人')
    const contact: Contact = {
      id: uid('ct'),
      contactName: body.contactName.trim(),
      mobile: body.mobile,
      createdAt: Date.now(),
    }
    list.unshift(contact)
    commit()
    return ok(contact)
  }),

  http.put(`${P}/contacts/:id`, async ({ request, params }) => {
    const blocked = await latency('/contacts')
    if (blocked) return blocked
    const a = auth(request)
    if (a instanceof Response) return a
    const body = (await request.json()) as { whois: string; contactName: string; mobile: string }
    if (!isMobile(body.mobile)) return fail(SUB_CODE.PARAM, '手机号格式不正确')
    const db = await getDb()
    const list = db.contacts[body.whois] ?? []
    const target = list.find((c) => c.id === params.id)
    if (!target) return fail(SUB_CODE.NOT_FOUND, '联系人不存在')
    if (list.some((c) => c.mobile === body.mobile && c.id !== target.id))
      return fail(SUB_CODE.DUPLICATE, '该号码已在通讯录中')
    Object.assign(target, { contactName: body.contactName.trim(), mobile: body.mobile })
    commit()
    return ok(target)
  }),

  http.delete(`${P}/contacts/:id`, async ({ request, params }) => {
    const blocked = await latency('/contacts')
    if (blocked) return blocked
    const a = auth(request)
    if (a instanceof Response) return a
    const whois = new URL(request.url).searchParams.get('whois') ?? a.whois
    const db = await getDb()
    db.contacts[whois] = (db.contacts[whois] ?? []).filter((c) => c.id !== params.id)
    commit()
    return ok(null)
  }),
]
