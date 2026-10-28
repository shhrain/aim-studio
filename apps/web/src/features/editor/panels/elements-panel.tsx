'use client'
import { useEditorCopy } from '@/features/editor/lib/copy'

import { addElement } from '@aim/template-core'
import {
  ELEMENT_META,
  ELEMENT_TYPES,
  type ElementGroup,
  type ElementType,
} from '@aim/template-schema'
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
  const ec = useEditorCopy()

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
      {!free && <Alert variant="neutral">{ec('e15fa24b4ab')}</Alert>}
      {GROUPS.map((g) => (
        <section key={g.key}>
          <h3 className="text-muted-foreground mb-2 text-xs font-semibold">{ec(g.label)}</h3>
          <div className="grid grid-cols-3 gap-2">
            {ELEMENT_TYPES.filter((t) => ELEMENT_META[t].group === g.key).map((t) => {
              const Icon = ICONS[t]
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => add(t)}
                  className="bg-card text-foreground/80 hover:border-primary/50 hover:bg-accent hover:text-accent-foreground flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border text-xs transition"
                >
                  <Icon className="size-5" />
                  {ec(ELEMENT_META[t].label)}
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
