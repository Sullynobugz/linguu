import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const formData = await req.formData()

  const upstream = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: formData,
  })

  const data = await upstream.json()
  return NextResponse.json(data, { status: upstream.status })
}
