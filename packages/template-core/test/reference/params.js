import { PARAM_NAME_REG, REJECT_TEXT } from './constants'

export function replaceAll(str, search, replacement) {
  if (str == null) return str
  return String(str).split(search).join(replacement)
}

export function replaceSymbol(str) {
  if (!str) return str
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<br>/g, '')
}

export function stripReject(str) {
  if (!str) return str
  return replaceAll(replaceAll(String(str), ' ' + REJECT_TEXT, ''), REJECT_TEXT, '')
}

export function nodeToString(node) {
  const tmpNode = document.createElement('div')
  tmpNode.appendChild(node.cloneNode(true))
  return tmpNode.innerHTML
}

export function getTextParam(html) {
  if (!html) return ''
  let final = html
  const div = document.createElement('div')
  div.innerHTML = html
  const allSpan = div.querySelectorAll ? div.querySelectorAll('span') : div.getElementsByTagName('span')
  const allStr = div.querySelectorAll ? div.querySelectorAll('i') : div.getElementsByTagName('i')
  Array.prototype.forEach.call(allStr, item => {
    final = final.replace(nodeToString(item), '')
  })
  Array.prototype.forEach.call(allSpan, item => {
    const itemString = nodeToString(item).replace(/\n/g, '').replace(/\r/g, '')
    final = final.replace(itemString + ' ', '${' + item.innerText + '}')
    final = final.replace(itemString, '${' + item.innerText + '}')
  })
  return final
}

export function stripDynamicParams(html) {
  return getTextParam(html || '').replace(/(\${.*?}+)/g, '')
}

export function htmlParamsToTpl(payload) {
  if (payload == null) return payload
  const raw = typeof payload === 'string' ? payload : JSON.stringify(payload)
  const replaced = raw.replace(PARAM_NAME_REG, (_, __, param) => '${' + param + '}')
  return typeof payload === 'string' ? replaced : JSON.parse(replaced)
}

export function isValidHttpsUrl(string) {
  return /^(https:\/\/)/.test(string || '')
}
