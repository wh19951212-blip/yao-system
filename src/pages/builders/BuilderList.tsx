import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import BuilderTierBadge from '@/components/ui/BuilderTierBadge'
import CapacityBadge from '@/components/ui/CapacityBadge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState, { LIST_EMPTY_STATES } from '@/components/ui/EmptyState'
import { useListFilters } from '@/hooks/useListFilters'
import Pagination from '@/components/ui/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { fetchBuilders, formatPriceRange } from '@/services/builders'
import { useCanWrite } from '@/hooks/useCanWrite'
import type { Builder } from '@/types/database'

export default function BuilderList() {
  const { canWrite } = useCanWrite()
  const [builders, setBuilders] = useState<Builder[]>([])
  const [filters, setFilters] = useListFilters('builders', { search: '' })
  const search = filters.search
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBuilders()
      .then(setBuilders)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = builders.filter(
    (b) =>
      !search ||
      b.company_name.includes(search) ||
      b.contact_name?.includes(search) ||
      b.specialty?.includes(search) ||
      b.region?.includes(search),
  )

  const { paginated, page, setPage, totalPages, total, pageSize } =
    usePagination(filtered, undefined, search)

  return (
    <div className="page-shell">
      <PageHeader
        title="建筑商管理"
        description="管理合作建筑商档案与报价记录"
        actions={
          canWrite ? (
            <Link to="/builders/new">
              <Button>
                <Plus size={16} />
                新增建筑商
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
          placeholder="搜索公司、联系人、专长..."
          className="input-field pl-9"
        />
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : builders.length === 0 ? (
        <div className="card">
          <EmptyState {...LIST_EMPTY_STATES.builders} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="未找到匹配的建筑商"
            description="试试调整搜索关键词"
          />
        </div>
      ) : (
        <>
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head">
                <th className="text-left px-5 py-3">公司名</th>
                <th className="text-left px-4 py-3">联系人</th>
                <th className="text-left px-4 py-3">评级</th>
                <th className="text-left px-4 py-3">专长</th>
                <th className="text-left px-4 py-3">报价区间</th>
                <th className="text-left px-4 py-3">容量</th>
                <th className="text-right px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((builder) => (
                  <tr key={builder.id} className="table-row">
                    <td className="px-5 py-4">
                      <Link
                        to={`/builders/${builder.id}`}
                        className="font-medium text-[#1A1A2A] hover:text-[#C9A84C] transition-colors"
                      >
                        {builder.company_name}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-[#1A1A2A]">
                      {builder.contact_name ?? '—'}
                    </td>
                    <td className="px-4 py-4">
                      <BuilderTierBadge tier={builder.tier} />
                    </td>
                    <td className="px-4 py-4 text-gray-500">
                      {builder.specialty ?? '—'}
                      {builder.region && (
                        <span className="block text-xs mt-0.5">
                          {builder.region}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[#1A1A2A]">
                      {formatPriceRange(
                        builder.price_per_sqm_min,
                        builder.price_per_sqm_max,
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <CapacityBadge status={builder.capacity_status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/builders/${builder.id}/edit`}
                        className="text-gray-500 hover:text-[#1A1A2A] text-sm mr-3"
                      >
                        编辑
                      </Link>
                      <Link
                        to={`/builders/${builder.id}`}
                        className="text-[#1A1A2A] hover:text-[#C9A84C] text-sm font-medium"
                      >
                        详情
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
