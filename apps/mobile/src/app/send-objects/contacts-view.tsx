'use client'

import type { ApiError, Contact } from '@aim/api-client'
import { Button, Checkbox, ConfirmDialog, Empty, Field, Input, Skeleton, toast } from '@aim/ui'
import { BottomSheet, NavBar, SafePage } from '@aim/ui/mobile'
import { isMobile } from '@aim/utils'
import { PencilIcon, PlusIcon, SearchIcon, UserIcon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { AppTabBar } from '@/components/app-tabbar'
import { hooks } from '@/lib/api'
import { getPhone } from '@/lib/auth'
import { MAX_SEND, loadDraft, saveDraft } from '@/lib/send-draft'

export function ContactsView() {
  const router = useRouter()
  const sp = useSearchParams()
  const selectMode = sp.get('mode') === 'select'
  const tplId = sp.get('tplId') ?? ''
  const whois = getPhone()
  const { data, isLoading } = hooks.useContacts(whois)
  const del = hooks.useDeleteContacts(whois)
  const [keyword, setKeyword] = useState('')
  const [checked, setChecked] = useState<string[]>([])
  const [editing, setEditing] = useState<Contact | 'new' | null>(null)
  const [managing, setManaging] = useState(false)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (selectMode && tplId) setChecked(loadDraft(tplId)?.mobiles ?? [])
  }, [selectMode, tplId])

  const list = useMemo(() => (data?.records ?? []).filter((c) => !keyword || c.contactName.includes(keyword) || c.mobile.includes(keyword)), [data, keyword])
  const key = (c: Contact) => (selectMode ? c.mobile : c.id)
  const toggle = (c: Contact) => {
    const k = key(c)
    if (checked.includes(k)) return setChecked(checked.filter((x) => x !== k))
    if (selectMode && checked.length >= MAX_SEND) return void toast.error(`每次最多选择 ${MAX_SEND} 个号码`)
    setChecked([...checked, k])
  }

  const footer = selectMode ? (
    <Button
      block
      size="lg"
      onClick={() => {
        saveDraft({ tplId, mobiles: checked })
        router.replace(`/detail?tplId=${tplId}&send=1`)
      }}
    >
      确定（{checked.length}/{MAX_SEND}）
    </Button>
  ) : managing ? (
    <Button block size="lg" variant="destructive" disabled={!checked.length} onClick={() => setConfirm(true)}>
      删除所选（{checked.length}）
    </Button>
  ) : undefined

  return (
    <SafePage footer={footer} className={selectMode || managing ? '' : 'pb-0'}>
      <NavBar
        title={selectMode ? '选择接收号码' : '通讯录'}
        onBack={() => (selectMode ? router.back() : router.push('/template-list'))}
        right={
          !selectMode && (
            <button type="button" className="px-2 text-sm text-primary" onClick={() => (setManaging(!managing), setChecked([]))}>
              {managing ? '完成' : '管理'}
            </button>
          )
        }
      />
      <div className="space-y-2.5 p-3">
        <div className="flex gap-2">
          <Input prefix={<SearchIcon className="size-4" />} placeholder="搜索姓名或号码" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="flex-1 bg-card" />
          <Button variant="soft" onClick={() => setEditing('new')}>
            <PlusIcon />
            新增
          </Button>
        </div>
        {isLoading ? (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
        ) : list.length === 0 ? (
          <Empty icon={<UserIcon className="size-6" />} title={keyword ? '没有匹配的联系人' : '通讯录为空'} description="添加常用号码，发送时一键选择" action={<Button size="sm" onClick={() => setEditing('new')}>添加联系人</Button>} />
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl bg-card">
            {list.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3" onClick={() => (selectMode || managing) && toggle(c)}>
                {(selectMode || managing) && <Checkbox checked={checked.includes(key(c))} onCheckedChange={() => toggle(c)} onClick={(e) => e.stopPropagation()} aria-label={`选择 ${c.contactName}`} />}
                <span className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">{c.contactName.slice(0, 1)}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px]">{c.contactName}</div>
                  <div className="text-xs text-muted-foreground tabular-nums">{c.mobile}</div>
                </div>
                {!selectMode && !managing && (
                  <button type="button" aria-label="编辑" className="p-2 text-muted-foreground" onClick={() => setEditing(c)}>
                    <PencilIcon className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {!selectMode && !managing && <AppTabBar />}
      <ContactEditor value={editing} onClose={() => setEditing(null)} whois={whois} />
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        destructive
        title={`删除 ${checked.length} 个联系人？`}
        confirmText="删除"
        onConfirm={async () => {
          await del.mutateAsync(checked)
          setChecked([])
          setManaging(false)
          toast.success('已删除')
        }}
      />
    </SafePage>
  )
}

function ContactEditor({ value, onClose, whois }: { value: Contact | 'new' | null; onClose: () => void; whois: string }) {
  const save = hooks.useSaveContact(whois)
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    if (!value) return
    setName(value === 'new' ? '' : value.contactName)
    setMobile(value === 'new' ? '' : value.mobile)
    setError('')
  }, [value])
  const submit = async () => {
    if (!name.trim()) return setError('请输入姓名')
    if (!isMobile(mobile)) return setError('请输入正确的 11 位手机号')
    try {
      await save.mutateAsync({ id: value === 'new' ? undefined : value?.id, contactName: name, mobile })
      toast.success(value === 'new' ? '已添加' : '已保存')
      onClose()
    } catch (e) {
      setError((e as ApiError).message)
    }
  }
  return (
    <BottomSheet
      open={Boolean(value)}
      onOpenChange={(o) => !o && onClose()}
      title={value === 'new' ? '新增联系人' : '编辑联系人'}
      footer={
        <Button block size="lg" loading={save.isPending} onClick={() => void submit()}>
          保存
        </Button>
      }
    >
      <div className="space-y-4">
        <Field label="姓名" required>
          <Input value={name} maxLength={20} onChange={(e) => setName(e.target.value)} placeholder="联系人姓名" />
        </Field>
        <Field label="手机号" required error={error}>
          <Input value={mobile} inputMode="numeric" maxLength={11} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} placeholder="11 位手机号" />
        </Field>
      </div>
    </BottomSheet>
  )
}
