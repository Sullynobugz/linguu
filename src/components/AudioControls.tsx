import { useState, useEffect } from 'react';
import { useSpeak, useListen } from '../hooks/useSpeech';
import { useProgress } from '../store/ProgressContext';
import type { Language } from '../types';

const nativeLangLabel: Record<Language, string> = {
  ar: 'بالعربية',
  uk: 'Українською',
  es: 'En español',
  en: 'In English',
  tr: 'Türkçe\'de',
  pl: 'Po polsku',
  ro: 'În română',
  ru: 'На русском',
  de: 'Auf Deutsch',
};

const labels = {
  slow:       { ar: 'ببطء',       uk: 'Повільно',    es: 'Despacio',    en: 'Slow',        tr: 'Yavaş',    pl: 'Wolno',      ro: 'Încet',     ru: 'Медленно',  de: 'Langsam'    },
  speak:      { ar: 'تحدث',       uk: 'Говорити',    es: 'Hablar',      en: 'Speak',       tr: 'Konuş',    pl: 'Mów',        ro: 'Vorbești',  ru: 'Говорить',  de: 'Sprechen'   },
  stop:       { ar: 'إيقاف',      uk: 'Стоп',        es: 'Parar',       en: 'Stop',        tr: 'Dur',      pl: 'Stop',       ro: 'Stop',      ru: 'Стоп',      de: 'Stop'       },
  loading:    { ar: 'جارٍ...',    uk: 'Завантаж...',  es: 'Cargando...', en: 'Loading...',  tr: 'Yüklüyor...',pl: 'Ładowanie...',ro: 'Încarcă...',ru: 'Загрузка...', de: 'Laden...'  },
  processing: { ar: 'معالجة...',  uk: 'Обробка...',   es: 'Procesando...',en: 'Processing...',tr: 'İşleniyor...',pl: 'Przetwarza...',ro: 'Procesează...',ru: 'Обработка...',de: 'Verarbeite...' },
  listening:  { ar: '● يستمع...', uk: '● Запис...',   es: '● Grabando...', en: '● Recording...',tr: '● Kaydediliyor...',pl: '● Nagrywa...',ro: '● Înregistrează...',ru: '● Запись...',de: '● Aufnahme...' },
  close:      { ar: 'إغلاق',      uk: 'закрити',     es: 'cerrar',      en: 'close',       tr: 'kapat',    pl: 'zamknij',    ro: 'închide',   ru: 'закрыть',   de: 'schließen'  },
  feedback: {
    perfect:   { ar: '🎉 ممتاز! نطق رائع!', uk: '🎉 Чудово! Ідеальна вимова!', es: '🎉 ¡Perfecto!', en: '🎉 Perfect pronunciation!', tr: '🎉 Mükemmel!', pl: '🎉 Idealnie!', ro: '🎉 Perfect!', ru: '🎉 Отлично!', de: '🎉 Perfekt!' },
    good:      { ar: '👍 جيد! استمر في التدرب', uk: '👍 Добре! Продовжуй', es: '👍 ¡Bien! Sigue practicando', en: '👍 Good! Keep practicing', tr: '👍 İyi! Devam et', pl: '👍 Dobrze! Ćwicz dalej', ro: '👍 Bine! Continuă', ru: '👍 Хорошо! Продолжай', de: '👍 Gut! Weiter üben' },
    try_again: { ar: '🔄 حاول مرة أخرى', uk: '🔄 Спробуй ще раз', es: '🔄 Inténtalo de nuevo', en: '🔄 Try again', tr: '🔄 Tekrar dene', pl: '🔄 Spróbuj ponownie', ro: '🔄 Încearcă din nou', ru: '🔄 Попробуй ещё раз', de: '🔄 Nochmal versuchen' },
  },
};

const statusColor = { perfect: '#10b981', good: '#f59e0b', try_again: '#ef4444' };

interface AudioControlsProps {
  germanPhrase: string;
  nativeTranslation?: string;
  lang: Language;
  compact?: boolean;
  learnLangLabel?: string;
}

export function AudioControls({ germanPhrase, nativeTranslation, lang, compact = false, learnLangLabel }: AudioControlsProps) {
  const { addOpenAiCost } = useProgress();
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
    speak(germanPhrase, 0.9, u => addOpenAiCost(u.costEur), 'nova');
  };

  const handleListenNative = () => {
    if (!nativeTranslation) return;
    if (isActive) { stopSpeak(); return; }
    setActiveVoice('native');
    speak(nativeTranslation, 0.9, u => addOpenAiCost(u.costEur), 'shimmer');
  };

  const handleSlow = () => {
    if (isActive) { stopSpeak(); return; }
    setActiveVoice('de');
    speak(germanPhrase, 0.6, u => addOpenAiCost(u.costEur), 'nova');
  };

  const handleMic = () => {
    if (listening) { stopListen(); return; }
    if (processing) return;
    reset();
    listen(germanPhrase, u => addOpenAiCost(u.costEur));
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
        {ttsLoading && activeVoice === 'de' ? labels.loading[lang] ?? labels.loading['en'] : speaking && activeVoice === 'de' ? labels.stop[lang] ?? labels.stop['en'] : learnLangLabel ?? 'Auf Deutsch'}
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
              {deActive ? labels.stop[lang] ?? labels.stop['en'] : learnLangLabel ?? 'Auf Deutsch'}
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
                {natActive ? labels.stop[lang] ?? labels.stop['en'] : nativeLangLabel[lang]}
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
          title={labels.slow[lang] ?? labels.slow['en']}
        >
          <span>🐢</span>
          <span>{labels.slow[lang] ?? labels.slow['en']}</span>
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
            {processing ? labels.processing[lang] ?? labels.processing['en'] : listening ? labels.listening[lang] ?? labels.listening['en'] : labels.speak[lang] ?? labels.speak['en']}
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
              {labels.feedback[result.status][lang] ?? labels.feedback[result.status]['en']}
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
            ✕ {labels.close[lang] ?? labels.close['en']}
          </button>
        </div>
      )}
    </div>
  );
}
