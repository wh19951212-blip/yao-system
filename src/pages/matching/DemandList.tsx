import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Sparkles } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import { useListFilters } from '@/hooks/useListFilters'
import { usePagination } from '@/hooks/usePagination'
import { useCanWrite } from '@/hooks/useCanWrite'
import { useDataScope } from '@/hooks/useDataScope'
import { fetchDemands, formatDemandTitle } from '@/services/demands'
import {
  DEMAND_INTENT_LABELS,
  DEMAND_STATUS_LABELS,
  DEMAND_STATUSES,
  type DemandStatus,
} from '@/config/matching'
import type { InvestorDemand } from '@/types/database'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-50 text-blue-600',
  matching: 'bg-amber-50 text-amber-600',
  matched: 'bg-emerald-50 text-emerald-600',
  in_progress: 'bg-[#C9A84C]/10 text-[#C9A84C]',
  closed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-50 text-red-500',
}

export default function DemandList() {
  const { canWrite } = useCanWrite()
  const { ownerEmail } = useDataScope()
  const [demands, setDemands] = useState<InvestorDemand[]>([])
  const [filters, setFilters] = useListFilters('demands', {
    status: 'all',
    search: '',
  })
  const statusFilter = filters.status as DemandStatus | 'all'
  const search = filters.search
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    fetchDemands(statusFilter, ownerEmail)
      .then(setDemands)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [statusFilter, ownerEmail])

  const filtered = demands.filter((d) => {
    if (!search) return true
    const title = formatDemandTitle(d)
    return (
      title.includes(search) ||
      d.raw_description?.includes(search) ||
      d.investor?.name?.includes(search) ||
      d.buyer?.name?.includes(search)
    )
  })

  const filterKey = `${statusFilter}-${search}`
  const { paginated, page, setPage, totalPages, total, pageSize } =
    usePagination(filtered, undefined, filterKey)

  return (
    <div className="page-shell">
      <PageHeader
        title="需求与匹配"
        description="从投资人发起需求，运行匹配引擎，审核推荐结果"
        actions={
          canWrite ? (
            <Link to="/matching/demands/new">
              <Button>
                <Plus size={16} />
                新建需求单
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder="搜索客户、区域、描述..."
            className="input-field pl-9"
          />
        </div>
        <div className="flex items-center gap-1 card p-1 overflow-x-auto">
          {(['all', ...DEMAND_STATUSES] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() =>
                setFilters({ status: status === 'all' ? 'all' : status })
              }
              className={`shrink-0 px-3 py-1.5 rounded-md text-sm transition-all ${
                statusFilter === status
                  ? 'bg-[#1B2B4B]/10 text-[#1B2B4B] font-medium'
                  : 'text-gray-500 hover:text-[#1B2B4B] hover:bg-gray-50'
              }`}
            >
              {status === 'all' ? '全部' : DEMAND_STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="加载需求单..." />
      ) : error ? (
        <div className="alert-error">{error}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="暂无需求单"
          description="创建需求单后，系统将根据预算、区域、类型等条件自动匹配项目与服务"
          actionLabel="创建第一条需求"
          actionTo="/matching/demands/new"
        />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>需求摘要</th>
                    <th>意向</th>
                    <th>状态</th>
                    <th>负责人</th>
                    <th>更新时间</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((demand) => (
                    <tr key={demand.id}>
                      <td>
                        <Link
                          to={`/matching/demands/${demand.id}`}
                          className="font-medium text-[#1A1A2A] hover:text-[#C9A84C]"
                        >
                          {formatDemandTitle(demand)}
                        </Link>
                        {demand.raw_description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            {demand.raw_description}
                          </p>
                        )}
                      </td>
                      <td className="text-sm text-gray-600">
                        {DEMAND_INTENT_LABELS[demand.intent_type]}
                      </td>
                      <td>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[demand.status] ?? 'bg-gray-100'}`}
                        >
                          {DEMAND_STATUS_LABELS[demand.status]}
                        </span>
                      </td>
                      <td className="text-sm text-gray-500">
                        {demand.owner ?? '—'}
                      </td>
                      <td className="text-sm text-gray-500">
                        {new Date(demand.updated_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td>
                        <Link
                          to={`/matching/demands/${demand.id}`}
                          className="text-sm text-[#C9A84C] hover:underline"
                        >
                          匹配中心 →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
