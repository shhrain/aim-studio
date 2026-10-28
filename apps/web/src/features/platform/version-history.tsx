'use client'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { platform } from '@/lib/platform'

interface Version {
  id: string
  revision: number
  status: string
  created_at: string
  reason?: string
  reviewed_at?: string
}
export function VersionHistory({
  api,
  templateId,
  onPreview,
}: {
  api: string
  templateId: string
  onPreview: (row: Record<string, unknown>) => void
}) {
  const t = useTranslations()
  const versions = useQuery({
    queryKey: ['platform', api, templateId, 'versions'],
    queryFn: () => platform.get<Version[]>(api + '/templates/' + templateId + '/versions'),
  })
  return (
    <section className="panel">
      <h2>{t('versionHistory')}</h2>
      {versions.isPending ? (
        <p>{t('loading')}</p>
      ) : versions.isError ? (
        <button className="button outlined" onClick={() => void versions.refetch()}>
          {t('retry')}
        </button>
      ) : !versions.data?.length ? (
        <p>{t('none')}</p>
      ) : (
        versions.data.map((version) => (
          <div className="recent-row" key={version.id}>
            <span>
              <strong>
                v{version.revision} · {t(version.status)}
              </strong>
              <small>{version.reason ?? version.created_at}</small>
            </span>
            <button
              className="button outlined"
              onClick={() =>
                void platform
                  .get<Record<string, unknown>>(
                    api + '/templates/' + templateId + '/versions/' + version.id,
                  )
                  .then(onPreview)
              }
            >
              {t('preview')}
            </button>
          </div>
        ))
      )}
    </section>
  )
}
