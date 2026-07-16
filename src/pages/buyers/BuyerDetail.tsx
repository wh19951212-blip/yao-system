import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, FileText, Pencil, Sparkles } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import PropertyStatusBadge from '@/components/ui/PropertyStatusBadge'
import RelatedLinksPanel from '@/components/ui/RelatedLinksPanel'
import {
  fetchBuyerById,
  fetchRecommendedPropertiesForBuyer,
  formatBuyerBudget,
} from '@/services/buyers'
import { fetchChannelById } from '@/services/channels'
import { fetchDemandsByBuyer, formatDemandTitle } from '@/services/demands'
import {
  contractToLinkItem,
  fetchContractsByBuyer,
} from '@/services/relations'
import { formatPriceWan } from '@/services/properties'
import { DEMAND_STATUS_LABELS } from '@/config/matching'
import type { Buyer, Channel, Contract, InvestorDemand, Property } from '@/types/database'
import AccessDenied from '@/components/ui/AccessDenied'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useOwnerAccess } from '@/hooks/useOwnerAccess'

export default function BuyerDetail() {
  const { id } = useParams<{ id: string }>()
  const [buyer, setBuyer] = useState<Buyer | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [channel, setChannel] = useState<Channel | null>(null)
  const [demands, setDemands] = useState<InvestorDemand[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { denied } = useOwnerAccess(buyer?.owner)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchBuyerById(id)
      .then(async (buyerData) => {
        setBuyer(buyerData)
        const [props, demandRows, contractRows] = await Promise.all([
          fetchRecommendedPropertiesForBuyer(buyerData),
          fetchDemandsByBuyer(buyerData.id),
          fetchContractsByBuyer(buyerData.id),
        ])
        setProperties(props)
        setDemands(demandRows)
        setContracts(contractRows)
        if (buyerData.channel_id) {
          fetchChannelById(buyerData.channel_id)
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

  if (error || !buyer) {
    return (
      <div className="page-shell">
        <div className="alert-error">{error || '买家不存在'}</div>
        <Link to="/investors?tab=buyers" className="link-back mt-4">
          ← 返回列表
        </Link>
      </div>
    )
  }

  if (denied) return <AccessDenied />

  const infoRows = [
    { label: '预算', value: formatBuyerBudget(buyer.budget_wan) },
    { label: '偏好类型', value: buyer.preferred_type },
    { label: '投资动机', value: buyer.motivation },
    { label: '微信', value: buyer.contact_wechat },
    { label: '电话', value: buyer.contact_phone },
    { label: '来源', value: buyer.source },
    {
      label: '引荐渠道',
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
    { label: '负责人', value: buyer.owner },
    { label: '备注', value: buyer.notes },
  ]

  return (
    <div className="page-shell">
      <Link to="/investors?tab=buyers" className="link-back">
        <ArrowLeft size={16} />
        返回列表
      </Link>

      <PageHeader
        title={buyer.name}
        description={[buyer.preferred_type, formatBuyerBudget(buyer.budget_wan)]
          .filter(Boolean)
          .join(' · ')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={`/matching/demands/new?buyerId=${buyer.id}`}>
              <Button variant="accent">
                <Sparkles size={16} />
                创建需求单
              </Button>
            </Link>
            <Link to={`/contracts/new?type=中介&buyerId=${buyer.id}${buyer.channel_id ? `&channelId=${buyer.channel_id}` : ''}`}>
              <Button variant="secondary">
                <FileText size={16} />
                新建合同
              </Button>
            </Link>
            <Link to={`/buyers/${buyer.id}/edit`}>
              <Button variant="secondary">
                <Pencil size={16} />
                编辑
              </Button>
            </Link>
          </div>
        }
      />

      <section className="card p-6 mb-6">
        <h2 className="section-label mb-4">买家信息</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {infoRows.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-gray-500 mb-0.5">{label}</dt>
              <dd className="text-sm text-[#1A1A2A]">{value || '—'}</dd>
            </div>
          ))}
        </dl>
      </section>

      {demands.length > 0 && (
        <RelatedLinksPanel
          title="购房需求与匹配"
          description="智能匹配中心的需求单"
          items={demands.map((d) => ({
            id: d.id,
            label: formatDemandTitle(d),
            path: `/matching/demands/${d.id}`,
            subtitle: DEMAND_STATUS_LABELS[d.status],
          }))}
          className="mb-6"
        />
      )}

      {contracts.length > 0 && (
        <RelatedLinksPanel
          title="关联合同"
          items={contracts.map(contractToLinkItem)}
          className="mb-6"
        />
      )}

      <section className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="section-label">推荐物件</h2>
          <p className="text-xs text-gray-500 mt-1">
            根据预算与偏好类型自动匹配（结果已持久化）
          </p>
        </div>

        {properties.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            暂无匹配物件
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {properties.map((property) => (
              <Link
                key={property.id}
                to={`/properties/${property.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-16 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {property.image_url ? (
                    <img
                      src={property.image_url}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Building2 size={20} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1A1A2A] truncate">
                    {property.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {property.location} · {property.type}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-[#1B2B4B]">
                    {formatPriceWan(property.price_wan)}
                  </p>
                  <PropertyStatusBadge status={property.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
