const MODEL = 'claude-sonnet-4-20250514'
const PROXY_ENDPOINT = '/api/anthropic/v1/messages'
const DIRECT_ENDPOINT = 'https://api.anthropic.com/v1/messages'

function getDevApiKey() {
  return import.meta.env.VITE_ANTHROPIC_API_KEY?.trim() || ''
}

function parseClaudeResponse(data: {
  content?: { type: string; text?: string }[]
}) {
  const text = data.content
    ?.filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('\n')
    .trim()

  if (!text) throw new Error('AI 未返回有效内容')
  return text
}

function missingKeyMessage() {
  if (import.meta.env.DEV) {
    return 'AI 服务未配置。请在 .env 中加入 VITE_ANTHROPIC_API_KEY 或 ANTHROPIC_API_KEY，保存后重启 npm run dev。'
  }
  return 'AI 服务未配置。请在 Vercel 环境变量中设置 ANTHROPIC_API_KEY（服务端，不会暴露给浏览器）。'
}

export async function callClaude(
  prompt: string,
  maxTokens = 1024,
): Promise<string> {
  const body = JSON.stringify({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })

  // 开发环境：优先本地 Vite 代理；可选浏览器直连（需 VITE_ANTHROPIC_API_KEY）
  if (import.meta.env.DEV) {
    const devKey = getDevApiKey()
    if (devKey) {
      const response = await fetch(DIRECT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': devKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body,
      })
      if (!response.ok) {
        const detail = await response.text()
        throw new Error(detail || `AI 请求失败（${response.status}）`)
      }
      return parseClaudeResponse(await response.json())
    }

    const proxyRes = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    if (!proxyRes.ok) {
      throw new Error(missingKeyMessage())
    }
    return parseClaudeResponse(await proxyRes.json())
  }

  // 生产环境：仅走服务端代理，Key 不进入前端包
  const response = await fetch(PROXY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  if (!response.ok) {
    const detail = await response.text()
    if (response.status === 503 || response.status === 404) {
      throw new Error(missingKeyMessage())
    }
    throw new Error(detail || `AI 请求失败（${response.status}）`)
  }

  return parseClaudeResponse(await response.json())
}

export const CLAUDE_MODEL = MODEL
