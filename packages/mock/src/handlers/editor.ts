import {
  EDITOR_PREFIX,
  SUB_CODE,
  type AiCopyRequest,
  type DeepPrecheckTask,
  type FeedbackBody,
  type Material,
  type SubmitTemplateBody,
  type TemplateSummary,
  type UploadMaterialBody,
} from '@aim/api-client'
import { cloneDocument, isPlaceholderSrc, precheck, type PrecheckIssue } from '@aim/template-core'
import { parseTemplateDocument, type TemplateDocument } from '@aim/template-schema'
import { charLength, isHttpsUrl, truncate, uid } from '@aim/utils'
import { http } from 'msw'
import { commit, getDb, type StoredTemplate } from '../db'
import { fail, hashOf, latency, ok } from '../utils'

const P = `*${EDITOR_PREFIX}`
const tasks = new Map<string, { startedAt: number; doc: TemplateDocument }>()
/** 审核模拟：提交后 15 秒自动出结果 */
const REVIEW_MS = 15_000

function summary(s: StoredTemplate): TemplateSummary {
  const d = s.document
  return {
    id: d.id,
    name: d.name,
    layoutId: d.layoutId,
    cardId: d.cardId,
    category: d.category,
    usage: d.usage,
    status: s.status,
    vendors: d.vendors,
    updatedAt: d.meta.updatedAt,
    createdAt: d.meta.createdAt,
    rejectReason: s.rejectReason,
    document: { ...d, meta: { ...d.meta, status: s.status, rejectReason: s.rejectReason } },
  }
}

/** 推进审核状态（读取时惰性结算） */
function settleReview(s: StoredTemplate) {
  if (s.status !== 'reviewing' || !s.submittedAt || Date.now() - s.submittedAt < REVIEW_MS) return
  const report = precheck(s.document)
  const reject = !report.passed || hashOf(s.document.id + s.submittedAt) % 4 === 0
  s.status = reject ? 'rejected' : 'approved'
  s.rejectReason = reject
    ? (report.errors[0]?.message ?? '图片清晰度不足，请更换高清素材后重新提交')
    : undefined
}

/** 深度检测：模拟图片质量 / 链接可达性 / 文案合规 */
function deepIssues(doc: TemplateDocument): {
  issues: PrecheckIssue[]
  dimensions: DeepPrecheckTask['dimensions']
} {
  const issues: PrecheckIssue[] = []
  const json = JSON.stringify(doc.pages)
  const links = [...json.matchAll(/"target":"(https?:[^"]+)"/g)].map((m) => m[1]!)
  for (const l of links) {
    if (!isHttpsUrl(l))
      issues.push({ code: 'deep.link', level: 'error', message: `链接不安全：${truncate(l, 40)}` })
    else if (l.includes('example.com') && hashOf(l) % 7 === 0)
      issues.push({
        code: 'deep.link',
        level: 'warning',
        message: `链接响应较慢（>3s）：${truncate(l, 40)}`,
      })
  }
  const images = doc.pages.flatMap((p) => p.elements).filter((e) => e.type === 'image')
  for (const img of images) {
    if (img.type === 'image' && isPlaceholderSrc(img.props.src))
      issues.push({
        code: 'deep.image',
        level: 'error',
        elementId: img.id,
        message: '检测到默认占位图，请替换为实际素材',
      })
    else if (img.type === 'image' && img.w >= 300 && hashOf(img.props.src.slice(-40)) % 5 === 0)
      issues.push({
        code: 'deep.image',
        level: 'warning',
        elementId: img.id,
        message: '图片分辨率偏低，建议使用宽度 ≥ 1080px 的素材',
      })
  }
  const textLen = charLength(json.replace(/<[^>]+>/g, ''))
  if (textLen > 6000)
    issues.push({
      code: 'deep.size',
      level: 'warning',
      message: '模板内容较大，可能影响终端加载速度',
    })
  const score = (code: string) =>
    Math.max(60, 100 - issues.filter((i) => i.code === code).length * 15)
  return {
    issues,
    dimensions: [
      {
        key: 'image',
        label: '图片质量',
        score: score('deep.image'),
        passed: !issues.some((i) => i.code === 'deep.image' && i.level === 'error'),
      },
      {
        key: 'link',
        label: '链接可达性',
        score: score('deep.link'),
        passed: !issues.some((i) => i.code === 'deep.link' && i.level === 'error'),
      },
      { key: 'content', label: '文案合规', score: 96, passed: true },
      { key: 'size', label: '加载性能', score: score('deep.size'), passed: true },
    ],
  }
}

const AI_BANK: Record<AiCopyRequest['field'], ((p: string) => string)[]> = {
  title: [
    (p) => `${p}限时特惠，错过再等一年`,
    (p) => `${p}上新啦，会员专享好礼`,
    (p) => `您有一份${p}福利待领取`,
    (p) => `${p}狂欢季 全场低至5折`,
    (p) => `${p}，今天就出发`,
  ],
  description: [
    (p) => `${p}多重优惠叠加，下单即享专属折扣，名额有限，先到先得。点击下方按钮立即查看详情。`,
    (p) => `为感谢您的支持，${p}特别为您准备了专属权益，有效期 7 天，赶快来领取吧。`,
    (p) => `${p}品质好物精选推荐，正品保障，极速发货，7 天无理由退换。`,
  ],
  button: [() => '立即查看', () => '马上领取', () => '立即抢购', () => '了解详情', () => '去看看'],
}

export const editorHandlers = [
  http.get(`${P}/templates`, async ({ request }) => {
    const blocked = await latency('/templates')
    if (blocked) return blocked
    const sp = new URL(request.url).searchParams
    const db = await getDb()
    Object.values(db.templates).forEach(settleReview)
    let list = Object.values(db.templates)
    const status = sp.get('status')
    const category = sp.get('category')
    const keyword = sp.get('keyword')
    if (status && status !== 'all') list = list.filter((t) => t.status === status)
    if (category && category !== 'all') list = list.filter((t) => t.document.category === category)
    if (keyword) list = list.filter((t) => t.document.name.includes(keyword))
    list.sort((a, b) => b.document.meta.updatedAt - a.document.meta.updatedAt)
    const page = Number(sp.get('page') ?? 1)
    const size = Number(sp.get('size') ?? 24)
    return ok(list.slice((page - 1) * size, page * size).map(summary), {
      total: list.length,
      pageIndex: page,
      pageSize: size,
    })
  }),

  http.get(`${P}/templates/:id`, async ({ params }) => {
    const blocked = await latency('/templates/')
    if (blocked) return blocked
    const db = await getDb()
    const s = db.templates[String(params.id)]
    if (!s) return fail(SUB_CODE.NOT_FOUND, '模板不存在或已删除')
    settleReview(s)
    return ok(summary(s))
  }),

  http.post(`${P}/templates`, async ({ request }) => {
    const blocked = await latency('/templates')
    if (blocked) return blocked
    const doc = (await request.json()) as TemplateDocument
    const parsed = parseTemplateDocument(doc)
    if (!parsed.success)
      return fail(SUB_CODE.PARAM, `模板结构不合法：${parsed.error.issues[0]?.message}`)
    const db = await getDb()
    db.templates[doc.id] = {
      document: { ...doc, meta: { ...doc.meta, updatedAt: Date.now() } },
      status: 'draft',
    }
    commit()
    return ok(summary(db.templates[doc.id]!))
  }),

  http.put(`${P}/templates/:id`, async ({ request, params }) => {
    const blocked = await latency('/templates/')
    if (blocked) return blocked
    const doc = (await request.json()) as TemplateDocument
    const db = await getDb()
    const prev = db.templates[String(params.id)]
    if (prev?.status === 'reviewing') return fail(SUB_CODE.PARAM, '模板审核中，暂不可修改')
    db.templates[String(params.id)] = {
      document: { ...doc, meta: { ...doc.meta, updatedAt: Date.now() } },
      status:
        prev?.status === 'approved' || prev?.status === 'rejected'
          ? 'draft'
          : (prev?.status ?? 'draft'),
    }
    commit()
    return ok(summary(db.templates[String(params.id)]!))
  }),

  http.delete(`${P}/templates/:id`, async ({ params }) => {
    const blocked = await latency('/templates/')
    if (blocked) return blocked
    const db = await getDb()
    delete db.templates[String(params.id)]
    commit()
    return ok(null)
  }),

  http.post(`${P}/templates/:id/duplicate`, async ({ params }) => {
    const blocked = await latency('/duplicate')
    if (blocked) return blocked
    const db = await getDb()
    const src = db.templates[String(params.id)]
    if (!src) return fail(SUB_CODE.NOT_FOUND, '模板不存在')
    const copy = cloneDocument(src.document)
    db.templates[copy.id] = { document: copy, status: 'draft' }
    commit()
    return ok(summary(db.templates[copy.id]!))
  }),

  http.post(`${P}/templates/:id/submit`, async ({ request, params }) => {
    const blocked = await latency('/submit')
    if (blocked) return blocked
    const body = (await request.json()) as SubmitTemplateBody
    const report = precheck(body.document)
    if (!report.passed) return fail(SUB_CODE.PARAM, `模板未通过校验：${report.errors[0]?.message}`)
    const db = await getDb()
    const now = Date.now()
    db.templates[String(params.id)] = {
      document: {
        ...body.document,
        meta: {
          ...body.document.meta,
          updatedAt: now,
          submittedAt: now,
          tplId: body.document.meta.tplId ?? `T${now}`,
        },
      },
      status: 'reviewing',
      submittedAt: now,
    }
    commit()
    return ok(summary(db.templates[String(params.id)]!))
  }),

  http.get(`${P}/materials`, async ({ request }) => {
    const blocked = await latency('/materials')
    if (blocked) return blocked
    const sp = new URL(request.url).searchParams
    const db = await getDb()
    let list = db.materials
    if (sp.get('type')) list = list.filter((m) => m.type === sp.get('type'))
    if (sp.get('keyword')) list = list.filter((m) => m.name.includes(sp.get('keyword')!))
    return ok(list)
  }),

  http.post(`${P}/materials`, async ({ request }) => {
    const blocked = await latency('/materials')
    if (blocked) return blocked
    const body = (await request.json()) as UploadMaterialBody
    const limit = body.type === 'image' ? 2 * 1024 * 1024 : 10 * 1024 * 1024
    if (body.size > limit)
      return fail(
        SUB_CODE.PARAM,
        `文件过大，${body.type === 'image' ? '图片不超过 2MB' : '视频不超过 10MB'}`,
      )
    const db = await getDb()
    const material: Material = { ...body, id: uid('mat'), createdAt: Date.now() }
    db.materials.unshift(material)
    commit()
    return ok(material)
  }),

  http.delete(`${P}/materials/:id`, async ({ params }) => {
    const db = await getDb()
    db.materials = db.materials.filter((m) => m.id !== params.id)
    commit()
    return ok(null)
  }),

  http.post(`${P}/precheck/deep`, async ({ request }) => {
    const blocked = await latency('/precheck/deep')
    if (blocked) return blocked
    const { document } = (await request.json()) as { document: TemplateDocument }
    const taskId = uid('chk')
    tasks.set(taskId, { startedAt: Date.now(), doc: document })
    return ok<DeepPrecheckTask>({ taskId, status: 'running', progress: 0, issues: [] })
  }),

  http.get(`${P}/precheck/deep/:taskId`, async ({ params }) => {
    const task = tasks.get(String(params.taskId))
    if (!task) return fail(SUB_CODE.NOT_FOUND, '检测任务不存在或已过期')
    const progress = Math.min(100, Math.round(((Date.now() - task.startedAt) / 4_000) * 100))
    if (progress < 100)
      return ok<DeepPrecheckTask>({
        taskId: String(params.taskId),
        status: 'running',
        progress,
        issues: [],
      })
    return ok<DeepPrecheckTask>({
      taskId: String(params.taskId),
      status: 'done',
      progress: 100,
      ...deepIssues(task.doc),
    })
  }),

  http.post(`${P}/tools/link-check`, async ({ request }) => {
    const blocked = await latency('/tools/link-check')
    if (blocked) return blocked
    const { url } = (await request.json()) as { url: string }
    const https = isHttpsUrl(url)
    const reachable = https && hashOf(url) % 9 !== 0
    return ok({
      url,
      https,
      reachable,
      status: reachable ? 200 : 404,
      message: !https
        ? '链接需以 https:// 开头'
        : reachable
          ? '链接可正常访问'
          : '链接无法访问（404），请检查地址',
    })
  }),

  http.post(`${P}/ai/copywriting`, async ({ request }) => {
    const blocked = await latency('/ai/copywriting')
    if (blocked) return blocked
    const body = (await request.json()) as AiCopyRequest
    const topic = body.prompt.trim().slice(0, 8) || body.layoutName
    const bank = AI_BANK[body.field]
    const seed = hashOf(body.prompt + body.field)
    const candidates = Array.from({ length: body.count ?? 3 }, (_, i) =>
      bank[(seed + i) % bank.length]!(topic),
    )
      .map((s) => truncate(s, body.maxLength, ''))
      .filter((s, i, arr) => arr.indexOf(s) === i)
    return ok({ candidates })
  }),

  http.post(`${P}/feedback`, async ({ request }) => {
    const body = (await request.json()) as FeedbackBody
    if (!body.content?.trim()) return fail(SUB_CODE.PARAM, '请填写反馈内容')
    const db = await getDb()
    const id = uid('fb')
    db.feedback.push({ id, content: body.content, contact: body.contact, createdAt: Date.now() })
    commit()
    return ok({ id })
  }),
]
