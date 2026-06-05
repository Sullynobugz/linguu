import type { Language, ApiUsage } from '../types';

const MODEL = 'claude-sonnet-4-20250514';
const INPUT_COST_PER_MTOK = 3;
const OUTPUT_COST_PER_MTOK = 15;
const EUR_RATE = 0.92;

const LANG_NAMES: Record<Language, string> = {
  de: 'German',
  ar: 'Arabic',
  uk: 'Ukrainian',
  es: 'Spanish',
  en: 'English',
  tr: 'Turkish',
  pl: 'Polish',
  ro: 'Romanian',
  ru: 'Russian',
  ku: 'Kurdish (Kurmanji)',
};

function calcCostEur(inputTokens: number, outputTokens: number): number {
  const usd =
    (inputTokens / 1_000_000) * INPUT_COST_PER_MTOK +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_MTOK;
  return usd * EUR_RATE;
}

function logUsage(label: string, usage: ApiUsage) {
  console.log(
    `[Linguu API] ${label} | in: ${usage.inputTokens} tok | out: ${usage.outputTokens} tok | cost: €${usage.costEur.toFixed(4)}`
  );
}

async function streamRequest(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  onChunk: (text: string) => void,
  onDone: (usage: ApiUsage) => void
): Promise<void> {
  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let inputTokens = 0;
  let outputTokens = 0;
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const event = JSON.parse(data);
        if (event.type === 'content_block_delta' && event.delta?.text) onChunk(event.delta.text);
        if (event.type === 'message_start' && event.message?.usage) inputTokens = event.message.usage.input_tokens;
        if (event.type === 'message_delta' && event.usage) outputTokens = event.usage.output_tokens;
      } catch { /* ignore */ }
    }
  }

  const usage: ApiUsage = { inputTokens, outputTokens, costEur: calcCostEur(inputTokens, outputTokens) };
  onDone(usage);
}

export async function translateText(
  text: string,
  fromLang: Language,
  toLang: Language,
  onChunk: (text: string) => void,
  onDone: (usage: ApiUsage) => void
): Promise<void> {
  const system = `You are a precise real-time interpreter. Translate the text from ${LANG_NAMES[fromLang]} to ${LANG_NAMES[toLang]}. Output only the translation — no explanation, no quotes, no extra text. Preserve formality and tone.`;
  await streamRequest(system, text, 300, onChunk, (u) => { logUsage('translateText', u); onDone(u); });
}

export async function explainPhrase(
  phrase: string,
  nativeLang: Language,
  targetLang: Language,
  onChunk: (text: string) => void,
  onDone: (usage: ApiUsage) => void
): Promise<void> {
  const system = `You are a friendly language tutor helping someone learn ${LANG_NAMES[targetLang]}.
Respond in ${LANG_NAMES[nativeLang]} (the user's native language).
Be warm, encouraging, and practical. Keep responses concise (3-5 sentences max).`;
  const user = `Explain when and how to use the ${LANG_NAMES[targetLang]} phrase: "${phrase}"
Include: 1) When to use it 2) Tone (formal/informal) 3) One practical tip for remembering it.`;
  await streamRequest(system, user, 300, onChunk, (u) => { logUsage('explainPhrase', u); onDone(u); });
}

export async function getEncouragingMessage(
  language: Language,
  score: number,
  total: number,
  onDone: (text: string, usage: ApiUsage) => void
): Promise<void> {
  const perfect = score === total;
  const prompt = perfect
    ? `Give a warm, short (2 sentences) congratulations message in ${LANG_NAMES[language]} for someone who just got a perfect quiz score (${score}/${total}) in their German language learning app. Make it feel personal and motivating.`
    : `Give a warm, short (2 sentences) encouraging message in ${LANG_NAMES[language]} for someone who scored ${score}/${total} on their German quiz. Acknowledge the effort and motivate them to keep going. Be kind, not patronizing.`;

  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 150, messages: [{ role: 'user', content: prompt }] }),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const data = await response.json();
  const text = data.content[0]?.text ?? '';
  const inputTokens = data.usage?.input_tokens ?? 0;
  const outputTokens = data.usage?.output_tokens ?? 0;
  const usage: ApiUsage = { inputTokens, outputTokens, costEur: calcCostEur(inputTokens, outputTokens) };
  logUsage('getEncouragingMessage', usage);
  onDone(text, usage);
}
