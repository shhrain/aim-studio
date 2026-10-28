'use client'
import { useLocale, useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard,
  Layers3,
  ImageIcon,
  ClipboardCheck,
  Send,
  Users,
  Settings,
  Contact,
  ArrowUpRight,
  Plus,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  ArrowRight,
  Upload,
  PanelLeftClose,
  BookOpen,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogBody, DialogClose } from '@aim/ui'
import { TemplatePreview } from '@aim/template-preview'
import '@aim/template-preview/styles.css'
import { can, type Workspace } from '@aim/api-contracts'
import { ApiError } from '@aim/api-client'
import { platform, authentication, loadAllPages } from '@/lib/platform'
import { BrandMark } from '@/components/brand-mark'
import { PlatformBrand } from '@/components/platform-brand'
import { Preferences } from '@/components/preferences'
import { EditorPage } from '@/features/editor/editor-page'
import { clearDrafts, setDraftOwner } from '@/features/editor/lib/save'
import { useEditor } from '@/features/editor/store'
import { importTemplates, readLegacyData, type ImportOutcome } from './import-templates'
import { VersionHistory } from './version-history'

const navigation = [
  { key: 'overview', path: '', icon: LayoutDashboard, permission: 'read' },
  { key: 'templates', path: 'templates', icon: Layers3, permission: 'read' },
  { key: 'materials', path: 'materials', icon: ImageIcon, permission: 'read' },
  { key: 'reviews', path: 'reviews', icon: ClipboardCheck, permission: 'read' },
  { key: 'delivery', path: 'delivery', icon: Send, permission: 'read' },
  { key: 'contacts', path: 'contacts', icon: Contact, permission: 'read' },
  { key: 'team', path: 'team', icon: Users, permission: 'team' },
  { key: 'settings', path: 'settings', icon: Settings, permission: 'manage' },
]
type Row = Record<string, any>
const activityKeys: Record<string, string> = {
  'template.create': 'activityCreate',
  'template.save': 'activitySave',
  'template.submit': 'activitySubmit',
  'review.approved': 'activityApproved',
  'review.rejected': 'activityRejected',
  'review.withdrawn': 'activityWithdrawn',
  'template.publish': 'activityPublish',
  'template.unpublish': 'activityUnpublish',
  'workspace.create': 'activityWorkspace',
}
const docs = process.env.NEXT_PUBLIC_DOCS_URL ?? 'http://localhost:3002'
export function ConsoleApplication({
  workspaceId,
  section = [],
}: {
  workspaceId?: string
  section?: string[]
}) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const qc = useQueryClient()
  const { setTheme } = useTheme()
  const searchParams = useSearchParams()
  const [drawer, setDrawer] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [notices, setNotices] = useState(false)
  const [newSpace, setNewSpace] = useState(false)
  const [spaceError, setSpaceError] = useState('')
  const user = useQuery({
    queryKey: ['platform', 'me'],
    queryFn: () => platform.get<Row>('/api/v1/me'),
    retry: false,
  })
  const workspaces = useQuery({
    queryKey: ['platform', user.data?.id, 'workspaces'],
    queryFn: () => platform.get<Workspace[]>('/api/v1/workspaces'),
    enabled: !!user.data,
  })
  const workspace =
    workspaces.data?.find((w) => w.id === workspaceId) ??
    (!workspaceId ? workspaces.data?.[0] : undefined)
  const base = `/${locale}/app/w/${workspace?.id ?? ''}`
  const api = `/api/v1/workspaces/${workspace?.id ?? workspaceId}`
  const active = section[0] ?? 'overview'
  const notifications = useQuery({
    queryKey: ['platform', user.data?.id, workspace?.id, 'notifications'],
    queryFn: () => platform.get<Row[]>(api + '/notifications'),
    enabled: !!workspace && notices,
  })
  useEffect(() => {
    if (user.error instanceof ApiError && user.error.isUnauthorized)
      router.replace(
        `/${locale}/login?redirect=${encodeURIComponent(location.pathname + location.search)}`,
      )
  }, [user.isError, user.error, locale, router])
  const themeApplied = useRef(false)
  useEffect(() => {
    const saved = user.data?.preferences.theme
    if (!saved || themeApplied.current) return
    themeApplied.current = true
    setTheme(saved)
  }, [user.data?.preferences.theme, setTheme])
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  useEffect(() => {
    if (!workspaceId && workspaces.data?.length && active !== 'account')
      router.replace(`/${locale}/app/w/${workspaces.data[0]!.id}`)
  }, [workspaceId, workspaces.data, active, locale, router])
  useEffect(() => {
    if (user.data && workspace) setDraftOwner(user.data.id, workspace.id)
  }, [user.data, workspace])
  const signout = async () => {
    await authentication.signOut()
    qc.clear()
    useEditor.setState({ doc: null, report: null, selectedId: null })
    clearDrafts()
    for (const key of Object.keys(sessionStorage))
      if (key.startsWith('aim')) sessionStorage.removeItem(key)
    router.replace(`/${locale}/login`)
  }
  const createWorkspace = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = String(new FormData(event.currentTarget).get('name'))
    const w = await platform.post<Workspace>('/api/v1/workspaces', {
      name,
      default: !workspaces.data?.length,
    })
    setNewSpace(false)
    await qc.invalidateQueries({ queryKey: ['platform'] })
    router.replace(`/${locale}/app/w/${w.id}`)
  }
  if (
    (user.isError && !(user.error instanceof ApiError && user.error.isUnauthorized)) ||
    workspaces.isError
  )
    return (
      <div className="platform boot-state">
        <p role="alert">
          {t(
            user.error instanceof ApiError && user.error.status === 403
              ? 'denied'
              : 'serviceUnavailable',
          )}
        </p>
        <button
          className="button outlined"
          onClick={() => {
            void user.refetch()
            void workspaces.refetch()
          }}
        >
          {t('retry')}
        </button>
        <Link href={`/${'${locale}'}/login`}>{t('login')}</Link>
      </div>
    )
  if (!user.data || workspaces.isPending)
    return (
      <div className="platform boot-state">
        <span className="brand-symbol">
          <BrandMark />
        </span>
        <p>{user.isError ? t('denied') : t('loading')}</p>
      </div>
    )
  if (!workspace && active !== 'account')
    return (
      <div className="platform onboarding">
        <PlatformBrand locale={locale} />
        <section className="panel">
          <span className="eyebrow">{t('onboardingLead')}</span>
          <h1>{workspaceId ? t('denied') : t('newWorkspace')}</h1>
          <p className="muted">{t('capability3')}</p>
          {!workspaceId && (
            <form onSubmit={(e) => void createWorkspace(e).catch(() => setSpaceError(t('error')))}>
              {spaceError && <p role="alert">{spaceError}</p>}
              <label>
                {t('name')}
                <input name="name" required maxLength={80} defaultValue={t('newWorkspaceName')} />
              </label>
              <button className="button primary">
                {t('newWorkspace')}
                <ArrowRight size={17} />
              </button>
            </form>
          )}
          {workspaceId && (
            <Link className="button primary" href={`/${locale}/app`}>
              {t('switchWorkspace')}
            </Link>
          )}
        </section>
      </div>
    )
  if (active === 'create' && workspace)
    return (
      <div className="platform editor-platform" data-role={workspace.role}>
        <div className="editor-platform-bar">
          <Link href={`${base}/templates`}>← {t('templates')}</Link>
          <span>{workspace.name}</span>
          <Preferences />
        </div>
        {can(workspace.role, 'edit') ? (
          <EditorPage
            key={`${workspaceId}:${section[1]}`}
            id={section[1] ?? 'new'}
            initialLayout={searchParams.get('layout') ?? undefined}
          />
        ) : (
          <div className="panel">{t('denied')}</div>
        )}
      </div>
    )
  return (
    <>
      <Dialog open={newSpace} onOpenChange={setNewSpace}>
        <DialogContent className="platform" aria-describedby={undefined}>
          <DialogTitle>{t('newWorkspace')}</DialogTitle>
          <form
            className="settings-form"
            onSubmit={(e) => {
              void createWorkspace(e).catch(() => setSpaceError(t('error')))
            }}
          >
            <label>
              {t('name')}
              <input name="name" required maxLength={80} />
            </label>
            {spaceError && <p role="alert">{spaceError}</p>}
            <button className="button primary">{t('create')}</button>
          </form>
        </DialogContent>
      </Dialog>
      <div className={`platform console-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <aside className={`console-sidebar ${drawer ? 'is-open' : ''}`}>
          <div className="sidebar-brand">
            <PlatformBrand locale={locale} />
            <button
              className="icon-button"
              aria-label={t('menu')}
              onClick={() => {
                setCollapsed(!collapsed)
                setDrawer(false)
              }}
            >
              <PanelLeftClose size={18} />
            </button>
          </div>
          <button className="sidebar-search" onClick={() => router.push(`${base}/templates`)}>
            <Search size={16} />
            <span>{t('search')}</span>
          </button>
          <p className="nav-caption">{t('workspace')}</p>
          <nav>
            {navigation
              .filter((n) => can(workspace?.role ?? 'viewer', n.permission))
              .map(({ key, path, icon: Icon }) => (
                <Link
                  key={key}
                  className={`nav-link ${active === key ? 'selected' : ''}`}
                  title={t(key)}
                  href={`${base}${path ? '/' + path : ''}`}
                  onClick={() => setDrawer(false)}
                >
                  <Icon size={19} />
                  <span>{t(key)}</span>
                  {key === active && <span className="nav-indicator" />}
                </Link>
              ))}
          </nav>
          <div className="sidebar-bottom">
            <a className="nav-link" href={docs}>
              <BookOpen size={19} />
              <span>{t('help')}</span>
              <ArrowUpRight size={14} />
            </a>
            <Link
              className={`nav-link ${active === 'account' ? 'selected' : ''}`}
              href={`/${locale}/app/settings`}
            >
              <Settings size={19} />
              <span>{t('account')}</span>
            </Link>
            <label className="workspace-switch">
              <span className="workspace-avatar">{workspace?.name[0] ?? 'A'}</span>
              <select
                aria-label={t('switchWorkspace')}
                value={workspace?.id ?? ''}
                onChange={(e) => router.push(`/${locale}/app/w/${e.target.value}`)}
              >
                {workspaces.data?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="nav-link" onClick={() => setNewSpace(true)}>
              <Plus size={17} />
              <span>{t('newWorkspace')}</span>
            </button>
            <button className="nav-link" onClick={() => void signout()}>
              <LogOut size={17} />
              <span>{t('logout')}</span>
            </button>
          </div>
        </aside>
        {drawer && (
          <button
            aria-label={t('cancel')}
            className="drawer-scrim"
            onClick={() => setDrawer(false)}
          />
        )}
        <div className="console-main">
          <header className="console-header">
            <button
              className="icon-button mobile-menu"
              aria-label={t('menu')}
              onClick={() => setDrawer(true)}
            >
              <Menu size={20} />
            </button>
            <div className="breadcrumb">
              <span>{workspace?.name ?? 'AIM Studio'}</span>
              <span>/</span>
              <strong>
                {t(
                  active === 'account'
                    ? 'account'
                    : (navigation.find((n) => n.key === active)?.key ?? 'overview'),
                )}
              </strong>
            </div>
            <div className="header-actions">
              <Preferences />
              <button
                className="icon-button"
                aria-label={t('notifications')}
                onClick={() => setNotices(!notices)}
              >
                <Bell size={19} />
              </button>
              <Link
                className="user-avatar"
                aria-label={t('account')}
                href={`/${locale}/app/settings`}
              >
                {user.data.name?.slice(0, 1)}
              </Link>
            </div>
            {notices && (
              <div className="notification-popover panel">
                <h3>{t('notifications')}</h3>
                {notifications.data?.length ? (
                  notifications.data.map((n) => (
                    <button
                      key={n.id}
                      className="notification-item"
                      onClick={() =>
                        void platform
                          .post(api + `/notifications/${n.id}/read`)
                          .then(() => notifications.refetch())
                      }
                    >
                      {t(
                        n.message.split('.')[1] === 'withdrawn'
                          ? 'withdraw'
                          : (n.message.split('.')[1] ?? 'notifications'),
                      )}{' '}
                      {n.read ? '✓' : '•'}
                    </button>
                  ))
                ) : (
                  <p className="muted">{t('noNotifications')}</p>
                )}
              </div>
            )}
          </header>
          <main className="console-content">
            {active === 'account' ? (
              <AccountSettings user={user.data} />
            ) : (
              <WorkspaceScreen
                key={`${workspaceId}:${active}`}
                section={active}
                base={base}
                api={api}
                workspace={workspace!}
                user={user.data}
              />
            )}
          </main>
        </div>
      </div>
    </>
  )
}

function WorkspaceScreen({
  section,
  base,
  api,
  workspace,
  user,
}: {
  section: string
  base: string
  api: string
  workspace: Workspace
  user: Row
}) {
  const t = useTranslations()
  const locale = useLocale()
  const qc = useQueryClient()
  const router = useRouter()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')
  const [archived, setArchived] = useState(false)
  const [preview, setPreview] = useState<Row | null>(null)
  const [history, setHistory] = useState<string>()
  const deliveryAttempt = useRef<{ payload: string; key: string } | null>(null)
  const [imported, setImported] = useState<ImportOutcome[]>([])
  const [importProgress, setImportProgress] = useState('')
  const [page, setPage] = useState(1)
  const resource = section === 'delivery' ? 'delivery-jobs' : section
  const query = useQuery({
    queryKey: ['platform', user.id, workspace.id, section, keyword, status, archived, page],
    queryFn: () =>
      platform.get<any>(`${api}/${resource}`, {
        query: ['templates', 'materials', 'reviews', 'contacts', 'delivery'].includes(section)
          ? { keyword, status, archived, page, size: 12 }
          : undefined,
        raw: ['templates', 'materials', 'reviews', 'contacts', 'delivery'].includes(section),
      }),
    enabled: section !== 'settings',
    refetchIntervalInBackground: false,
    refetchInterval: (query) =>
      section === 'delivery' &&
      Array.isArray(query.state.data?.data) &&
      query.state.data.data.some((row: Row) => ['pending', 'running'].includes(row.status))
        ? 2000
        : false,
  })
  const caps = useQuery({
    queryKey: ['platform', 'capabilities'],
    queryFn: () => platform.get<Row>('/api/v1/capabilities'),
    enabled: section === 'delivery',
  })
  const published = useQuery({
    queryKey: ['platform', user.id, workspace.id, 'published'],
    queryFn: () => loadAllPages<Row>(api + '/experience/templates'),
    enabled: section === 'delivery',
  })
  const mutate = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      await qc.invalidateQueries({ queryKey: ['platform'] })
    } catch (e) {
      setError(locale === 'en' ? t('error') : (e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const action = (path: string, body?: unknown) =>
    mutate(() => platform.post(`${api}/${path}`, body))
  const data = query.data
  const rows: Row[] = Array.isArray(data) ? data : (data?.data ?? [])
  const previewTemplate = async (row: Row) => {
    try {
      const detail = row.document ? row : await platform.get<Row>(`${api}/templates/${row.id}`)
      setPreview(detail)
    } catch {
      setError(t('error'))
    }
  }
  const upload = async (files: FileList | null) => {
    if (!files?.[0]) return
    const form = new FormData()
    form.set('file', files[0])
    await mutate(() => platform.post(api + '/materials', form))
  }
  const importFile = async (file?: File) => {
    if (!file) return
    await mutate(async () => {
      setImportProgress(t('uploadProgress'))
      try {
        setImported(await importTemplates(api, JSON.parse(await file.text()), setImportProgress))
      } finally {
        setImportProgress('')
      }
    })
  }
  const exportLocal = () =>
    mutate(async () => {
      const data = await readLegacyData()
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      )
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'aim-local-backup.json'
      anchor.click()
      URL.revokeObjectURL(url)
    })
  const date = (value: string | number) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: user.preferences.timezone,
    }).format(new Date(value))
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{workspace.name}</span>
          <h1>{t(section === 'overview' ? 'welcome' : section)}</h1>
          <p className="muted">
            {section === 'overview'
              ? t('welcomeHint')
              : section === 'templates'
                ? t('createHint')
                : section === 'materials'
                  ? t('materialHint')
                  : section === 'reviews'
                    ? t('reviewHint')
                    : ''}
          </p>
        </div>
        {['overview', 'templates'].includes(section) && can(workspace.role, 'edit') && (
          <Link href={`${base}/create/new`} className="button primary">
            <Plus size={17} />
            {t('create')}
          </Link>
        )}
      </div>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      {query.isError && (
        <div className="panel">
          <p>{t('error')}</p>
          <button className="button outlined" onClick={() => void query.refetch()}>
            {t('retry')}
          </button>
        </div>
      )}
      {section === 'overview' && (
        <>
          <section className="workspace-banner">
            <div>
              <span className="eyebrow">{t('quick')}</span>
              <h2>{t('createHint')}</h2>
              <p>{t('detail1')}</p>
            </div>
            <div className="workspace-shortcuts">
              <Link href={base + '/materials'} className="button outlined">
                <ImageIcon size={16} />
                {t('materials')}
              </Link>
              <a href={docs} className="button outlined">
                <BookOpen size={16} />
                {t('docs')}
              </a>
            </div>
          </section>
          <div className="metric-grid">
            {[
              ['total', data?.total],
              ['drafts', data?.drafts],
              ['reviewing', data?.reviewing],
              ['published', data?.published],
            ].map(([label, value]) => (
              <article className="metric-card" key={label}>
                <span>{t(label as string)}</span>
                <strong>{value ?? '—'}</strong>
              </article>
            ))}
          </div>
          <div className="overview-grid">
            <section className="panel">
              <div className="panel-heading">
                <h2>{t('recent')}</h2>
                <Link href={`${base}/templates`}>
                  {t('viewAll')}
                  <ArrowUpRight size={15} />
                </Link>
              </div>
              {data?.recent?.length ? (
                data.recent.map((row: Row) => (
                  <Link className="recent-row" key={row.id} href={`${base}/create/${row.id}`}>
                    <span className="tile-icon">
                      <Layers3 size={21} />
                    </span>
                    <span>
                      <strong>{row.name || t('draft')}</strong>
                      <small>{date(row.updatedAt)}</small>
                    </span>
                    <span className={`status-chip ${row.status}`}>{t(row.status)}</span>
                    <ArrowUpRight size={17} />
                  </Link>
                ))
              ) : (
                <Empty />
              )}
            </section>
            <section className="panel">
              <h2>{t('activity')}</h2>
              <div className="activity-list">
                {data?.activity?.length ? (
                  data.activity.map((row: Row, i: number) => (
                    <div className="activity-row" key={i}>
                      <span className="activity-dot" />
                      <div>
                        <strong>{t(activityKeys[row.action] ?? 'activityOther')}</strong>
                        <small>{date(row.created_at)}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <Empty />
                )}
              </div>
            </section>
          </div>
        </>
      )}
      {section === 'templates' && (
        <>
          <div className="filter-bar">
            <label className="search-field">
              <Search size={17} />
              <input
                aria-label={t('search')}
                placeholder={t('search')}
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setPage(1)
                }}
              />
            </label>
            <select
              aria-label={t('status')}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
            >
              <option value="all">{t('total')}</option>
              {['draft', 'reviewing', 'approved', 'rejected'].map((s) => (
                <option key={s} value={s}>
                  {t(s)}
                </option>
              ))}
            </select>
            <label className="check-label">
              <input
                type="checkbox"
                checked={archived}
                onChange={(e) => setArchived(e.target.checked)}
              />
              {t('archived')}
            </label>
            {can(workspace.role, 'edit') && (
              <label className="button outlined">
                <Upload size={16} />
                {t('import')}
                <input
                  type="file"
                  accept="application/json"
                  className="sr-only"
                  onChange={(e) => void importFile(e.target.files?.[0])}
                />
              </label>
            )}
          </div>
          <button className="button subtle" disabled={busy} onClick={() => void exportLocal()}>
            {t('mockImport')} · {t('export')}
          </button>
          {importProgress && <p role="status">{importProgress}</p>}
          {!!imported.length && (
            <section className="panel">
              <h2>{t('importResult')}</h2>
              {imported.map((result, index) => (
                <div className="recent-row" key={index}>
                  <span>{result.name}</span>
                  <span className={result.success ? 'form-success' : 'form-error'}>
                    {result.success ? t('created') : result.message}
                  </span>
                  {!result.success && (
                    <button
                      className="button outlined"
                      disabled={busy}
                      onClick={() =>
                        void mutate(async () => {
                          const next = await importTemplates(
                            api,
                            {
                              templates: { retry: { document: result.document } },
                              materials: result.materials,
                            },
                            setImportProgress,
                          )
                          setImported((previous) =>
                            previous.map((row, i) => (i === index ? next[0]! : row)),
                          )
                          setImportProgress('')
                        })
                      }
                    >
                      {t('retry')}
                    </button>
                  )}
                </div>
              ))}
            </section>
          )}
          {history && <VersionHistory api={api} templateId={history} onPreview={setPreview} />}
          <div className="template-grid">
            {rows.map((row) => (
              <article className="template-tile" key={row.id}>
                <button
                  className="template-art"
                  onClick={() => void previewTemplate(row)}
                  aria-label={t('preview')}
                >
                  <div className="mini-message">
                    <span />
                    <i />
                    <i />
                    <b />
                  </div>
                  <span className={`status-chip ${row.status}`}>{t(row.status)}</span>
                </button>
                <div className="template-info">
                  <h3>{row.name || t('draft')}</h3>
                  <p>
                    {row.layoutId?.split('.').at(-1)} · {date(row.updatedAt)}
                  </p>
                  <div className="tile-actions">
                    <button className="button subtle" onClick={() => void previewTemplate(row)}>
                      {t('preview')}
                    </button>
                    <button
                      className="button subtle"
                      onClick={() => setHistory(history === row.id ? undefined : row.id)}
                    >
                      {t('versionHistory')}
                    </button>
                    {can(workspace.role, 'edit') && (
                      <>
                        <Link className="button subtle" href={`${base}/create/${row.id}`}>
                          {t('edit')}
                        </Link>
                        <button
                          className="button subtle"
                          disabled={busy}
                          onClick={() => void action(`templates/${row.id}/duplicate`)}
                        >
                          {t('duplicate')}
                        </button>
                        <button
                          className="button subtle"
                          disabled={busy}
                          onClick={() =>
                            void action(`templates/${row.id}/archive`, { archived: !row.archived })
                          }
                        >
                          {t(row.archived ? 'restore' : 'archive')}
                        </button>
                      </>
                    )}
                    {can(workspace.role, 'review') && row.publishedVersionId && (
                      <button
                        className="button subtle"
                        onClick={() =>
                          void action(`templates/${row.id}/publish`, { versionId: null })
                        }
                      >
                        {t('unpublish')}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
          {!rows.length && !query.isPending && <Empty />}
          <div className="pagination">
            <button
              className="button outlined"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              ←
            </button>
            <span>
              {page} / {Math.max(1, Math.ceil((data?.pageInfo?.total ?? 0) / 12))}
            </span>
            <button
              className="button outlined"
              disabled={page * 12 >= (data?.pageInfo?.total ?? 0)}
              onClick={() => setPage(page + 1)}
            >
              →
            </button>
          </div>
        </>
      )}
      {section === 'materials' && (
        <>
          {can(workspace.role, 'edit') && (
            <label className="upload-zone">
              <Upload size={28} />
              <strong>{busy ? t('uploadProgress') : t('upload')}</strong>
              <span>PNG · JPG · WEBP · GIF · MP4 · WEBM · MP3</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,audio/mpeg"
                disabled={busy}
                onChange={(e) => void upload(e.target.files)}
              />
            </label>
          )}
          <div className="material-grid">
            {rows.map((row) => (
              <article className="panel material-card" key={row.id}>
                {row.type === 'image' ? (
                  <img src={row.url} alt={row.name} />
                ) : row.type === 'video' ? (
                  <video src={row.url} controls />
                ) : (
                  <audio src={row.url} controls />
                )}
                <strong>{row.name}</strong>
                <span className="muted">{(Number(row.size) / 1024).toFixed(0)} KB</span>
                {can(workspace.role, 'edit') && (
                  <button
                    className="button subtle"
                    disabled={busy}
                    onClick={() => void mutate(() => platform.del(`${api}/materials/${row.id}`))}
                  >
                    {t('remove')}
                  </button>
                )}
              </article>
            ))}
          </div>
        </>
      )}
      {section === 'reviews' && (
        <div className="panel">
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>{t('templates')}</th>
                  <th>{t('version')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>v{row.revision}</td>
                    <td>
                      <span className={`status-chip ${row.status}`}>
                        {t(row.status === 'withdrawn' ? 'draft' : row.status)}
                      </span>
                      {row.reason && <p className="muted">{row.reason}</p>}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="button subtle" onClick={() => setPreview(row)}>
                          {t('preview')}
                        </button>
                        {row.status === 'reviewing' && can(workspace.role, 'review') && (
                          <>
                            <button
                              className="button subtle"
                              disabled={busy}
                              onClick={() =>
                                void action(`reviews/${row.id}/decision`, { decision: 'approved' })
                              }
                            >
                              {t('approve')}
                            </button>
                            <button
                              className="button subtle"
                              disabled={busy}
                              onClick={() => {
                                const reason = prompt(t('reason'))
                                if (reason)
                                  void action(`reviews/${row.id}/decision`, {
                                    decision: 'rejected',
                                    reason,
                                  })
                              }}
                            >
                              {t('reject')}
                            </button>
                          </>
                        )}
                        {row.status === 'reviewing' && can(workspace.role, 'edit') && (
                          <button
                            className="button subtle"
                            onClick={() =>
                              void action(`reviews/${row.id}/decision`, { decision: 'withdrawn' })
                            }
                          >
                            {t('withdraw')}
                          </button>
                        )}
                        {row.status === 'approved' && can(workspace.role, 'review') && (
                          <button
                            className="button primary"
                            onClick={() =>
                              void action(`templates/${row.template_id}/publish`, {
                                versionId: row.version_id,
                              })
                            }
                          >
                            {t('publish')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length && <Empty />}
        </div>
      )}
      {section === 'contacts' && (
        <>
          <form
            className="inline-form panel"
            onSubmit={(e) => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              void action('contacts', { contactName: f.get('name'), mobile: f.get('phone') })
            }}
          >
            <label>
              {t('name')}
              <input name="name" required maxLength={80} />
            </label>
            <label>
              {t('phone')}
              <input name="phone" type="tel" required pattern="\+?[0-9]{7,15}" />
            </label>
            <button className="button primary" disabled={busy || !can(workspace.role, 'send')}>
              {t('save')}
            </button>
          </form>
          <div className="panel">
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>{t('name')}</th>
                    <th>{t('phone')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.contactName}</td>
                      <td>{row.mobile}</td>
                      <td>
                        {can(workspace.role, 'send') && (
                          <button
                            className="button subtle"
                            onClick={() =>
                              void mutate(() => platform.del(`${api}/contacts/${row.id}`))
                            }
                          >
                            {t('remove')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {section === 'team' && (
        <>
          <form
            className="panel inline-form"
            onSubmit={(e) => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              void action('team/invite', { email: f.get('email'), role: f.get('role') })
            }}
          >
            <label>
              {t('email')}
              <input name="email" type="email" required />
            </label>
            <label>
              {t('role')}
              <select name="role" defaultValue="editor">
                {['admin', 'editor', 'reviewer', 'viewer'].map((r) => (
                  <option key={r} value={r}>
                    {t(r)}
                  </option>
                ))}
              </select>
            </label>
            <button className="button primary" disabled={busy}>
              {t('invite')}
            </button>
          </form>
          <div className="panel">
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>{t('name')}</th>
                    <th>{t('email')}</th>
                    <th>{t('role')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.members?.map((row: Row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.email}</td>
                      <td>
                        <select
                          aria-label={t('role')}
                          disabled={
                            row.role === 'owner' ||
                            (workspace.role !== 'owner' && row.role === 'owner')
                          }
                          value={row.role}
                          onChange={(e) => void action(`team/${row.id}`, { role: e.target.value })}
                        >
                          {(workspace.role === 'owner'
                            ? ['owner', 'admin', 'editor', 'reviewer', 'viewer']
                            : ['admin', 'editor', 'reviewer', 'viewer']
                          ).map((r) => (
                            <option key={r} value={r}>
                              {t(r)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="table-actions">
                          {row.user_id !== user.id && (
                            <>
                              <button
                                className="button subtle"
                                onClick={() => {
                                  if (confirm(t('restoreConfirm')))
                                    void action(`team/${row.id}`, { remove: true })
                                }}
                              >
                                {t('remove')}
                              </button>
                              {workspace.role === 'owner' && (
                                <button
                                  className="button subtle"
                                  onClick={() => {
                                    if (confirm(t('restoreConfirm')))
                                      void action(`team/${row.id}`, { transfer: true })
                                  }}
                                >
                                  {t('transfer')}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3>{t('invite')}</h3>
            {data?.invitations?.map((row: Row) => (
              <div className="recent-row" key={row.id}>
                <span>{row.email}</span>
                {row.status === 'pending' && (
                  <button
                    className="button subtle"
                    disabled={busy}
                    onClick={() =>
                      void mutate(() => platform.del(api + `/team/invitations/${row.id}`))
                    }
                  >
                    {t('cancelInvite')}
                  </button>
                )}
                <span className="muted">
                  {row.status} · {date(row.expires_at)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
      {section === 'settings' && (
        <>
          <form
            className="panel settings-form"
            onSubmit={(e) => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              void mutate(() => platform.put(api + '/settings', { name: f.get('name') }))
            }}
          >
            <h2>{t('workspace')}</h2>
            <label>
              {t('name')}
              <input name="name" defaultValue={workspace.name} required maxLength={80} />
            </label>
            <button className="button primary" disabled={busy}>
              {t('save')}
            </button>
          </form>
          <WorkspaceExtras api={api} />
        </>
      )}
      {section === 'delivery' && (
        <>
          <div className="mode-banner">
            {t(caps.data?.mode === 'simulated' ? 'simulated' : 'disabled')}
          </div>
          <form
            className="panel inline-form"
            onSubmit={(e) => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              const mobiles = String(f.get('mobiles'))
                .split(/[\s,;，；]+/)
                .filter(Boolean)
              const payload = { templateId: f.get('templateId'), mobiles, sendMode: 'priority' }
              const fingerprint = JSON.stringify(payload)
              if (deliveryAttempt.current?.payload !== fingerprint)
                deliveryAttempt.current = { payload: fingerprint, key: crypto.randomUUID() }
              const key = deliveryAttempt.current.key
              void mutate(async () => {
                await platform.post(api + '/delivery-jobs', payload, {
                  headers: { 'Idempotency-Key': key },
                })
                deliveryAttempt.current = null
              })
            }}
          >
            <label>
              {t('selectTemplate')}
              <select name="templateId" required>
                {published.data?.map((row) => (
                  <option value={row.tplId} key={row.tplId}>
                    {row.tplName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('phone')}
              <textarea name="mobiles" required placeholder="13800138000" />
            </label>
            <button
              className="button primary"
              disabled={busy || !caps.data?.send || !can(workspace.role, 'send')}
            >
              {t('send')}
            </button>
          </form>
          <div className="panel">
            {rows.map((row) => (
              <div className="recent-row" key={row.id}>
                <span className="tile-icon">
                  <Send size={20} />
                </span>
                <span>
                  <strong>{row.id.slice(0, 8)}</strong>
                  <small>{date(row.created_at)}</small>
                </span>
                <span className="status-chip">
                  {t(
                    row.status === 'pending'
                      ? 'pending'
                      : row.status === 'done'
                        ? 'done'
                        : 'failed',
                  )}
                </span>
                <span className="muted">
                  {t(row.mode === 'simulated' ? 'simulated' : 'disabled')}
                </span>
                {row.error && <span className="form-error">{row.error}</span>}
                {row.status === 'failed' && can(workspace.role, 'send') && (
                  <button
                    className="button outlined"
                    disabled={busy}
                    onClick={() => void action(`tasks/${row.id}/retry`)}
                  >
                    {t('retryTask')}
                  </button>
                )}
                <button
                  className="button subtle"
                  onClick={() =>
                    void platform.get<Row>(`${api}/delivery-jobs/${row.id}`).then(setPreview)
                  }
                >
                  {t('view')}
                </button>
              </div>
            ))}
            {!rows.length && <Empty />}
          </div>
        </>
      )}
      {section !== 'templates' && data?.pageInfo && (
        <div className="pagination">
          <button
            className="button outlined"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            ←
          </button>
          <span>
            {page} / {Math.max(1, Math.ceil(data.pageInfo.total / 12))}
          </span>
          <button
            className="button outlined"
            disabled={page * 12 >= data.pageInfo.total}
            onClick={() => setPage(page + 1)}
          >
            →
          </button>
        </div>
      )}
      <Dialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null)
        }}
      >
        <DialogContent className="platform" showCloseButton={false} aria-describedby={undefined}>
          <div className="panel-heading">
            <DialogTitle>{preview?.name ?? t('preview')}</DialogTitle>
            <DialogClose className="icon-button" aria-label={t('cancel')}>
              <X size={20} />
            </DialogClose>
          </div>
          <DialogBody>
            {preview?.document ? (
              <TemplatePreview document={preview.document} mode="phone" />
            ) : (
              <pre>{JSON.stringify(preview, null, 2)}</pre>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  )
}
function Empty() {
  const t = useTranslations()
  return (
    <div className="empty-state">
      <Layers3 size={30} />
      <h3>{t('empty')}</h3>
      <p>{t('emptyHint')}</p>
    </div>
  )
}
function WorkspaceExtras({ api }: { api: string }) {
  const t = useTranslations()
  const shares = useQuery({
    queryKey: ['platform', api, 'shares'],
    queryFn: () => platform.get<Row[]>(api + '/shares'),
  })
  const audit = useQuery({
    queryKey: ['platform', api, 'audit'],
    queryFn: () => platform.get<Row[]>(api + '/audit-logs'),
  })
  return (
    <>
      <section className="panel">
        <h2>{t('shares')}</h2>
        {shares.data?.map((row) => (
          <div className="recent-row" key={row.id}>
            <span>{row.template_id}</span>
            <span>{row.revoked_at ? t('revoke') : row.expires_at}</span>
            <button
              className="button subtle"
              disabled={!!row.revoked_at}
              onClick={() =>
                void platform.del(api + `/shares/${row.id}`).then(() => shares.refetch())
              }
            >
              {t('revokeShare')}
            </button>
          </div>
        ))}
      </section>
      <section className="panel">
        <h2>{t('audit')}</h2>
        {audit.data?.map((row) => (
          <div className="recent-row" key={row.id}>
            <span>{row.action}</span>
            <span className="muted">{row.created_at}</span>
          </div>
        ))}
      </section>
    </>
  )
}
function AccountSettings({ user }: { user: Row }) {
  const t = useTranslations()
  const locale = useLocale()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const qc = useQueryClient()
  const sessions = useQuery({
    queryKey: ['platform', user.id, 'sessions'],
    queryFn: () => authentication.request<Row[]>('list-sessions'),
  })
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setMessage('')
    try {
      await fn()
      setMessage(t('stored'))
      await qc.invalidateQueries({ queryKey: ['platform'] })
    } catch (e) {
      setMessage(locale === 'en' ? t('error') : (e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <div className="page-heading">
        <h1>{t('account')}</h1>
      </div>
      {message && (
        <p role="status" className="mode-banner">
          {message}
        </p>
      )}
      <div className="settings-grid">
        <form
          className="panel settings-form"
          onSubmit={(e) => {
            e.preventDefault()
            const f = new FormData(e.currentTarget)
            void run(async () => {
              await authentication.request('update-user', { name: f.get('name') })
              await platform.put('/api/v1/me/preferences', { timezone: f.get('timezone') })
            })
          }}
        >
          <h2>{t('account')}</h2>
          <label>
            {t('name')}
            <input name="name" defaultValue={user.name} required />
          </label>
          <label>
            {t('timezone')}
            <input name="timezone" defaultValue={user.preferences.timezone} required />
          </label>
          <Preferences />
          <button className="button primary" disabled={busy}>
            {t('save')}
          </button>
        </form>
        <form
          className="panel settings-form"
          onSubmit={(e) => {
            e.preventDefault()
            const f = new FormData(e.currentTarget)
            void run(() =>
              authentication.request('change-password', {
                currentPassword: f.get('current'),
                newPassword: f.get('password'),
                revokeOtherSessions: true,
              }),
            )
          }}
        >
          <h2>{t('changePassword')}</h2>
          <label>
            {t('currentPassword')}
            <input name="current" type="password" required autoComplete="current-password" />
          </label>
          <label>
            {t('newPassword')}
            <input
              name="password"
              type="password"
              minLength={12}
              maxLength={128}
              required
              autoComplete="new-password"
            />
          </label>
          <button className="button primary" disabled={busy}>
            {t('save')}
          </button>
        </form>
        <form
          className="panel settings-form"
          onSubmit={(e) => {
            e.preventDefault()
            const email = new FormData(e.currentTarget).get('email')
            void run(() =>
              authentication.request('change-email', {
                newEmail: email,
                callbackURL: `${location.origin}/${locale}/app/settings`,
              }),
            )
          }}
        >
          <h2>{t('changeEmail')}</h2>
          <label>
            {t('email')}
            <input name="email" type="email" defaultValue={user.email} required />
          </label>
          <button className="button outlined" disabled={busy}>
            {t('changeEmail')}
          </button>
        </form>
        <section className="panel">
          <h2>{t('sessions')}</h2>
          {sessions.data?.map((row) => (
            <div className="session-row" key={row.id}>
              <span>
                {row.userAgent || 'Browser'}
                <small>{row.ipAddress}</small>
              </span>
              <button
                className="button subtle"
                disabled={busy}
                onClick={() =>
                  void run(() => authentication.request('revoke-session', { token: row.token }))
                }
              >
                {t('revoke')}
              </button>
            </div>
          ))}
          <button
            className="button outlined"
            disabled={busy}
            onClick={() => void run(() => authentication.request('revoke-sessions', {}))}
          >
            {t('allSessions')}
          </button>
        </section>
      </div>
    </>
  )
}
