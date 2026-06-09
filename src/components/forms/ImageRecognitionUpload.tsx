import { useRef, useState } from 'react'
import { validateUploadFileSize, formatMaxUploadSize } from '@/config/upload'
import { FileImage, Loader2, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import { recognizeFormFromImage } from '@/services/aiVision'
import type { RecognitionFormType } from '@/config/formRecognition'

interface ImageRecognitionUploadProps {
  formType: RecognitionFormType
  onRecognized: (data: Record<string, string>) => void
}

const ACCEPT = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf'

export default function ImageRecognitionUpload({
  formType,
  onRecognized,
}: ImageRecognitionUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleFileSelect = (selected: File | null) => {
    setError('')
    setSuccess('')
    if (!selected) return

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowed.includes(selected.type)) {
      setError('仅支持 JPG、PNG、PDF 格式')
      return
    }

    const sizeError = validateUploadFileSize(selected)
    if (sizeError) {
      setError(sizeError)
      return
    }

    setFile(selected)
    if (selected.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(selected))
    } else {
      setPreviewUrl(null)
    }
  }

  const handleRecognize = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const data = await recognizeFormFromImage(file, formType)
      onRecognized(data)
      setSuccess('识别完成，已填入表单，请核对后保存')
    } catch (err) {
      setError(err instanceof Error ? err.message : '识别失败')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setFile(null)
    setPreviewUrl(null)
    setError('')
    setSuccess('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="p-4 rounded-xl border border-dashed border-[#1B2B4B]/20 bg-[#1B2B4B]/5 mb-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-medium text-[#1B2B4B]">上传图片识别</p>
          <p className="text-xs text-gray-500 mt-0.5">
            支持 JPG / PNG / PDF，单文件不超过 {formatMaxUploadSize()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
          >
            <FileImage size={16} />
            选择文件
          </Button>
          <Button
            type="button"
            variant="accent"
            onClick={handleRecognize}
            disabled={!file || loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? '识别中...' : '开始识别'}
          </Button>
        </div>
      </div>

      {file && (
        <div className="flex items-start gap-4 p-3 rounded-lg bg-white border border-gray-200">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="预览"
              className="w-24 h-24 object-cover rounded-lg border border-gray-200 shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <span className="text-xs text-gray-500 font-medium">PDF</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#1A1A2A] truncate">{file.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {(file.size / 1024).toFixed(0)} KB
            </p>
            <button
              type="button"
              onClick={handleClear}
              className="mt-2 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500"
            >
              <X size={12} />
              移除
            </button>
          </div>
        </div>
      )}

      {error && <div className="alert-error mt-3">{error}</div>}
      {success && (
        <p className="mt-3 text-sm text-emerald-600">{success}</p>
      )}
    </div>
  )
}
