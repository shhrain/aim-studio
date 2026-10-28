import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createDatabase } from '@aim/db'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { startDatabase } from './database'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const postgres = await startDatabase(55435)
const { pool, db } = createDatabase(postgres.url)
try {
  const folder = await mkdtemp(root + '.cache/migration-check-')
  await mkdir(folder + '/meta')
  const journal = JSON.parse(
    await readFile(root + 'packages/db/migrations/meta/_journal.json', 'utf8'),
  )
  for (const entry of journal.entries)
    await copyFile(
      root + 'packages/db/migrations/' + entry.tag + '.sql',
      folder + '/' + entry.tag + '.sql',
    )
  await writeFile(
    folder + '/meta/_journal.json',
    JSON.stringify({ ...journal, entries: journal.entries.slice(0, -1) }),
  )
  await migrate(db, { migrationsFolder: folder })
  await pool.query(
    "INSERT INTO organization(id,name,slug,created_at) VALUES('upgrade-space','迁移测试','upgrade-space',now())",
  )
  await pool.query(
    "INSERT INTO contacts(id,workspace_id,contact_name,mobile) VALUES('upgrade-contact','upgrade-space','保留的数据','13800138000')",
  )
  await migrate(db, { migrationsFolder: root + 'packages/db/migrations' })
  assert.equal(
    (await pool.query("SELECT contact_name FROM contacts WHERE id='upgrade-contact'")).rows[0]
      .contact_name,
    '保留的数据',
  )
  assert.equal(
    (await pool.query("SELECT to_regclass('public.share_materials') AS name")).rows[0].name,
    'share_materials',
  )
  const before = (await pool.query('SELECT count(*)::int total FROM drizzle.__drizzle_migrations'))
    .rows[0].total
  const broken = {
    idx: journal.entries.length,
    version: '7',
    when: Date.now() + 1000,
    tag: '9999_intentionally_broken',
    breakpoints: true,
  }
  await writeFile(
    folder + '/meta/_journal.json',
    JSON.stringify({ ...journal, entries: [...journal.entries, broken] }),
  )
  await writeFile(
    folder + '/' + broken.tag + '.sql',
    'CREATE TABLE migration_must_rollback(id text);\n--> statement-breakpoint\nSELECT missing_column FROM migration_must_rollback;',
  )
  await assert.rejects(migrate(db, { migrationsFolder: folder }))
  assert.equal(
    (await pool.query("SELECT to_regclass('public.migration_must_rollback') AS name")).rows[0].name,
    null,
    '失败迁移必须回滚全部 DDL',
  )
  assert.equal(
    (await pool.query('SELECT count(*)::int total FROM drizzle.__drizzle_migrations')).rows[0]
      .total,
    before,
    '失败迁移不得标记完成',
  )
  assert.equal(
    (await pool.query("SELECT count(*)::int total FROM contacts WHERE id='upgrade-contact'"))
      .rows[0].total,
    1,
  )
  await migrate(db, { migrationsFolder: root + 'packages/db/migrations' })
  console.log(
    '通过：真实 PostgreSQL 旧库升级、原有数据保留、失败迁移完整回滚、修复后重复迁移幂等。备份恢复和镜像回滚仍由 Docker 演练验证。',
  )
} finally {
  await pool.end()
  await postgres.stop()
}
