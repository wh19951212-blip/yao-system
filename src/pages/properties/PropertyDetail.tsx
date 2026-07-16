import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import PropertyStatusBadge from '@/components/ui/PropertyStatusBadge'
import PropertyInvestorMatches from '@/components/properties/PropertyInvestorMatches'
import { useAuth } from '@/contexts/AuthContext'
import AiAnalysisPanel from '@/components/ai/AiAnalysisPanel'
import { analyzeProperty } from '@/services/aiAnalysis'
import { fetchPropertyInvestorMatches } from '@/services/propertyMatches'
import { useDataScope } from '@/hooks/useDataScope'
import RelatedLinksPanel from '@/components/ui/RelatedLinksPanel'
import AccessDenied from '@/components/ui/AccessDenied'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useOwnerAccess } from '@/hooks/useOwnerAccess'
import { fetchChannelById } from '@/services/channels'
import { fetchLandById } from '@/services/lands'
import { fetchMediaByRelated } from '@/services/media'
import {
  contractToLinkItem,
  fetchContractsByProperty,
} from '@/services/relations'
import {
  fetchPropertyById,
  formatCommission,
  formatPriceWan,
} from '@/services/properties'
import type { Channel, Contract, Land, MediaAsset, Property } from '@/types/database'

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { ownerEmail } = useDataScope()
  const [property, setProperty] = useState<Property | null>(null)
  const [land, setLand] = useState<Land | null>(null)
  const [channel, setChannel] = useState<Channel | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [media, setMedia] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { denied } = useOwnerAccess(property?.owner)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchPropertyById(id)
      .then(async (prop) => {
        setProperty(prop)
        const [contractRows, mediaRows] = await Promise.all([
          fetchContractsByProperty(prop.id),
          fetchMediaByRelated('项目', prop.id),
        ])
        setContracts(contractRows)
        setMedia(mediaRows)
        if (prop.land_id) {
          fetchLandById(prop.land_id)
            .then(setLand)
            .catch(() => setLand(null))
        }
        if (prop.channel_id) {
          fetchChannelById(prop.channel_id)
            .then(setChannel)
            .catch(() => setChannel(null))
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="page-shell">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="page-shell">
        <div className="alert-error">{error || '物件不存在'}</div>
        <Link to="/properties" className="link-back mt-4">
          ← 返回列表
        </Link>
      </div>
    )
  }

  if (denied) return <AccessDenied />

  const infoRows = [
    { label: '位置', value: property.location },
    { label: '类型', value: property.type },
    { label: '来源', value: property.source_type },
    {
      label: '来源土地',
      value: land ? (
        <Link
          to={`/lands/${land.id}`}
          className="text-[#C9A84C] hover:underline"
        >
          {land.name}
        </Link>
      ) : (
        '—'
      ),
    },
    {
      label: '代理渠道',
      value: channel ? (
        <Link
          to={`/channels/${channel.id}`}
          className="text-[#C9A84C] hover:underline"
        >
          {channel.name}
        </Link>
      ) : (
        '—'
      ),
    },
    { label: '价格', value: formatPriceWan(property.price_wan) },
    { label: '佣金率', value: formatCommission(property.commission_rate) },
    { label: '描述', value: property.description },
  ]

  return (
    <div className="page-shell">
      <Link to="/properties" className="link-back">
        <ArrowLeft size={16} />
        返回列表
      </Link>

      <PageHeader
        title={property.name}
        description={[property.type, property.location].filter(Boolean).join(' · ')}
        actions={
          <div className="flex items-center gap-3">
            <PropertyStatusBadge status={property.status} />
            <Link to={`/properties/${property.id}/edit`}>
              <Button variant="secondary">
                <Pencil size={16} />
                编辑
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <section className="card overflow-hidden">
          {property.image_url ? (
            <img
              src={property.image_url}
              alt={property.name}
              className="w-full aspect-[16/10] object-cover"
            />
          ) : (
            <div className="aspect-[16/10] bg-gray-100 flex items-center justify-center text-gray-300">
              暂无图片
            </div>
          )}
        </section>

        <section className="card p-6">
          <h2 className="section-label mb-4">基本信息</h2>
          <dl className="space-y-4">
            {infoRows.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-gray-500 mb-0.5">{label}</dt>
                <dd className="text-sm text-[#1A1A2A]">{value || '—'}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {contracts.length > 0 && (
        <RelatedLinksPanel
          title="关联合同"
          items={contracts.map(contractToLinkItem)}
          className="mb-6"
        />
      )}

      {media.length > 0 && (
        <RelatedLinksPanel
          title="营销素材"
          items={media.map((m) => ({
            id: m.id,
            label: m.title,
            path: `/media/${m.id}/edit`,
            subtitle: `${m.platform} · ${m.type}`,
          }))}
          className="mb-6"
        />
      )}

      <AiAnalysisPanel
        title="AI 物件分析"
        description="分析物件价值定位、目标客群及投资人/买家匹配策略"
        onAnalyze={async () => {
          if (!property) throw new Error('物件不存在')
          const investorMatches = await fetchPropertyInvestorMatches(
            property,
            ownerEmail,
          )
          return analyzeProperty(property, {
            investorMatches,
            landName: land?.name ?? null,
            channelName: channel?.name ?? null,
          })
        }}
        feedbackContext={{
          contextType: 'property_analysis',
          entityType: 'property',
          entityId: property.id,
          createdBy: user?.email ?? null,
        }}
        taskContext={{ relatedType: 'land', relatedId: property.land_id ?? property.id }}
        className="mb-6"
      />

      <PropertyInvestorMatches property={property} />
    </div>
  )
}
