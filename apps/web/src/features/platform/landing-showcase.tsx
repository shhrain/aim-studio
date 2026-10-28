'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Layers3, Smartphone } from 'lucide-react'
import { createDocument } from '@aim/template-core'
import { TemplatePreview } from '@aim/template-preview'
import type { VendorId } from '@aim/template-schema'

/** 公开示例只在浏览器内编辑，使用正式预览 SDK，不保存工作空间数据。 */
export default function LandingShowcase() {
  const t = useTranslations()
  const [title, setTitle] = useState(t('designSampleTitle'))
  const [vendor, setVendor] = useState<VendorId>('huawei')
  const document = useMemo(() => {
    const doc = createDocument({
      id: 'public-landing-sample',
      layoutId: 'com.hbm.pureText',
      now: 0,
    })
    const page = doc.pages[0]!
    for (const element of page.elements) {
      if (element.type === 'text') {
        element.props.text = element.slot === 'title' ? title : t('designSampleBody')
        element.y = element.slot === 'title' ? 14 : 48
        element.h = element.slot === 'title' ? 26 : 92
      } else if (element.type === 'button') {
        element.props.text = t('designSampleAction')
        element.y = 154
      }
    }
    page.style.height = 208
    return doc
  }, [title, t])
  return (
    <>
      <header className="showcase-header">
        <span>
          <Layers3 size={16} aria-hidden="true" />
          {t('examples')}
        </span>
        <span className="muted">{t('designLocalSample')}</span>
      </header>
      <div className="showcase-body">
        <div className="showcase-fields">
          <span className="eyebrow">{t('slots')}</span>
          <label>
            {t('designTitle')}
            <input
              value={title}
              maxLength={15}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label>
            {t('designDevice')}
            <select value={vendor} onChange={(event) => setVendor(event.target.value as VendorId)}>
              <option value="huawei">HUAWEI</option>
              <option value="xiaomi">Xiaomi</option>
              <option value="oppo">OPPO</option>
            </select>
          </label>
          <p>{t('designSampleHint')}</p>
          <span className="showcase-format">AIM / {t('preview')}</span>
        </div>
        <div className="showcase-preview">
          <span className="showcase-preview-label">
            <Smartphone size={14} aria-hidden="true" />
            {t('preview')}
          </span>
          <TemplatePreview
            document={document}
            vendor={vendor}
            mode="bare"
            width="100%"
            theme="light"
            interactive="none"
            showTime={false}
          />
        </div>
      </div>
      <footer className="showcase-footer">
        <span>{t('designPublicSample')}</span>
        <span>342 px</span>
      </footer>
    </>
  )
}
