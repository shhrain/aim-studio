/** 登录态：URL 携带的 token / phone 由 proxy 写入 Cookie 后从地址栏清除 */
export const TOKEN_COOKIE = 'aim_token'
export const PHONE_COOKIE = 'aim_phone'
const MAX_AGE = 7 * 24 * 3600

/** 无需登录即可访问的路径前缀 */
export const PUBLIC_PATHS = ['/auth-required', '/ability-guide', '/preview', '/embed', '/api']

function readCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return m ? decodeURIComponent(m[1]!) : ''
}

export function getToken() {
  return readCookie(TOKEN_COOKIE)
}

/** 业务标识 whois = 登录手机号 */
export function getPhone() {
  return readCookie(PHONE_COOKIE)
}

export function setAuth(token: string, phone: string) {
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${MAX_AGE}; samesite=lax`
  document.cookie = `${PHONE_COOKIE}=${encodeURIComponent(phone)}; path=/; max-age=${MAX_AGE}; samesite=lax`
}

export function clearAuth() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`
  document.cookie = `${PHONE_COOKIE}=; path=/; max-age=0`
  try {
    sessionStorage.removeItem('aim:sendDraft')
  } catch {
    /* ignore */
  }
}
