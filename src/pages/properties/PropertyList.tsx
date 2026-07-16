import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, MapPin, Plus, Search } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import PropertyStatusBadge from '@/components/ui/PropertyStatusBadge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'
import EmptyState, { LIST_EMPTY_STATES } from '@/components/ui/EmptyState'
import { useListFilters } from '@/hooks/useListFilters'
import { useDataScope } from '@/hooks/useDataScope'
import { usePagination } from '@/hooks/usePagination'
import {
  fetchProperties,
  formatCommission,
  formatPriceWan,
} from '@/services/properties'
import { PROPERTY_TABS, type PropertyStatus } from '@/config/app'
import { useCanWrite } from '@/hooks/useCanWrite'
import type { Property } from '@/types/database'

export default function PropertyList({ embedded = false }: { embedded?: boolean }) {
  const { ownerEmail } = useDataScope()
  const { canWrite } = useCanWrite()
  const [properties, setProperties] = useState<Property[]>([])
  const [filters, setFilters] = useListFilters('properties', {
    status: 'all',
    search: '',
  })
  const statusTab = filters.status as PropertyStatus | 'all'
  const search = filters.search
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    fetchProperties(statusTab, ownerEmail)
      .then(setProperties)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [statusTab, ownerEmail])

  const filtered = properties.filter(
    (p) =>
      !search ||
      p.name.includes(search) ||
      p.location?.includes(search) ||
      p.type.includes(search),
  )

  const filterKey = `${statusTab}-${search}`
  const { paginated, page, setPage, totalPages, total, pageSize } =
    usePagination(filtered, undefined, filterKey)

  return (
    <div className={embedded ? undefined : 'page-shell'}>
      {!embedded && (
      <PageHeader
        title="物件管理"
        description="中介线物件上架与状态跟踪"
        actions={
          canWrite ? (
            <Link to="/properties/new">
              <Button>
                <Plus size={16} />
                新增物件
              </Button>
            </Link>
          ) : undefined
        }
      />
      )}

      {embedded && canWrite && (
        <div className="flex justify-end mb-4">
          <Link to="/properties/new">
            <Button>
              <Plus size={16} />
              新增物件
            </Button>
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {PROPERTY_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilters({ status: tab.key })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              statusTab === tab.key
                ? 'bg-[#1B2B4B] text-white border-[#1B2B4B]'
                : 'bg-white text-gray-500 border-gray-200 hover:border-[#1B2B4B]/30 hover:text-[#1B2B4B]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-6 max-w-sm relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setFilters({ search: e.target.value })}
          placeholder="搜索物件名、位置..."
          className="input-field pl-9"
        />
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : properties.length === 0 ? (
        <div className="card">
          <EmptyState {...LIST_EMPTY_STATES.properties} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="未找到匹配的物件"
            description="试试调整搜索关键词或状态筛选"
          />
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {paginated.map((property) => (
            <Link
              key={property.id}
              to={`/properties/${property.id}`}
              className="card group hover:shadow-md transition-all overflow-hidden"
            >
              <div className="aspect-[16/10] bg-gray-100 relative overflow-hidden">
                {property.image_url ? (
                  <img
                    src={property.image_url}
                    alt={property.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Building2 size={48} strokeWidth={1} />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <PropertyStatusBadge status={property.status} />
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-[#1A1A2A] group-hover:text-[#1B2B4B] transition-colors truncate">
                  {property.name}
                </h3>
                {property.location && (
                  <p className="flex items-center gap-1 text-sm text-gray-500 mt-1 truncate">
                    <MapPin size={14} className="shrink-0" />
                    {property.location}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-[#1B2B4B]">
                    {property.type}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                    {property.source_type}
                  </span>
                </div>
                <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">价格</p>
                    <p className="text-lg font-bold text-[#1B2B4B]">
                      {formatPriceWan(property.price_wan)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">佣金率</p>
                    <p className="text-sm font-medium text-[#C9A84C]">
                      {formatCommission(property.commission_rate)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
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
