import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import AmountInput from '@/components/ui/AmountInput'
import ListBackLink from '@/components/ui/ListBackLink'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { createDemand } from '@/services/demands'
import { fetchInvestorById } from '@/services/investors'
import { fetchBuyerById } from '@/services/buyers'
import {
  DEMAND_INTENT_LABELS,
  DEMAND_INTENT_TYPES,
  PREFERRED_REGIONS,
  RISK_TOLERANCE_OPTIONS,
  type DemandIntentType,
} from '@/config/matching'
import { PROPERTY_TYPES } from '@/config/app'

export default function DemandForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const toast = useToast()

  const investorIdParam = searchParams.get('investorId')
  const buyerIdParam = searchParams.get('buyerId')

  const [clientLabel, setClientLabel] = useState('')
  const [loading, setLoading] = useState(Boolean(investorIdParam || buyerIdParam))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    intent_type: 'general' as DemandIntentType,
    budget_min_wan: '',
    budget_max_wan: '',
    preferred_regions: [] as string[],
    preferred_types: [] as string[],
    min_roi_percent: '',
    risk_tolerance: '',
    timeline: '',
    raw_description: '',
    notes: '',
  })

  useEffect(() => {
    async function loadClient() {
      try {
        if (investorIdParam) {
          const inv = await fetchInvestorById(investorIdParam)
          setClientLabel(`投资人：${inv.name}`)
          setForm((prev) => ({
            ...prev,
            budget_min_wan: inv.budget ? String(Math.round(inv.budget * 0.6)) : '',
            budget_max_wan: inv.budget ? String(inv.budget) : '',
            raw_description: inv.motivation ?? prev.raw_description,
            intent_type: 'invest_dev',
          }))
        } else if (buyerIdParam) {
          const buyer = await fetchBuyerById(buyerIdParam)
          setClientLabel(`买家：${buyer.name}`)
          setForm((prev) => ({
            ...prev,
            budget_max_wan: buyer.budget_wan ? String(buyer.budget_wan) : '',
            preferred_types: buyer.preferred_type ? [buyer.preferred_type] : [],
            raw_description: buyer.motivation ?? prev.raw_description,
            intent_type: 'buy_property',
          }))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载客户信息失败')
      } finally {
        setLoading(false)
      }
    }
    loadClient()
  }, [investorIdParam, buyerIdParam])

  const toggleRegion = (region: string) => {
    setForm((prev) => ({
      ...prev,
      preferred_regions: prev.preferred_regions.includes(region)
        ? prev.preferred_regions.filter((r) => r !== region)
        : [...prev.preferred_regions, region],
    }))
  }

  const toggleType = (type: string) => {
    setForm((prev) => ({
      ...prev,
      preferred_types: prev.preferred_types.includes(type)
        ? prev.preferred_types.filter((t) => t !== type)
        : [...prev.preferred_types, type],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const demand = await createDemand({
        source: 'staff',
        investor_id: investorIdParam,
        buyer_id: buyerIdParam,
        submitted_by: user?.email ?? null,
        owner: user?.email ?? null,
        intent_type: form.intent_type,
        budget_min_wan: form.budget_min_wan ? Number(form.budget_min_wan) : null,
        budget_max_wan: form.budget_max_wan ? Number(form.budget_max_wan) : null,
        preferred_regions: form.preferred_regions,
        preferred_types: form.preferred_types,
        min_roi_percent: form.min_roi_percent
          ? Number(form.min_roi_percent)
          : null,
        risk_tolerance: form.risk_tolerance || null,
        timeline: form.timeline.trim() || null,
        raw_description: form.raw_description.trim() || null,
        notes: form.notes.trim() || null,
        status: 'submitted',
      })
      toast.success('需求单已创建')
      navigate(`/matching/demands/${demand.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="page-shell text-gray-500 text-sm">加载中...</div>
    )
  }

  return (
    <div className="page-shell max-w-2xl">
      <ListBackLink listKey="demands" basePath="/matching/demands" />
      <PageHeader
        title="新建需求单"
        description={
          clientLabel || '录入投资人或买家的投资/购买需求，用于智能匹配'
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="alert-error">{error}</div>}

        <section className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#1B2B4B]">投资意向</h2>
          <Select
            label="需求类型"
            value={form.intent_type}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                intent_type: e.target.value as DemandIntentType,
              }))
            }
            options={DEMAND_INTENT_TYPES.map((type) => ({
              value: type,
              label: DEMAND_INTENT_LABELS[type],
            }))}
          />
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#1B2B4B]">核心条件</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AmountInput
              id="budget_min"
              label="预算下限（万）"
              value={form.budget_min_wan}
              onChange={(v) => setForm((prev) => ({ ...prev, budget_min_wan: v }))}
            />
            <AmountInput
              id="budget_max"
              label="预算上限（万）"
              value={form.budget_max_wan}
              onChange={(v) => setForm((prev) => ({ ...prev, budget_max_wan: v }))}
            />
          </div>
          <Input
            label="最低 ROI（%）"
            type="number"
            step="0.1"
            value={form.min_roi_percent}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, min_roi_percent: e.target.value }))
            }
          />
          <div>
            <p className="text-sm text-gray-600 mb-2">偏好区域</p>
            <div className="flex flex-wrap gap-2">
              {PREFERRED_REGIONS.map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => toggleRegion(region)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    form.preferred_regions.includes(region)
                      ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#1B2B4B]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">偏好类型</p>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    form.preferred_types.includes(type)
                      ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#1B2B4B]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
              <button
                type="button"
                onClick={() => toggleType('土地')}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  form.preferred_types.includes('土地')
                    ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#1B2B4B]'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                土地
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="风险偏好"
              value={form.risk_tolerance}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, risk_tolerance: e.target.value }))
              }
              options={[
                { value: '', label: '不限' },
                ...RISK_TOLERANCE_OPTIONS.map((opt) => ({
                  value: opt,
                  label: opt,
                })),
              ]}
            />
            <Input
              label="时间计划"
              placeholder="如：半年内、3个月内"
              value={form.timeline}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, timeline: e.target.value }))
              }
            />
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#1B2B4B]">需求描述</h2>
          <Textarea
            label="详细描述"
            rows={4}
            placeholder="投资人原话或补充说明，提交后可在匹配中心用 AI 解读"
            value={form.raw_description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, raw_description: e.target.value }))
            }
          />
          <Textarea
            label="内部备注"
            rows={2}
            value={form.notes}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, notes: e.target.value }))
            }
          />
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? '创建中...' : '创建并进入匹配中心'}
          </Button>
          <Link to="/matching/demands" className="text-sm text-gray-500 hover:underline">
            取消
          </Link>
        </div>
      </form>
    </div>
  )
}
