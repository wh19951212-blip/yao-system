import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calculator, Plus, Search } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import HotelStatusBadge from '@/components/ui/HotelStatusBadge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState, { LIST_EMPTY_STATES } from '@/components/ui/EmptyState'
import { useListFilters } from '@/hooks/useListFilters'
import Pagination from '@/components/ui/Pagination'
import { useDataScope } from '@/hooks/useDataScope'
import { usePagination } from '@/hooks/usePagination'
import { fetchInvestors } from '@/services/investors'
import { fetchHotels } from '@/services/hotels'
import { useCanWrite } from '@/hooks/useCanWrite'
import type { Hotel } from '@/types/database'

export default function HotelList() {
  const { ownerEmail, isAdmin, isGuest } = useDataScope()
  const { canWrite } = useCanWrite()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [filters, setFilters] = useListFilters('hotels', { search: '' })
  const search = filters.search
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        if (isAdmin || isGuest) {
          setHotels(await fetchHotels())
          return
        }
        const investors = await fetchInvestors('all', ownerEmail)
        setHotels(await fetchHotels(investors.map((item) => item.id)))
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [ownerEmail, isAdmin, isGuest])

  const filtered = hotels.filter(
    (h) =>
      !search ||
      h.name.includes(search) ||
      h.location?.includes(search) ||
      h.owner_investor?.name.includes(search),
  )

  const { paginated, page, setPage, totalPages, total, pageSize } =
    usePagination(filtered, undefined, search)

  return (
    <div className="page-shell">
      <PageHeader
        title="酒店管理"
        description="代运营酒店档案与月度收益跟踪"
        actions={
          <div className="flex items-center gap-3">
            <Link to="/hotels/forecast">
              <Button variant="secondary">
                <Calculator size={16} />
                收益试算
              </Button>
            </Link>
            {canWrite && (
              <Link to="/hotels/new">
                <Button>
                  <Plus size={16} />
                  新增酒店
                </Button>
              </Link>
            )}
          </div>
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
          placeholder="搜索酒店名、位置、业主..."
          className="input-field pl-9"
        />
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : hotels.length === 0 ? (
        <div className="card">
          <EmptyState {...LIST_EMPTY_STATES.hotels} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="未找到匹配的酒店"
            description="试试调整搜索关键词"
          />
        </div>
      ) : (
        <>
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head">
                <th className="text-left px-5 py-3">酒店名</th>
                <th className="text-left px-4 py-3">位置</th>
                <th className="text-right px-4 py-3">房间数</th>
                <th className="text-left px-4 py-3">状态</th>
                <th className="text-left px-4 py-3">业主</th>
                <th className="text-right px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((hotel) => (
                  <tr key={hotel.id} className="table-row">
                    <td className="px-5 py-4">
                      <Link
                        to={`/hotels/${hotel.id}`}
                        className="font-medium text-[#1A1A2A] hover:text-[#C9A84C] transition-colors"
                      >
                        {hotel.name}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-gray-500">
                      {hotel.location ?? '—'}
                    </td>
                    <td className="px-4 py-4 text-right text-[#1A1A2A]">
                      {hotel.room_count?.toLocaleString('zh-CN') ?? '—'}
                    </td>
                    <td className="px-4 py-4">
                      <HotelStatusBadge status={hotel.status} />
                    </td>
                    <td className="px-4 py-4 text-[#1A1A2A]">
                      {hotel.owner_investor?.name ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/hotels/${hotel.id}/edit`}
                        className="text-gray-500 hover:text-[#1A1A2A] text-sm mr-3"
                      >
                        编辑
                      </Link>
                      <Link
                        to={`/hotels/${hotel.id}`}
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
