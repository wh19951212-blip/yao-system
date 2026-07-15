import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPABASE_ORIGIN =
  process.env.VITE_SUPABASE_URL?.trim() ||
  'https://eldmhacdbisslcyrvxqt.supabase.co'

const ALLOW_HEADERS =
  'authorization, apikey, content-type, x-client-info, x-supabase-api-version, accept, accept-profile, prefer, range, content-profile'

function applyCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', ALLOW_HEADERS)
  res.setHeader('Access-Control-Max-Age', '86400')
}

function extractSupabasePath(req: VercelRequest): string {
  const raw = req.url ?? '/'
  const pathname = raw.split('?')[0] ?? '/'
  const prefix = '/api/supabase/'
  if (pathname.startsWith(prefix)) {
    return pathname.slice(prefix.length)
  }
  if (pathname === '/api/supabase') {
    return ''
  }
  return ''
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  const path = extractSupabasePath(req)
  const queryIndex = req.url?.indexOf('?') ?? -1
  const query = queryIndex >= 0 ? req.url!.slice(queryIndex) : ''
  const target = `${SUPABASE_ORIGIN.replace(/\/$/, '')}/${path}${query}`

  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value || key.toLowerCase() === 'host') continue
    headers.set(key, Array.isArray(value) ? value.join(', ') : value)
  }

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body:
        req.method !== 'GET' && req.method !== 'HEAD'
          ? (req as unknown as { body?: BodyInit }).body
          : undefined,
    })

    res.status(upstream.status)
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'content-encoding') return
      res.setHeader(key, value)
    })
    applyCors(res)

    const buffer = Buffer.from(await upstream.arrayBuffer())
    return res.send(buffer)
  } catch (error) {
    applyCors(res)
    return res.status(502).json({
      message: error instanceof Error ? error.message : 'Supabase proxy failed',
      target,
    })
  }
}
