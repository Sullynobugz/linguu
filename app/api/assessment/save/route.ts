import { NextResponse } from 'next/server'

// Speichert Assessment-Ergebnisse in WIDs Supabase (shared DB)
// Kein Auth erforderlich — user_id bleibt null für anonyme Linguu-Nutzer
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(req: Request) {
  const body = await req.json()
  const { sessionId, level, score, total, duration, answers } = body

  if (!sessionId || !level || score == null || total == null) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    // Supabase nicht konfiguriert — still ignorieren
    return NextResponse.json({ ok: true, saved: false })
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/assessment_results`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates',
    },
    body: JSON.stringify({
      session_id: sessionId,
      level,
      score,
      total,
      answers: answers ?? [],
      duration_sec: duration ?? 0,
      user_id: null,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[assessment/save]', err)
    return NextResponse.json({ ok: false, error: err }, { status: 500 })
  }

  return NextResponse.json({ ok: true, saved: true })
}
