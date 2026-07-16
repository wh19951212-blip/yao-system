import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ImagePlus, X } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import AmountInput from '@/components/ui/AmountInput'
import ListBackLink from '@/components/ui/ListBackLink'
import ImageRecognitionUpload from '@/components/forms/ImageRecognitionUpload'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { validateUploadFileSize } from '@/config/upload'
import {
  createProperty,
  fetchPropertyById,
  updateProperty,
} from '@/services/properties'
import { uploadPropertyImage } from '@/services/storage'
import {
  PROPERTY_SOURCE_TYPES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  type PropertySourceType,
  type PropertyStatus,
  type PropertyType,
} from '@/config/app'
import { fetchChannels } from '@/services/channels'
import type { Channel } from '@/types/database'
import { mergeRecognizedFields } from '@/utils/formRecognition'

const emptyForm = {
  name: '',
  location: '',
  type: '酒店' as PropertyType,
  source_type: '代理' as PropertySourceType,
  price_wan: '',
  commission_rate: '',
  status: '進行中' as PropertyStatus,
  description: '',
  image_url: '',
  channel_id: '',
}

export default function PropertyForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [channels, setChannels] = useState<Channel[]>([])

  useEffect(() => {
    fetchChannels().then(setChannels).catch(() => setChannels([]))
  }, [])

  useEffect(() => {
    if (!id) return
    fetchPropertyById(id)
      .then((p) => {
        setForm({
          name: p.name,
          location: p.location ?? '',
          type: p.type as PropertyType,
          source_type: p.source_type as PropertySourceType,
          price_wan: p.price_wan != null ? String(p.price_wan) : '',
          commission_rate:
            p.commission_rate != null ? String(p.commission_rate) : '',
          status: p.status as PropertyStatus,
          description: p.description ?? '',
          image_url: p.image_url ?? '',
          channel_id: p.channel_id ?? '',
        })
        if (p.image_url) setImagePreview(p.image_url)
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : '加载失败'),
      )
      .finally(() => setLoading(false))
  }, [id])

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const sizeError = validateUploadFileSize(file)
    if (sizeError) {
      toast.error(sizeError)
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setForm((prev) => ({ ...prev, image_url: '' }))
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      let imageUrl = form.image_url || null
      if (imageFile) {
        imageUrl = await uploadPropertyImage(imageFile)
      }

      const payload = {
        name: form.name.trim(),
        location: form.location.trim() || null,
        type: form.type,
        source_type: form.source_type,
        price_wan: form.price_wan ? Number(form.price_wan) : null,
        commission_rate: form.commission_rate
          ? Number(form.commission_rate)
          : null,
        status: form.status,
        description: form.description.trim() || null,
        image_url: imageUrl,
        channel_id:
          form.source_type === '代理' && form.channel_id
            ? form.channel_id
            : null,
        owner: user?.email ?? null,
      }

      if (isEdit && id) {
        await updateProperty(id, payload)
        toast.success('物件已更新')
      } else {
        await createProperty(payload)
        toast.success('物件已创建')
      }
      navigate('/properties')
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
      <ListBackLink listKey="properties" basePath="/properties" />

      <PageHeader
        title={isEdit ? '编辑物件' : '新增物件'}
        description="录入物件基本信息与图片"
      />

      {error && <div className="alert-error mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <ImageRecognitionUpload
          formType="property"
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
          placeholder="如：东京都港区"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Select
            id="type"
            label="类型"
            value={form.type}
            onChange={(e) => set('type', e.target.value)}
            options={PROPERTY_TYPES.map((t) => ({ value: t, label: t }))}
            required
          />
          <Select
            id="source_type"
            label="来源"
            value={form.source_type}
            onChange={(e) => set('source_type', e.target.value)}
            options={PROPERTY_SOURCE_TYPES.map((s) => ({
              value: s,
              label: s,
            }))}
            required
          />
        </div>

        {form.source_type === '代理' && (
          <Select
            id="channel_id"
            label="渠道中介"
            value={form.channel_id}
            onChange={(e) => set('channel_id', e.target.value)}
            options={[
              { value: '', label: '未指定渠道' },
              ...channels.map((ch) => ({
                value: ch.id,
                label: `${ch.name}（${ch.entity_type}）`,
              })),
            ]}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <AmountInput
            id="price_wan"
            label="价格"
            value={form.price_wan}
            onChange={(v) => set('price_wan', v)}
          />
          <Input
            id="commission_rate"
            label="佣金率"
            type="number"
            min="0"
            step="0.01"
            value={form.commission_rate}
            onChange={(e) => set('commission_rate', e.target.value)}
            placeholder="%"
          />
        </div>

        <Select
          id="status"
          label="状态"
          value={form.status}
          onChange={(e) => set('status', e.target.value)}
          options={PROPERTY_STATUSES.map((s) => ({ value: s, label: s }))}
        />

        <Textarea
          id="description"
          label="描述"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="物件亮点、配套、交通等"
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-500">
            物件图片
          </label>
          {imagePreview ? (
            <div className="relative rounded-lg overflow-hidden border border-gray-200">
              <img
                src={imagePreview}
                alt="预览"
                className="w-full h-48 object-cover"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full h-36 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#1B2B4B]/30 hover:text-[#1B2B4B] transition-colors"
            >
              <ImagePlus size={28} strokeWidth={1.5} />
              <span className="text-sm">点击上传图片</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? '保存中...' : isEdit ? '保存修改' : '创建物件'}
          </Button>
          <Link to="/properties">
            <Button variant="secondary">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
