import { getRequestConfig } from 'next-intl/server'
import { messages, type Locale } from '@aim/i18n'
export default getRequestConfig(async ({ requestLocale }) => {
  const value = await requestLocale
  const locale: Locale = value === 'en' ? 'en' : 'zh-CN'
  return { locale, messages: messages[locale], timeZone: 'Asia/Shanghai' }
})
