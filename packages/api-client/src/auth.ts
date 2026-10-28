/** 认证错误保留服务端稳定错误码。 */
export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
  }
}
/** Better Auth 原生协议访问层；应用不得直接读取会话 Cookie。 */
export function createAuthClient(baseUrl = '') {
  const request = async <T = Record<string, unknown>>(path: string, body?: unknown): Promise<T> => {
    let response: Response
    try {
      response = await fetch(`${baseUrl}/api/auth/${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    } catch {
      throw new AuthError('UPSTREAM', '无法连接登录服务。请先启动 API（默认端口 4000）后再试。')
    }
    const text = await response.text()
    let data: { code?: string; message?: string } = {}
    if (text) {
      try {
        data = JSON.parse(text) as { code?: string; message?: string }
      } catch {
        throw new AuthError(
          'UPSTREAM',
          '登录服务没有返回有效数据。请确认 API 已启动并且数据库可连接后再试。',
        )
      }
    }
    if (!response.ok) throw new AuthError(data.code ?? 'AUTH_ERROR', data.message ?? '认证操作失败')
    return data as T
  }
  return {
    request,
    signIn: (email: string, password: string) => request('sign-in/email', { email, password }),
    signUp: (name: string, email: string, password: string, callbackURL: string) =>
      request('sign-up/email', { name, email, password, callbackURL }),
    signOut: () => request('sign-out', {}),
    forgotPassword: (email: string, redirectTo: string) =>
      request('request-password-reset', { email, redirectTo }),
    resetPassword: (token: string, newPassword: string) =>
      request('reset-password', { token, newPassword }),
    sendVerification: (email: string, callbackURL: string) =>
      request('send-verification-email', { email, callbackURL }),
  }
}
