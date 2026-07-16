import { CHANNEL_TIER_COLORS, type ChannelTier } from '@/config/app'

export default function ChannelTierBadge({ tier }: { tier: string }) {
  const colors =
    CHANNEL_TIER_COLORS[tier as ChannelTier] ?? CHANNEL_TIER_COLORS.C
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {tier} 级
    </span>
  )
}
