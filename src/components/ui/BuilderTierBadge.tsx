import { GRADE_COLORS, type BuilderTier } from '@/config/app'

interface BuilderTierBadgeProps {
  tier: string
}

export default function BuilderTierBadge({ tier }: BuilderTierBadgeProps) {
  const colors = GRADE_COLORS[tier as BuilderTier] ?? GRADE_COLORS.C

  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-sm font-bold border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {tier}
    </span>
  )
}
