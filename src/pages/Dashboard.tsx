import { useEffect, useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'
import { getSupabaseEnvDebug, withSupabaseFallback } from '@/lib/supabase'

type QueryError = {
  message: string
  details?: string
  hint?: string
  code?: string
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [investorCount, setInvestorCount] = useState(0)
  const [queryError, setQueryError] = useState<QueryError | null>(null)
  const [offlineMode, setOfflineMode] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setQueryError(null)
      setOfflineMode(false)
      setInvestorCount(0)

      try {
        const result = await withSupabaseFallback(async (client) => {
          const { count, error } = await client
            .from('investors')
            .select('id', { count: 'exact', head: true })

          return { data: count ?? 0, error }
        })

        if (cancelled) return

        console.info('[Dashboard] investors 查询成功', {
          count: result,
          supabase: getSupabaseEnvDebug(),
        })
        setInvestorCount(result)
      } catch (err) {
        if (cancelled) return
        console.error('[Dashboard] 查询失败', err)
        const normalized: QueryError =
          err && typeof err === 'object' && 'message' in err
            ? (err as QueryError)
            : {
                message: err instanceof Error ? err.message : String(err),
              }

        if (/failed to fetch/i.test(normalized.message)) {
          normalized.message =
            'Supabase 数据库无法连接。当前配置的项目地址可能已失效，请在 Supabase 控制台新建/恢复项目，并提供新的 URL 与 anon key 以更新部署。'
        } else if (!normalized.message?.trim()) {
          normalized.message =
            '无法连接 Supabase 数据库（项目可能已暂停或地址无效）'
        }

        setOfflineMode(true)
        setInvestorCount(0)
        setQueryError(normalized)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  if (loading) {
    return (
      <div className="page-shell">
        <LoadingSpinner label="加载仪表盘..." />
      </div>
    )
  }

  return (
    <div className="page-shell space-y-4">
      <PageHeader
        title="仪表盘"
        description={offlineMode ? '离线占位（数据库未连接）' : '投资人概览（简化版）'}
      />

      {offlineMode && queryError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
          <p className="font-medium text-amber-900">
            数据库暂不可用，已显示占位数据。网站部署正常，需恢复 Supabase 后才能加载真实投资人数据。
          </p>
          <p className="text-sm text-amber-800">
            请先强制刷新页面（Mac：Cmd+Shift+R）。若仍失败，说明 Supabase 项目
            <code className="mx-1 px-1 rounded bg-white/80">{getSupabaseEnvDebug().envUrl}</code>
            已失效，需要新建项目并更新配置。
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

      <div className="card">
        <div className="card-body">
          <p className="stat-label">投资人总数</p>
          <p className="stat-value text-[#1B2B4B] mt-2">{investorCount}</p>
          <p className="text-sm text-gray-500 mt-2">
            {offlineMode ? '占位数据 · 数据库未连接' : '来自 investors 表 · count'}
          </p>
        </div>
      </div>
    </div>
  )
}
