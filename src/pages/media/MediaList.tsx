import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Image, Plus, Video } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'
import EmptyState, { LIST_EMPTY_STATES } from '@/components/ui/EmptyState'
import { useListFilters } from '@/hooks/useListFilters'
import { useDataScope } from '@/hooks/useDataScope'
import { usePagination } from '@/hooks/usePagination'
import { fetchMediaAssets } from '@/services/media'
import {
  MEDIA_PLATFORMS,
  MEDIA_TYPES,
  type MediaPlatform,
  type MediaType,
} from '@/config/app'
import { useCanWrite } from '@/hooks/useCanWrite'
import type { MediaAsset } from '@/types/database'

const typeIcons = {
  图片: Image,
  视频: Video,
  文案: FileText,
}

export default function MediaList() {
  const { ownerEmail } = useDataScope()
  const { canWrite } = useCanWrite()
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [filters, setFilters] = useListFilters('media', {
    type: 'all',
    platform: 'all',
  })
  const typeFilter = filters.type as MediaType | 'all'
  const platformFilter = filters.platform as MediaPlatform | 'all'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    fetchMediaAssets({
      type: typeFilter,
      platform: platformFilter,
      createdBy: ownerEmail,
    })
      .then(setAssets)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [typeFilter, platformFilter, ownerEmail])

  const filterKey = `${typeFilter}-${platformFilter}`
  const { paginated, page, setPage, totalPages, total, pageSize } =
    usePagination(assets, undefined, filterKey)

  return (
    <div className="page-shell">
      <PageHeader
        title="素材库"
        description="小红书、微信等平台内容素材管理"
        actions={
          canWrite ? (
            <Link to="/media/new">
              <Button>
                <Plus size={16} />
                新增素材
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-1 card p-1">
          <button
            type="button"
            onClick={() => setFilters({ type: 'all' })}
            className={`px-3 py-1.5 rounded-md text-sm ${
              typeFilter === 'all'
                ? 'bg-[#1B2B4B]/10 text-[#1B2B4B] font-medium'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            全部类型
          </button>
          {MEDIA_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilters({ type: t })}
              className={`px-3 py-1.5 rounded-md text-sm ${
                typeFilter === t
                  ? 'bg-[#1B2B4B]/10 text-[#1B2B4B] font-medium'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 card p-1">
          <button
            type="button"
            onClick={() => setFilters({ platform: 'all' })}
            className={`px-3 py-1.5 rounded-md text-sm ${
              platformFilter === 'all'
                ? 'bg-[#1B2B4B]/10 text-[#1B2B4B] font-medium'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            全部平台
          </button>
          {MEDIA_PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setFilters({ platform: p })}
              className={`px-3 py-1.5 rounded-md text-sm ${
                platformFilter === p
                  ? 'bg-[#1B2B4B]/10 text-[#1B2B4B] font-medium'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : assets.length === 0 && typeFilter === 'all' && platformFilter === 'all' ? (
        <div className="card">
          <EmptyState {...LIST_EMPTY_STATES.media} />
        </div>
      ) : assets.length === 0 ? (
        <div className="card">
          <EmptyState
            title="未找到匹配的素材"
            description="试试调整类型或平台筛选"
          />
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginated.map((asset) => {
            const Icon = typeIcons[asset.type as keyof typeof typeIcons] ?? FileText
            return (
              <Link
                key={asset.id}
                to={`/media/${asset.id}/edit`}
                className="card group hover:shadow-md transition-all overflow-hidden"
              >
                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                  {asset.type === '图片' && asset.file_url ? (
                    <img
                      src={asset.file_url}
                      alt={asset.title}
                      className="w-full h-full object-cover"
                    />
                  ) : asset.type === '视频' && asset.file_url ? (
                    <div className="w-full h-full flex items-center justify-center bg-[#1B2B4B]/5">
                      <Video size={40} className="text-[#1B2B4B]/40" />
                    </div>
                  ) : (
                    <div className="w-full h-full p-4 flex flex-col">
                      <Icon
                        size={24}
                        className="text-[#1B2B4B]/30 mb-2 shrink-0"
                      />
                      <p className="text-xs text-gray-500 line-clamp-5 leading-relaxed">
                        {asset.content || '暂无文案内容'}
                      </p>
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium bg-white/90 text-[#1B2B4B] border border-gray-200">
                    {asset.platform}
                  </span>
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-medium bg-[#1B2B4B] text-white">
                    {asset.type}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-[#1A1A2A] truncate group-hover:text-[#1B2B4B]">
                    {asset.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {asset.status} · {asset.related_type}
                  </p>
                </div>
              </Link>
            )
          })}
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
