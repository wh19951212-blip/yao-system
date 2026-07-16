import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Users } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'
import PoolCard from '@/components/dashboard/PoolCard'
import DashboardStatsSection from '@/components/dashboard/DashboardStatsSection'
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines'
import BusinessLineSwitcher from '@/components/dashboard/BusinessLineSwitcher'
import DashboardQuickNav from '@/components/dashboard/DashboardQuickNav'
import MyTasksPanel from '@/components/dashboard/MyTasksPanel'
import DailyTodoModal, {
  shouldShowDailyTodo,
} from '@/components/dashboard/DailyTodoModal'
import { getSupabaseEnvDebug } from '@/lib/supabase'
import { subscribeDemoData } from '@/lib/demoData'
import { useDataScope } from '@/hooks/useDataScope'
import {
  fetchDashboardData,
  formatCurrency,
} from '@/services/investors'
import { DashboardLoadError } from '@/utils/supabaseError'
import type { DashboardData } from '@/types/database'

type QueryError = {
  message: string
  details?: string
  hint?: string
  code?: string
}

export default function Dashboard() {
  const { ownerEmail } = useDataScope()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [queryError, setQueryError] = useState<QueryError | null>(null)
  const [offlineMode, setOfflineMode] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [usingDemo, setUsingDemo] = useState(false)
  const [todoOpen, setTodoOpen] = useState(false)

  useEffect(() => subscribeDemoData(setUsingDemo), [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setQueryError(null)
      setOfflineMode(false)
      setData(null)

      try {
        const dashboard = await fetchDashboardData(ownerEmail)
        if (cancelled) return
        setData(dashboard)
        if (shouldShowDailyTodo()) {
          setTodoOpen(true)
        }
      } catch (err) {
        if (cancelled) return
        console.error('[Dashboard] 加载失败', err)

        const normalized: QueryError =
          err instanceof DashboardLoadError
            ? {
                message: err.message,
                code: err.code,
                details: err.details,
                hint: err.hint,
              }
            : err && typeof err === 'object' && 'message' in err
              ? (err as QueryError)
              : {
                  message: err instanceof Error ? err.message : String(err),
                }

        if (/failed to fetch/i.test(normalized.message)) {
          normalized.message =
            'Supabase 数据库无法连接。请在 Supabase 控制台确认项目有效，或运行 supabase/seed_demo.sql。'
        }

        setOfflineMode(true)
        setQueryError(normalized)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [reloadKey, ownerEmail])

  if (loading) {
    return (
      <div className="page-shell">
        <LoadingSpinner label="加载仪表盘..." />
      </div>
    )
  }

  if (offlineMode || !data) {
    return (
      <div className="page-shell space-y-4">
        <PageHeader title="仪表盘" description="数据库暂不可用" />
        {queryError && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
            <p className="font-medium text-amber-900">
              无法加载仪表盘数据。网站部署正常，需恢复 Supabase 连接。
            </p>
            <p className="text-sm text-amber-800">
              项目地址：
              <code className="mx-1 px-1 rounded bg-white/80">
                {getSupabaseEnvDebug().envUrl}
              </code>
            </p>
            <pre className="text-xs overflow-auto whitespace-pre-wrap break-all bg-white/70 p-3 rounded-lg border border-amber-100">
              {JSON.stringify(
                { ...queryError, supabase: getSupabaseEnvDebug() },
                null,
                2,
              )}
            </pre>
            <Button variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>
              重试
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="page-shell space-y-8">
      <PageHeader
        title="工作台"
        description={
          usingDemo
            ? '业务概览 · 演示案例数据'
            : '业务概览 · 资金池与待办'
        }
      />

      <BusinessLineSwitcher />

      <DashboardQuickNav />

      <MyTasksPanel />

      <section>
        <h2 className="section-label mb-4">总览</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '投资人总数', value: data.totals.investors, unit: '人' },
            {
              label: '总预算',
              value: formatCurrency(data.totals.totalBudget),
              unit: '',
            },
            {
              label: '已确认',
              value: formatCurrency(data.totals.confirmedAmount),
              unit: '',
            },
            {
              label: '确认率',
              value: `${data.totals.confirmRate.toFixed(0)}%`,
              unit: '',
            },
          ].map((item) => (
            <div key={item.label} className="card">
              <div className="card-body">
                <p className="stat-label">{item.label}</p>
                <p className="stat-value text-[#1B2B4B] mt-2">
                  {item.value}
                  {item.unit && (
                    <span className="text-base font-normal text-gray-500 ml-1">
                      {item.unit}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-label">分级资金池</h2>
          <Link
            to="/investors"
            className="text-sm text-[#C9A84C] hover:underline"
          >
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {data.pools.map((pool) => (
            <PoolCard key={pool.grade} pool={pool} />
          ))}
        </div>
      </section>

      {data.overdueInvestors.length > 0 && (
        <section>
          <h2 className="section-label mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            需要跟进 ({data.overdueInvestors.length})
          </h2>
          <div className="space-y-2">
            {data.overdueInvestors.slice(0, 5).map((inv) => (
              <Link
                key={inv.id}
                to={`/investors/${inv.id}`}
                className="card block hover:border-[#C9A84C]/40 transition-colors"
              >
                <div className="card-body flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-red-500" />
                    <span className="font-medium">{inv.name}</span>
                    <span className="text-xs text-gray-500">{inv.stage}</span>
                  </div>
                  <span className="text-sm text-red-600">跟进 →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-label mb-4">截止日期临近</h2>
        <UpcomingDeadlines investors={data.upcomingDeadlineInvestors} />
      </section>

      <DashboardStatsSection stats={data.stats} />

      <DailyTodoModal
        open={todoOpen}
        data={data}
        onClose={() => setTodoOpen(false)}
      />
    </div>
  )
}
