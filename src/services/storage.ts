import { supabase } from '@/lib/supabase'
import type { PropertyStatus } from '@/config/app'

import { validateUploadFileSize } from '@/config/upload'

export function normalizePropertyStatus(status: string): PropertyStatus {
  const legacy: Record<string, PropertyStatus> = {
    上架: '販売中',
    洽谈中: '進行中',
    已售: '終了&不合格',
  }
  return (legacy[status] ?? status) as PropertyStatus
}

export async function uploadFile(
  bucket: string,
  file: File,
  folder?: string,
): Promise<string> {
  const sizeError = validateUploadFileSize(file)
  if (sizeError) throw new Error(sizeError)

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const path = folder
    ? `${folder}/${crypto.randomUUID()}.${ext}`
    : `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw new Error(
      `文件上传失败：${error.message}。请在 Supabase 创建 bucket「${bucket}」。`,
    )
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadPropertyImage(file: File): Promise<string> {
  return uploadFile('property-images', file)
}

export async function uploadContractPdf(file: File): Promise<string> {
  return uploadFile('contract-files', file, 'contracts')
}

export async function uploadMediaFile(file: File): Promise<string> {
  return uploadFile('media-assets', file)
}
