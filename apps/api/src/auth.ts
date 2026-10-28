import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { organization } from 'better-auth/plugins'
import * as schema from '@aim/db'
import { config, db, id, pool } from './context'

function english(url: string) {
  const callback =
    new URL(url).searchParams.get('callbackURL') ??
    new URL(url).searchParams.get('redirectTo') ??
    ''
  return /\/en(?:\/|$)/.test(callback)
}
async function email(to: string, subject: string, text: string) {
  await pool.query('INSERT INTO outbox(id,topic,payload) VALUES($1,$2,$3)', [
    id(),
    'mail',
    JSON.stringify({ to, subject, text }),
  ])
}
export const auth = betterAuth({
  secret: config.BETTER_AUTH_SECRET,
  baseURL: config.PUBLIC_URL,
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  trustedOrigins: [config.PUBLIC_URL],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await email(
        user.email,
        english(url) ? 'Reset password — AIM Studio' : '重置密码 — AIM Studio',
        (english(url)
          ? 'Reset your password. Ignore this message if you did not request it.'
          : '请打开以下链接重置密码。如非本人操作请忽略。') +
          '\n' +
          url,
      )
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await email(
        user.email,
        english(url) ? 'Verify email — AIM Studio' : '验证邮箱 — AIM Studio',
        (english(url) ? 'Verify your email address:' : '请验证您的邮箱：') + '\n' + url,
      )
    },
  },
  user: { changeEmail: { enabled: true } },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: false },
  },
  advanced: {
    useSecureCookies: config.PUBLIC_URL.startsWith('https://'),
    defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', path: '/' },
  },
  plugins: [organization()],
})
export { email }
