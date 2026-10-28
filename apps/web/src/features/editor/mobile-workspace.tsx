'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { TemplatePreview } from '@aim/template-preview'
import { ELEMENT_META } from '@aim/template-schema'
import { useEditor } from './store'
import { AutoForm, setIn } from './inspector/auto-form'
import { EventEditor } from './inspector/event-editor'
import { ParamsPanel } from './panels/params-panel'
import { ReviewSheet } from './dialogs/review-sheet'
import { PreviewDialog } from './dialogs/preview-dialog'
/** 小屏创作采用结构化表单，不改变自由画布的几何信息。 */
export function MobileWorkspace({ saveNow }: { saveNow: () => Promise<boolean> }) {
  const t = useTranslations()
  const doc = useEditor((s) => s.doc)!
  const failure = useEditor((s) => s.saveFailure)
  const state = useEditor((s) => s.saveState)
  const [tab, setTab] = useState('slots')
  const { update, mutateElement, set } = useEditor.getState()
  const readonly = doc.meta.status === 'reviewing'
  return (
    <div className="mobile-creator">
      <header>
        <input
          disabled={readonly}
          aria-label={t('name')}
          value={doc.name}
          maxLength={20}
          onChange={(e) => update((d) => ({ ...d, name: e.target.value }))}
        />
        <span className="status-chip">
          {t(state === 'error' ? (failure === 'conflict' ? 'saveConflict' : 'saveError') : state)}
        </span>
        <button
          disabled={readonly}
          className="button primary"
          onClick={() => set({ reviewOpen: true })}
        >
          {t('submitReview')}
        </button>
      </header>
      <p className="mode-banner">{t('mobileHint')}</p>
      <nav>
        {['slots', 'parameters', 'preview'].map((k) => (
          <button
            className={`button ${tab === k ? 'primary' : 'outlined'}`}
            key={k}
            onClick={() => setTab(k)}
          >
            {t(k)}
          </button>
        ))}
      </nav>
      <main>
        <fieldset disabled={readonly}>
          {tab === 'preview' ? (
            <TemplatePreview document={doc} mode="fluid" />
          ) : tab === 'parameters' ? (
            <ParamsPanel />
          ) : (
            doc.pages.flatMap((page) =>
              page.elements.map((el) => (
                <details className="panel" key={el.id}>
                  <summary>{el.slot ?? ELEMENT_META[el.type].label}</summary>
                  <AutoForm
                    value={el.props as Record<string, unknown>}
                    path={[]}
                    ctx={{
                      el,
                      onSet: (path, value) =>
                        mutateElement(el.id, (d) =>
                          setIn(d.props as Record<string, unknown>, path, value),
                        ),
                    }}
                  />
                  {ELEMENT_META[el.type].clickable && (
                    <EventEditor
                      value={el.event}
                      elementType={el.type}
                      optional={el.type !== 'button'}
                      onChange={(event) =>
                        mutateElement(el.id, (d) => {
                          d.event = event
                        })
                      }
                    />
                  )}
                </details>
              )),
            )
          )}
        </fieldset>
      </main>
      <footer>
        <button
          disabled={readonly || state === 'saving'}
          className="button outlined"
          onClick={() => void saveNow()}
        >
          {t('save')}
        </button>
        <button className="button outlined" onClick={() => set({ previewOpen: true })}>
          {t('preview')}
        </button>
        <button
          className="button subtle"
          onClick={() => {
            const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = doc.name + '.json'
            a.click()
            URL.revokeObjectURL(url)
          }}
        >
          {t('export')}
        </button>
      </footer>
      <ReviewSheet
        saveNow={saveNow}
        onLocate={(i) => {
          useEditor.getState().select(i.elementId ?? null)
          set({ reviewOpen: false })
        }}
      />
      <PreviewDialog />
    </div>
  )
}
