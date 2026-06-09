import { LAND_STATUS_COLORS, type LandStatus } from '@/config/app'

interface LandStatusBadgeProps {
  status: string
}

export default function LandStatusBadge({ status }: LandStatusBadgeProps) {
  const colors =
    LAND_STATUS_COLORS[status as LandStatus] ?? LAND_STATUS_COLORS['分析中']

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {status}
    </span>
  )
}
