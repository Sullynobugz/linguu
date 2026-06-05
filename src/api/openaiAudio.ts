
// Cost constants (USD → EUR @ 0.92)
const TTS_COST_PER_CHAR = 0.000015 * 0.92;    // $0.015 / 1K chars
const WHISPER_COST_PER_SEC = (0.006 / 60) * 0.92; // $0.006 / min

export interface AudioUsage {
  costEur: number;
  detail: string;
}

// ── TTS CACHE ────────────────────────────────────────────────────
// Speichert Blob-URLs im Speicher — vermeidet doppelte API-Anfragen
// und reduziert Latenz bei wiederholten Phrasen erheblich.
const ttsCache = new Map<string, string>();
const MAX_CACHE_SIZE = 60;

function ttsCacheKey(text: string, voice: string, speed: number) {
  return `${voice}:${speed}:${text}`;
}

function evictOldestCacheEntry() {
  const firstKey = ttsCache.keys().next().value;
  if (firstKey) {
    const url = ttsCache.get(firstKey)!;
    URL.revokeObjectURL(url);
    ttsCache.delete(firstKey);
  }
}

// ── TEXT-TO-SPEECH ──────────────────────────────────────────────
// Returns an <Audio> element ready to play, or throws.
export async function ttsSpeak(
  text: string,
  speed = 0.9,
  onUsage?: (u: AudioUsage) => void,
  voice = 'nova'
): Promise<HTMLAudioElement> {
  const cacheKey = ttsCacheKey(text, voice, speed);
  let url = ttsCache.get(cacheKey);

  if (!url) {
    const response = await fetch('/api/openai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tts-1', input: text, voice, speed }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`TTS error ${response.status}: ${err}`);
    }

    const blob = await response.blob();
    url = URL.createObjectURL(blob);

    if (ttsCache.size >= MAX_CACHE_SIZE) evictOldestCacheEntry();
    ttsCache.set(cacheKey, url);

    if (onUsage) {
      const costEur = text.length * TTS_COST_PER_CHAR;
      console.log(`[Linguu Audio] TTS | ${text.length} chars | €${costEur.toFixed(5)}`);
      onUsage({ costEur, detail: `TTS ${text.length} chars` });
    }
  }

  return new Audio(url);
}

// ── SPEECH-TO-TEXT (WHISPER) ────────────────────────────────────
export async function whisperTranscribe(
  audioBlob: Blob,
  durationSec: number,
  onUsage?: (u: AudioUsage) => void,
  lang = 'de'
): Promise<string> {
  const formData = new FormData();
  const ext = audioBlob.type.includes('ogg') ? 'ogg'
    : audioBlob.type.includes('mp4') ? 'mp4'
    : 'webm';
  formData.append('file', audioBlob, `recording.${ext}`);
  formData.append('model', 'whisper-1');
  formData.append('language', lang);

  const response = await fetch('/api/openai/whisper', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Whisper error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const transcript: string = data.text ?? '';

  if (onUsage) {
    const costEur = durationSec * WHISPER_COST_PER_SEC;
    const usage: AudioUsage = { costEur, detail: `Whisper ${Math.round(durationSec)}s` };
    console.log(`[Linguu Audio] Whisper | ${Math.round(durationSec)}s | €${costEur.toFixed(5)}`);
    onUsage(usage);
  }

  return transcript;
}
