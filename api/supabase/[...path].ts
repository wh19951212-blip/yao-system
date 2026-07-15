export const config = { runtime: 'edge' }

const SUPABASE_ORIGIN =
  'https://eldmhacdbisslcyrvxqt.supabase.co'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, apikey, content-type, x-client-info, x-supabase-api-version, accept, accept-profile, prefer, range, content-profile',
}

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  const url = new URL(request.url)
  const prefix = '/api/supabase/'
  const path = url.pathname.startsWith(prefix)
    ? url.pathname.slice(prefix.length)
    : ''
  const target = `${SUPABASE_ORIGIN}/${path}${url.search}`

  const headers = new Headers(request.headers)
  headers.delete('host')

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body:
        request.method !== 'GET' && request.method !== 'HEAD'
          ? request.body
          : undefined,
    })

    const outHeaders = new Headers(upstream.headers)
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      outHeaders.set(key, value)
    })

    return new Response(upstream.body, {
      status: upstream.status,
      headers: outHeaders,
    })
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : 'Supabase proxy failed',
      },
      { status: 502, headers: CORS_HEADERS },
    )
  }
}
