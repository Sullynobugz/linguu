import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()

  const upstream = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!upstream.ok) {
    return NextResponse.json({ error: 'TTS error' }, { status: upstream.status })
  }

  return new Response(upstream.body, {
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'audio/mpeg' },
  })
}
