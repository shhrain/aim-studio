'use client'
import { usePathname } from 'next/navigation'
import {
  formatPrecheckIssue,
  editorMessages,
  editorCopyKeys,
  type EditorMessageKey,
} from '@aim/i18n'
/** 界面专用：不得用于翻译用户文案、素材名称或参数。 */
export function useEditorCopy() {
  const path = usePathname()
  const locale = path.startsWith('/en/') ? 'en' : 'zh-CN'
  return (key: EditorMessageKey | string): string => {
    const id = (key in editorMessages ? key : editorCopyKeys[key]) as EditorMessageKey
    return id ? editorMessages[id][locale] : key
  }
}

/** 预检提示通过规则编码翻译，不翻译模板正文。 */
export function usePrecheckText() {
  const path = usePathname()
  return (issue: Parameters<typeof formatPrecheckIssue>[0]) =>
    formatPrecheckIssue(issue, path.startsWith('/en/') ? 'en' : 'zh-CN')
}
