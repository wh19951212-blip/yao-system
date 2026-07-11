import { useEffect, useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'
import { supabase, getSupabaseEnvDebug } from '@/lib/supabase'

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
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setQueryError(null)
      setInvestorCount(0)

      try {
        const { data: investors, error } = await supabase
          .from('investors')
          .select('*')

        if (cancelled) return

        if (error) {
          console.error('[Dashboard] investors 查询失败', error)
          setQueryError(error)
          return
        }

        console.info('[Dashboard] investors 查询成功', {
          count: investors?.length ?? 0,
          supabaseUrl: getSupabaseEnvDebug().url,
        })
        setInvestorCount(investors?.length ?? 0)
      } catch (err) {
        if (cancelled) return
        console.error('[Dashboard] 查询异常', err)
        setQueryError({
          message: err instanceof Error ? err.message : String(err),
        })
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

  if (queryError) {
    return (
      <div className="page-shell space-y-4">
        <PageHeader title="仪表盘" description="加载失败" />
        <div className="alert-error space-y-3">
          <p className="font-medium">investors 表查询失败</p>
          <pre className="text-xs overflow-auto whitespace-pre-wrap break-all bg-red-50 p-3 rounded-lg border border-red-200">
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
      </div>
    )
  }

  return (
    <div className="page-shell">
      <PageHeader title="仪表盘" description="投资人概览（简化版）" />

      <div className="card">
        <div className="card-body">
          <p className="stat-label">投资人总数</p>
          <p className="stat-value text-[#1B2B4B] mt-2">{investorCount}</p>
          <p className="text-sm text-gray-500 mt-2">来自 investors 表 · select *</p>
        </div>
      </div>
    </div>
  )
}
