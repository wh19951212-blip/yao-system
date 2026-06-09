import { GRADE_COLORS, type InvestorGrade } from '@/config/app'

interface GradeBadgeProps {
  grade: InvestorGrade | string
}

export default function GradeBadge({ grade }: GradeBadgeProps) {
  const colors = GRADE_COLORS[grade as InvestorGrade] ?? GRADE_COLORS.C
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-sm font-bold border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {grade}
    </span>
  )
}
