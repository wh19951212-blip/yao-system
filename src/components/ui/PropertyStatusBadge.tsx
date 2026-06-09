import { PROPERTY_STATUS_COLORS, type PropertyStatus } from '@/config/app'
import { normalizePropertyStatus } from '@/services/storage'

interface PropertyStatusBadgeProps {
  status: string
}

export default function PropertyStatusBadge({ status }: PropertyStatusBadgeProps) {
  const normalized = normalizePropertyStatus(status)
  const colors =
    PROPERTY_STATUS_COLORS[normalized as PropertyStatus] ??
    PROPERTY_STATUS_COLORS['進行中']

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {normalized}
    </span>
  )
}
