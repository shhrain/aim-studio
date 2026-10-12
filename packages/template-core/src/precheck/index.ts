import type { TemplateDocument } from '@aim/template-schema'
import { registry } from '../registry'
import type { PrecheckIssue, PrecheckReport } from './types'

export * from './types'
export { SENSITIVE_WORDS, displayLength, readPath } from './rules'

const WEIGHT = { error: 12, warning: 4, info: 0 } as const

/**
 * 模板预检（快速检测）：同步执行所有已注册规则。
 * 返回 passed=false 时不允许提交审核；warning 仅提示。
 */
export function precheck(doc: TemplateDocument, options: { only?: string[] } = {}): PrecheckReport {
  const issues: PrecheckIssue[] = []
  for (const rule of registry.rules()) {
    if (options.only && !options.only.includes(rule.code)) continue
    try {
      issues.push(...rule.run(doc))
    } catch (err) {
      issues.push({ code: `${rule.code}.crash`, level: 'warning', message: `规则「${rule.description}」执行异常：${(err as Error).message}` })
    }
  }
  const errors = issues.filter((i) => i.level === 'error')
  const warnings = issues.filter((i) => i.level === 'warning')
  const infos = issues.filter((i) => i.level === 'info')
  const score = Math.max(0, 100 - issues.reduce((s, i) => s + WEIGHT[i.level], 0))
  return { passed: errors.length === 0, score, errors, warnings, infos, issues, checkedAt: Date.now() }
}

/** 按元素聚合问题（画布上标红用） */
export function issuesByElement(report: PrecheckReport): Map<string, PrecheckIssue[]> {
  const map = new Map<string, PrecheckIssue[]>()
  for (const i of report.issues) {
    if (!i.elementId || i.level === 'info') continue
    map.set(i.elementId, [...(map.get(i.elementId) ?? []), i])
  }
  return map
}
