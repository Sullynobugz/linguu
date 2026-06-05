import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (body.stream) {
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') ?? 'text/event-stream' },
    })
  }

  const data = await upstream.json()
  return NextResponse.json(data, { status: upstream.status })
}
