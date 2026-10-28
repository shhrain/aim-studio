import { z } from 'zod'
const schema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  PUBLIC_URL: z.string().url().default('http://localhost:3000'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PROVIDER_MODE: z.enum(['disabled', 'simulated']).default('disabled'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().default('AIM Studio <noreply@aim.local>'),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_PATH: z.string().default('./data/files'),
  S3_BUCKET: z.string().optional(),
  S3_ENDPOINT: z.preprocess((v) => (v === '' ? undefined : v), z.string().url().optional()),
  S3_REGION: z.string().default('us-east-1'),
  UPLOAD_MAX_BYTES: z.coerce
    .number()
    .positive()
    .default(50 * 1024 * 1024),
  WORKSPACE_STORAGE_BYTES: z.coerce
    .number()
    .positive()
    .default(1024 * 1024 * 1024),
})
/** 启动时拒绝不完整的生产配置。 */
export function loadConfig(input: NodeJS.ProcessEnv = process.env) {
  const c = schema.parse(input)
  if (
    c.NODE_ENV === 'production' &&
    (!c.PUBLIC_URL.startsWith('https://') || !input.SMTP_HOST || c.PROVIDER_MODE === 'simulated')
  )
    throw new Error('生产环境必须配置 HTTPS、SMTP，并关闭模拟通道')
  if (c.STORAGE_DRIVER === 's3' && !c.S3_BUCKET) throw new Error('S3 存储必须配置 S3_BUCKET')
  return c
}
export type Config = ReturnType<typeof loadConfig>
