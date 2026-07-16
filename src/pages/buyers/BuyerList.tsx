import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'
import EmptyState, { LIST_EMPTY_STATES } from '@/components/ui/EmptyState'
import { useListFilters } from '@/hooks/useListFilters'
import { useDataScope } from '@/hooks/useDataScope'
import { usePagination } from '@/hooks/usePagination'
import { useCanWrite } from '@/hooks/useCanWrite'
import { fetchBuyers, formatBuyerBudget } from '@/services/buyers'

export default function BuyerList() {
  const { ownerEmail } = useDataScope()
  const { canWrite } = useCanWrite()
  const [buyers, setBuyers] = useState<Awaited<ReturnType<typeof fetchBuyers>>>([])
  const [filters, setFilters] = useListFilters('buyers', { search: '' })
  const search = filters.search
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBuyers(ownerEmail)
      .then(setBuyers)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [ownerEmail])

  const filtered = buyers.filter(
    (b) =>
      !search ||
      b.name.includes(search) ||
      b.preferred_type?.includes(search) ||
      b.owner?.includes(search),
  )

  const { paginated, page, setPage, totalPages, total, pageSize } =
    usePagination(filtered, undefined, search)

  return (
    <div className="page-shell">
      <PageHeader
        title="买家管理"
        description="中介线买家档案与物件推荐"
        actions={
          canWrite ? (
            <Link to="/buyers/new">
              <Button>
                <Plus size={16} />
                新增买家
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="mb-6 max-w-sm relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setFilters({ search: e.target.value })}
          placeholder="搜索姓名、偏好类型..."
          className="input-field pl-9"
        />
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : buyers.length === 0 ? (
        <div className="card">
          <EmptyState {...LIST_EMPTY_STATES.buyers} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="未找到匹配的买家"
            description="试试调整搜索关键词"
          />
        </div>
      ) : (
        <>
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head">
                <th className="text-left px-5 py-3">姓名</th>
                <th className="text-left px-4 py-3">预算</th>
                <th className="text-left px-4 py-3">偏好类型</th>
                <th className="text-left px-4 py-3">负责人</th>
                <th className="text-right px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((buyer) => (
                <tr key={buyer.id} className="table-row">
                  <td className="px-5 py-4 font-medium text-[#1A1A2A]">
                    {buyer.name}
                  </td>
                  <td className="px-4 py-4">
                    {formatBuyerBudget(buyer.budget_wan)}
                  </td>
                  <td className="px-4 py-4">
                    {buyer.preferred_type ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-[#1B2B4B]">
                        {buyer.preferred_type}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-4 text-gray-500">
                    {buyer.owner || '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      to={`/buyers/${buyer.id}`}
                      className="text-[#C9A84C] hover:text-[#B8963F] font-medium"
                    >
                      查看 →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
