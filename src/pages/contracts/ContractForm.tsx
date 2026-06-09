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
import { fetchLands } from '@/services/lands'
import { fetchProperties } from '@/services/properties'
import {
  createContract,
  fetchContractById,
  updateContract,
} from '@/services/contracts'
import { uploadContractPdf } from '@/services/storage'
import {
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
  type ContractStatus,
  type ContractType,
} from '@/config/app'
import type { Investor } from '@/types/database'
import { mergeRecognizedFields } from '@/utils/formRecognition'
import { useAuth } from '@/contexts/AuthContext'
import { useDataScope } from '@/hooks/useDataScope'
import { useToast } from '@/contexts/ToastContext'
import { validateUploadFileSize } from '@/config/upload'

const emptyForm = {
  type: '开发' as ContractType,
  investor_id: '',
  related_kind: 'none' as 'none' | 'land' | 'property',
  land_id: '',
  property_id: '',
  amount_wan: '',
  commission_wan: '',
  signed_date: '',
  status: '进行中' as ContractStatus,
  notes: '',
  file_url: '',
}

export default function ContractForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { ownerEmail } = useDataScope()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState(emptyForm)
  const [investors, setInvestors] = useState<Investor[]>([])
  const [lands, setLands] = useState<{ id: string; name: string }[]>([])
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfName, setPdfName] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetchInvestors('all', ownerEmail),
      fetchLands(ownerEmail),
      fetchProperties('all', ownerEmail),
    ])
      .then(([inv, landList, propList]) => {
        setInvestors(inv)
        setLands(landList.map((l) => ({ id: l.id, name: l.name })))
        setProperties(propList.map((p) => ({ id: p.id, name: p.name })))
      })
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : '加载选项失败'),
      )
  }, [ownerEmail, toast])

  useEffect(() => {
    const investorId = searchParams.get('investorId')
    if (investorId && !isEdit) {
      setForm((prev) => ({ ...prev, investor_id: investorId }))
    }
  }, [searchParams, isEdit])

  useEffect(() => {
    if (!id) return
    fetchContractById(id)
      .then((c) => {
        setForm({
          type: c.type as ContractType,
          investor_id: c.investor_id ?? '',
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
        })
        if (c.file_url) setPdfName('已上传合同文件')
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : '加载失败'),
      )
      .finally(() => setLoading(false))
  }, [id])

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
        type: form.type,
        investor_id: form.investor_id || null,
        land_id: form.related_kind === 'land' ? form.land_id || null : null,
        property_id:
          form.related_kind === 'property' ? form.property_id || null : null,
        amount_wan: form.amount_wan ? Number(form.amount_wan) : null,
        commission_wan: form.commission_wan
          ? Number(form.commission_wan)
          : null,
        signed_date: form.signed_date || null,
        status: form.status,
        file_url: fileUrl,
        notes: form.notes.trim() || null,
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
          id="type"
          label="合同类型"
          value={form.type}
          onChange={(e) => set('type', e.target.value)}
          options={CONTRACT_TYPES.map((t) => ({ value: t, label: t }))}
          required
        />

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
          id="related_kind"
          label="关联标的"
          value={form.related_kind}
          onChange={(e) => set('related_kind', e.target.value)}
          options={[
            { value: 'none', label: '无' },
            { value: 'land', label: '土地' },
            { value: 'property', label: '物件/项目' },
          ]}
        />

        {form.related_kind === 'land' && (
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
        )}

        {form.related_kind === 'property' && (
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
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <AmountInput
            id="amount_wan"
            label="合同金额"
            value={form.amount_wan}
            onChange={(v) => set('amount_wan', v)}
          />
          <AmountInput
            id="commission_wan"
            label="佣金金额"
            value={form.commission_wan}
            onChange={(v) => set('commission_wan', v)}
          />
        </div>

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
