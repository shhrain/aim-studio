import { session } from '@aim/utils'

/** 发送草稿：从详情页跳转通讯录选号后恢复 */
export interface SendDraft {
  tplId: string
  mobiles: string[]
  updatedAt: number
}

const KEY = 'sendDraft'
export const MAX_SEND = 10

export function loadDraft(tplId: string): SendDraft | null {
  const d = session.get<SendDraft | null>(KEY, null)
  return d && d.tplId === tplId ? d : null
}

export function saveDraft(draft: Omit<SendDraft, 'updatedAt'>) {
  session.set(KEY, { ...draft, mobiles: draft.mobiles.slice(0, MAX_SEND), updatedAt: Date.now() })
}

export function clearDraft() {
  session.remove(KEY)
}
