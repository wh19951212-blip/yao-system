import { CHANNEL_STATUS_COLORS, type ChannelStatus } from '@/config/app'

export default function ChannelStatusBadge({ status }: { status: string }) {
  const colors =
    CHANNEL_STATUS_COLORS[status as ChannelStatus] ??
    CHANNEL_STATUS_COLORS.合作中
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {status}
    </span>
  )
}
