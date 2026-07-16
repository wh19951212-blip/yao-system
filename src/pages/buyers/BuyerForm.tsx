import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import ImageRecognitionUpload from '@/components/forms/ImageRecognitionUpload'
import { useAuth } from '@/contexts/AuthContext'
import { BUYER_PREFERRED_TYPES, type BuyerPreferredType } from '@/config/app'
import {
  createBuyer,
  fetchBuyerById,
  updateBuyer,
} from '@/services/buyers'
import AmountInput from '@/components/ui/AmountInput'
import ListBackLink from '@/components/ui/ListBackLink'
import { useToast } from '@/contexts/ToastContext'
import ChannelPicker from '@/components/channels/ChannelPicker'
import {
  fetchChannelById,
  resolveSourceWithChannel,
} from '@/services/channels'
import { mergeRecognizedFields } from '@/utils/formRecognition'

const emptyForm = {
  name: '',
  budget_wan: '',
  preferred_type: '酒店' as BuyerPreferredType,
  motivation: '',
  contact_wechat: '',
  contact_phone: '',
  source: '',
  channel_id: '',
  notes: '',
}

export default function BuyerForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    fetchBuyerById(id)
      .then((buyer) => {
        setForm({
          name: buyer.name,
          budget_wan: buyer.budget_wan != null ? String(buyer.budget_wan) : '',
          preferred_type: (buyer.preferred_type as BuyerPreferredType) ?? '酒店',
          motivation: buyer.motivation ?? '',
          contact_wechat: buyer.contact_wechat ?? '',
          contact_phone: buyer.contact_phone ?? '',
          source: buyer.source ?? '',
          channel_id: buyer.channel_id ?? '',
          notes: buyer.notes ?? '',
        })
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    let source = form.source.trim() || null
    if (form.channel_id) {
      try {
        const channel = await fetchChannelById(form.channel_id)
        source = resolveSourceWithChannel(channel, source)
      } catch {
        /* keep manual source */
      }
    }

    const payload = {
      name: form.name.trim(),
      budget_wan: form.budget_wan ? Number(form.budget_wan) : null,
      preferred_type: form.preferred_type,
      motivation: form.motivation.trim() || null,
      contact_wechat: form.contact_wechat.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      channel_id: form.channel_id || null,
      source,
      owner: user?.email ?? null,
      notes: form.notes.trim() || null,
    }

    try {
      if (isEdit && id) {
        await updateBuyer(id, payload)
        toast.success('买家信息已保存')
        navigate('/investors?tab=buyers')
      } else {
        await createBuyer(payload)
        toast.success('买家已创建')
        navigate('/investors?tab=buyers')
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
      <ListBackLink listKey="investors" basePath="/investors?tab=buyers" />

      <PageHeader
        title={isEdit ? '编辑买家' : '新增买家'}
        description="录入买家基本信息与购房偏好"
      />

      {error && <div className="alert-error mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {!isEdit && (
          <ImageRecognitionUpload
            formType="investor"
            onRecognized={(data) => {
              setForm((prev) =>
                mergeRecognizedFields(prev, {
                  name: data.name,
                  budget_wan: data.budget,
                  motivation: data.motivation,
                  source: data.source,
                  notes: data.notes,
                }),
              )
            }}
          />
        )}

        <Input
          id="name"
          label="姓名"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <AmountInput
            id="budget_wan"
            label="预算"
            value={form.budget_wan}
            onChange={(v) => set('budget_wan', v)}
          />
          <Select
            id="preferred_type"
            label="偏好类型"
            value={form.preferred_type}
            onChange={(e) => set('preferred_type', e.target.value)}
            options={BUYER_PREFERRED_TYPES.map((t) => ({ value: t, label: t }))}
          />
        </div>

        <Input
          id="motivation"
          label="投资动机"
          value={form.motivation}
          onChange={(e) => set('motivation', e.target.value)}
        />

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

        <ChannelPicker
          channelId={form.channel_id}
          source={form.source}
          onChannelChange={(channelId) => set('channel_id', channelId)}
          onSourceChange={(source) => set('source', source)}
        />

        <Textarea
          id="notes"
          label="备注"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? '保存中...' : isEdit ? '保存修改' : '创建买家'}
          </Button>
          <Link to={isEdit ? `/buyers/${id}` : '/investors?tab=buyers'}>
            <Button variant="secondary">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
