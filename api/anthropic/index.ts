import type { VercelRequest, VercelResponse } from '@vercel/node'

const ANTHROPIC_ORIGIN = 'https://api.anthropic.com'

function applyCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'content-type, anthropic-version',
  )
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const apiKey =
    process.env.ANTHROPIC_API_KEY?.trim() ||
    process.env.VITE_ANTHROPIC_API_KEY?.trim()

  if (!apiKey) {
    return res.status(503).json({
      message:
        'AI 服务未配置。请在 Vercel 环境变量中设置 ANTHROPIC_API_KEY。',
    })
  }

  const path = (req.url ?? '').replace(/^\/api\/anthropic/, '') || '/v1/messages'
  const target = `${ANTHROPIC_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`

  try {
    const upstream = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    })

    const buffer = Buffer.from(await upstream.arrayBuffer())
    res.status(upstream.status)
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'content-encoding') return
      res.setHeader(key, value)
    })
    applyCors(res)
    return res.send(buffer)
  } catch (error) {
    applyCors(res)
    return res.status(502).json({
      message: error instanceof Error ? error.message : 'Anthropic proxy failed',
    })
  }
}
