import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import AmountInput from '@/components/ui/AmountInput'
import ListBackLink from '@/components/ui/ListBackLink'
import ImageRecognitionUpload from '@/components/forms/ImageRecognitionUpload'
import { useAuth } from '@/contexts/AuthContext'
import LandRoiCalculator from '@/components/lands/LandRoiCalculator'
import { calculateRoiPercent, createLand, formatPercent } from '@/services/lands'
import { mergeRecognizedFields } from '@/utils/formRecognition'
import { useToast } from '@/contexts/ToastContext'
import {
  firstError,
  requirePositiveNumber,
  requireTrimmed,
} from '@/utils/validation'

export default function LandForm() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({
    name: '',
    location: '',
    area_sqm: '',
    price_wan: '',
    expected_rent_wan: '',
    legal_status: '',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const roi = useMemo(() => {
    const price = Number(form.price_wan)
    const rent = Number(form.expected_rent_wan)
    if (!price || !rent) return null
    return calculateRoiPercent(price, rent)
  }, [form.price_wan, form.expected_rent_wan])

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const applyNetYield = (_netYieldPercent: number, netIncomeMan: number) => {
    setForm((prev) => ({
      ...prev,
      expected_rent_wan: String(Math.round(netIncomeMan * 100) / 100),
      price_wan: prev.price_wan || '',
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const validationError = firstError(
      requireTrimmed(form.name, '地块名称'),
      requireTrimmed(form.location, '位置'),
      requirePositiveNumber(form.area_sqm, '面积'),
      requirePositiveNumber(form.price_wan, '价格'),
      requirePositiveNumber(form.expected_rent_wan, '预期租金'),
    )
    if (validationError) {
      setError(validationError)
      toast.error(validationError)
      setSubmitting(false)
      return
    }

    const price_wan = Number(form.price_wan)
    const expected_rent_wan = Number(form.expected_rent_wan)
    const area_sqm = Number(form.area_sqm)

    if (price_wan <= 0) {
      setError('价格必须大于 0')
      setSubmitting(false)
      return
    }

    try {
      await createLand(
        {
          name: form.name.trim(),
          location: form.location.trim(),
          area_sqm,
          price_wan,
          expected_rent_wan,
          roi_percent: calculateRoiPercent(price_wan, expected_rent_wan),
          legal_status: form.legal_status.trim() || null,
          description: form.description.trim() || null,
          owner: user?.email ?? null,
        },
        user?.email ?? undefined,
      )
      toast.success('土地已创建')
      navigate('/lands')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '保存失败'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-shell max-w-6xl">
      <ListBackLink listKey="lands" basePath="/lands" />

      <PageHeader
        title="新增土地"
        description="录入土地基本信息，可使用下方计算器测算净回报率"
      />

      {error && <div className="alert-error mb-4">{error}</div>}

      <div className="space-y-8">
        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          <ImageRecognitionUpload
            formType="land"
            onRecognized={(data) =>
              setForm((prev) => mergeRecognizedFields(prev, data))
            }
          />
          <Input
            id="name"
            label="地块名称"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="如：涩谷区道玄坂地块"
            required
          />

          <Input
            id="location"
            label="位置"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="如：东京都涩谷区道玄坂"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              id="area_sqm"
            label="面积（㎡）"
              type="number"
              min="0"
              step="0.01"
              value={form.area_sqm}
              onChange={(e) => set('area_sqm', e.target.value)}
              required
            />
            <AmountInput
              id="price_wan"
              label="价格"
              value={form.price_wan}
              onChange={(v) => set('price_wan', v)}
              required
            />
          </div>

          <AmountInput
            id="expected_rent_wan"
            label="预期租金/净收入"
            suffix="万/年"
            value={form.expected_rent_wan}
            onChange={(v) => set('expected_rent_wan', v)}
            required
          />

          <div className="p-4 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/30">
            <p className="text-sm text-gray-500 mb-1">简单回报率（净收入 ÷ 价格）</p>
            <p className="stat-value text-[#C9A84C]">{formatPercent(roi)}</p>
          </div>

          <Input
            id="legal_status"
            label="法律状态"
            value={form.legal_status}
            onChange={(e) => set('legal_status', e.target.value)}
            placeholder="如：所有权清晰、无抵押"
          />

          <Textarea
            id="description"
            label="备注"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="补充说明、风险点等"
          />

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? '保存中...' : '保存土地'}
            </Button>
            <Link to="/lands">
              <Button variant="secondary">取消</Button>
            </Link>
          </div>
        </form>

        <LandRoiCalculator
          initialValues={{
            landAreaSqm: Number(form.area_sqm) || undefined,
            landPriceMan: Number(form.price_wan) || undefined,
          }}
          onApplyNetYield={applyNetYield}
        />
      </div>
    </div>
  )
}
