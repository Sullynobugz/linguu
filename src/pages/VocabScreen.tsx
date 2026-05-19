import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../store/ProgressContext';
import { topics } from '../data/content';
import { useSpeak } from '../hooks/useSpeech';
import { t, getT } from '../i18n';
import type { Language } from '../types';

interface VocabCard {
  phraseId: string;
  german: string;
  phonetics: string;
  native: string;
  nativeExample: string;
  germanExample: string;
  topicIcon: string;
}

function buildDeck(lang: Language, mastery: Record<string, 0 | 1 | 2>): VocabCard[] {
  const all: VocabCard[] = [];
  for (const topic of topics) {
    for (const phrase of topic.phrases) {
      all.push({
        phraseId: phrase.id,
        german: phrase.german,
        phonetics: phrase.phonetics,
        native: getT(phrase.translations, lang),
        nativeExample: getT(phrase.exampleTranslations, lang),
        germanExample: phrase.exampleDE,
        topicIcon: topic.icon,
      });
    }
  }
  // Sort: new (0) and learning (1) first, mastered (2) last
  return [...all].sort((a, b) => {
    const ma = mastery[a.phraseId] ?? 0;
    const mb = mastery[b.phraseId] ?? 0;
    return ma - mb;
  });
}

const ratingLabels = {
  again:    { ar: 'مرة أخرى', uk: 'Ще раз', es: 'Otra vez', en: 'Again' },
  good:     { ar: 'جيد', uk: 'Добре', es: 'Bien', en: 'Gut' },
  mastered: { ar: 'أتقنته', uk: 'Засвоєно', es: 'Dominado', en: 'Gemeistert' },
} as const;

export function VocabScreen() {
  const navigate = useNavigate();
  const { progress, setVocabMastery, addApiCost, addXp } = useProgress();
  const lang = (progress.language ?? 'en') as Language;
  const { speak, stop } = useSpeak();

  const [deck] = useState<VocabCard[]>(() => buildDeck(lang, progress.vocabMastery ?? {}));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [rated, setRated] = useState<Set<string>>(new Set());
  const [sessionMastery, setSessionMastery] = useState<Record<string, 0 | 1 | 2>>({ ...progress.vocabMastery });

  const card = deck[idx];
  const total = deck.length;
  const masteredCount = Object.values(sessionMastery).filter(v => v === 2).length;

  // Auto-play German when card changes
  useEffect(() => {
    if (!card) return;
    const t = setTimeout(() => {
      speak(card.german, 0.9, u => addApiCost(u.costEur), 'nova');
    }, 300);
    return () => { clearTimeout(t); stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const handleFlip = useCallback(() => {
    setFlipped(f => !f);
  }, []);

  const handleRate = useCallback((level: 0 | 1 | 2) => {
    if (!card) return;
    setVocabMastery(card.phraseId, level);
    setSessionMastery(prev => ({ ...prev, [card.phraseId]: level }));
    if (!rated.has(card.phraseId)) {
      addXp(5);
      setRated(prev => new Set([...prev, card.phraseId]));
    }
    setFlipped(false);
    setIdx(i => i + 1);
  }, [card, rated, setVocabMastery, addXp]);

  const handlePlayDE = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(card.german, 0.9, u => addApiCost(u.costEur), 'nova');
  };

  const handlePlayNative = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(card.native, 0.9, u => addApiCost(u.costEur), 'shimmer');
  };

  // All cards rated
  if (!card || idx >= total) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'linear-gradient(180deg, #0f1117 0%, #131620 100%)' }}
      >
        <div className="text-6xl mb-6">🎉</div>
        <h1
          className="text-2xl font-bold mb-3"
          style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8' }}
        >
          {t('allMastered', lang)}
        </h1>
        <p className="text-sm mb-8" style={{ color: '#8b8fa8' }}>
          {masteredCount} / {total} {t('masteredCount', lang)}
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3.5 rounded-xl font-semibold text-sm"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f1117' }}
        >
          {t('overview', lang)}
        </button>
      </div>
    );
  }

  const currentMastery = sessionMastery[card.phraseId] ?? 0;
  const masteryLabel = currentMastery === 2 ? '⭐' : currentMastery === 1 ? '📖' : '🆕';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #0f1117 0%, #131620 100%)' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(15,17,23,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="text-sm transition-all"
          style={{ color: '#8b8fa8' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f0ede8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8b8fa8')}
        >
          ← {t('overview', lang)}
        </button>
        <span style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8', fontWeight: 700 }}>
          🃏 {t('vocabTitle', lang)}
        </span>
        <span className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
          {idx + 1} / {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${(idx / total) * 100}%`,
            background: 'linear-gradient(90deg, #f59e0b, #fcd34d)',
          }}
        />
      </div>

      {/* Stats row */}
      <div className="flex justify-center gap-6 pt-4 px-6">
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: '#10b981' }}>{masteredCount}</div>
          <div className="text-xs" style={{ color: '#8b8fa8' }}>{t('masteredCount', lang)}</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: '#f59e0b' }}>{total - masteredCount}</div>
          <div className="text-xs" style={{ color: '#8b8fa8' }}>{t('again', lang)}</div>
        </div>
        <div className="text-center">
          <div className="text-lg">{card.topicIcon}</div>
          <div className="text-xs" style={{ color: '#8b8fa8' }}>{masteryLabel}</div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex items-center justify-center px-6 py-6">
        <div className="w-full max-w-lg">

          {/* Card with flip effect */}
          <div
            onClick={handleFlip}
            style={{
              perspective: '1000px',
              cursor: 'pointer',
              marginBottom: 24,
            }}
          >
            <div
              style={{
                position: 'relative',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                minHeight: 260,
              }}
            >
              {/* Front: German */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  background: 'rgba(26,29,39,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 24,
                  padding: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  minHeight: 260,
                }}
              >
                <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#8b8fa8', opacity: 0.6 }}>
                  {t('inGerman', lang)}
                </p>
                <h2
                  className="mb-3 leading-tight"
                  style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8', fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 700 }}
                >
                  {card.german}
                </h2>
                <p className="font-mono text-sm mb-5" style={{ color: 'rgba(240,237,232,0.4)' }}>
                  [{card.phonetics}]
                </p>
                <button
                  onClick={handlePlayDE}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}
                >
                  🔊 Auf Deutsch
                </button>
                <p className="text-xs mt-5 animate-pulse" style={{ color: '#8b8fa8' }}>
                  {t('tapToFlip', lang)}
                </p>
              </div>

              {/* Back: Native translation */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: 'rgba(26,29,39,0.9)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  borderRadius: 24,
                  padding: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  minHeight: 260,
                }}
              >
                <p className="text-2xl font-bold mb-3" style={{ color: '#818cf8', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
                  {card.native}
                </p>
                <button
                  onClick={handlePlayNative}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4"
                  style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}
                >
                  🔊 {lang === 'ar' ? 'بالعربية' : lang === 'uk' ? 'Українською' : lang === 'es' ? 'En español' : 'In English'}
                </button>
                <div
                  className="w-full rounded-xl p-3 text-sm"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                >
                  <p style={{ color: '#f0ede8', fontStyle: 'italic' }}>„{card.germanExample}"</p>
                  <p className="mt-1" style={{ color: '#8b8fa8', fontSize: 12 }}>{card.nativeExample}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rating buttons — only shown when flipped */}
          {flipped ? (
            <div className="grid grid-cols-3 gap-3 animate-fade-in-up">
              <button
                onClick={() => handleRate(0)}
                className="py-4 rounded-xl font-semibold text-sm flex flex-col items-center gap-1 transition-all"
                style={{ background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.35)', color: '#ef4444' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.12)')}
              >
                <span className="text-xl">🔄</span>
                <span>{ratingLabels.again[lang]}</span>
              </button>
              <button
                onClick={() => handleRate(1)}
                className="py-4 rounded-xl font-semibold text-sm flex flex-col items-center gap-1 transition-all"
                style={{ background: 'rgba(245,158,11,0.12)', border: '2px solid rgba(245,158,11,0.35)', color: '#f59e0b' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.12)')}
              >
                <span className="text-xl">👍</span>
                <span>{ratingLabels.good[lang]}</span>
              </button>
              <button
                onClick={() => handleRate(2)}
                className="py-4 rounded-xl font-semibold text-sm flex flex-col items-center gap-1 transition-all"
                style={{ background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.35)', color: '#10b981' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.12)')}
              >
                <span className="text-xl">⭐</span>
                <span>{ratingLabels.mastered[lang]}</span>
              </button>
            </div>
          ) : (
            <p className="text-center text-sm" style={{ color: '#8b8fa8' }}>
              {t('vocabSubtitle', lang)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
