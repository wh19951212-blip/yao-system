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

/** 存储路径格式：bucket:path/to/file.ext */
export function toStorageRef(bucket: string, path: string) {
  return `${bucket}:${path}`
}

export function parseStorageRef(ref: string): { bucket: string; path: string } | null {
  const idx = ref.indexOf(':')
  if (idx <= 0) return null
  return { bucket: ref.slice(0, idx), path: ref.slice(idx + 1) }
}

export async function getSignedFileUrl(
  refOrUrl: string,
  expiresIn = 3600,
): Promise<string> {
  if (refOrUrl.startsWith('http://') || refOrUrl.startsWith('https://')) {
    return refOrUrl
  }
  const parsed = parseStorageRef(refOrUrl)
  if (!parsed) return refOrUrl

  const { data, error } = await supabase.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.path, expiresIn)
  if (error) throw error
  return data.signedUrl
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
      `文件上传失败：${error.message}。请在 Supabase 创建私有 bucket「${bucket}」。`,
    )
  }

  return toStorageRef(bucket, path)
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
