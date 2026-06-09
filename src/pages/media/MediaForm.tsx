import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ListBackLink from '@/components/ui/ListBackLink'
import { Bot, ImagePlus, X } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import ImageRecognitionUpload from '@/components/forms/ImageRecognitionUpload'
import { useAuth } from '@/contexts/AuthContext'
import { generateXiaohongshuCopy, formatXhsCopyForSave } from '@/services/aiMedia'
import { fetchLands } from '@/services/lands'
import {
  createMediaAsset,
  fetchMediaAssetById,
  updateMediaAsset,
} from '@/services/media'
import { fetchProperties } from '@/services/properties'
import { uploadMediaFile } from '@/services/storage'
import {
  MEDIA_PLATFORMS,
  MEDIA_RELATED_TYPES,
  MEDIA_TYPES,
  type MediaPlatform,
  type MediaRelatedType,
  type MediaType,
} from '@/config/app'
import { mergeRecognizedFields } from '@/utils/formRecognition'
import { useDataScope } from '@/hooks/useDataScope'
import { useToast } from '@/contexts/ToastContext'
import { validateUploadFileSize } from '@/config/upload'

const emptyForm = {
  title: '',
  type: '文案' as MediaType,
  platform: '小红书' as MediaPlatform,
  related_type: '通用' as MediaRelatedType,
  related_id: '',
  content: '',
  xhsTitle: '',
  xhsBody: '',
  xhsTags: '',
  file_url: '',
  status: '草稿',
}

function parseSavedXhsContent(content: string) {
  const titleMatch = content.match(/【标题】\s*\n([\s\S]*?)(?=\n\n【正文】|$)/)
  const bodyMatch = content.match(/【正文】\s*\n([\s\S]*?)(?=\n\n【话题】|$)/)
  const tagsMatch = content.match(/【话题】\s*\n([\s\S]*)$/)

  if (titleMatch || bodyMatch || tagsMatch) {
    return {
      xhsTitle: titleMatch?.[1]?.trim() ?? '',
      xhsBody: bodyMatch?.[1]?.trim() ?? '',
      xhsTags: tagsMatch?.[1]?.trim() ?? '',
      content,
    }
  }

  return { xhsTitle: '', xhsBody: '', xhsTags: '', content }
}

export default function MediaForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { ownerEmail } = useDataScope()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState(emptyForm)
  const [lands, setLands] = useState<{ id: string; name: string }[]>([])
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetchLands(ownerEmail),
      fetchProperties('all', ownerEmail),
    ])
      .then(([landList, propList]) => {
        setLands(landList.map((l) => ({ id: l.id, name: l.name })))
        setProperties(propList.map((p) => ({ id: p.id, name: p.name })))
      })
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : '加载关联数据失败'),
      )
  }, [ownerEmail, toast])

  useEffect(() => {
    if (!id) return
    fetchMediaAssetById(id)
      .then((asset) => {
        const parsed = parseSavedXhsContent(asset.content ?? '')
        setForm({
          title: asset.title,
          type: asset.type as MediaType,
          platform: asset.platform as MediaPlatform,
          related_type: asset.related_type as MediaRelatedType,
          related_id: asset.related_id ?? '',
          content: parsed.content,
          xhsTitle: parsed.xhsTitle,
          xhsBody: parsed.xhsBody,
          xhsTags: parsed.xhsTags,
          file_url: asset.file_url ?? '',
          status: asset.status,
        })
        if (asset.file_url && asset.type === '图片') {
          setPreviewUrl(asset.file_url)
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : '加载失败'),
      )
      .finally(() => setLoading(false))
  }, [id])

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const sizeError = validateUploadFileSize(file)
    if (sizeError) {
      toast.error(sizeError)
      return
    }
    setMediaFile(file)
    if (form.type === '图片') {
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleAiGenerate = async () => {
    if (form.related_type !== '通用' && !form.related_id) {
      setError('请先选择关联的土地或项目')
      return
    }
    setAiLoading(true)
    setError('')
    try {
      const relatedType =
        form.related_type === '土地'
          ? '土地'
          : form.related_type === '项目'
            ? '项目'
            : '通用'
      const result = await generateXiaohongshuCopy({
        relatedType,
        relatedId: form.related_id || null,
        title: form.title,
      })
      setForm((prev) => ({
        ...prev,
        title: prev.title.trim() || result.title,
        xhsTitle: result.title,
        xhsBody: result.body,
        xhsTags: result.tags,
        content: formatXhsCopyForSave(result),
        type: '文案',
        platform: '小红书',
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 生成失败')
    } finally {
      setAiLoading(false)
    }
  }

  const syncXhsContent = (
    updates: Partial<Pick<typeof form, 'xhsTitle' | 'xhsBody' | 'xhsTags'>>,
  ) => {
    setForm((prev) => {
      const next = { ...prev, ...updates }
      next.content = formatXhsCopyForSave({
        title: next.xhsTitle,
        body: next.xhsBody,
        tags: next.xhsTags,
        raw: '',
      })
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      let fileUrl = form.file_url || null
      if (mediaFile) {
        fileUrl = await uploadMediaFile(mediaFile)
      }

      const payload = {
        title: form.title.trim(),
        type: form.type,
        platform: form.platform,
        related_type: form.related_type,
        related_id:
          form.related_type === '通用' || !form.related_id
            ? null
            : form.related_id,
        content:
          form.xhsTitle || form.xhsBody || form.xhsTags
            ? formatXhsCopyForSave({
                title: form.xhsTitle,
                body: form.xhsBody,
                tags: form.xhsTags,
                raw: '',
              })
            : form.content.trim() || null,
        file_url: fileUrl,
        status: form.status,
        created_by: user?.email ?? null,
      }

      if (isEdit && id) {
        await updateMediaAsset(id, payload)
        toast.success('素材已更新')
      } else {
        await createMediaAsset(payload)
        toast.success('素材已创建')
      }
      navigate('/media')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '保存失败'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const relatedOptions =
    form.related_type === '土地'
      ? lands
      : form.related_type === '项目'
        ? properties
        : []

  if (loading) {
    return <div className="page-shell text-gray-500 text-sm">加载中...</div>
  }

  return (
    <div className="page-shell max-w-2xl">
      <ListBackLink listKey="media" basePath="/media" label="返回素材库" />

      <PageHeader
        title={isEdit ? '编辑素材' : '新增素材'}
        description="上传文件或填写文案，支持 AI 生成小红书内容"
      />

      {error && <div className="alert-error mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <ImageRecognitionUpload
          formType="media"
          onRecognized={(data) => {
            setForm((prev) => {
              const merged = mergeRecognizedFields(prev, data)
              if (data.content && !data.xhsTitle) {
                return { ...merged, content: data.content }
              }
              return merged
            })
          }}
        />
        <Input
          id="title"
          label="标题 *"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Select
            id="type"
            label="类型 *"
            value={form.type}
            onChange={(e) => set('type', e.target.value)}
            options={MEDIA_TYPES.map((t) => ({ value: t, label: t }))}
          />
          <Select
            id="platform"
            label="平台 *"
            value={form.platform}
            onChange={(e) => set('platform', e.target.value)}
            options={MEDIA_PLATFORMS.map((p) => ({ value: p, label: p }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Select
            id="related_type"
            label="关联类型"
            value={form.related_type}
            onChange={(e) => {
              set('related_type', e.target.value)
              set('related_id', '')
            }}
            options={MEDIA_RELATED_TYPES.map((r) => ({
              value: r,
              label: r,
            }))}
          />
          {form.related_type !== '通用' && (
            <Select
              id="related_id"
              label={`关联${form.related_type}`}
              value={form.related_id}
              onChange={(e) => set('related_id', e.target.value)}
              options={[
                { value: '', label: '请选择' },
                ...relatedOptions.map((item) => ({
                  value: item.id,
                  label: item.name,
                })),
              ]}
            />
          )}
        </div>

        {(form.type === '图片' || form.type === '视频') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-500">
              上传{form.type === '图片' ? '图片' : '视频'}
            </label>
            {previewUrl && form.type === '图片' ? (
              <div className="relative rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={previewUrl}
                  alt="预览"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setMediaFile(null)
                    setPreviewUrl(null)
                    setForm((p) => ({ ...p, file_url: '' }))
                    if (fileRef.current) fileRef.current.value = ''
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-28 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#1B2B4B]/30"
              >
                <ImagePlus size={24} />
                <span className="text-sm">点击上传</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept={form.type === '图片' ? 'image/*' : 'video/*'}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-500">
              小红书文案
            </label>
            <Button
              type="button"
              variant="accent"
              onClick={handleAiGenerate}
              disabled={aiLoading}
              className="text-xs py-1.5 px-3"
            >
              <Bot size={14} />
              {aiLoading ? '生成中...' : 'AI 生成小红书文案'}
            </Button>
          </div>

          {form.xhsTitle || form.xhsBody || form.xhsTags ? (
            <div className="space-y-4 p-4 rounded-xl bg-[#C9A84C]/5 border border-[#C9A84C]/20">
              <Input
                id="xhs_title"
                label="标题（带 emoji）"
                value={form.xhsTitle}
                onChange={(e) => syncXhsContent({ xhsTitle: e.target.value })}
              />
              <Textarea
                value={form.xhsBody}
                onChange={(e) => syncXhsContent({ xhsBody: e.target.value })}
                placeholder="正文约 500 字..."
                rows={10}
              />
              <Input
                id="xhs_tags"
                label="话题标签（5 个）"
                value={form.xhsTags}
                onChange={(e) => syncXhsContent({ xhsTags: e.target.value })}
                placeholder="#日本投资 #东京房产 ..."
              />
            </div>
          ) : (
            <Textarea
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              placeholder="选择关联土地/项目后点击 AI 生成，或手动填写文案..."
              rows={10}
            />
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? '保存中...' : isEdit ? '保存修改' : '保存素材'}
          </Button>
          <Link to="/media">
            <Button variant="secondary">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
