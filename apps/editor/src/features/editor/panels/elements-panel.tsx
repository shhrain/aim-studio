'use client'

import { addElement } from '@aim/template-core'
import { ELEMENT_META, ELEMENT_TYPES, type ElementGroup, type ElementType } from '@aim/template-schema'
import { Alert } from '@aim/ui'
import {
  AlignLeftIcon,
  AudioLinesIcon,
  BadgeCheckIcon,
  CalendarDaysIcon,
  ChevronDownSquareIcon,
  CircleDotIcon,
  ClapperboardIcon,
  ClipboardListIcon,
  ClockIcon,
  FileCheckIcon,
  GalleryHorizontalEndIcon,
  GalleryHorizontalIcon,
  ImageIcon,
  LayoutGridIcon,
  ListChecksIcon,
  MapPinIcon,
  MinusIcon,
  PhoneIcon,
  PointerIcon,
  QrCodeIcon,
  RectangleHorizontalIcon,
  SendIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  SquareCheckIcon,
  TextCursorInputIcon,
  TicketIcon,
  TicketPercentIcon,
  TicketsIcon,
  TimerIcon,
  TrainFrontIcon,
  TypeIcon,
  type LucideIcon,
} from 'lucide-react'
import { useEditor } from '../store'

const ICONS: Record<ElementType, LucideIcon> = {
  text: TypeIcon,
  image: ImageIcon,
  video: ClapperboardIcon,
  audio: AudioLinesIcon,
  button: RectangleHorizontalIcon,
  hotZone: PointerIcon,
  shape: MinusIcon,
  qrCode: QrCodeIcon,
  swiper: GalleryHorizontalIcon,
  sideslip: GalleryHorizontalEndIcon,
  eCommerce: ShoppingBagIcon,
  moreGoods: ShoppingCartIcon,
  ecommerceCoupon: TicketPercentIcon,
  cardVoucher: TicketIcon,
  cardVouchers: TicketsIcon,
  countdown: TimerIcon,
  ticketImage: TrainFrontIcon,
  tel: PhoneIcon,
  map: MapPinIcon,
  serviceNumber: BadgeCheckIcon,
  agreement: FileCheckIcon,
  form: ClipboardListIcon,
  input: TextCursorInputIcon,
  textarea: AlignLeftIcon,
  radioGroup: CircleDotIcon,
  checkboxGroup: SquareCheckIcon,
  picker: ChevronDownSquareIcon,
  datePicker: CalendarDaysIcon,
  timePicker: ClockIcon,
  textSelect: ListChecksIcon,
  imgSelect: LayoutGridIcon,
  submitButton: SendIcon,
}

const GROUPS: { key: ElementGroup; label: string }[] = [
  { key: 'basic', label: '基础' },
  { key: 'media', label: '媒体' },
  { key: 'marketing', label: '营销' },
  { key: 'service', label: '服务' },
  { key: 'form', label: '表单' },
]

export function ElementsPanel() {
  const free = useEditor((s) => s.doc?.pages[0]?.mode === 'absolute')
  const { update, select } = useEditor.getState()
  const add = (type: ElementType) => {
    let id: string | undefined
    update((d) => {
      const r = addElement(d, type)
      id = r.element.id
      return r.doc
    })
    if (id) select(id)
  }
  return (
    <div className="space-y-5 p-4">
      {!free && <Alert variant="neutral">结构化版式中新增的元素会追加在卡片底部；需要自由摆放请在「模板设置」中转为自由排版。</Alert>}
      {GROUPS.map((g) => (
        <section key={g.key}>
          <h3 className="mb-2 text-xs font-semibold text-muted-foreground">{g.label}</h3>
          <div className="grid grid-cols-3 gap-2">
            {ELEMENT_TYPES.filter((t) => ELEMENT_META[t].group === g.key).map((t) => {
              const Icon = ICONS[t]
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => add(t)}
                  className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border bg-card text-xs text-foreground/80 transition hover:border-primary/50 hover:bg-accent hover:text-accent-foreground"
                >
                  <Icon className="size-5" />
                  {ELEMENT_META[t].label}
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
