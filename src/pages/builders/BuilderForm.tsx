import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import ListBackLink from '@/components/ui/ListBackLink'
import ImageRecognitionUpload from '@/components/forms/ImageRecognitionUpload'
import { useToast } from '@/contexts/ToastContext'
import {
  createBuilder,
  fetchBuilderById,
  updateBuilder,
} from '@/services/builders'
import {
  BUILDER_TIERS,
  CAPACITY_STATUSES,
  type BuilderTier,
  type CapacityStatus,
} from '@/config/app'
import { mergeRecognizedFields } from '@/utils/formRecognition'

const emptyForm = {
  company_name: '',
  contact_name: '',
  contact_wechat: '',
  contact_phone: '',
  specialty: '',
  region: '',
  tier: 'B' as BuilderTier,
  price_per_sqm_min: '',
  price_per_sqm_max: '',
  typical_timeline_months: '',
  capacity_status: '空闲' as CapacityStatus,
  notes: '',
}

export default function BuilderForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    fetchBuilderById(id)
      .then((b) => {
        setForm({
          company_name: b.company_name,
          contact_name: b.contact_name ?? '',
          contact_wechat: b.contact_wechat ?? '',
          contact_phone: b.contact_phone ?? '',
          specialty: b.specialty ?? '',
          region: b.region ?? '',
          tier: b.tier as BuilderTier,
          price_per_sqm_min:
            b.price_per_sqm_min != null ? String(b.price_per_sqm_min) : '',
          price_per_sqm_max:
            b.price_per_sqm_max != null ? String(b.price_per_sqm_max) : '',
          typical_timeline_months:
            b.typical_timeline_months != null
              ? String(b.typical_timeline_months)
              : '',
          capacity_status: b.capacity_status as CapacityStatus,
          notes: b.notes ?? '',
        })
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : '加载失败'),
      )
      .finally(() => setLoading(false))
  }, [id])

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const payload = {
      company_name: form.company_name.trim(),
      contact_name: form.contact_name.trim() || null,
      contact_wechat: form.contact_wechat.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      specialty: form.specialty.trim() || null,
      region: form.region.trim() || null,
      tier: form.tier,
      price_per_sqm_min: form.price_per_sqm_min
        ? Number(form.price_per_sqm_min)
        : null,
      price_per_sqm_max: form.price_per_sqm_max
        ? Number(form.price_per_sqm_max)
        : null,
      typical_timeline_months: form.typical_timeline_months
        ? Number(form.typical_timeline_months)
        : null,
      capacity_status: form.capacity_status,
      notes: form.notes.trim() || null,
    }

    try {
      if (isEdit && id) {
        await updateBuilder(id, payload)
        toast.success('建筑商信息已保存')
        navigate('/builders')
      } else {
        await createBuilder(payload)
        toast.success('建筑商已创建')
        navigate('/builders')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="page-shell text-gray-500 text-sm">加载中...</div>
  }

  return (
    <div className="page-shell max-w-2xl">
      <ListBackLink listKey="builders" basePath="/builders" />

      <PageHeader
        title={isEdit ? '编辑建筑商' : '新增建筑商'}
        description="录入建筑商基本信息与合作条件"
      />

      {error && <div className="alert-error mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <ImageRecognitionUpload
          formType="builder"
          onRecognized={(data) =>
            setForm((prev) => mergeRecognizedFields(prev, data))
          }
        />
        <Input
          id="company_name"
          label="公司名 *"
          value={form.company_name}
          onChange={(e) => set('company_name', e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            id="contact_name"
            label="联系人"
            value={form.contact_name}
            onChange={(e) => set('contact_name', e.target.value)}
          />
          <Input
            id="contact_phone"
            label="电话"
            value={form.contact_phone}
            onChange={(e) => set('contact_phone', e.target.value)}
          />
        </div>

        <Input
          id="contact_wechat"
          label="微信"
          value={form.contact_wechat}
          onChange={(e) => set('contact_wechat', e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            id="specialty"
            label="专长"
            value={form.specialty}
            onChange={(e) => set('specialty', e.target.value)}
            placeholder="如：酒店/商业"
          />
          <Input
            id="region"
            label="作业区域"
            value={form.region}
            onChange={(e) => set('region', e.target.value)}
            placeholder="如：东京"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Select
            id="tier"
            label="评级 *"
            value={form.tier}
            onChange={(e) => set('tier', e.target.value)}
            options={BUILDER_TIERS.map((t) => ({ value: t, label: `${t} 级` }))}
          />
          <Select
            id="capacity_status"
            label="当前容量 *"
            value={form.capacity_status}
            onChange={(e) => set('capacity_status', e.target.value)}
            options={CAPACITY_STATUSES.map((c) => ({ value: c, label: c }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            id="price_per_sqm_min"
            label="每平米报价最低（万）"
            type="number"
            min="0"
            value={form.price_per_sqm_min}
            onChange={(e) => set('price_per_sqm_min', e.target.value)}
          />
          <Input
            id="price_per_sqm_max"
            label="每平米报价最高（万）"
            type="number"
            min="0"
            value={form.price_per_sqm_max}
            onChange={(e) => set('price_per_sqm_max', e.target.value)}
          />
        </div>

        <Input
          id="typical_timeline_months"
          label="典型工期（月）"
          type="number"
          min="0"
          value={form.typical_timeline_months}
          onChange={(e) => set('typical_timeline_months', e.target.value)}
        />

        <Textarea
          id="notes"
          label="备注"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? '保存中...' : isEdit ? '保存修改' : '创建建筑商'}
          </Button>
          <Link to={isEdit ? `/builders/${id}` : '/builders'}>
            <Button variant="secondary">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
