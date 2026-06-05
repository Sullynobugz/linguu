// WID-Code: verknüpft Linguu-Aktivität mit WID-Koordinator-Dashboard

const KEY = 'linguu_wid_code'
const WID_API = 'https://wid.techstag.de/api/participant/track'

export function getWidCode(): string | null {
  try { return localStorage.getItem(KEY) } catch { return null }
}

export function setWidCode(code: string): void {
  try { localStorage.setItem(KEY, code.trim().toUpperCase()) } catch {}
}

export function clearWidCode(): void {
  try { localStorage.removeItem(KEY) } catch {}
}

export async function trackProgress(data: {
  topicId: string
  lessonType: 'phrases' | 'vocab' | 'quiz'
  score?: number
  xpEarned?: number
  durationSeconds?: number
}): Promise<void> {
  const code = getWidCode()
  if (!code) return
  try {
    await fetch(WID_API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        participantCode: code,
        app: 'linguu',
        type: 'progress',
        data,
      }),
    })
  } catch { /* Tracking ist optional */ }
}

export async function trackAssessment(data: {
  sessionId: string
  level: string
  score: number
  total: number
  durationSec: number
  answers: unknown[]
}): Promise<void> {
  const code = getWidCode()
  if (!code) return
  try {
    await fetch(WID_API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        participantCode: code,
        app: 'linguu',
        type: 'assessment',
        data,
      }),
    })
  } catch {}
}
