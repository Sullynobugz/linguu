const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;

// Cost constants (USD → EUR @ 0.92)
const TTS_COST_PER_CHAR = 0.000015 * 0.92;    // $0.015 / 1K chars
const WHISPER_COST_PER_SEC = (0.006 / 60) * 0.92; // $0.006 / min

export interface AudioUsage {
  costEur: number;
  detail: string;
}

// ── TEXT-TO-SPEECH ──────────────────────────────────────────────
// Returns an <Audio> element ready to play, or throws.
export async function ttsSpeak(
  text: string,
  speed = 0.9,
  onUsage?: (u: AudioUsage) => void,
  voice = 'nova'
): Promise<HTMLAudioElement> {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice,
      speed,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`TTS error ${response.status}: ${err}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  if (onUsage) {
    const costEur = text.length * TTS_COST_PER_CHAR;
    const usage: AudioUsage = { costEur, detail: `TTS ${text.length} chars` };
    console.log(`[Linguu Audio] TTS | ${text.length} chars | €${costEur.toFixed(5)}`);
    onUsage(usage);
  }

  return audio;
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

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}` },
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
