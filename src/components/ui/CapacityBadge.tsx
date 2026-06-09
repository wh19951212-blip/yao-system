import { CAPACITY_COLORS, type CapacityStatus } from '@/config/app'

interface CapacityBadgeProps {
  status: string
}

export default function CapacityBadge({ status }: CapacityBadgeProps) {
  const colors =
    CAPACITY_COLORS[status as CapacityStatus] ?? CAPACITY_COLORS['空闲']

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {status}
    </span>
  )
}
