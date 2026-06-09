import { INVESTOR_STAGES } from '@/config/app'
import { formatCurrency } from '@/services/investors'
import type { DashboardStats } from '@/types/database'

interface DashboardStatsSectionProps {
  stats: DashboardStats
}

const STAGE_COLORS = [
  '#1B2B4B',
  '#C9A84C',
  '#3B82F6',
  '#10B981',
  '#8B5CF6',
]

const ABANDON_COLORS = [
  '#EF4444',
  '#F59E0B',
  '#8B5CF6',
  '#3B82F6',
  '#10B981',
  '#6B7280',
]

export default function DashboardStatsSection({
  stats,
}: DashboardStatsSectionProps) {
  const totalStages = stats.stageDistribution.reduce((s, d) => s + d.count, 0)
  const totalUpgrades = stats.stageUpgradesThisMonth.reduce(
    (s, d) => s + d.count,
    0,
  )
  const totalAbandoned = stats.abandonReasonStats.reduce(
    (s, d) => s + d.count,
    0,
  )
  const maxTrend = Math.max(
    ...stats.poolTrend.flatMap((p) => [p.totalBudget, p.confirmedAmount]),
    1,
  )

  let pieOffset = 0
  const pieSegments = stats.stageDistribution
    .filter((d) => d.count > 0)
    .map((item, index) => {
      const pct = totalStages > 0 ? (item.count / totalStages) * 100 : 0
      const segment = {
        ...item,
        pct,
        color: STAGE_COLORS[index % STAGE_COLORS.length],
        offset: pieOffset,
      }
      pieOffset += pct
      return segment
    })

  const pieGradient =
    pieSegments.length > 0
      ? pieSegments
          .map(
            (s) =>
              `${s.color} ${s.offset}% ${s.offset + s.pct}%`,
          )
          .join(', ')
      : '#E5E7EB 0% 100%'

  let abandonOffset = 0
  const abandonSegments = stats.abandonReasonStats
    .filter((d) => d.count > 0)
    .map((item, index) => {
      const pct = totalAbandoned > 0 ? (item.count / totalAbandoned) * 100 : 0
      const segment = {
        ...item,
        pct,
        color: ABANDON_COLORS[index % ABANDON_COLORS.length],
        offset: abandonOffset,
      }
      abandonOffset += pct
      return segment
    })

  const abandonGradient =
    abandonSegments.length > 0
      ? abandonSegments
          .map((s) => `${s.color} ${s.offset}% ${s.offset + s.pct}%`)
          .join(', ')
      : '#E5E7EB 0% 100%'

  return (
    <section>
      <h2 className="section-label mb-4">数据统计</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: '本月新增投资人',
            value: stats.newInvestorsThisMonth,
            unit: '人',
          },
          {
            label: '本月新增物件',
            value: stats.newPropertiesThisMonth,
            unit: '个',
          },
          {
            label: '本月成交合同',
            value: stats.closedContractsThisMonth,
            unit: '份',
          },
        ].map((item) => (
          <div key={item.label} className="card">
            <div className="card-body">
              <p className="stat-label">{item.label}</p>
              <p className="stat-value mt-1">
                {item.value}
                <span className="text-base font-normal text-gray-500 ml-1">
                  {item.unit}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-body">
            <h3 className="text-sm font-semibold text-[#1B2B4B] mb-4">
              各阶段投资人分布
            </h3>
            {totalStages === 0 ? (
              <p className="text-sm text-gray-500 text-center py-12">暂无数据</p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div
                  className="w-40 h-40 rounded-full shrink-0"
                  style={{
                    background: `conic-gradient(${pieGradient})`,
                  }}
                />
                <div className="flex-1 space-y-2 w-full">
                  {INVESTOR_STAGES.map((stage, index) => {
                    const item = stats.stageDistribution.find(
                      (d) => d.stage === stage,
                    )
                    const count = item?.count ?? 0
                    const pct =
                      totalStages > 0
                        ? Math.round((count / totalStages) * 100)
                        : 0
                    return (
                      <div key={stage} className="flex items-center gap-2 text-sm">
                        <span
                          className="w-3 h-3 rounded-sm shrink-0"
                          style={{
                            backgroundColor:
                              STAGE_COLORS[index % STAGE_COLORS.length],
                          }}
                        />
                        <span className="flex-1 text-[#1A1A2A]">{stage}</span>
                        <span className="text-gray-500">
                          {count} 人 ({pct}%)
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 className="text-sm font-semibold text-[#1B2B4B] mb-1">
              本月阶段升级人数
            </h3>
            <p className="text-xs text-gray-500 mb-4">仅统计阶段向前升级的记录</p>
            {totalUpgrades === 0 ? (
              <p className="text-sm text-gray-500 text-center py-12">本月暂无升级</p>
            ) : (
              <div className="space-y-3">
                {INVESTOR_STAGES.map((stage) => {
                  const item = stats.stageUpgradesThisMonth.find(
                    (d) => d.stage === stage,
                  )
                  const count = item?.count ?? 0
                  if (count === 0) return null
                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <span className="flex-1 text-sm text-[#1A1A2A]">{stage}</span>
                      <span className="text-sm font-medium text-[#C9A84C]">
                        +{count} 人
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 className="text-sm font-semibold text-[#1B2B4B] mb-4">
              土地放弃原因分布
            </h3>
            {totalAbandoned === 0 ? (
              <p className="text-sm text-gray-500 text-center py-12">暂无放弃记录</p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div
                  className="w-40 h-40 rounded-full shrink-0"
                  style={{ background: `conic-gradient(${abandonGradient})` }}
                />
                <div className="flex-1 space-y-2 w-full">
                  {stats.abandonReasonStats.map((item, index) => {
                    const pct =
                      totalAbandoned > 0
                        ? Math.round((item.count / totalAbandoned) * 100)
                        : 0
                    return (
                      <div key={item.stage} className="flex items-center gap-2 text-sm">
                        <span
                          className="w-3 h-3 rounded-sm shrink-0"
                          style={{
                            backgroundColor:
                              ABANDON_COLORS[index % ABANDON_COLORS.length],
                          }}
                        />
                        <span className="flex-1 text-[#1A1A2A]">{item.stage}</span>
                        <span className="text-gray-500">
                          {item.count} 块 ({pct}%)
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card lg:col-span-2">
          <div className="card-body">
            <h3 className="text-sm font-semibold text-[#1B2B4B] mb-4">
              资金池趋势（近 6 个月）
            </h3>
            {stats.poolTrend.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-12">暂无数据</p>
            ) : (
              <>
                <div className="relative h-48 flex items-end gap-2 border-b border-gray-200 pb-2">
                  {stats.poolTrend.map((point) => {
                    const budgetH = (point.totalBudget / maxTrend) * 100
                    const confirmedH = (point.confirmedAmount / maxTrend) * 100
                    return (
                      <div
                        key={point.month}
                        className="flex-1 flex flex-col items-center min-w-0"
                      >
                        <div className="w-full flex items-end justify-center gap-0.5 h-36">
                          <div
                            className="w-[42%] bg-[#1B2B4B]/70 rounded-t transition-all"
                            style={{ height: `${Math.max(budgetH, 2)}%` }}
                            title={`总预算 ${formatCurrency(point.totalBudget)}`}
                          />
                          <div
                            className="w-[42%] bg-[#C9A84C] rounded-t transition-all"
                            style={{ height: `${Math.max(confirmedH, 2)}%` }}
                            title={`已确认 ${formatCurrency(point.confirmedAmount)}`}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 mt-2 truncate w-full text-center">
                          {point.month}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-[#1B2B4B]/70" />
                    累计总预算
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-[#C9A84C]" />
                    累计已确认
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
