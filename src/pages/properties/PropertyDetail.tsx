import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import PropertyStatusBadge from '@/components/ui/PropertyStatusBadge'
import PropertyInvestorMatches from '@/components/properties/PropertyInvestorMatches'
import AccessDenied from '@/components/ui/AccessDenied'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useOwnerAccess } from '@/hooks/useOwnerAccess'
import {
  fetchPropertyById,
  formatCommission,
  formatPriceWan,
} from '@/services/properties'
import type { Property } from '@/types/database'

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { denied } = useOwnerAccess(property?.owner)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchPropertyById(id)
      .then(setProperty)
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

      <PropertyInvestorMatches property={property} />
    </div>
  )
}
