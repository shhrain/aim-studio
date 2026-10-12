import {
  ACTIONS,
  ELEMENT_META,
  PARAM_TYPE_META,
  TEMPLATE_NAME_MAX,
  URL_MAX_LENGTH,
  VENDORS,
  expandSlots,
  getLayout,
  replaceParams,
  type ActionEvent,
  type AnyElement,
  type TemplateDocument,
} from '@aim/template-schema'
import { charLength, isEmail, isHttpsUrl, stripTags } from '@aim/utils'
import { isPlaceholderSrc } from '../assets'
import { collectUsedParams } from '../document'
import { defineRule, elementTexts, type PrecheckRule } from '../registry'
import type { PrecheckIssue } from './types'

/** 以参数示例值计算展示长度（审核时按示例计字数） */
export function displayLength(text: string, doc: TemplateDocument): number {
  const examples = new Map(doc.params.map((p) => [p.name, p.example]))
  return charLength(stripTags(replaceParams(text, (n) => examples.get(n) ?? n)))
}

/** 按路径读取：'cards[].title' → 每张卡片的 title */
export function readPath(obj: unknown, path: string): { value: unknown; at: string }[] {
  const parts = path.split('.')
  let current: { value: unknown; at: string }[] = [{ value: obj, at: '' }]
  for (const part of parts) {
    const isArray = part.endsWith('[]')
    const key = isArray ? part.slice(0, -2) : part
    const next: { value: unknown; at: string }[] = []
    for (const c of current) {
      const v = (c.value as Record<string, unknown> | undefined)?.[key]
      if (isArray) {
        if (Array.isArray(v)) v.forEach((item, i) => next.push({ value: item, at: `${c.at}${key}[${i}].` }))
      } else if (v !== undefined) next.push({ value: v, at: `${c.at}${key}.` })
    }
    current = next
  }
  return current.map((c) => ({ value: c.value, at: c.at.replace(/\.$/, '') }))
}

const PLACEHOLDER_TEXT = /^编辑(文本|标题|按钮|名称)/

function mainText(el: AnyElement): string | undefined {
  if (el.type === 'text') return el.props.text
  if (el.type === 'button' || el.type === 'submitButton') return el.props.text
  return undefined
}

const issue = (i: PrecheckIssue) => i

/* ---------------------------- 基础信息 ---------------------------- */

export const basicRule = defineRule({
  code: 'basic',
  description: '模板名称、厂商、版式',
  run(doc) {
    const out: PrecheckIssue[] = []
    if (!doc.name.trim()) out.push(issue({ code: 'basic.name', level: 'error', message: '请填写模板名称', suggestion: '在画布上方输入模板名称' }))
    else if (charLength(doc.name) > TEMPLATE_NAME_MAX)
      out.push(issue({ code: 'basic.name', level: 'error', message: `模板名称不能超过 ${TEMPLATE_NAME_MAX} 个字` }))
    if (!doc.vendors.length) out.push(issue({ code: 'basic.vendors', level: 'error', message: '请至少选择一个发送厂商' }))
    const layout = getLayout(doc.layoutId)
    if (!layout) out.push(issue({ code: 'basic.layout', level: 'error', message: `未知版式：${doc.layoutId}` }))
    else {
      for (const v of doc.vendors) {
        if (!layout.vendors.includes(v))
          out.push(
            issue({
              code: 'vendor.unsupported',
              level: 'error',
              target: v,
              message: `${VENDORS[v].name}暂不支持「${layout.name}」版式`,
              suggestion: '取消勾选该厂商或更换版式',
            }),
          )
      }
    }
    return out
  },
})

/* ---------------------------- 槽位 ---------------------------- */

export const slotRule = defineRule({
  code: 'slot',
  description: '必填槽位、字数上限、列表数量',
  run(doc) {
    const layout = getLayout(doc.layoutId)
    if (!layout || layout.free) return []
    const out: PrecheckIssue[] = []
    const page = doc.pages[0]!
    for (const slot of expandSlots(layout, doc.settings)) {
      const el = page.elements.find((e) => e.slot === slot.key)
      if (!el) {
        if (slot.required) out.push(issue({ code: 'slot.missing', level: 'error', slot: slot.key, message: `缺少「${slot.label}」` }))
        continue
      }
      if (!el.visible) continue
      const base = { elementId: el.id, slot: slot.key }
      const text = mainText(el)
      if (text !== undefined) {
        const len = displayLength(text, doc)
        if (slot.required && len === 0) out.push(issue({ ...base, code: 'slot.required', level: 'error', message: `「${slot.label}」不能为空` }))
        if (slot.maxLength && len > slot.maxLength)
          out.push(
            issue({
              ...base,
              code: 'slot.maxLength',
              level: 'error',
              message: `「${slot.label}」超出 ${len - slot.maxLength} 个字（${len}/${slot.maxLength}）`,
              suggestion: '精简文案；参数按示例值计算字数',
            }),
          )
        if (PLACEHOLDER_TEXT.test(stripTags(text)))
          out.push(issue({ ...base, code: 'slot.placeholder', level: 'warning', message: `「${slot.label}」仍为默认文案` }))
      }
      if (el.type === 'image' && isPlaceholderSrc(el.props.src) && !el.props.srcParam) {
        out.push(issue({ ...base, code: 'slot.image', level: slot.required ? 'error' : 'warning', message: `请上传「${slot.label}」` }))
      }
      if (el.type === 'video' && !el.props.src) {
        out.push(issue({ ...base, code: 'slot.video', level: 'error', message: `请上传「${slot.label}」` }))
      }
      for (const [path, max] of Object.entries(slot.limits ?? {})) {
        for (const { value, at } of readPath(el.props, path)) {
          if (typeof value !== 'string') continue
          const len = displayLength(value, doc)
          if (len > max) out.push(issue({ ...base, code: 'slot.maxLength', level: 'error', target: at, message: `「${slot.label}」${at} 超出字数（${len}/${max}）` }))
        }
      }
      if (slot.count) {
        const list = (el.props as Record<string, unknown>)[slot.count.path]
        const n = Array.isArray(list) ? list.length : 0
        if (n < slot.count.min || n > slot.count.max)
          out.push(issue({ ...base, code: 'slot.count', level: 'error', message: `「${slot.label}」数量需为 ${slot.count.min}-${slot.count.max} 个，当前 ${n} 个` }))
      }
    }
    return out
  },
})

/* ---------------------------- 点击事件 ---------------------------- */

function checkEvent(event: ActionEvent | undefined, where: string, el: AnyElement, doc: TemplateDocument): PrecheckIssue[] {
  if (!event) return []
  const def = ACTIONS[event.action]
  if (!def) return [issue({ code: 'event.unknown', level: 'error', elementId: el.id, message: `${where}：未知事件 ${event.action}` })]
  const out: PrecheckIssue[] = []
  const examples = new Map(doc.params.map((p) => [p.name, p.example]))
  for (const f of def.fields) {
    const raw = event[f.key]
    const value = typeof raw === 'string' ? replaceParams(raw, (n) => examples.get(n) ?? '') : raw
    const empty = value === undefined || value === ''
    if (f.required && empty) {
      out.push(issue({ code: 'event.required', level: 'error', elementId: el.id, slot: el.slot, message: `${where}「${def.label}」未填写${f.label}` }))
      continue
    }
    if (empty || typeof value !== 'string') continue
    if (f.kind === 'url') {
      if (!isHttpsUrl(value))
        out.push(issue({ code: 'event.https', level: 'error', elementId: el.id, slot: el.slot, message: `${where}：${f.label}需以 https:// 开头` }))
      if (value.length > URL_MAX_LENGTH)
        out.push(issue({ code: 'event.urlLength', level: 'error', elementId: el.id, message: `${where}：链接长度不能超过 ${URL_MAX_LENGTH}` }))
    }
    if (f.kind === 'phone' && !/^[\d*+\-\s]{3,20}$/.test(value))
      out.push(issue({ code: 'event.phone', level: 'error', elementId: el.id, message: `${where}：电话号码格式不正确` }))
    if (f.kind === 'email' && !isEmail(value))
      out.push(issue({ code: 'event.email', level: 'error', elementId: el.id, message: `${where}：邮箱格式不正确` }))
    if (f.maxLength && charLength(value) > f.maxLength && f.kind !== 'url')
      out.push(issue({ code: 'event.maxLength', level: 'error', elementId: el.id, message: `${where}：${f.label}最多 ${f.maxLength} 个字` }))
  }
  if (event.action === 'OPEN_SCHEDULE' && event.startTime && event.endTime && String(event.startTime) >= String(event.endTime))
    out.push(issue({ code: 'event.schedule', level: 'error', elementId: el.id, message: `${where}：日程结束时间需晚于开始时间` }))
  return out
}

function nestedEvents(el: AnyElement): { event?: ActionEvent; where: string }[] {
  const label = ELEMENT_META[el.type].label
  const list: { event?: ActionEvent; where: string }[] = [{ event: el.event, where: label }]
  const p = el.props as Record<string, unknown>
  const pushButtons = (buttons: unknown, prefix: string) => {
    if (Array.isArray(buttons))
      buttons.forEach((b: { text?: string; event?: ActionEvent }, i) => list.push({ event: b?.event, where: `${prefix}按钮${i + 1}「${b?.text ?? ''}」` }))
  }
  if (el.type === 'sideslip') el.props.cards.forEach((c, i) => pushButtons(c.buttons, `${label}第${i + 1}张`))
  if (el.type === 'eCommerce') pushButtons(el.props.buttons, label)
  if (el.type === 'moreGoods') el.props.items.forEach((it, i) => list.push({ event: it.button.event, where: `${label}商品${i + 1}按钮` }))
  if (el.type === 'swiper') el.props.items.forEach((it, i) => list.push({ event: it.event, where: `${label}第${i + 1}张` }))
  if (el.type === 'cardVoucher') list.push({ event: el.props.button?.event, where: `${label}按钮` })
  if (el.type === 'textSelect' || el.type === 'imgSelect')
    (p.options as { event?: ActionEvent }[]).forEach((o, i) => list.push({ event: o.event, where: `${label}选项${i + 1}` }))
  return list
}

export const eventRule = defineRule({
  code: 'event',
  description: '点击事件必填项、链接 https、长度、格式',
  run(doc) {
    const out: PrecheckIssue[] = []
    for (const page of doc.pages)
      for (const el of page.elements) {
        if (!el.visible) continue
        for (const { event, where } of nestedEvents(el)) out.push(...checkEvent(event, where, el, doc))
      }
    return out
  },
})

/* ---------------------------- 参数 ---------------------------- */

export const paramRule = defineRule({
  code: 'param',
  description: '参数定义、示例、长度',
  run(doc) {
    const out: PrecheckIssue[] = []
    const used = collectUsedParams(doc)
    const defined = new Map(doc.params.map((p) => [p.name, p]))
    for (const name of used) {
      const p = defined.get(name)
      if (!p) {
        out.push(issue({ code: 'param.undefined', level: 'error', target: name, message: `参数「${name}」未定义`, suggestion: '打开“参数管理”补充参数' }))
        continue
      }
      if (!p.example.trim())
        out.push(issue({ code: 'param.example', level: 'error', target: name, message: `参数「${name}」缺少示例`, suggestion: `示例：${PARAM_TYPE_META[p.type].example}` }))
      const len = charLength(p.example)
      if (p.example && (len < p.minLength || len > p.maxLength))
        out.push(issue({ code: 'param.length', level: 'error', target: name, message: `参数「${name}」示例长度需在 ${p.minLength}-${p.maxLength} 之间` }))
      if (p.minLength > p.maxLength) out.push(issue({ code: 'param.range', level: 'error', target: name, message: `参数「${name}」最小长度大于最大长度` }))
    }
    for (const p of doc.params)
      if (!used.includes(p.name)) out.push(issue({ code: 'param.unused', level: 'info', target: p.name, message: `参数「${p.name}」未被使用` }))
    if (used.length > 0) out.push(issue({ code: 'param.dynamic', level: 'info', message: `模板包含 ${used.length} 个动态参数，发送时需传入参数值` }))
    return out
  },
})

/* ---------------------------- 三信融合 ---------------------------- */

export const protocolRule = defineRule({
  code: 'protocol',
  description: 'RCS / RMS 转换兼容性',
  run(doc) {
    const layout = getLayout(doc.layoutId)
    if (!layout?.protocols.includes('rcs')) return []
    const out: PrecheckIssue[] = []
    for (const el of doc.pages[0]!.elements) {
      if (el.type !== 'button' || !el.event) continue
      const def = ACTIONS[el.event.action]
      if (def.rcs.kind === 'unsupported')
        out.push(
          issue({
            code: 'protocol.rcsAction',
            level: 'warning',
            elementId: el.id,
            slot: el.slot,
            message: `按钮「${el.props.text}」的「${def.label}」事件在苹果端（RCS）不支持，提交时需补填替代链接`,
          }),
        )
      if (def.rcs.kind === 'asBrowser')
        out.push(issue({ code: 'protocol.rcsBrowser', level: 'info', elementId: el.id, message: `按钮「${el.props.text}」在苹果端将以浏览器打开` }))
    }
    return out
  },
})

/* ---------------------------- 内容合规 ---------------------------- */

/** 广告法极限词（示例词库，可通过插件替换） */
export const SENSITIVE_WORDS = ['最好', '第一', '国家级', '最高级', '顶级', '绝对', '100%', '万能', '史无前例', '永久']

export const contentRule = defineRule({
  code: 'content',
  description: '广告法极限词、营销退订提示',
  run(doc) {
    const out: PrecheckIssue[] = []
    for (const el of doc.pages.flatMap((p) => p.elements)) {
      // 仅检查用户可见文本，避免素材地址（如 SVG 中的 100%）误报
      const text = elementTexts(el).map(stripTags).join('\n')
      const hits = SENSITIVE_WORDS.filter((w) => text.includes(w))
      if (hits.length)
        out.push(
          issue({ code: 'content.sensitive', level: 'warning', elementId: el.id, slot: el.slot, message: `检测到疑似极限词：${hits.join('、')}`, suggestion: '极限词易导致审核驳回，建议替换' }),
        )
    }
    if (doc.usage === 'commercial' && doc.category === 'service')
      out.push(issue({ code: 'content.unsubscribe', level: 'info', message: '营销类模板下发时将自动追加退订提示' }))
    return out
  },
})

export const builtinRules: PrecheckRule[] = [basicRule, slotRule, eventRule, paramRule, protocolRule, contentRule]
