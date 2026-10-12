/**
 * 从 template-schema 生成 Markdown 规范表。
 * 文档站、PROMPT.md、AGENTS.md、Cursor 规则共用，保证与代码一致。
 */
import {
  ACTION_LIST,
  ELEMENT_META,
  ELEMENT_TYPES,
  LAYOUTS,
  LAYOUT_GROUPS,
  PARAM_TYPES,
  PARAM_TYPE_META,
  PROTOCOL_META,
  VENDOR_LIST,
  elementPropsSchemas,
  type LayoutDefinition,
  type SlotDefinition,
} from '@aim/template-schema'

/** 表格单元格转义；花括号只出现在行内代码中，MDX 与纯 Markdown 均安全 */
const esc = (s: string) => s.replace(/\|/g, '\\|')
const code = (s: string) => `\`${s}\``

function table(head: string[], rows: string[][]) {
  return [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n')
}

function slotRule(s: SlotDefinition): string {
  const parts: string[] = []
  if (s.maxLength) parts.push(`≤${s.maxLength}字`)
  if (s.ratios) parts.push(s.ratios.map((r) => r.join(':')).join(' / '))
  if (s.count) parts.push(`${s.count.min}-${s.count.max} 项`)
  if (s.limits) parts.push(Object.entries(s.limits).map(([k, v]) => `${k}≤${v}`).join('，'))
  if (s.repeat) parts.push(`数量由 ${s.repeat.setting} 决定`)
  return esc(parts.join('；'))
}

export function layoutsSummaryTable(): string {
  return table(
    ['版式', 'cardId', '分组', '分类', '三信融合', '厂商数', '说明'],
    LAYOUTS.map((l) => [
      l.name,
      code(l.id),
      LAYOUT_GROUPS[l.group].label,
      l.category === 'service' ? '服务类' : '通知类',
      l.protocols.includes('rcs') ? '✓' : '',
      String(l.vendors.length),
      esc(l.description),
    ]),
  )
}

export function layoutDetail(l: LayoutDefinition): string {
  const lines = [
    `### ${l.name}`,
    '',
    `- cardId：${code(l.id)}${l.aliases?.length ? `（兼容 ${l.aliases.map(code).join('、')}）` : ''}`,
    `- 分组：${LAYOUT_GROUPS[l.group].label} · ${l.category === 'service' ? '服务类' : '通知类'}`,
    `- 协议：${l.protocols.map((p) => PROTOCOL_META[p].name).join('、')}`,
    `- 厂商：${l.vendors.map((v) => VENDOR_LIST.find((x) => x.id === v)!.name).join('、')}`,
    '',
  ]
  if (l.settings?.length) {
    lines.push(table(['设置', 'key', '可选值', '默认'], l.settings.map((s) => [s.label, code(s.key), esc((s.options ?? []).map((o) => o.label).join(' / ')), String(s.defaultValue)])), '')
  }
  if (l.slots.length) {
    lines.push(table(['槽位', 'key', '元素', '必填', '规则'], l.slots.map((s) => [s.label, code(s.key), ELEMENT_META[s.elementType].label, s.required ? '✓' : '', slotRule(s)])), '')
  } else lines.push('自由版式：无固定槽位，可添加任意元素并自由拖拽。', '')
  return lines.join('\n')
}

export function elementsTable(): string {
  return table(
    ['类型', '名称', '分组', '可点击', 'props 字段'],
    ELEMENT_TYPES.map((t) => {
      const shape = (elementPropsSchemas[t] as unknown as { shape?: Record<string, unknown> }).shape
      return [code(t), ELEMENT_META[t].label, ELEMENT_META[t].group, ELEMENT_META[t].clickable ? '✓' : '', esc(Object.keys(shape ?? {}).join('、'))]
    }),
  )
}

export function actionsTable(): string {
  const rcs = { urlAction: '支持', dialerAction: '支持（拨号）', asBrowser: '降级为浏览器', unsupported: '不支持，需补填链接' } as const
  return table(
    ['action', '名称', '字段（* 必填）', 'RCS（苹果）', 'RMS'],
    ACTION_LIST.map((a) => [
      code(a.type),
      a.label,
      esc(a.fields.map((f) => `${f.required ? '*' : ''}${f.key}（${f.label}）`).join('、') || '–'),
      rcs[a.rcs.kind],
      { link: '链接文本', text: '文本', none: '–' }[a.rms],
    ]),
  )
}

export function vendorsTable(): string {
  return table(
    ['vendor', '厂商', '旧 factoryType', '审核时效', '支持版式数'],
    VENDOR_LIST.map((v) => [code(v.id), v.name, String(v.legacyFactoryType), v.reviewTime, String(LAYOUTS.filter((l) => l.vendors.includes(v.id)).length)]),
  )
}

export function vendorMatrix(): string {
  return table(
    ['版式', ...VENDOR_LIST.map((v) => v.name)],
    LAYOUTS.map((l) => [l.name, ...VENDOR_LIST.map((v) => (l.vendors.includes(v.id) ? '✓' : ''))]),
  )
}

export function paramTypesTable(): string {
  return table(['type', '名称', '示例', '默认最大长度'], PARAM_TYPES.map((t) => [code(t), PARAM_TYPE_META[t].label, esc(PARAM_TYPE_META[t].example), String(PARAM_TYPE_META[t].maxLength)]))
}

export function counts() {
  return {
    layouts: LAYOUTS.filter((l) => !l.free).length,
    elements: ELEMENT_TYPES.length,
    actions: ACTION_LIST.length,
    vendors: VENDOR_LIST.length,
  }
}
