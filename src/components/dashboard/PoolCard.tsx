import { GRADE_COLORS, type InvestorGrade } from '@/config/app'
import { formatCurrency } from '@/services/investors'
import type { GradePoolStats } from '@/types/database'

interface PoolCardProps {
  pool: GradePoolStats
}

export default function PoolCard({ pool }: PoolCardProps) {
  const colors = GRADE_COLORS[pool.grade as InvestorGrade]

  return (
    <div className={`card border-l-4 ${colors.accent}`}>
      <div className="card-body">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span
              className={`w-11 h-11 rounded-lg flex items-center justify-center text-lg font-bold border ${colors.bg} ${colors.text} ${colors.border}`}
            >
              {pool.grade}
            </span>
            <div>
              <p className="stat-label">等级 {pool.grade}</p>
              <p className="stat-value">{pool.count}</p>
              <p className="text-xs text-gray-500 mt-0.5">投资人</p>
            </div>
          </div>
          <span className={`text-lg font-bold ${colors.text}`}>
            {pool.progress.toFixed(0)}%
          </span>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">人数</span>
            <span className="text-[#1A1A2A] font-medium">{pool.count} 人</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">总预算</span>
            <span className="text-[#1A1A2A] font-medium">
              {formatCurrency(pool.totalBudget)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">已确认</span>
            <span className="text-[#C9A84C] font-semibold">
              {formatCurrency(pool.confirmedAmount)}
            </span>
          </div>
        </div>

        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>确认率</span>
          <span>{pool.progress.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${colors.bar}`}
            style={{ width: `${pool.progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
