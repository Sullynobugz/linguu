import { useState, useEffect } from 'react';
import { useSpeak, useListen } from '../hooks/useSpeech';
import { useProgress } from '../store/ProgressContext';
import type { Language } from '../types';

const nativeLangLabel: Record<Language, string> = {
  ar: 'بالعربية',
  uk: 'Українською',
  es: 'En español',
  en: 'In English',
};

const labels = {
  listenDE:   { ar: 'بالألمانية', uk: 'Deutsch', es: 'Auf Deutsch', en: 'Auf Deutsch' },
  slow:       { ar: 'ببطء', uk: 'Повільно', es: 'Despacio', en: 'Slow' },
  speak:      { ar: 'تحدث', uk: 'Говорити', es: 'Hablar', en: 'Speak' },
  stop:       { ar: 'إيقاف', uk: 'Стоп', es: 'Parar', en: 'Stop' },
  loading:    { ar: 'جارٍ...', uk: 'Завантаж...', es: 'Cargando...', en: 'Loading...' },
  processing: { ar: 'معالجة...', uk: 'Обробка...', es: 'Procesando...', en: 'Processing...' },
  listening:  { ar: '● يستمع...', uk: '● Запис...', es: '● Grabando...', en: '● Recording...' },
  close:      { ar: 'إغلاق', uk: 'закрити', es: 'cerrar', en: 'close' },
  feedback: {
    perfect:   { ar: '🎉 ممتاز! نطق رائع!', uk: '🎉 Чудово! Ідеальна вимова!', es: '🎉 ¡Perfecto!', en: '🎉 Perfect pronunciation!' },
    good:      { ar: '👍 جيد! استمر في التدرب', uk: '👍 Добре! Продовжуй', es: '👍 ¡Bien! Sigue practicando', en: '👍 Good! Keep practicing' },
    try_again: { ar: '🔄 حاول مرة أخرى', uk: '🔄 Спробуй ще раз', es: '🔄 Inténtalo de nuevo', en: '🔄 Try again' },
  },
} as const;

const statusColor = { perfect: '#10b981', good: '#f59e0b', try_again: '#ef4444' };

interface AudioControlsProps {
  germanPhrase: string;
  nativeTranslation?: string;
  lang: Language;
  compact?: boolean;
}

export function AudioControls({ germanPhrase, nativeTranslation, lang, compact = false }: AudioControlsProps) {
  const { addApiCost } = useProgress();
  const { speak, stop: stopSpeak, speaking, loading: ttsLoading } = useSpeak();
  const { listen, stop: stopListen, reset, listening, processing, result } = useListen();
  const [activeVoice, setActiveVoice] = useState<'de' | 'native' | null>(null);

  const isActive = speaking || ttsLoading;

  // Reset which button is active once playback fully ends
  useEffect(() => {
    if (!speaking && !ttsLoading) setActiveVoice(null);
  }, [speaking, ttsLoading]);

  const handleListenDE = () => {
    if (isActive) { stopSpeak(); return; }
    setActiveVoice('de');
    speak(germanPhrase, 0.9, u => addApiCost(u.costEur), 'nova');
  };

  const handleListenNative = () => {
    if (!nativeTranslation) return;
    if (isActive) { stopSpeak(); return; }
    setActiveVoice('native');
    speak(nativeTranslation, 0.9, u => addApiCost(u.costEur), 'shimmer');
  };

  const handleSlow = () => {
    if (isActive) { stopSpeak(); return; }
    setActiveVoice('de');
    speak(germanPhrase, 0.6, u => addApiCost(u.costEur), 'nova');
  };

  const handleMic = () => {
    if (listening) { stopListen(); return; }
    if (processing) return;
    reset();
    listen(germanPhrase, u => addApiCost(u.costEur));
  };

  if (compact) {
    return (
      <button
        onClick={handleListenDE}
        disabled={ttsLoading && activeVoice === null}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
        style={{
          background: speaking && activeVoice === 'de' ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.12)',
          border: '1px solid rgba(245,158,11,0.3)',
          color: '#f59e0b',
          opacity: ttsLoading && activeVoice === null ? 0.7 : 1,
        }}
      >
        {ttsLoading && activeVoice === 'de' ? '⏳' : speaking && activeVoice === 'de' ? '⏹' : '🔊'}
        {ttsLoading && activeVoice === 'de' ? labels.loading[lang] : speaking && activeVoice === 'de' ? labels.stop[lang] : 'Auf Deutsch'}
      </button>
    );
  }

  const deActive = isActive && activeVoice === 'de';
  const natActive = isActive && activeVoice === 'native';

  return (
    <div className="w-full">
      {/* Primary audio buttons — two large, side by side */}
      <div className="grid grid-cols-2 gap-2 mb-2">

        {/* 🔊 Auf Deutsch */}
        <button
          onClick={handleListenDE}
          disabled={ttsLoading && !deActive}
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{
            background: deActive ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.1)',
            border: `2px solid ${deActive ? '#f59e0b' : 'rgba(245,158,11,0.35)'}`,
            color: '#f59e0b',
            opacity: ttsLoading && !deActive ? 0.5 : 1,
          }}
        >
          <span className="text-base">{ttsLoading && !deActive ? '⏳' : deActive ? '⏹' : '🔊'}</span>
          <div className="text-left">
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {deActive ? labels.stop[lang] : 'Auf Deutsch'}
            </div>
          </div>
        </button>

        {/* 🔊 Native language */}
        {nativeTranslation ? (
          <button
            onClick={handleListenNative}
            disabled={ttsLoading && !natActive}
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200"
            style={{
              background: natActive ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.1)',
              border: `2px solid ${natActive ? '#818cf8' : 'rgba(99,102,241,0.35)'}`,
              color: '#818cf8',
              opacity: ttsLoading && !natActive ? 0.5 : 1,
            }}
          >
            <span className="text-base">{ttsLoading && !natActive ? '⏳' : natActive ? '⏹' : '🔊'}</span>
            <div className="text-left">
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {natActive ? labels.stop[lang] : nativeLangLabel[lang]}
              </div>
            </div>
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* Secondary row: slow + mic */}
      <div className="flex gap-2">
        {/* Slow speed */}
        <button
          onClick={handleSlow}
          disabled={ttsLoading && !deActive}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
          style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.2)',
            color: 'rgba(245,158,11,0.75)',
            opacity: ttsLoading && !deActive ? 0.5 : 1,
          }}
          title={labels.slow[lang]}
        >
          <span>🐢</span>
          <span>{labels.slow[lang]}</span>
        </button>

        {/* Mic — Whisper */}
        <button
          onClick={handleMic}
          disabled={processing}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all duration-200"
          style={{
            background: listening ? 'rgba(239,68,68,0.15)' : processing ? 'rgba(139,143,168,0.1)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${listening ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
            color: listening ? '#ef4444' : processing ? '#8b8fa8' : '#8b8fa8',
          }}
        >
          <span className="text-base">{processing ? '⏳' : listening ? '🔴' : '🎤'}</span>
          <span>
            {processing ? labels.processing[lang] : listening ? labels.listening[lang] : labels.speak[lang]}
          </span>
        </button>
      </div>

      {/* Pronunciation result */}
      {result && (
        <div
          className="mt-3 rounded-xl px-4 py-3 text-sm animate-fade-in-up"
          style={{
            background: `${statusColor[result.status]}12`,
            border: `1px solid ${statusColor[result.status]}40`,
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span style={{ color: statusColor[result.status], fontWeight: 600, direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
              {labels.feedback[result.status][lang]}
            </span>
            <span className="text-sm font-bold" style={{ color: statusColor[result.status] }}>
              {result.score}%
            </span>
          </div>
          {result.transcript && (
            <p className="text-xs mt-1 italic" style={{ color: 'rgba(240,237,232,0.4)' }}>
              „{result.transcript}"
            </p>
          )}
          <div className="mt-2 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${result.score}%`, background: statusColor[result.status] }}
            />
          </div>
          <button onClick={reset} className="mt-2 text-xs" style={{ color: 'rgba(139,143,168,0.5)' }}>
            ✕ {labels.close[lang]}
          </button>
        </div>
      )}
    </div>
  );
}
