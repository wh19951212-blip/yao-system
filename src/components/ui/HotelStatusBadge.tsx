import { HOTEL_STATUS_COLORS, type HotelStatus } from '@/config/app'

interface HotelStatusBadgeProps {
  status: string
}

export default function HotelStatusBadge({ status }: HotelStatusBadgeProps) {
  const colors =
    HOTEL_STATUS_COLORS[status as HotelStatus] ?? HOTEL_STATUS_COLORS['筹备中']

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {status}
    </span>
  )
}
