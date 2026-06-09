import { CLAUDE_MODEL } from '@/services/ai'
import {
  buildRecognitionPrompt,
  type RecognitionFormType,
} from '@/config/formRecognition'

const PROXY_ENDPOINT = '/api/anthropic/v1/messages'
const DIRECT_ENDPOINT = 'https://api.anthropic.com/v1/messages'

function getApiKey() {
  return import.meta.env.VITE_ANTHROPIC_API_KEY?.trim() || ''
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function buildContentBlock(file: File, base64: string) {
  if (file.type === 'application/pdf') {
    return {
      type: 'document' as const,
      source: {
        type: 'base64' as const,
        media_type: 'application/pdf' as const,
        data: base64,
      },
    }
  }

  const mediaType =
    file.type === 'image/png'
      ? 'image/png'
      : file.type === 'image/jpeg' || file.type === 'image/jpg'
        ? 'image/jpeg'
        : 'image/png'

  return {
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: mediaType,
      data: base64,
    },
  }
}

function parseJsonResponse(text: string): Record<string, string> {
  const trimmed = text.trim()
  const jsonMatch =
    trimmed.match(/```json\s*([\s\S]*?)```/) ??
    trimmed.match(/(\{[\s\S]*\})/)

  const raw = jsonMatch ? jsonMatch[1] : trimmed

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (value === null || value === undefined) {
        result[key] = ''
      } else {
        result[key] = String(value)
      }
    }
    return result
  } catch {
    throw new Error('AI 返回格式无法解析，请重试或手动填写')
  }
}

async function callClaudeVision(
  file: File,
  prompt: string,
): Promise<string> {
  const apiKey = getApiKey()
  const base64 = await fileToBase64(file)
  const contentBlock = buildContentBlock(file, base64)

  const body = JSON.stringify({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [contentBlock, { type: 'text', text: prompt }],
      },
    ],
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
  }

  let endpoint = PROXY_ENDPOINT
  if (apiKey) {
    endpoint = DIRECT_ENDPOINT
    headers['x-api-key'] = apiKey
    headers['anthropic-dangerous-direct-browser-access'] = 'true'
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body,
  })

  if (!response.ok) {
    const detail = await response.text()
    if (response.status === 401) {
      throw new Error('Claude API Key 无效，请检查 .env 中的 VITE_ANTHROPIC_API_KEY。')
    }
    if (!apiKey && (response.status === 404 || response.status === 502)) {
      throw new Error(
        'AI 服务未配置。请在 .env 中加入 VITE_ANTHROPIC_API_KEY，保存后重启 npm run dev。',
      )
    }
    throw new Error(detail || `图片识别失败（${response.status}）`)
  }

  const data = await response.json()
  const text = data.content
    ?.filter((block: { type: string }) => block.type === 'text')
    .map((block: { text?: string }) => block.text ?? '')
    .join('\n')
    .trim()

  if (!text) throw new Error('AI 未返回有效内容')
  return text
}

export async function recognizeFormFromImage(
  file: File,
  formType: RecognitionFormType,
): Promise<Record<string, string>> {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
  if (!allowed.includes(file.type)) {
    throw new Error('仅支持 JPG、PNG、PDF 格式')
  }

  const prompt = buildRecognitionPrompt(formType)
  const raw = await callClaudeVision(file, prompt)
  return parseJsonResponse(raw)
}
