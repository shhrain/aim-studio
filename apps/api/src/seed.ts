import { createDocument } from '@aim/template-core'
import { saveTemplate } from './templates'
import { pool } from './context'
const email = process.env.SEED_EMAIL
if (!email) throw new Error('请设置已验证账号的 SEED_EMAIL；不会创建默认密码账号')
try {
  const user = (
    await pool.query(
      'SELECT u.id,m.organization_id FROM "user" u JOIN member m ON m.user_id=u.id WHERE u.email=$1 AND u.email_verified=true AND m.role=\'owner\' ORDER BY m.created_at LIMIT 1',
      [email],
    )
  ).rows[0]
  if (!user) throw new Error('请先注册并创建工作空间')
  const doc = createDocument({ layoutId: 'com.hbm.imageandtext' })
  doc.id = `seed-${user.organization_id}`
  doc.name = '欢迎使用 AIM Studio'
  if (!(await pool.query('SELECT id FROM templates WHERE id=$1', [doc.id])).rowCount)
    await saveTemplate(user.organization_id, user.id, doc)
  console.log('示例草稿已就绪')
} finally {
  await pool.end()
}
