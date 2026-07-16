import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Building2, Sparkles, Users } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'
import { getSupabaseEnvDebug } from '@/lib/supabase'
import { subscribeDemoData } from '@/lib/demoData'
import { useDataScope } from '@/hooks/useDataScope'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchDashboardData,
  formatDateTime,
} from '@/services/investors'
import { fetchMyTasks, getTaskRelatedPath, updateTaskStatus } from '@/services/tasks'
import { DashboardLoadError } from '@/utils/supabaseError'
import { useToast } from '@/contexts/ToastContext'
import { CheckCircle2, Circle, ListTodo } from 'lucide-react'
import type { DashboardData, Task } from '@/types/database'

type QueryError = {
  message: string
  details?: string
  hint?: string
  code?: string
}

export default function Dashboard() {
  const { ownerEmail } = useDataScope()
  const { profile } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [queryError, setQueryError] = useState<QueryError | null>(null)
  const [offlineMode, setOfflineMode] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [usingDemo, setUsingDemo] = useState(false)

  useEffect(() => subscribeDemoData(setUsingDemo), [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setQueryError(null)
      setOfflineMode(false)
      setData(null)

      try {
        const [dashboard, taskRows] = await Promise.all([
          fetchDashboardData(ownerEmail),
          fetchMyTasks(profile?.id ?? null),
        ])
        if (cancelled) return
        setData(dashboard)
        setTasks(taskRows.slice(0, 5))
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
  }, [reloadKey, ownerEmail, profile?.id])

  const handleDone = async (task: Task) => {
    try {
      await updateTaskStatus(task.id, 'done')
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
      toast.success('任务已完成')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <LoadingSpinner label="加载工作台..." />
      </div>
    )
  }

  if (offlineMode || !data) {
    return (
      <div className="page-shell space-y-4">
        <PageHeader title="工作台" description="数据库暂不可用" />
        {queryError && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
            <p className="font-medium text-amber-900">
              无法加载数据。网站部署正常，需恢复 Supabase 连接。
            </p>
            <p className="text-sm text-amber-800">
              项目地址：
              <code className="mx-1 px-1 rounded bg-white/80">
                {getSupabaseEnvDebug().envUrl}
              </code>
            </p>
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
          usingDemo ? '今日待办与跟进提醒 · 演示数据' : '今日待办与跟进提醒'
        }
      />

      <section className="card p-6">
        <h2 className="section-label flex items-center gap-2 mb-4">
          <ListTodo size={16} className="text-[#C9A84C]" />
          今日待办
        </h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">暂无待办任务</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                <button
                  type="button"
                  onClick={() => handleDone(task)}
                  className="mt-0.5 text-gray-400 hover:text-emerald-600"
                  title="标记完成"
                >
                  <Circle size={18} />
                </button>
                <div className="flex-1 min-w-0">
                  <Link
                    to={getTaskRelatedPath(task)}
                    className="text-sm font-medium text-[#1A1A2A] hover:text-[#C9A84C]"
                  >
                    {task.title}
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => handleDone(task)}
                  className="text-xs text-emerald-600 hover:underline shrink-0"
                >
                  <CheckCircle2 size={14} className="inline mr-0.5" />
                  完成
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-6">
        <h2 className="section-label flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-red-500" />
          需要跟进
          {data.overdueInvestors.length > 0 && (
            <span className="text-gray-400 font-normal text-xs">
              （{data.overdueInvestors.length} 位 · 7 天未联系）
            </span>
          )}
        </h2>
        {data.overdueInvestors.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">所有客户跟进正常</p>
        ) : (
          <div className="space-y-2">
            {data.overdueInvestors.slice(0, 5).map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#C9A84C]/30 transition-colors"
              >
                <div className="min-w-0">
                  <Link
                    to={`/investors/${inv.id}`}
                    className="font-medium text-[#1A1A2A] hover:text-[#C9A84C]"
                  >
                    {inv.name}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {inv.next_action || inv.stage} · 上次{' '}
                    {formatDateTime(inv.last_contact_at)}
                  </p>
                </div>
                <Link to={`/investors/${inv.id}#follow-up`}>
                  <Button variant="secondary" className="text-xs px-3 py-1.5">
                    跟进
                  </Button>
                </Link>
              </div>
            ))}
            {data.overdueInvestors.length > 5 && (
              <Link
                to="/clients"
                className="block text-center text-sm text-[#C9A84C] hover:underline pt-2"
              >
                查看全部 {data.overdueInvestors.length} 位 →
              </Link>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="section-label mb-4">快捷入口</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/investors/new"
            className="card p-4 flex items-center gap-3 hover:border-[#C9A84C]/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1B2B4B]/5 flex items-center justify-center">
              <Users size={20} className="text-[#1B2B4B]" />
            </div>
            <div>
              <p className="font-medium text-sm">新建客户</p>
              <p className="text-xs text-gray-500">投资人档案</p>
            </div>
          </Link>
          <Link
            to="/lands/new"
            className="card p-4 flex items-center gap-3 hover:border-[#C9A84C]/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1B2B4B]/5 flex items-center justify-center">
              <Building2 size={20} className="text-[#1B2B4B]" />
            </div>
            <div>
              <p className="font-medium text-sm">新建土地</p>
              <p className="text-xs text-gray-500">录入地块信息</p>
            </div>
          </Link>
          <Link
            to="/business"
            className="card p-4 flex items-center gap-3 hover:border-[#C9A84C]/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center">
              <Sparkles size={20} className="text-[#C9A84C]" />
            </div>
            <div>
              <p className="font-medium text-sm">运行匹配</p>
              <p className="text-xs text-gray-500">需求与匹配</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}
