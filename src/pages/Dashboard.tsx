import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DailyTodoModal, {
  shouldShowDailyTodo,
} from '@/components/dashboard/DailyTodoModal'
import { AlertTriangle, CalendarClock, Map, Plus, UserPlus } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import PoolCard from '@/components/dashboard/PoolCard'
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines'
import DashboardStatsSection from '@/components/dashboard/DashboardStatsSection'
import GradeBadge from '@/components/ui/GradeBadge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useSettings } from '@/contexts/SettingsContext'
import { useDataScope } from '@/hooks/useDataScope'
import {
  fetchDashboardData,
  formatCurrency,
  formatDateTime,
  daysSinceContact,
} from '@/services/investors'
import { isSupabaseConfigured, getSupabaseConfigHint } from '@/lib/supabase'
import { DashboardLoadError } from '@/utils/supabaseError'
import { AFTER_SALES_REMINDER_DAYS } from '@/config/app'
import type { DashboardData } from '@/types/database'

export default function Dashboard() {
  const { ownerEmail } = useDataScope()
  const { settings } = useSettings()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [errorStep, setErrorStep] = useState('')
  const [todoOpen, setTodoOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError('')
    setErrorStep('')

    console.info('[Dashboard] 开始加载', {
      ownerEmail,
      supabaseConfigured: isSupabaseConfigured(),
      configHint: getSupabaseConfigHint(),
    })

    fetchDashboardData(ownerEmail)
      .then((dashboardData) => {
        console.info('[Dashboard] 加载成功', {
          investors: dashboardData.totals.investors,
          overdue: dashboardData.overdueInvestors.length,
        })
        setData(dashboardData)
        if (shouldShowDailyTodo()) setTodoOpen(true)
      })
      .catch((err) => {
        const step =
          err instanceof DashboardLoadError ? err.step : 'unknown'
        const message =
          err instanceof Error ? err.message : '加载失败'

        console.error('[Dashboard] 加载失败', {
          step,
          message,
          ownerEmail,
          supabaseConfigured: isSupabaseConfigured(),
          error: err,
        })

        setErrorStep(step)
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [ownerEmail])

  if (loading) {
    return (
      <div className="page-shell">
        <LoadingSpinner label="加载仪表盘..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="alert-error space-y-2">
          <p className="font-medium">加载失败：{error}</p>
          {errorStep && (
            <p className="text-sm opacity-90">失败步骤：{errorStep}</p>
          )}
          {errorStep === 'env' && (
            <p className="text-sm opacity-90">
              Vercel 部署需在 Build 前配置 VITE_SUPABASE_URL 和
              VITE_SUPABASE_ANON_KEY，然后重新 Deploy。
            </p>
          )}
          {errorStep === 'fetchInvestors' && (
            <p className="text-sm opacity-90">
              常见原因：investors 表不存在、RLS 权限不足、或列名不匹配（需有 level /
              budget_wan 字段）。请在 Supabase SQL Editor 运行
              supabase/fix_permissions.sql。
            </p>
          )}
          <p className="text-xs opacity-75">
            详细错误已输出到浏览器控制台（Console → [Dashboard]）。
          </p>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="page-shell">
      <PageHeader title="仪表盘" description="资金池总览与跟进预警" />

      <section className="mb-10">
        <h2 className="section-label mb-4">资金池总览</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {data.pools.map((pool) => (
            <PoolCard key={pool.grade} pool={pool} />
          ))}
        </div>
        <div className="mt-6 card">
          <div className="card-body">
            <div className="flex flex-wrap gap-10 mb-5">
              {[
                { label: '投资人总数', value: String(data.totals.investors) },
                {
                  label: '总预算',
                  value: formatCurrency(data.totals.totalBudget),
                },
                {
                  label: '已确认',
                  value: formatCurrency(data.totals.confirmedAmount),
                  gold: true,
                },
                {
                  label: '总确认率',
                  value: `${data.totals.confirmRate.toFixed(1)}%`,
                  gold: true,
                },
              ].map((item) => (
                <div key={item.label}>
                  <p className="stat-label">{item.label}</p>
                  <p
                    className={`stat-value ${item.gold ? 'text-[#C9A84C]' : ''}`}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>全库确认进度</span>
              <span>{data.totals.confirmRate.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C9A84C] rounded-full transition-all"
                style={{ width: `${data.totals.confirmRate}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock size={16} className="text-[#C9A84C]" />
          <h2 className="section-label">即将到期</h2>
          <span className="text-xs text-gray-500">
            {settings.followUpReminderDays} 天内截止的跟进任务
          </span>
        </div>
        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            已过期
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {settings.deadlineReminderDays} 天内
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {settings.followUpReminderDays} 天内
          </span>
        </div>
        <UpcomingDeadlines investors={data.upcomingDeadlineInvestors} />
      </section>

      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-red-500" />
          <h2 className="section-label">跟进预警</h2>
          <span className="text-xs text-gray-500">
            超过 {settings.followUpReminderDays} 天未联系
          </span>
        </div>

        {data.overdueInvestors.length === 0 ? (
          <div className="card">
            <div className="card-body text-sm text-gray-500">
              暂无超时未跟进的投资人
            </div>
          </div>
        ) : (
          <div className="table-wrap border-red-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-head">
                  <th className="text-left px-5 py-3">姓名</th>
                  <th className="text-left px-4 py-3">等级</th>
                  <th className="text-left px-4 py-3">阶段</th>
                  <th className="text-left px-4 py-3">最后联系</th>
                  <th className="text-left px-4 py-3">未联系</th>
                  <th className="text-right px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {data.overdueInvestors.map((investor) => {
                  const days = daysSinceContact(investor.last_contact_at)
                  return (
                    <tr key={investor.id} className="table-row bg-red-50">
                      <td className="px-5 py-4">
                        <span className="text-red-500 font-medium">
                          {investor.name}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <GradeBadge grade={investor.grade} />
                      </td>
                      <td className="px-4 py-4 text-[#1A1A2A]">
                        {investor.stage}
                      </td>
                      <td className="px-4 py-4 text-red-500">
                        {formatDateTime(investor.last_contact_at)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-red-500 font-semibold">
                          {days === null ? '从未' : `${days} 天`}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/investors/${investor.id}`}
                          className="text-[#C9A84C] hover:text-[#B8963F] text-sm font-medium"
                        >
                          查看 →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-amber-500" />
          <h2 className="section-label">售后跟进提醒</h2>
          <span className="text-xs text-gray-500">
            已成交客户 · 超过 {AFTER_SALES_REMINDER_DAYS} 天未联系
          </span>
        </div>

        {data.afterSalesOverdueInvestors.length === 0 ? (
          <div className="card">
            <div className="card-body text-sm text-gray-500">
              暂无需要售后回访的客户
            </div>
          </div>
        ) : (
          <div className="table-wrap border-amber-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-head">
                  <th className="text-left px-5 py-3">姓名</th>
                  <th className="text-left px-4 py-3">等级</th>
                  <th className="text-left px-4 py-3">最后联系</th>
                  <th className="text-left px-4 py-3">未联系</th>
                  <th className="text-right px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {data.afterSalesOverdueInvestors.map((investor) => {
                  const days = daysSinceContact(investor.last_contact_at)
                  return (
                    <tr key={investor.id} className="table-row bg-amber-50">
                      <td className="px-5 py-4 font-medium text-[#1A1A2A]">
                        {investor.name}
                      </td>
                      <td className="px-4 py-4">
                        <GradeBadge grade={investor.grade} />
                      </td>
                      <td className="px-4 py-4 text-amber-700">
                        {formatDateTime(investor.last_contact_at)}
                      </td>
                      <td className="px-4 py-4 text-amber-700 font-semibold">
                        {days === null ? '从未' : `${days} 天`}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/investors/${investor.id}`}
                          className="text-[#C9A84C] hover:text-[#B8963F] text-sm font-medium"
                        >
                          回访 →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-10">
        <DashboardStatsSection stats={data.stats} />
      </section>

      <section>
        <h2 className="section-label mb-4">快捷入口</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              to: '/investors/new',
              icon: UserPlus,
              title: '新增投资人',
              desc: '录入新的投资人档案',
            },
            {
              to: '/lands/new',
              icon: Map,
              title: '新增土地',
              desc: '录入土地信息',
            },
            {
              to: '/properties/new',
              icon: Plus,
              title: '新增物件',
              desc: '录入物件信息',
            },
          ].map(({ to, icon: Icon, title, desc }) => (
            <Link
              key={to}
              to={to}
              className="card group hover:shadow-md transition-all"
            >
              <div className="card-body flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] group-hover:bg-[#C9A84C]/20 transition-colors">
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="font-medium text-[#1A1A2A]">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <DailyTodoModal
        open={todoOpen}
        data={data}
        onClose={() => setTodoOpen(false)}
      />
    </div>
  )
}
