import type { BadgeProps } from '@aim/ui'
import { TEMPLATE_STATUS_LABEL, type TemplateStatus } from '@aim/template-schema'

export const STATUS_BADGE: Record<
  TemplateStatus,
  { label: string; variant: BadgeProps['variant'] }
> = {
  draft: { label: TEMPLATE_STATUS_LABEL.draft, variant: 'secondary' },
  reviewing: { label: TEMPLATE_STATUS_LABEL.reviewing, variant: 'info' },
  approved: { label: TEMPLATE_STATUS_LABEL.approved, variant: 'success' },
  rejected: { label: TEMPLATE_STATUS_LABEL.rejected, variant: 'destructive' },
}
