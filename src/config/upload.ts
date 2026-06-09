/** 客户端上传大小上限（5MB） */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export function formatMaxUploadSize() {
  return '5MB'
}

export function validateUploadFileSize(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return `文件大小不能超过 ${formatMaxUploadSize()}（当前 ${(file.size / 1024 / 1024).toFixed(1)}MB）`
  }
  return null
}
