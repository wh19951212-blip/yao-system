import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { FileUp, X } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import AmountInput from '@/components/ui/AmountInput'
import DateInput from '@/components/ui/DateInput'
import ListBackLink from '@/components/ui/ListBackLink'
import ImageRecognitionUpload from '@/components/forms/ImageRecognitionUpload'
import { fetchInvestors } from '@/services/investors'
import { fetchBuyers } from '@/services/buyers'
import { fetchLands } from '@/services/lands'
import { fetchProperties } from '@/services/properties'
import {
  createContract,
  fetchContractById,
  updateContract,
} from '@/services/contracts'
import { uploadContractPdf } from '@/services/storage'
import {
  CONTRACT_KIND_LABELS,
  CONTRACT_KINDS,
  CONTRACT_KIND_TO_TYPE,
  CONTRACT_STATUSES,
  type ContractKind,
  type ContractStatus,
} from '@/config/app'
import type { Buyer, Investor } from '@/types/database'
import { fetchBuilders } from '@/services/builders'
import {
  computeChannelCommission,
  fetchChannels,
} from '@/services/channels'
import type { Channel } from '@/types/database'
import { mergeRecognizedFields } from '@/utils/formRecognition'
import { useAuth } from '@/contexts/AuthContext'
import { useDataScope } from '@/hooks/useDataScope'
import { useToast } from '@/contexts/ToastContext'
import { validateUploadFileSize } from '@/config/upload'

const emptyForm = {
  contract_kind: 'development' as ContractKind,
  type: '开发',
  investor_id: '',
  buyer_id: '',
  builder_id: '',
  related_kind: 'none' as 'none' | 'land' | 'property',
  land_id: '',
  property_id: '',
  amount_wan: '',
  commission_wan: '',
  signed_date: '',
  status: '进行中' as ContractStatus,
  notes: '',
  file_url: '',
  channel_id: '',
}

export default function ContractForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, profile } = useAuth()
  const { ownerEmail, ownerId } = useDataScope()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState(emptyForm)
  const [investors, setInvestors] = useState<Investor[]>([])
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [lands, setLands] = useState<{ id: string; name: string }[]>([])
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [builders, setBuilders] = useState<{ id: string; name: string }[]>([])
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfName, setPdfName] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetchInvestors('all', ownerEmail),
      fetchBuyers(ownerEmail),
      fetchLands(ownerEmail),
      fetchProperties('all', ownerEmail),
      fetchChannels(),
      fetchBuilders(),
    ])
      .then(([inv, buyerList, landList, propList, channelList, builderList]) => {
        setInvestors(inv)
        setBuyers(buyerList)
        setLands(landList.map((l) => ({ id: l.id, name: l.name })))
        setProperties(propList.map((p) => ({ id: p.id, name: p.name })))
        setChannels(channelList)
        setBuilders(builderList.map((b) => ({ id: b.id, name: b.company_name })))
      })
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : '加载选项失败'),
      )
  }, [ownerEmail, toast])

  useEffect(() => {
    if (isEdit) return
    const investorId = searchParams.get('investorId')
    const buyerId = searchParams.get('buyerId')
    const channelId = searchParams.get('channelId')
    const type = searchParams.get('type')
    const contractKind = searchParams.get('contractKind')
    const landId = searchParams.get('landId')
    const propertyId = searchParams.get('propertyId')
    const relatedKind = searchParams.get('relatedKind')
    setForm((prev) => ({
      ...prev,
      ...(investorId ? { investor_id: investorId } : {}),
      ...(buyerId ? { buyer_id: buyerId } : {}),
      ...(channelId ? { channel_id: channelId } : {}),
      ...(type ? { type, contract_kind: type === '中介' ? 'broker' as ContractKind : 'development' as ContractKind } : {}),
      ...(contractKind && CONTRACT_KINDS.includes(contractKind as ContractKind)
        ? {
            contract_kind: contractKind as ContractKind,
            type: CONTRACT_KIND_TO_TYPE[contractKind as ContractKind],
          }
        : {}),
      ...(relatedKind === 'land' && landId
        ? { related_kind: 'land' as const, land_id: landId }
        : {}),
      ...(relatedKind === 'property' && propertyId
        ? { related_kind: 'property' as const, property_id: propertyId }
        : {}),
      ...(propertyId && !relatedKind
        ? { related_kind: 'property' as const, property_id: propertyId }
        : {}),
      ...(landId && !relatedKind
        ? { related_kind: 'land' as const, land_id: landId }
        : {}),
    }))
  }, [searchParams, isEdit])

  useEffect(() => {
    if (!id) return
    fetchContractById(id)
      .then((c) => {
        setForm({
          contract_kind: (c.contract_type ?? 'development') as ContractKind,
          type: c.type,
          investor_id: c.investor_id ?? '',
          buyer_id: c.buyer_id ?? '',
          builder_id: c.builder_id ?? '',
          related_kind: c.land_id ? 'land' : c.property_id ? 'property' : 'none',
          land_id: c.land_id ?? '',
          property_id: c.property_id ?? '',
          amount_wan: c.amount_wan != null ? String(c.amount_wan) : '',
          commission_wan:
            c.commission_wan != null ? String(c.commission_wan) : '',
          signed_date: c.signed_date ?? '',
          status: c.status as ContractStatus,
          notes: c.notes ?? '',
          file_url: c.file_url ?? '',
          channel_id: c.channel_id ?? '',
        })
        if (c.file_url) setPdfName('已上传合同文件')
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : '加载失败'),
      )
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (form.contract_kind !== 'broker' || !form.channel_id || !form.amount_wan) return
    const channel = channels.find((item) => item.id === form.channel_id)
    const computed = computeChannelCommission(
      Number(form.amount_wan),
      channel?.default_commission_rate,
    )
    if (computed != null) {
      setForm((prev) => ({ ...prev, commission_wan: String(computed) }))
    }
  }, [form.contract_kind, form.channel_id, form.amount_wan, channels])

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const sizeError = validateUploadFileSize(file)
    if (sizeError) {
      toast.error(sizeError)
      return
    }
    setPdfFile(file)
    setPdfName(file.name)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      let fileUrl = form.file_url || null
      if (pdfFile) {
        fileUrl = await uploadContractPdf(pdfFile)
      }

      const payload = {
        type: CONTRACT_KIND_TO_TYPE[form.contract_kind],
        contract_type: form.contract_kind,
        investor_id: form.investor_id || null,
        buyer_id: form.buyer_id || null,
        builder_id: form.contract_kind === 'construction' ? form.builder_id || null : null,
        land_id:
          form.contract_kind !== 'broker' && form.related_kind === 'land'
            ? form.land_id || null
            : form.contract_kind === 'development'
              ? form.land_id || null
              : null,
        property_id:
          form.contract_kind === 'broker' && form.related_kind === 'property'
            ? form.property_id || null
            : form.contract_kind === 'broker'
              ? form.property_id || null
              : null,
        channel_id: form.contract_kind === 'broker' ? form.channel_id || null : null,
        amount_wan: form.amount_wan ? Number(form.amount_wan) : null,
        commission_wan:
          form.contract_kind === 'broker' && form.commission_wan
            ? Number(form.commission_wan)
            : null,
        signed_date: form.signed_date || null,
        status: form.status,
        file_url: fileUrl,
        notes: form.notes.trim() || null,
        owner_id: ownerId ?? profile?.id ?? null,
      }

      if (isEdit && id) {
        await updateContract(id, payload, user?.email ?? undefined)
        toast.success('合同已更新')
      } else {
        await createContract(payload, user?.email ?? undefined)
        toast.success('合同已创建')
      }
      navigate('/contracts')
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
      <ListBackLink listKey="contracts" basePath="/contracts" />

      <PageHeader
        title={isEdit ? '编辑合同' : '新增合同'}
        description="录入合同信息与上传 PDF 文件"
      />

      {error && <div className="alert-error mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <ImageRecognitionUpload
          formType="contract"
          onRecognized={(data) =>
            setForm((prev) => mergeRecognizedFields(prev, data))
          }
        />
        <Select
          id="contract_kind"
          label="合同分类"
          value={form.contract_kind}
          onChange={(e) => {
            const kind = e.target.value as ContractKind
            setForm((prev) => ({
              ...prev,
              contract_kind: kind,
              type: CONTRACT_KIND_TO_TYPE[kind],
            }))
          }}
          options={CONTRACT_KINDS.map((k) => ({
            value: k,
            label: CONTRACT_KIND_LABELS[k],
          }))}
          required
        />

        {form.contract_kind === 'development' && (
          <>
            <Select
              id="investor_id"
              label="关联投资人"
              value={form.investor_id}
              onChange={(e) => set('investor_id', e.target.value)}
              options={[
                { value: '', label: '未关联' },
                ...investors.map((inv) => ({
                  value: inv.id,
                  label: `${inv.name}（${inv.grade}级）`,
                })),
              ]}
            />
            <Select
              id="land_id"
              label="关联土地"
              value={form.land_id}
              onChange={(e) => set('land_id', e.target.value)}
              options={[
                { value: '', label: '请选择' },
                ...lands.map((l) => ({ value: l.id, label: l.name })),
              ]}
            />
          </>
        )}

        {form.contract_kind === 'broker' && (
          <>
            <Select
              id="channel_id"
              label="渠道中介"
              value={form.channel_id}
              onChange={(e) => set('channel_id', e.target.value)}
              options={[
                { value: '', label: '未关联渠道' },
                ...channels.map((ch) => ({
                  value: ch.id,
                  label: `${ch.name}（默认 ${ch.default_commission_rate ?? '—'}%）`,
                })),
              ]}
            />
            <Select
              id="investor_id"
              label="关联投资人（可选）"
              value={form.investor_id}
              onChange={(e) => set('investor_id', e.target.value)}
              options={[
                { value: '', label: '未关联' },
                ...investors.map((inv) => ({
                  value: inv.id,
                  label: `${inv.name}（${inv.grade}级）`,
                })),
              ]}
            />
            <Select
              id="buyer_id"
              label="关联买家"
              value={form.buyer_id}
              onChange={(e) => set('buyer_id', e.target.value)}
              options={[
                { value: '', label: '未关联' },
                ...buyers.map((b) => ({
                  value: b.id,
                  label: `${b.name}${b.preferred_type ? `（${b.preferred_type}）` : ''}`,
                })),
              ]}
            />
            <Select
              id="property_id"
              label="关联物件"
              value={form.property_id}
              onChange={(e) => set('property_id', e.target.value)}
              options={[
                { value: '', label: '请选择' },
                ...properties.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
            <AmountInput
              id="commission_wan"
              label="佣金金额"
              value={form.commission_wan}
              onChange={(v) => set('commission_wan', v)}
            />
          </>
        )}

        {form.contract_kind === 'construction' && (
          <>
            <Select
              id="builder_id"
              label="关联建筑商"
              value={form.builder_id}
              onChange={(e) => set('builder_id', e.target.value)}
              options={[
                { value: '', label: '请选择' },
                ...builders.map((b) => ({ value: b.id, label: b.name })),
              ]}
            />
            <Select
              id="land_id"
              label="关联土地/项目地块"
              value={form.land_id}
              onChange={(e) => set('land_id', e.target.value)}
              options={[
                { value: '', label: '请选择' },
                ...lands.map((l) => ({ value: l.id, label: l.name })),
              ]}
            />
          </>
        )}

        <AmountInput
          id="amount_wan"
          label="合同金额"
          value={form.amount_wan}
          onChange={(v) => set('amount_wan', v)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <DateInput
            id="signed_date"
            label="签约日期"
            value={form.signed_date}
            onChange={(v) => set('signed_date', v)}
          />
          <Select
            id="status"
            label="状态"
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            options={CONTRACT_STATUSES.map((s) => ({ value: s, label: s }))}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-500">
            合同文件（PDF）
          </label>
          {pdfName ? (
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
              <span className="text-sm text-[#1A1A2A] truncate">{pdfName}</span>
              <button
                type="button"
                onClick={() => {
                  setPdfFile(null)
                  setPdfName('')
                  setForm((p) => ({ ...p, file_url: '' }))
                  if (fileRef.current) fileRef.current.value = ''
                }}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full p-4 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center gap-2 text-gray-400 hover:border-[#1B2B4B]/30 hover:text-[#1B2B4B]"
            >
              <FileUp size={20} />
              上传 PDF 合同
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handlePdfChange}
          />
        </div>

        <Textarea
          id="notes"
          label="备注"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? '保存中...' : isEdit ? '保存修改' : '创建合同'}
          </Button>
          <Link to="/contracts">
            <Button variant="secondary">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
