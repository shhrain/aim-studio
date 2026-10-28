import { sql } from 'drizzle-orm'
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  bigint,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'

const at = (name: string) => timestamp(name, { withTimezone: true }).notNull().defaultNow()
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: at('created_at'),
  updatedAt: at('updated_at'),
})
export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  metadata: text('metadata'),
  createdAt: at('created_at'),
})
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: at('created_at'),
  updatedAt: at('updated_at'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  activeOrganizationId: text('active_organization_id'),
})
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: at('created_at'),
  updatedAt: at('updated_at'),
})
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: at('created_at'),
  updatedAt: at('updated_at'),
})
export const member = pgTable(
  'member',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    createdAt: at('created_at'),
  },
  (t) => [uniqueIndex('member_unique').on(t.organizationId, t.userId)],
)
export const invitation = pgTable('invitation', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').notNull().default('pending'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => user.id),
  createdAt: at('created_at'),
})
export const preferences = pgTable('preferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull().default('zh-CN'),
  theme: text('theme').notNull().default('system'),
  timezone: text('timezone').notNull().default('Asia/Shanghai'),
  defaultWorkspaceId: text('default_workspace_id'),
})
export const templates = pgTable(
  'templates',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => organization.id),
    name: text('name').notNull(),
    document: jsonb('document').notNull(),
    revision: integer('revision').notNull().default(1),
    status: text('status').notNull().default('draft'),
    archived: boolean('archived').notNull().default(false),
    publishedVersionId: text('published_version_id'),
    createdBy: text('created_by')
      .notNull()
      .references(() => user.id),
    createdAt: at('created_at'),
    updatedAt: at('updated_at'),
  },
  (t) => [index('templates_workspace').on(t.workspaceId, t.updatedAt)],
)
export const versions = pgTable('template_versions', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => organization.id),
  templateId: text('template_id')
    .notNull()
    .references(() => templates.id),
  revision: integer('revision').notNull(),
  document: jsonb('document').notNull(),
  converted: jsonb('converted'),
  status: text('status').notNull().default('reviewing'),
  createdBy: text('created_by')
    .notNull()
    .references(() => user.id),
  createdAt: at('created_at'),
})
export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => organization.id),
  templateId: text('template_id')
    .notNull()
    .references(() => templates.id),
  versionId: text('version_id')
    .notNull()
    .references(() => versions.id),
  status: text('status').notNull().default('reviewing'),
  reason: text('reason'),
  reviewerId: text('reviewer_id').references(() => user.id),
  createdAt: at('created_at'),
  updatedAt: at('updated_at'),
})
export const publications = pgTable('publications', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => organization.id),
  templateId: text('template_id')
    .notNull()
    .references(() => templates.id),
  versionId: text('version_id')
    .notNull()
    .references(() => versions.id),
  action: text('action').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  createdAt: at('created_at'),
})
export const materials = pgTable('materials', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => organization.id),
  name: text('name').notNull(),
  type: text('type').notNull(),
  mime: text('mime').notNull(),
  key: text('key').notNull().unique(),
  size: bigint('size', { mode: 'number' }).notNull(),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: at('created_at'),
})
export const materialReferences = pgTable('material_references', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => organization.id),
  materialId: text('material_id')
    .notNull()
    .references(() => materials.id),
  templateId: text('template_id')
    .notNull()
    .references(() => templates.id),
  versionId: text('version_id').references(() => versions.id),
})
export const contacts = pgTable(
  'contacts',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => organization.id),
    contactName: text('contact_name').notNull(),
    mobile: text('mobile').notNull(),
    createdAt: at('created_at'),
  },
  (t) => [uniqueIndex('contacts_workspace_mobile').on(t.workspaceId, t.mobile)],
)
export const jobs = pgTable(
  'jobs',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => organization.id),
    kind: text('kind').notNull(),
    status: text('status').notNull().default('pending'),
    mode: text('mode').notNull(),
    payload: jsonb('payload').notNull(),
    result: jsonb('result'),
    error: text('error'),
    idempotencyKey: text('idempotency_key'),
    createdBy: text('created_by')
      .notNull()
      .references(() => user.id),
    createdAt: at('created_at'),
    updatedAt: at('updated_at'),
  },
  (t) => [uniqueIndex('jobs_idempotency').on(t.workspaceId, t.kind, t.idempotencyKey)],
)
export const deliveries = pgTable(
  'deliveries',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => organization.id),
    jobId: text('job_id')
      .notNull()
      .references(() => jobs.id),
    mobile: text('mobile').notNull(),
    status: text('status').notNull().default('pending'),
    messageType: integer('message_type').notNull(),
    providerEventId: text('provider_event_id').unique(),
    createdAt: at('created_at'),
  },
  (t) => [
    index('deliveries_workspace_created').on(t.workspaceId, t.createdAt),
    index('deliveries_job').on(t.jobId),
  ],
)
export const shares = pgTable('shares', {
  id: text('id').primaryKey(),
  tokenHash: text('token_hash').notNull().unique(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => organization.id),
  templateId: text('template_id')
    .notNull()
    .references(() => templates.id),
  document: jsonb('document').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdBy: text('created_by')
    .notNull()
    .references(() => user.id),
  createdAt: at('created_at'),
})
export const audit = pgTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => organization.id),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    action: text('action').notNull(),
    targetId: text('target_id'),
    details: jsonb('details'),
    createdAt: at('created_at'),
  },
  (t) => [index('audit_workspace_created').on(t.workspaceId, t.createdAt)],
)
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => organization.id),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  message: text('message').notNull(),
  read: boolean('read').notNull().default(false),
  createdAt: at('created_at'),
})
export const feedback = pgTable('feedback', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => organization.id),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  content: text('content').notNull(),
  createdAt: at('created_at'),
})
export const outbox = pgTable(
  'outbox',
  {
    id: text('id').primaryKey(),
    topic: text('topic').notNull(),
    payload: jsonb('payload').notNull(),
    attempts: integer('attempts').notNull().default(0),
    availableAt: at('available_at'),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    error: text('error'),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    createdAt: at('created_at'),
  },
  // worker 每 5 秒轮询待处理事件；部分索引避免全表扫描。
  (t) => [
    index('outbox_pending')
      .on(t.availableAt)
      .where(sql`delivered_at IS NULL AND failed_at IS NULL`),
  ],
)
export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  hits: integer('hits').notNull().default(1),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

/** 显式分享素材引用，使分享创建、素材删除及租户检查共享数据库约束。 */
export const shareMaterials = pgTable(
  'share_materials',
  {
    shareId: text('share_id')
      .notNull()
      .references(() => shares.id, { onDelete: 'cascade' }),
    materialId: text('material_id')
      .notNull()
      .references(() => materials.id),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => organization.id),
  },
  (t) => [uniqueIndex('share_material_unique').on(t.shareId, t.materialId)],
)
