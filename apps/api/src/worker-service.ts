import nodemailer from 'nodemailer'
import { precheck } from '@aim/template-core'
import { config, transaction } from './context'
import { storage } from './storage'
import { providers } from './providers'
const mail = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_PORT === 465,
  connectionTimeout: 10000,
  socketTimeout: 15000,
  auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } : undefined,
})
/** 重复队列消息不会重复变更已完成记录。 */
export async function processEvent(eventId: string) {
  await transaction(async (client) => {
    const row = (await client.query('SELECT * FROM outbox WHERE id=$1 FOR UPDATE', [eventId]))
      .rows[0]
    if (
      !row ||
      row.delivered_at ||
      row.failed_at ||
      new Date(row.available_at).getTime() > Date.now()
    )
      return
    if (row.topic === 'mail')
      await mail.sendMail({
        from: config.MAIL_FROM,
        ...row.payload,
        messageId: `<${row.id}@aim.local>`,
      })
    else if (row.topic === 'file-delete')
      await storage.delete(row.payload.key).catch((e) => {
        if (e.code !== 'ENOENT') throw e
      })
    else if (row.topic === 'job') {
      const job = (
        await client.query('SELECT * FROM jobs WHERE id=$1 FOR UPDATE', [row.payload.id])
      ).rows[0]
      if (job && job.status !== 'done') {
        if (job.kind === 'precheck')
          await client.query(
            "UPDATE jobs SET status='done',result=$1,error=NULL,updated_at=now() WHERE id=$2",
            [JSON.stringify(precheck(job.payload.document)), job.id],
          )
        else if (job.kind === 'delivery') {
          // 真实通道必须实现独立的投递确认与回执状态机，不能沿用模拟成功状态。
          if (job.mode !== 'simulated' || config.PROVIDER_MODE !== 'simulated')
            throw new Error('未启用模拟通道')
          const result = await providers.delivery.send({
            requestId: job.id,
            mobiles: job.payload.request.mobiles,
          })
          await client.query(
            "UPDATE deliveries SET status='simulated_success' WHERE job_id=$1 AND status='pending'",
            [job.id],
          )
          await client.query(
            "UPDATE jobs SET status='done',result=$1,error=NULL,updated_at=now() WHERE id=$2",
            [JSON.stringify(result), job.id],
          )
        } else throw new Error('不支持的后台任务')
      }
    } else throw new Error('不支持的事件类型')
    await client.query('UPDATE outbox SET delivered_at=now(),error=NULL WHERE id=$1', [row.id])
  })
}
/** 最多五次尝试，指数退避；不泄露 SMTP 或数据库连接信息。 */
export async function recordFailure(eventId: string) {
  await transaction(async (client) => {
    const result = await client.query(
      "UPDATE outbox SET attempts=attempts+1,error='TASK_EXECUTION_FAILED',available_at=now()+make_interval(secs=>LEAST(3600,10*power(2,attempts))::int),failed_at=CASE WHEN attempts+1>=5 THEN now() ELSE NULL END WHERE id=$1 AND delivered_at IS NULL AND failed_at IS NULL RETURNING *",
      [eventId],
    )
    const row = result.rows[0]
    if (row?.failed_at && row.topic === 'job')
      await client.query(
        "UPDATE jobs SET status='failed',error='TASK_EXECUTION_FAILED',updated_at=now() WHERE id=$1 AND status<>'done'",
        [row.payload.id],
      )
  })
}
