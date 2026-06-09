import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DateInput from '@/components/ui/DateInput'
import ListBackLink from '@/components/ui/ListBackLink'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import ImageRecognitionUpload from '@/components/forms/ImageRecognitionUpload'
import { fetchInvestors } from '@/services/investors'
import { createHotel, fetchHotelById, updateHotel } from '@/services/hotels'
import { HOTEL_STATUSES, type HotelStatus } from '@/config/app'
import type { Investor } from '@/types/database'
import { mergeRecognizedFields } from '@/utils/formRecognition'
import { useDataScope } from '@/hooks/useDataScope'
import { useToast } from '@/contexts/ToastContext'

const emptyForm = {
  name: '',
  location: '',
  room_count: '',
  owner_investor_id: '',
  management_fee_rate: '',
  contract_start: '',
  contract_end: '',
  status: '筹备中' as HotelStatus,
  notes: '',
}

export default function HotelForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { ownerEmail } = useDataScope()
  const toast = useToast()

  const [form, setForm] = useState(emptyForm)
  const [investors, setInvestors] = useState<Investor[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchInvestors('all', ownerEmail)
      .then(setInvestors)
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : '加载投资人失败'),
      )
  }, [ownerEmail, toast])

  useEffect(() => {
    if (!id) return
    fetchHotelById(id)
      .then((h) => {
        setForm({
          name: h.name,
          location: h.location ?? '',
          room_count: h.room_count != null ? String(h.room_count) : '',
          owner_investor_id: h.owner_investor_id ?? '',
          management_fee_rate:
            h.management_fee_rate != null
              ? String(h.management_fee_rate)
              : '',
          contract_start: h.contract_start ?? '',
          contract_end: h.contract_end ?? '',
          status: h.status as HotelStatus,
          notes: h.notes ?? '',
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
      name: form.name.trim(),
      location: form.location.trim() || null,
      room_count: form.room_count ? Number(form.room_count) : null,
      owner_investor_id: form.owner_investor_id || null,
      management_fee_rate: form.management_fee_rate
        ? Number(form.management_fee_rate)
        : null,
      contract_start: form.contract_start || null,
      contract_end: form.contract_end || null,
      status: form.status,
      notes: form.notes.trim() || null,
    }

    try {
      if (isEdit && id) {
        await updateHotel(id, payload)
        toast.success('酒店信息已保存')
        navigate('/hotels')
      } else {
        await createHotel(payload)
        toast.success('酒店已创建')
        navigate('/hotels')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '保存失败'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="page-shell text-gray-500 text-sm">加载中...</div>
  }

  return (
    <div className="page-shell max-w-2xl">
      <ListBackLink listKey="hotels" basePath="/hotels" />

      <PageHeader
        title={isEdit ? '编辑酒店' : '新增酒店'}
        description="录入酒店基本信息与运营合同"
      />

      {error && <div className="alert-error mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <ImageRecognitionUpload
          formType="hotel"
          onRecognized={(data) =>
            setForm((prev) => mergeRecognizedFields(prev, data))
          }
        />
        <Input
          id="name"
          label="名称"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          required
        />

        <Input
          id="location"
          label="位置"
          value={form.location}
          onChange={(e) => set('location', e.target.value)}
          placeholder="如：东京都新宿区"
        />

        <Input
          id="room_count"
          label="房间数"
          type="number"
          min="0"
          value={form.room_count}
          onChange={(e) => set('room_count', e.target.value)}
        />

        <Select
          id="owner_investor_id"
          label="关联业主投资人"
          value={form.owner_investor_id}
          onChange={(e) => set('owner_investor_id', e.target.value)}
          options={[
            { value: '', label: '未关联' },
            ...investors.map((inv) => ({
              value: inv.id,
              label: `${inv.name}（${inv.grade}级）`,
            })),
          ]}
        />

        <Input
          id="management_fee_rate"
          label="管理费率（%）"
          type="number"
          min="0"
          step="0.01"
          value={form.management_fee_rate}
          onChange={(e) => set('management_fee_rate', e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <DateInput
            id="contract_start"
            label="合同开始日期"
            value={form.contract_start}
            onChange={(v) => set('contract_start', v)}
          />
          <DateInput
            id="contract_end"
            label="合同结束日期"
            value={form.contract_end}
            onChange={(v) => set('contract_end', v)}
          />
        </div>

        <Select
          id="status"
          label="状态"
          value={form.status}
          onChange={(e) => set('status', e.target.value)}
          options={HOTEL_STATUSES.map((s) => ({ value: s, label: s }))}
        />

        <Textarea
          id="notes"
          label="备注"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? '保存中...' : isEdit ? '保存修改' : '创建酒店'}
          </Button>
          <Link to="/hotels">
            <Button variant="secondary">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
