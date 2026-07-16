import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import ChannelTierBadge from '@/components/ui/ChannelTierBadge'
import ChannelStatusBadge from '@/components/ui/ChannelStatusBadge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'
import EmptyState, { LIST_EMPTY_STATES } from '@/components/ui/EmptyState'
import { useListFilters } from '@/hooks/useListFilters'
import { usePagination } from '@/hooks/usePagination'
import { useCanWrite } from '@/hooks/useCanWrite'
import {
  fetchChannels,
  formatCooperationTypes,
} from '@/services/channels'
import type { Channel } from '@/types/database'
import { CHANNEL_TIERS, type ChannelTier } from '@/config/app'

export default function ChannelList() {
  const { canWrite } = useCanWrite()
  const [channels, setChannels] = useState<Channel[]>([])
  const [filters, setFilters] = useListFilters('channels', {
    tier: 'all',
    search: '',
  })
  const tierFilter = filters.tier as ChannelTier | 'all'
  const search = filters.search
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    fetchChannels(tierFilter)
      .then(setChannels)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [tierFilter])

  const filtered = channels.filter(
    (ch) =>
      !search ||
      ch.name.includes(search) ||
      ch.contact_name?.includes(search) ||
      ch.region?.includes(search),
  )

  const filterKey = `${tierFilter}-${search}`
  const { paginated, page, setPage, totalPages, total, pageSize } =
    usePagination(filtered, undefined, filterKey)

  return (
    <div className="page-shell">
      <PageHeader
        title="渠道中介"
        description="管理合作渠道、引荐记录与佣金结算"
        actions={
          canWrite ? (
            <Link to="/channels/new">
              <Button>
                <Plus size={16} />
                新增渠道
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
            placeholder="搜索名称、联系人、区域..."
            className="input-field pl-9"
          />
        </div>
        <div className="flex items-center gap-1 card p-1">
          {(['all', ...CHANNEL_TIERS] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setFilters({ tier: tier === 'all' ? 'all' : tier })}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                tierFilter === tier
                  ? 'bg-[#1B2B4B]/10 text-[#1B2B4B] font-medium'
                  : 'text-gray-500 hover:text-[#1B2B4B] hover:bg-gray-50'
              }`}
            >
              {tier === 'all' ? '全部' : `${tier} 级`}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : channels.length === 0 ? (
        <div className="card">
          <EmptyState {...LIST_EMPTY_STATES.channels} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="未找到匹配的渠道"
            description="试试调整搜索关键词或等级筛选"
          />
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-head">
                  <th className="text-left px-5 py-3">名称</th>
                  <th className="text-left px-4 py-3">类型</th>
                  <th className="text-left px-4 py-3">等级</th>
                  <th className="text-left px-4 py-3">合作范围</th>
                  <th className="text-right px-4 py-3">默认佣金</th>
                  <th className="text-left px-4 py-3">状态</th>
                  <th className="text-right px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((channel) => (
                  <tr key={channel.id} className="table-row">
                    <td className="px-5 py-4">
                      <Link
                        to={`/channels/${channel.id}`}
                        className="font-medium text-[#1A1A2A] hover:text-[#C9A84C]"
                      >
                        {channel.name}
                      </Link>
                      {channel.region && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {channel.region}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-500">
                      {channel.entity_type}
                    </td>
                    <td className="px-4 py-4">
                      <ChannelTierBadge tier={channel.tier} />
                    </td>
                    <td className="px-4 py-4 text-gray-500 max-w-[180px] truncate">
                      {formatCooperationTypes(channel.cooperation_types)}
                    </td>
                    <td className="px-4 py-4 text-right font-medium">
                      {channel.default_commission_rate != null
                        ? `${channel.default_commission_rate}%`
                        : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <ChannelStatusBadge status={channel.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      {canWrite && (
                        <Link
                          to={`/channels/${channel.id}/edit`}
                          className="text-gray-500 hover:text-[#1A1A2A] text-sm mr-3"
                        >
                          编辑
                        </Link>
                      )}
                      <Link
                        to={`/channels/${channel.id}`}
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
