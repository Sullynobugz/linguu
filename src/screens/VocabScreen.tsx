import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../store/ProgressContext';
import { topics } from '../data/content';
import { words as allWords } from '../data/words';
import { useSpeak } from '../hooks/useSpeech';
import { t, getT, langNames } from '../i18n';
import { BilingualText } from '../components/BilingualText';
import type { Language, Word } from '../types';

interface VocabCard {
  phraseId: string;
  german: string;
  phonetics: string;
  native: string;
  nativeExample: string;
  germanExample: string;
  topicIcon: string;
}

function buildDeck(
  nativeLang: Language,
  targetLang: Language,
  mastery: Record<string, 0 | 1 | 2>
): VocabCard[] {
  const isGermanSpeaker = nativeLang === 'de'
  const all: VocabCard[] = [];
  for (const topic of topics) {
    for (const phrase of topic.phrases) {
      if (isGermanSpeaker) {
        // Vorne: Zielsprache (z.B. Ukrainisch) — was gelernt wird
        // Hinten: Deutsch — was der Nutzer schon kennt
        all.push({
          phraseId: phrase.id,
          german: getT(phrase.translations, targetLang) || phrase.german,
          phonetics: '',
          native: phrase.german,
          nativeExample: phrase.exampleDE,
          germanExample: getT(phrase.exampleTranslations, targetLang),
          topicIcon: topic.icon,
        });
      } else {
        // Standard: vorne Deutsch, hinten Muttersprache
        all.push({
          phraseId: phrase.id,
          german: phrase.german,
          phonetics: phrase.phonetics,
          native: getT(phrase.translations, nativeLang),
          nativeExample: getT(phrase.exampleTranslations, nativeLang),
          germanExample: phrase.exampleDE,
          topicIcon: topic.icon,
        });
      }
    }
  }
  return [...all].sort((a, b) => {
    const ma = mastery[a.phraseId] ?? 0;
    const mb = mastery[b.phraseId] ?? 0;
    return ma - mb;
  });
}

const targetLangLabel: Partial<Record<Language, string>> = {
  de: 'Deutsch', en: 'Englisch', tr: 'Türkisch', ar: 'Arabisch',
  es: 'Spanisch', uk: 'Ukrainisch', ru: 'Russisch', pl: 'Polnisch', ro: 'Rumänisch', ku: 'Kurdisch',
};


type VocabMode = 'phrases' | 'words';

interface WordCard {
  wordId: string;
  german: string;
  article?: string;
  type: Word['type'];
  native: string;
  topicId: string;
}

function buildWordDeck(nativeLang: Language, mastery: Record<string, 0 | 1 | 2>): WordCard[] {
  return [...allWords]
    .map(w => ({
      wordId: w.id,
      german: w.german,
      article: w.article,
      type: w.type,
      native: w.translations[nativeLang] ?? w.translations['en'] ?? w.german,
      topicId: w.topicId,
    }))
    .sort((a, b) => (mastery[a.wordId] ?? 0) - (mastery[b.wordId] ?? 0));
}

const typeLabel: Record<Word['type'], string> = {
  nomen: 'Nomen',
  verb: 'Verb',
  adjektiv: 'Adjektiv',
  ausdruck: 'Ausdruck',
};

const typeColor: Record<Word['type'], string> = {
  nomen: '#818cf8',
  verb: '#10b981',
  adjektiv: '#4f46e5',
  ausdruck: '#f472b6',
};

export function VocabScreen() {
  const navigate = useNavigate();
  const { progress, setVocabMastery, setWordMastery, addOpenAiCost, addXp } = useProgress();
  const lang = (progress.language ?? 'en') as Language;
  const targetLang = (progress.targetLanguage ?? 'de') as Language;
  const isGermanSpeaker = lang === 'de';
  const { speak, stop } = useSpeak();

  const [mode, setMode] = useState<VocabMode>('phrases');

  // Phrase deck
  const [phraseDeck] = useState<VocabCard[]>(() => buildDeck(lang, targetLang, progress.vocabMastery ?? {}));
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [phraseFlipped, setPhraseFlipped] = useState(false);
  const [phraseRated, setPhraseRated] = useState<Set<string>>(new Set());
  const [sessionPhraseMastery, setSessionPhraseMastery] = useState<Record<string, 0 | 1 | 2>>({ ...progress.vocabMastery });

  // Word deck
  const [wordDeck] = useState<WordCard[]>(() => buildWordDeck(lang, progress.wordMastery ?? {}));
  const [wordIdx, setWordIdx] = useState(0);
  const [wordFlipped, setWordFlipped] = useState(false);
  const [wordRated, setWordRated] = useState<Set<string>>(new Set());
  const [sessionWordMastery, setSessionWordMastery] = useState<Record<string, 0 | 1 | 2>>({ ...progress.wordMastery });

  // Card animation
  const [animatingOut, setAnimatingOut] = useState(false);
  const [animationType, setAnimationType] = useState<'repeat' | 'forward'>('forward');

  const autoPlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const idx = mode === 'phrases' ? phraseIdx : wordIdx;
  const card = mode === 'phrases' ? phraseDeck[phraseIdx] : null;
  const wcard = mode === 'words' ? wordDeck[wordIdx] : null;
  const total = mode === 'phrases' ? phraseDeck.length : wordDeck.length;
  const masteredCount = mode === 'phrases'
    ? Object.values(sessionPhraseMastery).filter(v => v === 2).length
    : Object.values(sessionWordMastery).filter(v => v === 2).length;
  const flipped = mode === 'phrases' ? phraseFlipped : wordFlipped;

  const germanText = mode === 'phrases'
    ? (card?.german ?? '')
    : wcard ? (wcard.article ? `${wcard.article} ${wcard.german}` : wcard.german) : '';

  const cancelAutoPlay = () => {
    if (autoPlayTimer.current) { clearTimeout(autoPlayTimer.current); autoPlayTimer.current = null; }
  };

  // Auto-play when card/word changes
  useEffect(() => {
    if (!germanText) return;
    autoPlayTimer.current = setTimeout(() => {
      speak(germanText, 0.9, u => addOpenAiCost(u.costEur), 'nova');
    }, 300);
    return () => { cancelAutoPlay(); stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, mode]);

  const handleFlip = useCallback(() => {
    if (mode === 'phrases') setPhraseFlipped(f => !f);
    else setWordFlipped(f => !f);
  }, [mode]);

  const handleRate = useCallback((level: 0 | 1 | 2) => {
    const type = level === 0 ? 'repeat' : 'forward';
    setAnimationType(type);
    setAnimatingOut(true);
    const delay = level === 0 ? 560 : 300;

    setTimeout(() => {
      if (mode === 'phrases') {
        if (!card) return;
        setVocabMastery(card.phraseId, level);
        setSessionPhraseMastery(prev => ({ ...prev, [card.phraseId]: level }));
        if (!phraseRated.has(card.phraseId)) {
          addXp(5);
          setPhraseRated(prev => new Set([...prev, card.phraseId]));
        }
        setPhraseFlipped(false);
        setPhraseIdx(i => i + 1);
      } else {
        if (!wcard) return;
        setWordMastery(wcard.wordId, level);
        setSessionWordMastery(prev => ({ ...prev, [wcard.wordId]: level }));
        if (!wordRated.has(wcard.wordId)) {
          addXp(3);
          setWordRated(prev => new Set([...prev, wcard.wordId]));
        }
        setWordFlipped(false);
        setWordIdx(i => i + 1);
      }
      setAnimatingOut(false);
    }, delay);
  }, [mode, card, wcard, phraseRated, wordRated, setVocabMastery, setWordMastery, addXp]);

  const handlePlayDE = (e: React.MouseEvent) => {
    e.stopPropagation();
    cancelAutoPlay();
    speak(germanText, 0.9, u => addOpenAiCost(u.costEur), 'nova');
  };

  const handlePlayNative = (e: React.MouseEvent) => {
    e.stopPropagation();
    cancelAutoPlay();
    const nativeText = mode === 'phrases' ? card?.native ?? '' : wcard?.native ?? '';
    speak(nativeText, 0.9, u => addOpenAiCost(u.costEur), 'shimmer');
  };

  const currentCard = mode === 'phrases' ? card : wcard;
  const isDone = !currentCard || idx >= total;

  if (isDone) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}
      >
        <div className="text-6xl mb-6">🎉</div>
        <h1
          className="text-2xl font-bold mb-3"
          style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', color: '#0f172a' }}
        >
          <BilingualText native={t('allMastered', lang)} de={t('allMastered', 'de')} lang={lang} />
        </h1>
        <p className="text-sm mb-8" style={{ color: '#64748b' }}>
          {masteredCount} / {total} {t('masteredCount', lang)}
        </p>
        <button
          onClick={() => { if (mode === 'phrases') setPhraseIdx(0); else setWordIdx(0); }}
          className="px-8 py-3.5 rounded-xl font-semibold text-sm mb-3"
          style={{ background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.4)', color: '#4f46e5' }}
        >
          ↩ <BilingualText native={t('again', lang)} de={t('again', 'de')} lang={lang} />
        </button>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3.5 rounded-xl font-semibold text-sm"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)', color: '#f8fafc' }}
        >
          <BilingualText native={t('overview', lang)} de={t('overview', 'de')} lang={lang} />
        </button>
      </div>
    );
  }

  const currentMastery = mode === 'phrases'
    ? (sessionPhraseMastery[(card as VocabCard).phraseId] ?? 0)
    : (sessionWordMastery[(wcard as WordCard).wordId] ?? 0);
  const masteryLabel = currentMastery === 2 ? '⭐' : currentMastery === 1 ? '📖' : '🆕';
  const topicIcon = mode === 'phrases' ? (card as VocabCard).topicIcon : '📖';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(248,250,252,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="text-sm transition-all"
          style={{ color: '#64748b' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#0f172a')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
        >
          ← <BilingualText native={t('overview', lang)} de={t('overview', 'de')} lang={lang} />
        </button>
        <span style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', color: '#0f172a', fontWeight: 700 }}>
          🃏 <BilingualText native={t('vocabTitle', lang)} de={t('vocabTitle', 'de')} lang={lang} />
        </span>
        <span className="text-sm font-semibold" style={{ color: '#4f46e5' }}>
          {idx + 1} / {total}
        </span>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 px-6 pt-4">
        {(['phrases', 'words'] as VocabMode[]).map(m => (
          <button
            key={m}
            onClick={() => { cancelAutoPlay(); stop(); setMode(m); }}
            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: mode === m ? 'rgba(79,70,229,0.18)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${mode === m ? 'rgba(79,70,229,0.5)' : 'rgba(0,0,0,0.06)'}`,
              color: mode === m ? '#4f46e5' : '#64748b',
            }}
          >
            <BilingualText
              native={t(m === 'phrases' ? 'vocabPhrases' : 'vocabWords', lang)}
              de={t(m === 'phrases' ? 'vocabPhrases' : 'vocabWords', 'de')}
              lang={lang}
            />
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 mt-3" style={{ background: 'rgba(0,0,0,0.05)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${(idx / total) * 100}%`,
            background: 'linear-gradient(90deg, #4f46e5, #a5b4fc)',
          }}
        />
      </div>

      {/* Stats row */}
      <div className="flex justify-center gap-6 pt-4 px-6">
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: '#10b981' }}>{masteredCount}</div>
          <div className="text-xs" style={{ color: '#64748b' }}>
            <BilingualText native={t('masteredCount', lang)} de={t('masteredCount', 'de')} lang={lang} />
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: '#4f46e5' }}>{total - masteredCount}</div>
          <div className="text-xs" style={{ color: '#64748b' }}>
            <BilingualText native={t('again', lang)} de={t('again', 'de')} lang={lang} />
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg">{topicIcon}</div>
          <div className="text-xs" style={{ color: '#64748b' }}>{masteryLabel}</div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex items-center justify-center px-6 py-4">
        <div className="w-full max-w-lg">

          {/* Card stack + flip */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            {/* Decorative stack cards behind */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 24,
              background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(0,0,0,0.04)',
              transform: 'translateY(10px) translateX(8px) rotate(2.5deg)',
              zIndex: 0,
            }} />
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 24,
              background: "rgba(203,213,225,0.6)", border: "1px solid rgba(0,0,0,0.04)",
              transform: 'translateY(5px) translateX(4px) rotate(1.2deg)',
              zIndex: 1,
            }} />

            {/* Animated card wrapper */}
            <div
              style={{
                position: 'relative', zIndex: 2,
                ...(animatingOut
                  ? animationType === 'repeat'
                    ? {
                        transform: 'translateX(60px) translateY(52px) rotate(9deg) scale(0.82)',
                        opacity: 0,
                        transition: 'transform 0.52s cubic-bezier(0.4, 0, 0.6, 1), opacity 0.44s ease',
                        pointerEvents: 'none' as const,
                      }
                    : {
                        transform: 'translateX(-110%) rotate(-6deg)',
                        opacity: 0,
                        transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.6, 1), opacity 0.24s ease',
                        pointerEvents: 'none' as const,
                      }
                  : {
                      transform: 'none',
                      opacity: 1,
                      transition: 'opacity 0.18s ease',
                    }),
              }}
            >
              {/* Flip container */}
              <div
                onClick={!animatingOut ? handleFlip : undefined}
                style={{ perspective: '1000px', cursor: animatingOut ? 'default' : 'pointer' }}
              >
                <div
                  style={{
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    minHeight: 220,
                  }}
                >
                  {/* Front */}
                  <div
                    style={{
                      position: 'absolute', inset: 0,
                      backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                      background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.07)',
                      borderRadius: 24, padding: '28px 28px 24px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      textAlign: 'center', minHeight: 220,
                    }}
                  >
                    {mode === 'words' && wcard && (
                      <span
                        className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-3"
                        style={{ background: `${typeColor[wcard.type]}18`, color: typeColor[wcard.type], border: `1px solid ${typeColor[wcard.type]}40` }}
                      >
                        {typeLabel[wcard.type]}
                      </span>
                    )}
                    {mode === 'words' && wcard?.article && (
                      <p className="text-base mb-1" style={{ color: '#818cf8', fontWeight: 500 }}>
                        {wcard.article}
                      </p>
                    )}
                    <h2
                      className="mb-3 leading-tight"
                      style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', color: '#0f172a', fontSize: 'clamp(26px, 6vw, 40px)', fontWeight: 700 }}
                    >
                      {mode === 'phrases' ? card?.german : wcard?.german}
                    </h2>
                    {mode === 'phrases' && card?.phonetics && (
                      <p className="font-mono text-sm mb-3" style={{ color: "rgba(15,23,42,0.4)" }}>
                        [{card.phonetics}]
                      </p>
                    )}
                    <button
                      onClick={handlePlayDE}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mt-1"
                      style={{ background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.3)', color: '#4f46e5' }}
                    >
                      🔊 {isGermanSpeaker ? (targetLangLabel[targetLang] ?? targetLang) : (langNames['de']?.[lang] ?? 'Auf Deutsch')}
                    </button>
                    {/* Prominenter Flip-Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFlip(); }}
                      className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm"
                      style={{
                        background: 'rgba(129,140,248,0.18)',
                        border: '1.5px solid rgba(129,140,248,0.5)',
                        color: '#a5b4fc',
                        boxShadow: '0 0 12px rgba(129,140,248,0.15)',
                      }}
                    >
                      ↩ <BilingualText native={t('tapToFlip', lang)} de={t('tapToFlip', 'de')} lang={lang} />
                    </button>
                  </div>

                  {/* Back */}
                  <div
                    style={{
                      position: 'absolute', inset: 0,
                      backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(99,102,241,0.4)',
                      borderRadius: 24, padding: '28px 28px 24px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      textAlign: 'center', minHeight: 220,
                    }}
                  >
                    <p
                      className="text-2xl font-bold mb-3"
                      style={{ color: '#818cf8', direction: lang === 'ar' ? 'rtl' : 'ltr' }}
                    >
                      {mode === 'phrases' ? card?.native : wcard?.native}
                    </p>
                    <button
                      onClick={handlePlayNative}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-3"
                      style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}
                    >
                      🔊 {isGermanSpeaker ? (langNames['de']?.[lang] ?? 'Auf Deutsch') : (langNames[lang]?.[lang] ?? lang)}
                    </button>
                    {mode === 'phrases' && card && (
                      <div
                        className="w-full rounded-xl p-3 text-sm"
                        style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}
                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      >
                        <p style={{ color: '#0f172a', fontStyle: 'italic' }}>„{card.germanExample}"</p>
                        <p className="mt-1" style={{ color: '#64748b', fontSize: 12 }}>{card.nativeExample}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rating buttons — immer sichtbar wenn geflippt, gesperrt während Animation */}
          {flipped ? (
            <div className="grid grid-cols-3 gap-3">
              {([
                { level: 0 as const, icon: '🔄', labelNative: t('again', lang), labelDE: t('again', 'de'), color: '#ef4444', bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.45)' },
                { level: 1 as const, icon: '👍', labelNative: t('good', lang), labelDE: t('good', 'de'), color: '#4f46e5', bg: 'rgba(79,70,229,0.14)', border: 'rgba(79,70,229,0.45)' },
                { level: 2 as const, icon: '⭐', labelNative: t('mastered', lang), labelDE: t('mastered', 'de'), color: '#10b981', bg: 'rgba(16,185,129,0.14)', border: 'rgba(16,185,129,0.45)' },
              ]).map(({ level, icon, labelNative, labelDE, color, bg, border }) => (
                <button
                  key={level}
                  onClick={() => !animatingOut && handleRate(level)}
                  disabled={animatingOut}
                  className="py-4 rounded-2xl font-semibold text-sm flex flex-col items-center gap-1.5 transition-opacity"
                  style={{
                    background: bg,
                    border: `2px solid ${border}`,
                    color,
                    opacity: animatingOut ? 0.4 : 1,
                    boxShadow: `0 2px 12px ${bg}`,
                  }}
                >
                  <span className="text-2xl">{icon}</span>
                  <BilingualText native={labelNative} de={labelDE} lang={lang} />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs" style={{ color: 'rgba(139,143,168,0.5)' }}>
              <BilingualText native={t('vocabSubtitle', lang)} de={t('vocabSubtitle', 'de')} lang={lang} />
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
