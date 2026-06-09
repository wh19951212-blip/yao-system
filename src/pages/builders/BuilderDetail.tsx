import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import BuilderTierBadge from '@/components/ui/BuilderTierBadge'
import CapacityBadge from '@/components/ui/CapacityBadge'
import {
  fetchBuilderById,
  fetchBuilderQuotes,
  formatDate,
  formatPriceRange,
  formatQuoteAmount,
} from '@/services/builders'
import type { Builder, BuilderQuote } from '@/types/database'

export default function BuilderDetail() {
  const { id } = useParams<{ id: string }>()
  const [builder, setBuilder] = useState<Builder | null>(null)
  const [quotes, setQuotes] = useState<BuilderQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([fetchBuilderById(id), fetchBuilderQuotes(id)])
      .then(([b, q]) => {
        setBuilder(b)
        setQuotes(q)
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="page-shell text-gray-500 text-sm">加载中...</div>
  }

  if (error || !builder) {
    return (
      <div className="page-shell">
        <div className="alert-error">{error || '建筑商不存在'}</div>
        <Link to="/builders" className="link-back mt-4">
          ← 返回列表
        </Link>
      </div>
    )
  }

  const infoRows = [
    { label: '联系人', value: builder.contact_name },
    { label: '微信', value: builder.contact_wechat },
    { label: '电话', value: builder.contact_phone },
    { label: '专长', value: builder.specialty },
    { label: '作业区域', value: builder.region },
    {
      label: '报价区间',
      value: formatPriceRange(
        builder.price_per_sqm_min,
        builder.price_per_sqm_max,
      ),
    },
    {
      label: '典型工期',
      value: builder.typical_timeline_months
        ? `${builder.typical_timeline_months} 个月`
        : null,
    },
    { label: '备注', value: builder.notes },
  ]

  return (
    <div className="page-shell">
      <Link to="/builders" className="link-back">
        <ArrowLeft size={16} />
        返回列表
      </Link>

      <PageHeader
        title={builder.company_name}
        description={[builder.specialty, builder.region].filter(Boolean).join(' · ')}
        actions={
          <Link to={`/builders/${builder.id}/edit`}>
            <Button variant="secondary">
              <Pencil size={16} />
              编辑
            </Button>
          </Link>
        }
      />

      <div className="flex items-center gap-3 mb-8">
        <BuilderTierBadge tier={builder.tier} />
        <CapacityBadge status={builder.capacity_status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

        <section className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="section-label">历史报价记录</h2>
            <p className="text-xs text-gray-500 mt-1">关联地块的报价历史</p>
          </div>

          {quotes.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              暂无报价记录
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {quotes.map((quote) => (
                <div key={quote.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <p className="font-medium text-[#1A1A2A]">
                        {quote.land?.name ?? '未关联地块'}
                      </p>
                      {quote.land?.location && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {quote.land.location}
                        </p>
                      )}
                    </div>
                    <p className="text-lg font-bold text-[#1B2B4B] shrink-0">
                      {formatQuoteAmount(quote.quote_amount_wan)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span>{formatDate(quote.quote_date)}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full border ${
                        quote.status === '已接受'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : quote.status === '已拒绝'
                            ? 'bg-red-50 text-red-500 border-red-200'
                            : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}
                    >
                      {quote.status}
                    </span>
                    {quote.notes && <span>{quote.notes}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
