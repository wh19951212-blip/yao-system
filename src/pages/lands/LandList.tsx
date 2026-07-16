import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calculator, Plus, Search } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import LandStatusBadge from '@/components/ui/LandStatusBadge'
import { LAND_ABANDON_REASONS } from '@/config/app'
import { useDataScope } from '@/hooks/useDataScope'
import ExportButton from '@/components/ui/ExportButton'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'
import EmptyState, { LIST_EMPTY_STATES } from '@/components/ui/EmptyState'
import { useListFilters } from '@/hooks/useListFilters'
import { usePagination } from '@/hooks/usePagination'
import { fetchLands, formatPercent } from '@/services/lands'
import { formatAmountWan } from '@/utils/formatDisplay'
import { exportToExcel } from '@/utils/exportExcel'
import { useCanWrite } from '@/hooks/useCanWrite'
import ListMobileCards from '@/components/ui/ListMobileCards'
import type { Land } from '@/types/database'

export default function LandList() {
  const { ownerEmail } = useDataScope()
  const { canWrite } = useCanWrite()
  const [lands, setLands] = useState<Land[]>([])
  const [filters, setFilters] = useListFilters('lands', {
    search: '',
    abandon: 'all',
  })
  const search = filters.search
  const abandonFilter = filters.abandon
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchLands(ownerEmail)
      .then(setLands)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [ownerEmail])

  const filtered = lands.filter((land) => {
    const matchSearch =
      !search || land.name.includes(search) || land.location.includes(search)
    const matchAbandon =
      abandonFilter === 'all' ||
      (abandonFilter === 'none'
        ? land.status !== '已放弃'
        : land.status === '已放弃' && land.abandon_reason === abandonFilter)
    return matchSearch && matchAbandon
  })

  const filterKey = `${search}-${abandonFilter}`
  const { paginated, page, setPage, totalPages, total, pageSize } =
    usePagination(filtered, undefined, filterKey)

  const abandonOptions = [
    { value: 'all', label: '全部土地' },
    { value: 'none', label: '排除已放弃' },
    ...LAND_ABANDON_REASONS.map((r) => ({
      value: r,
      label: `已放弃 · ${r}`,
    })),
  ]

  return (
    <div className="page-shell">
      <PageHeader
        title="土地管理"
        description="管理土地资产、审批状态与投资人匹配"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ExportButton
              disabled={filtered.length === 0}
              onClick={() =>
                exportToExcel(
                  `土地列表_${new Date().toISOString().slice(0, 10)}`,
                  ['名称', '位置', '面积(㎡)', '价格(万)', '回报率', '状态'],
                  filtered.map((l) => [
                    l.name,
                    l.location,
                    l.area_sqm,
                    l.price_wan,
                    l.roi_percent ?? '',
                    l.status,
                  ]),
                )
              }
            />
            <Link to="/lands/calculator">
              <Button variant="secondary">
                <Calculator size={16} />
                回报率计算器
              </Button>
            </Link>
            {canWrite && (
              <Link to="/lands/new">
                <Button>
                  <Plus size={16} />
                  新增土地
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="max-w-sm relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder="搜索地块名、位置..."
            className="input-field pl-9"
          />
        </div>
        <div className="max-w-xs w-full">
          <Select
            id="abandonFilter"
            value={abandonFilter}
            onChange={(e) => setFilters({ abandon: e.target.value })}
            options={abandonOptions}
          />
        </div>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : lands.length === 0 ? (
        <div className="card">
          <EmptyState {...LIST_EMPTY_STATES.lands} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="未找到匹配的土地"
            description="试试调整搜索关键词或筛选条件"
          />
        </div>
      ) : (
        <>
          <ListMobileCards
            items={paginated.map((land) => ({
              id: land.id,
              href: `/lands/${land.id}`,
              title: land.name,
              subtitle: land.location,
              badge: <LandStatusBadge status={land.status} />,
              fields: [
                {
                  label: '面积',
                  value: `${land.area_sqm?.toLocaleString('zh-CN')} ㎡`,
                },
                { label: '价格', value: formatAmountWan(land.price_wan) },
                { label: '回报率', value: formatPercent(land.roi_percent) },
              ],
            }))}
          />
          <div className="table-wrap hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-head">
                  <th className="text-left px-5 py-3">地块名</th>
                  <th className="text-left px-4 py-3">位置</th>
                  <th className="text-right px-4 py-3">面积</th>
                  <th className="text-right px-4 py-3">价格</th>
                  <th className="text-right px-4 py-3">回报率</th>
                  <th className="text-left px-4 py-3">状态</th>
                  <th className="text-right px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((land) => (
                  <tr key={land.id} className="table-row">
                    <td className="px-5 py-4 max-w-[160px]">
                      <Link
                        to={`/lands/${land.id}`}
                        className="font-medium text-[#1A1A2A] hover:text-[#C9A84C] transition-colors truncate block"
                      >
                        {land.name}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-[#1A1A2A] max-w-[200px] truncate">
                      {land.location}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-500">
                      {land.area_sqm?.toLocaleString('zh-CN')} ㎡
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-[#1A1A2A]">
                      {formatAmountWan(land.price_wan)}
                    </td>
                    <td className="px-4 py-4 text-right text-emerald-500 font-medium">
                      {formatPercent(land.roi_percent)}
                    </td>
                    <td className="px-4 py-4">
                      <LandStatusBadge status={land.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      {canWrite && (
                        <Link
                          to={`/lands/${land.id}/edit`}
                          className="text-gray-500 hover:text-[#1A1A2A] text-sm mr-3"
                        >
                          编辑
                        </Link>
                      )}
                      <Link
                        to={`/lands/${land.id}`}
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
