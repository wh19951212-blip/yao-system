import { APPROVAL_STATUS_COLORS, type ApprovalStatus } from '@/config/app'

interface ApprovalStatusBadgeProps {
  status: string
}

export default function ApprovalStatusBadge({
  status,
}: ApprovalStatusBadgeProps) {
  const colors =
    APPROVAL_STATUS_COLORS[status as ApprovalStatus] ??
    APPROVAL_STATUS_COLORS['待提交']

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {status}
    </span>
  )
}
