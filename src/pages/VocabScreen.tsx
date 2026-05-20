import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../store/ProgressContext';
import { topics } from '../data/content';
import { words as allWords } from '../data/words';
import { useSpeak } from '../hooks/useSpeech';
import { t, getT, langNames } from '../i18n';
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
  es: 'Spanisch', uk: 'Ukrainisch', ru: 'Russisch', pl: 'Polnisch', ro: 'Rumänisch',
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
  adjektiv: '#f59e0b',
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
          onClick={() => { if (mode === 'phrases') setPhraseIdx(0); else setWordIdx(0); }}
          className="px-8 py-3.5 rounded-xl font-semibold text-sm mb-3"
          style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b' }}
        >
          ↩ Nochmal
        </button>
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

  const currentMastery = mode === 'phrases'
    ? (sessionPhraseMastery[(card as VocabCard).phraseId] ?? 0)
    : (sessionWordMastery[(wcard as WordCard).wordId] ?? 0);
  const masteryLabel = currentMastery === 2 ? '⭐' : currentMastery === 1 ? '📖' : '🆕';
  const topicIcon = mode === 'phrases' ? (card as VocabCard).topicIcon : '📖';

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

      {/* Mode toggle */}
      <div className="flex gap-2 px-6 pt-4">
        {(['phrases', 'words'] as VocabMode[]).map(m => (
          <button
            key={m}
            onClick={() => { cancelAutoPlay(); stop(); setMode(m); }}
            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: mode === m ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${mode === m ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.08)'}`,
              color: mode === m ? '#f59e0b' : '#8b8fa8',
            }}
          >
            {m === 'phrases' ? '💬 Phrasen' : '🔤 Wörter'}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 mt-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
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
          <div className="text-lg">{topicIcon}</div>
          <div className="text-xs" style={{ color: '#8b8fa8' }}>{masteryLabel}</div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex items-center justify-center px-6 py-6">
        <div className="w-full max-w-lg">

          {/* Card with flip effect */}
          <div
            onClick={handleFlip}
            style={{ perspective: '1000px', cursor: 'pointer', marginBottom: 24 }}
          >
            <div
              style={{
                position: 'relative',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                minHeight: 240,
              }}
            >
              {/* Front */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  background: 'rgba(26,29,39,0.9)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 24, padding: 32,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', minHeight: 240,
                }}
              >
                {mode === 'words' && wcard && (
                  <span
                    className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-4"
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
                  style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8', fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 700 }}
                >
                  {mode === 'phrases' ? card?.german : wcard?.german}
                </h2>
                {mode === 'phrases' && card?.phonetics && (
                  <p className="font-mono text-sm mb-4" style={{ color: 'rgba(240,237,232,0.4)' }}>
                    [{card.phonetics}]
                  </p>
                )}
                <button
                  onClick={handlePlayDE}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mt-2"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}
                >
                  🔊 {isGermanSpeaker ? (targetLangLabel[targetLang] ?? targetLang) : (langNames['de']?.[lang] ?? 'Auf Deutsch')}
                </button>
                <p className="text-xs mt-4 animate-pulse" style={{ color: '#8b8fa8' }}>
                  {t('tapToFlip', lang)}
                </p>
              </div>

              {/* Back */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: 'rgba(26,29,39,0.9)', border: '1px solid rgba(99,102,241,0.4)',
                  borderRadius: 24, padding: 32,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', minHeight: 240,
                }}
              >
                <p
                  className="text-2xl font-bold mb-4"
                  style={{ color: '#818cf8', direction: lang === 'ar' ? 'rtl' : 'ltr' }}
                >
                  {mode === 'phrases' ? card?.native : wcard?.native}
                </p>
                <button
                  onClick={handlePlayNative}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4"
                  style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}
                >
                  🔊 {isGermanSpeaker ? (langNames['de']?.[lang] ?? 'Auf Deutsch') : (langNames[lang]?.[lang] ?? lang)}
                </button>
                {mode === 'phrases' && card && (
                  <div
                    className="w-full rounded-xl p-3 text-sm"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                  >
                    <p style={{ color: '#f0ede8', fontStyle: 'italic' }}>„{card.germanExample}"</p>
                    <p className="mt-1" style={{ color: '#8b8fa8', fontSize: 12 }}>{card.nativeExample}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rating buttons */}
          {flipped ? (
            <div className="grid grid-cols-3 gap-3 animate-fade-in-up">
              {([
                { level: 0 as const, icon: '🔄', label: t('again', lang), color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)' },
                { level: 1 as const, icon: '👍', label: t('good', lang), color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
                { level: 2 as const, icon: '⭐', label: t('mastered', lang), color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)' },
              ]).map(({ level, icon, label, color, bg, border }) => (
                <button
                  key={level}
                  onClick={() => handleRate(level)}
                  className="py-4 rounded-xl font-semibold text-sm flex flex-col items-center gap-1 transition-all"
                  style={{ background: bg, border: `2px solid ${border}`, color }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  <span className="text-xl">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
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
