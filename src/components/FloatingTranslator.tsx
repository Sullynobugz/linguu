import { useState, useCallback, useRef, useEffect } from 'react';
import { useProgress } from '../store/ProgressContext';
import { useAudio } from '../store/AudioContext';
import { translateText } from '../api/claude';
import { whisperTranscribe, ttsSpeak } from '../api/openaiAudio';
import type { Language } from '../types';

const ttsVoice: Partial<Record<Language, string>> = {
  de: 'nova', en: 'alloy', ar: 'shimmer', uk: 'shimmer',
  es: 'nova', tr: 'echo', pl: 'echo', ro: 'echo', ru: 'shimmer',
};

const LANGS: { code: Language; label: string; flag: string }[] = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'ro', label: 'Română', flag: '🇷🇴' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

function useSide(voiceRef: React.MutableRefObject<boolean>, mutedRef: React.MutableRefObject<boolean>, addOpenAiCost: (n: number) => void, addClaudeCost: (n: number) => void) {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(0);
  const fromRef = useRef<Language>('de');
  const toRef = useRef<Language>('en');

  const toggle = useCallback(async (fromLang: Language, toLang: Language) => {
    if (listening) {
      recorderRef.current?.stop();
      return;
    }

    fromRef.current = fromLang;
    toRef.current = toLang;
    setTranscript('');
    setTranslation('');

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setTranscript('Kein Mikrofon-Zugriff');
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;
    chunksRef.current = [];
    startTimeRef.current = Date.now();

    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      setListening(false);
      setProcessing(true);

      const duration = (Date.now() - startTimeRef.current) / 1000;
      const blob = new Blob(chunksRef.current, { type: mimeType });

      try {
        const text = await whisperTranscribe(blob, duration, u => addOpenAiCost(u.costEur), fromRef.current);
        setTranscript(text);

        let full = '';
        await translateText(
          text,
          fromRef.current,
          toRef.current,
          chunk => { full += chunk; setTranslation(full); },
          usage => addClaudeCost(usage.costEur)
        );

        if (voiceRef.current && full && !mutedRef.current) {
          try {
            const voice = ttsVoice[toRef.current] ?? 'nova';
            const audio = await ttsSpeak(full, 1.0, u => addOpenAiCost(u.costEur), voice);
            await audio.play();
          } catch { /* ignore TTS errors */ }
        }
      } catch (err) {
        console.error('Translator error:', err);
        setTranscript('— Fehler beim Übersetzen —');
      } finally {
        setProcessing(false);
      }
    };

    recorder.start();
    setListening(true);
  }, [listening, voiceRef]);

  useEffect(() => {
    if (!listening) return;
    const t = setTimeout(() => recorderRef.current?.stop(), 15000);
    return () => clearTimeout(t);
  }, [listening]);

  return { listening, processing, transcript, translation, toggle };
}

interface PanelProps {
  lang: Language;
  onLangChange: (l: Language) => void;
  side: ReturnType<typeof useSide>;
  toLang: Language;
}

function Panel({ lang, onLangChange, side, toLang }: PanelProps) {
  const isRtlInput = lang === 'ar';
  const isRtlOutput = toLang === 'ar';

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <select
          value={lang}
          onChange={e => onLangChange(e.target.value as Language)}
          style={{
            flex: 1,
            background: 'rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 8,
            color: '#0f172a',
            fontSize: 13,
            padding: '6px 8px',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {LANGS.map(l => (
            <option key={l.code} value={l.code} style={{ background: '#ffffff' }}>
              {l.flag} {l.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => side.toggle(lang, toLang)}
          disabled={side.processing}
          title={side.listening ? 'Aufnahme stoppen' : 'Aufnahme starten'}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: 'none',
            background: side.listening ? 'rgba(239,68,68,0.25)' : 'rgba(99,102,241,0.2)',
            outline: side.listening ? '2px solid rgba(239,68,68,0.6)' : '2px solid rgba(99,102,241,0.4)',
            cursor: side.processing ? 'not-allowed' : 'pointer',
            fontSize: 18,
            flexShrink: 0,
            transition: 'all 0.2s',
            animation: side.listening ? 'pulse 1.2s ease-in-out infinite' : 'none',
          }}
        >
          {side.processing ? '⏳' : side.listening ? '⏹' : '🎤'}
        </button>
      </div>

      <div style={{ minHeight: 48 }}>
        {side.listening && (
          <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>● Aufnahme läuft…</p>
        )}
        {side.processing && !side.transcript && (
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Erkenne Sprache…</p>
        )}
        {!side.transcript && !side.listening && !side.processing && (
          <p style={{ fontSize: 12, color: 'rgba(100,116,139,0.4)', margin: 0, textAlign: 'center' }}>
            🎤 Tippen zum Aufnehmen
          </p>
        )}

        {side.transcript && (
          <p
            style={{
              fontSize: 13,
              color: '#c8c9d4',
              margin: '0 0 6px',
              direction: isRtlInput ? 'rtl' : 'ltr',
              lineHeight: 1.4,
            }}
          >
            {side.transcript}
          </p>
        )}

        {side.translation && (
          <p
            style={{
              fontSize: 13,
              color: '#818cf8',
              margin: 0,
              direction: isRtlOutput ? 'rtl' : 'ltr',
              lineHeight: 1.4,
              borderLeft: isRtlOutput ? 'none' : '2px solid rgba(99,102,241,0.4)',
              borderRight: isRtlOutput ? '2px solid rgba(99,102,241,0.4)' : 'none',
              paddingLeft: isRtlOutput ? 0 : 8,
              paddingRight: isRtlOutput ? 8 : 0,
            }}
          >
            {side.translation}
          </p>
        )}
      </div>
    </div>
  );
}

export function FloatingTranslator() {
  const { progress, addOpenAiCost, addClaudeCost } = useProgress();
  const { muted } = useAudio();
  const [open, setOpen] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(false);
  const voiceRef = useRef(voiceOutput);
  const mutedRef = useRef(muted);
  useEffect(() => { voiceRef.current = voiceOutput; }, [voiceOutput]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const [langA, setLangA] = useState<Language>('de');
  const [langB, setLangB] = useState<Language>(() => {
    const native = progress.language as Language | null;
    if (!native || native === 'de') return 'en';
    return native;
  });

  const sideA = useSide(voiceRef, mutedRef, addOpenAiCost, addClaudeCost);
  const sideB = useSide(voiceRef, mutedRef, addOpenAiCost, addClaudeCost);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Simultanübersetzer öffnen"
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'rgba(99,102,241,0.9)',
          border: 'none',
          boxShadow: '0 4px 20px rgba(99,102,241,0.45)',
          cursor: 'pointer',
          fontSize: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}
      >
        🌐
      </button>
    );
  }

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          width: 'min(360px, calc(100vw - 24px))',
          background: '#12151f',
          border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            background: 'rgba(99,102,241,0.08)',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
            🌐 Simultanübersetzer
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setVoiceOutput(v => !v)}
              title={voiceOutput ? 'Sprachausgabe deaktivieren' : 'Sprachausgabe aktivieren'}
              style={{
                background: voiceOutput ? 'rgba(99,102,241,0.3)' : 'rgba(0,0,0,0.05)',
                border: voiceOutput ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(0,0,0,0.07)',
                borderRadius: 8,
                color: voiceOutput ? '#818cf8' : '#64748b',
                fontSize: 16,
                width: 32,
                height: 32,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {voiceOutput ? '🔊' : '🔇'}
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.07)',
                borderRadius: 8,
                color: '#64748b',
                fontSize: 14,
                width: 32,
                height: 32,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Person A */}
        <Panel lang={langA} onLangChange={setLangA} side={sideA} toLang={langB} />

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', margin: '0 16px' }} />

        {/* Person B */}
        <Panel lang={langB} onLangChange={setLangB} side={sideB} toLang={langA} />
      </div>
    </>
  );
}
