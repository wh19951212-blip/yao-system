import {
  COMMISSION_STATUS_COLORS,
  type CommissionSettlementStatus,
} from '@/config/app'

export default function CommissionStatusBadge({ status }: { status: string }) {
  const colors =
    COMMISSION_STATUS_COLORS[status as CommissionSettlementStatus] ??
    COMMISSION_STATUS_COLORS.待结算
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {status}
    </span>
  )
}
