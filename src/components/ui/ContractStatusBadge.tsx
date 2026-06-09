import { CONTRACT_STATUS_COLORS, type ContractStatus } from '@/config/app'

interface ContractStatusBadgeProps {
  status: string
}

export default function ContractStatusBadge({
  status,
}: ContractStatusBadgeProps) {
  const colors =
    CONTRACT_STATUS_COLORS[status as ContractStatus] ??
    CONTRACT_STATUS_COLORS['进行中']

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {status}
    </span>
  )
}
