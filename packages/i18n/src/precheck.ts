import type { Locale } from './index'
interface Issue {
  code?: string
  message: string
  slot?: string
  target?: string
  messageKey?: string
  messageParams?: Record<string, string | number>
}
const english: Record<string, string> = {
  'basic.name': 'Enter a template name of up to 20 characters.',
  'basic.vendors': 'Select at least one supported vendor.',
  'basic.layout': 'Choose a supported layout.',
  'vendor.unsupported': 'Remove the unsupported vendor or choose a compatible layout.',
  'slot.missing': 'Add the missing layout element.',
  'slot.required': 'Fill in this required field.',
  'slot.maxLength': 'Shorten the content to fit this layout field.',
  'slot.placeholder': 'Replace the default text with your content.',
  'slot.image': 'Upload an image for this field.',
  'slot.video': 'Upload a video for this field.',
  'slot.count': 'Adjust the number of items to the layout limits.',
  'event.unknown': 'Choose a supported click action.',
  'event.required': 'Complete the required action fields.',
  'event.https': 'Use a valid HTTPS destination.',
  'event.urlLength': 'Shorten the destination URL.',
  'event.phone': 'Enter a valid phone number.',
  'event.email': 'Enter a valid email address.',
  'event.maxLength': 'Shorten the action field.',
  'event.schedule': 'Set a valid start and end time.',
  'param.undefined': 'Define the parameter before using it.',
  'param.example': 'Provide an example value for this parameter.',
  'param.length': 'Adjust the example to the parameter length limits.',
  'param.range': 'Set a valid parameter length range.',
  'param.unused': 'Remove the unused parameter or insert it into the content.',
  'param.dynamic': 'Use dynamic parameters supported by this field.',
  'protocol.rcsAction': 'Provide an HTTPS fallback for this action on RCS.',
  'protocol.rcsBrowser': 'Check the destination in the RCS preview.',
  'content.sensitive': 'Review potentially sensitive wording before submission.',
  'content.unsubscribe': 'Include a clear unsubscribe instruction where required.',
}
/** 使用稳定规则编码翻译提示；用户内容与参数名称保持原文。 */
export function formatPrecheckIssue(issue: Issue, locale: Locale): string {
  if (locale === 'zh-CN') return issue.message
  const message = issue.code?.endsWith('.crash')
    ? 'The validation rule could not run. Retry before submitting.'
    : (english[issue.messageKey ?? issue.code ?? ''] ?? 'Review this field before submitting.')
  const context = issue.target ?? issue.slot
  return message + (context ? ' [' + context + ']' : '')
}
