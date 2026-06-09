const MODEL = 'claude-sonnet-4-20250514'
const PROXY_ENDPOINT = '/api/anthropic/v1/messages'
const DIRECT_ENDPOINT = 'https://api.anthropic.com/v1/messages'

function getApiKey() {
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
  return 'AI 服务未配置。请在 .env 中加入 VITE_ANTHROPIC_API_KEY（console.anthropic.com 申请），保存后重启 npm run dev。'
}

export async function callClaude(
  prompt: string,
  maxTokens = 1024,
): Promise<string> {
  const apiKey = getApiKey()
  const body = JSON.stringify({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })

  if (apiKey) {
    const response = await fetch(DIRECT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body,
    })

    if (!response.ok) {
      const detail = await response.text()
      if (response.status === 401) {
        throw new Error('Claude API Key 无效，请检查 .env 中的 VITE_ANTHROPIC_API_KEY。')
      }
      throw new Error(detail || `AI 请求失败（${response.status}）`)
    }

    return parseClaudeResponse(await response.json())
  }

  const response = await fetch(PROXY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  if (!response.ok) {
    const detail = await response.text()
    if (response.status === 404 || response.status === 502) {
      throw new Error(missingKeyMessage())
    }
    throw new Error(detail || `AI 请求失败（${response.status}）`)
  }

  return parseClaudeResponse(await response.json())
}

export const CLAUDE_MODEL = MODEL
