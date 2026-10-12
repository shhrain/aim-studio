export type IssueLevel = 'error' | 'warning' | 'info'

export interface PrecheckIssue {
  /** 规则编码，如 slot.maxLength */
  code: string
  level: IssueLevel
  message: string
  /** 关联元素（用于点击定位） */
  elementId?: string
  slot?: string
  /** 关联的参数 / 厂商等 */
  target?: string
  /** 可执行的修复建议 */
  suggestion?: string
}

export interface PrecheckReport {
  passed: boolean
  score: number
  errors: PrecheckIssue[]
  warnings: PrecheckIssue[]
  infos: PrecheckIssue[]
  issues: PrecheckIssue[]
  checkedAt: number
}
