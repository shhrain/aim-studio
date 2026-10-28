/** 身份由 HttpOnly Cookie 与服务端会话确定；这里只保存页面工作空间选择。 */
export function getIdentity() {
  return typeof sessionStorage === 'undefined'
    ? ''
    : (sessionStorage.getItem('aim:workspace') ?? '')
}
export function getPhone() {
  return ''
}
/** 仅控制界面入口；服务端在每次请求中重新校验成员权限。 */
export function canWrite() {
  return (
    typeof sessionStorage !== 'undefined' &&
    ['owner', 'admin', 'editor'].includes(sessionStorage.getItem('aim:role') ?? '')
  )
}
export function clearAuth() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('aim:workspace')
    sessionStorage.removeItem('aim:role')
    sessionStorage.removeItem('aim:sendDraft')
    sessionStorage.removeItem('aim:user')
    for (const key of Object.keys(sessionStorage)) if (key.startsWith('aim:ability-history:')) sessionStorage.removeItem(key)
  }
}
