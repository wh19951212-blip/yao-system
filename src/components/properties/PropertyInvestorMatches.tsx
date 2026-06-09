import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import GradeBadge from '@/components/ui/GradeBadge'
import { useDataScope } from '@/hooks/useDataScope'
import { formatCurrency } from '@/services/investors'
import {
  fetchPropertyInvestorMatches,
  setInvestorRecommended,
} from '@/services/propertyMatches'
import { formatPriceWan } from '@/services/properties'
import type { Property, PropertyInvestorMatch } from '@/types/database'

interface PropertyInvestorMatchesProps {
  property: Property
}

export default function PropertyInvestorMatches({
  property,
}: PropertyInvestorMatchesProps) {
  const { ownerEmail } = useDataScope()
  const [matches, setMatches] = useState<PropertyInvestorMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetchPropertyInvestorMatches(property, ownerEmail)
      .then(setMatches)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [property.id, ownerEmail])

  const handleToggleRecommended = async (
    investorId: string,
    current: boolean,
  ) => {
    setSavingId(investorId)
    setError('')
    try {
      await setInvestorRecommended(property.id, investorId, !current)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="section-label">匹配投资人</h2>
        <p className="text-xs text-gray-500 mt-1">
          根据物件价格 {formatPriceWan(property.price_wan)} 自动筛选预算匹配的投资人
        </p>
      </div>

      <div className="p-6">
        {error && <div className="alert-error mb-4">{error}</div>}

        {loading ? (
          <p className="text-sm text-gray-500">加载匹配结果...</p>
        ) : matches.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            暂无预算匹配的投资人
          </p>
        ) : (
          <div className="divide-y divide-gray-200">
            {matches.map(({ investor, isRecommended, budgetMatch }) => (
              <div
                key={investor.id}
                className={`py-4 flex flex-wrap items-center justify-between gap-3 ${
                  isRecommended ? 'bg-emerald-50/50 -mx-6 px-6' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Link
                      to={`/investors/${investor.id}`}
                      className="font-medium text-[#1A1A2A] hover:text-[#C9A84C]"
                    >
                      {investor.name}
                    </Link>
                    <GradeBadge grade={investor.grade} />
                    {isRecommended && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={12} />
                        已推荐
                      </span>
                    )}
                    {budgetMatch && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                        预算匹配
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span>阶段：{investor.stage}</span>
                    <span>预算：{formatCurrency(investor.budget)}</span>
                    {investor.motivation && (
                      <span>动机：{investor.motivation}</span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant={isRecommended ? 'secondary' : 'accent'}
                  disabled={savingId === investor.id}
                  onClick={() =>
                    handleToggleRecommended(investor.id, isRecommended)
                  }
                  className="text-xs shrink-0"
                >
                  {savingId === investor.id
                    ? '保存中...'
                    : isRecommended
                      ? '取消推荐'
                      : '标记已推荐'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
