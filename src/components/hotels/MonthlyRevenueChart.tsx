import type { HotelMonthlyReport } from '@/types/database'
import { calcNoi } from '@/services/hotels'

interface MonthlyRevenueChartProps {
  reports: HotelMonthlyReport[]
}

export default function MonthlyRevenueChart({
  reports,
}: MonthlyRevenueChartProps) {
  if (reports.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-12">
        暂无月度数据，请先录入
      </p>
    )
  }

  const sorted = [...reports].sort(
    (a, b) => a.year * 12 + a.month - (b.year * 12 + b.month),
  )

  const maxValue = Math.max(
    ...sorted.map((r) => {
      const noi = calcNoi(r.revenue_wan, r.expense_wan) ?? 0
      return Math.max(r.revenue_wan ?? 0, noi)
    }),
    1,
  )

  return (
    <div>
      <div className="flex items-end gap-2 h-52 px-2 border-b border-gray-200 pb-2">
        {sorted.map((report) => {
          const noi = calcNoi(report.revenue_wan, report.expense_wan) ?? 0
          const revenueHeight = ((report.revenue_wan ?? 0) / maxValue) * 100
          const noiHeight = (noi / maxValue) * 100

          return (
            <div
              key={report.id}
              className="flex-1 flex flex-col items-center gap-1 min-w-0"
              title={`${report.year}/${report.month} 营业额 ${report.revenue_wan}万 NOI ${noi}万`}
            >
              <div className="w-full flex items-end justify-center gap-0.5 h-40">
                <div
                  className="w-[45%] bg-[#1B2B4B]/80 rounded-t"
                  style={{
                    height: `${Math.max(revenueHeight, 2)}%`,
                  }}
                />
                <div
                  className="w-[45%] bg-[#C9A84C] rounded-t"
                  style={{
                    height: `${Math.max(noiHeight, 2)}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-500 truncate w-full text-center">
                {report.month}月
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#1B2B4B]/80" />
          营业额
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#C9A84C]" />
          NOI
        </span>
      </div>
    </div>
  )
}
