import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import ListBackLink from '@/components/ui/ListBackLink'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useDemoReadOnly } from '@/hooks/useDemoReadOnly'
import {
  createChannel,
  fetchChannelById,
  updateChannel,
} from '@/services/channels'
import {
  CHANNEL_COOPERATION_TYPES,
  CHANNEL_ENTITY_TYPES,
  CHANNEL_STATUSES,
  CHANNEL_TIERS,
  type ChannelCooperationType,
  type ChannelEntityType,
  type ChannelStatus,
  type ChannelTier,
} from '@/config/app'

const emptyForm = {
  name: '',
  entity_type: '公司' as ChannelEntityType,
  contact_name: '',
  contact_wechat: '',
  contact_phone: '',
  region: '',
  tier: 'B' as ChannelTier,
  cooperation_types: ['全渠道'] as ChannelCooperationType[],
  default_commission_rate: '',
  status: '合作中' as ChannelStatus,
  notes: '',
}

export default function ChannelForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const { readOnly: demoReadOnly } = useDemoReadOnly(id)

  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    fetchChannelById(id)
      .then((ch) => {
        setForm({
          name: ch.name,
          entity_type: ch.entity_type as ChannelEntityType,
          contact_name: ch.contact_name ?? '',
          contact_wechat: ch.contact_wechat ?? '',
          contact_phone: ch.contact_phone ?? '',
          region: ch.region ?? '',
          tier: ch.tier as ChannelTier,
          cooperation_types: ch.cooperation_types as ChannelCooperationType[],
          default_commission_rate:
            ch.default_commission_rate != null
              ? String(ch.default_commission_rate)
              : '',
          status: ch.status as ChannelStatus,
          notes: ch.notes ?? '',
        })
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : '加载失败'),
      )
      .finally(() => setLoading(false))
  }, [id])

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const toggleCooperation = (type: ChannelCooperationType) => {
    setForm((prev) => {
      const has = prev.cooperation_types.includes(type)
      let next = has
        ? prev.cooperation_types.filter((item) => item !== type)
        : [...prev.cooperation_types, type]
      if (type === '全渠道' && !has) next = ['全渠道']
      if (type !== '全渠道' && !has) {
        next = next.filter((item) => item !== '全渠道')
      }
      if (next.length === 0) next = ['全渠道']
      return { ...prev, cooperation_types: next }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('请填写渠道名称')
      return
    }
    setError('')
    setSubmitting(true)

    const payload = {
      name: form.name.trim(),
      entity_type: form.entity_type,
      contact_name: form.contact_name.trim() || null,
      contact_wechat: form.contact_wechat.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      region: form.region.trim() || null,
      tier: form.tier,
      cooperation_types: form.cooperation_types,
      default_commission_rate: form.default_commission_rate
        ? Number(form.default_commission_rate)
        : null,
      status: form.status,
      owner: user?.email ?? null,
      notes: form.notes.trim() || null,
    }

    try {
      if (isEdit && id) {
        await updateChannel(id, payload)
        toast.success('渠道已更新')
        navigate(`/channels/${id}`)
      } else {
        const created = await createChannel(payload)
        toast.success('渠道已创建')
        navigate(`/channels/${created.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
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
      <ListBackLink listKey="channels" basePath="/channels" />

      <PageHeader
        title={isEdit ? '编辑渠道' : '新增渠道'}
        description="公司或个人渠道中介档案"
      />

      {error && <div className="alert-error mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            id="name"
            label="渠道名称"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
          <Select
            id="entity_type"
            label="主体类型"
            value={form.entity_type}
            onChange={(e) => set('entity_type', e.target.value)}
            options={CHANNEL_ENTITY_TYPES.map((t) => ({ value: t, label: t }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            id="contact_name"
            label="联系人"
            value={form.contact_name}
            onChange={(e) => set('contact_name', e.target.value)}
          />
          <Input
            id="region"
            label="区域"
            value={form.region}
            onChange={(e) => set('region', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            id="contact_wechat"
            label="微信"
            value={form.contact_wechat}
            onChange={(e) => set('contact_wechat', e.target.value)}
          />
          <Input
            id="contact_phone"
            label="电话"
            value={form.contact_phone}
            onChange={(e) => set('contact_phone', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Select
            id="tier"
            label="渠道等级"
            value={form.tier}
            onChange={(e) => set('tier', e.target.value)}
            options={CHANNEL_TIERS.map((t) => ({ value: t, label: `${t} 级` }))}
          />
          <Input
            id="default_commission_rate"
            label="默认佣金（%）"
            type="number"
            step="0.1"
            value={form.default_commission_rate}
            onChange={(e) => set('default_commission_rate', e.target.value)}
          />
          <Select
            id="status"
            label="合作状态"
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            options={CHANNEL_STATUSES.map((s) => ({ value: s, label: s }))}
          />
        </div>

        <div>
          <p className="text-sm font-medium text-[#1A1A2A] mb-2">合作范围</p>
          <div className="flex flex-wrap gap-2">
            {CHANNEL_COOPERATION_TYPES.map((type) => {
              const active = form.cooperation_types.includes(type)
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleCooperation(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    active
                      ? 'bg-[#1B2B4B] text-white border-[#1B2B4B]'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-[#1B2B4B]/30'
                  }`}
                >
                  {type}
                </button>
              )
            })}
          </div>
        </div>

        <Textarea
          id="notes"
          label="备注"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting || demoReadOnly}>
            {submitting ? '保存中...' : isEdit ? '保存修改' : '创建渠道'}
          </Button>
          <Link to={isEdit && id ? `/channels/${id}` : '/channels'}>
            <Button variant="secondary">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
