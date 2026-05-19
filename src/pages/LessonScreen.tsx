import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProgress } from '../store/ProgressContext';
import { topics } from '../data/content';
import { explainPhrase } from '../api/claude';
import { t, getT, langNames } from '../i18n';
import { AudioControls } from '../components/AudioControls';
import { useSpeak } from '../hooks/useSpeech';
import type { Language } from '../types';

const phoneticsLabel: Partial<Record<Language, string>> = {
  ar: 'النطق',
  uk: 'Вимова',
  es: 'Pronunciación',
  en: 'Pronunciation',
  tr: 'Telaffuz',
  pl: 'Wymowa',
  ro: 'Pronunție',
  ru: 'Произношение',
};

const translationLabel: Partial<Record<Language, string>> = {
  ar: 'الترجمة',
  uk: 'Переклад',
  es: 'Traducción',
  en: 'Translation',
  tr: 'Çeviri',
  pl: 'Tłumaczenie',
  ro: 'Traducere',
  ru: 'Перевод',
};

const topicTitlesNative: Partial<Record<Language, Record<string, string>>> = {
  ar: { jobcenter: 'مركز العمل', arzt: 'الطبيب', wohnung: 'البحث عن شقة', alltag: 'الحياة اليومية', behoerden: 'الجهات الرسمية', notfall: 'الطوارئ' },
  uk: { jobcenter: 'Центр зайнятості', arzt: 'Лікар', wohnung: 'Пошук квартири', alltag: 'Щоденне життя', behoerden: 'Держоргани', notfall: 'Надзвичайні ситуації' },
  es: { jobcenter: 'Oficina de empleo', arzt: 'Médico', wohnung: 'Buscar apartamento', alltag: 'Vida cotidiana', behoerden: 'Organismos oficiales', notfall: 'Emergencias' },
  en: { jobcenter: 'Job Center', arzt: 'Doctor', wohnung: 'Finding Apartment', alltag: 'Daily Life', behoerden: 'Government Offices', notfall: 'Emergencies' },
  tr: { jobcenter: 'İş Merkezi', arzt: 'Doktor', wohnung: 'Daire Arama', alltag: 'Günlük Yaşam', behoerden: 'Resmi Kurumlar', notfall: 'Acil Durumlar' },
  pl: { jobcenter: 'Urząd Pracy', arzt: 'Lekarz', wohnung: 'Szukanie Mieszkania', alltag: 'Codzienne Życie', behoerden: 'Urzędy', notfall: 'Sytuacje Awaryjne' },
  ro: { jobcenter: 'Oficiul de Șomaj', arzt: 'Medic', wohnung: 'Apartament', alltag: 'Viața Cotidiană', behoerden: 'Instituții', notfall: 'Urgențe' },
  ru: { jobcenter: 'Центр Занятости', arzt: 'Врач', wohnung: 'Поиск Квартиры', alltag: 'Повседневная Жизнь', behoerden: 'Госорганы', notfall: 'Чрезвычайные Ситуации' },
};

export function LessonScreen() {
  const navigate = useNavigate();
  const { topicId } = useParams<{ topicId: string }>();
  const { progress, addXp, markPhrasesSeen, addApiCost } = useProgress();
  const lang = (progress.language ?? 'en') as Language;
  const targetLang = (progress.targetLanguage ?? 'de') as Language;

  // Phrase in der Lernsprache + Übersetzung in der Muttersprache
  const getLearnPhrase = (p: { german: string; translations: Partial<Record<Language, string>> }) =>
    targetLang === 'de' ? p.german : (getT(p.translations, targetLang) || p.german);
  const getNativeTranslation = (p: { german: string; translations: Partial<Record<Language, string>> }) =>
    lang === 'de' ? p.german : getT(p.translations, lang);

  // Label für die Lernsprache, in der Muttersprache des Nutzers
  const learnLangLabel = langNames[targetLang]?.[lang] ?? targetLang;

  const topic = topics.find(tt => tt.id === topicId);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [seenInSession, setSeenInSession] = useState<Set<string>>(new Set());
  const [autoPlay, setAutoPlay] = useState(true);

  const { speak, stop } = useSpeak();
  const autoPlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!topic) navigate('/');
  }, [topic, navigate]);

  if (!topic) return null;

  const phrase = topic.phrases[currentIdx];
  const isLast = currentIdx === topic.phrases.length - 1;
  const isFirst = currentIdx === 0;
  const totalPhrases = topic.phrases.length;

  const handlePhraseView = (idx: number) => {
    if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
    stop(); // stop any current TTS

    const p = topic.phrases[idx];
    if (!seenInSession.has(p.id) && !progress.seenPhrases.includes(p.id)) {
      setSeenInSession(prev => new Set([...prev, p.id]));
      markPhrasesSeen([p.id]);
      addXp(10);
    }
    setShowExplanation(false);
    setExplanation('');
    setCurrentIdx(idx);

    // Auto-play via OpenAI TTS after short delay
    if (autoPlay) {
      autoPlayTimeoutRef.current = setTimeout(() => {
        speak(getLearnPhrase(p), 0.9, u => addApiCost(u.costEur));
      }, 400);
    }
  };

  // Mark first phrase on mount
  useEffect(() => {
    handlePhraseView(0);
    return () => {
      if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
      window.speechSynthesis?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => {
    if (!isLast) handlePhraseView(currentIdx + 1);
    else navigate(`/quiz/${topicId}`);
  };

  const handlePrev = () => {
    if (!isFirst) handlePhraseView(currentIdx - 1);
  };

  const handleExplain = async () => {
    if (explanation) {
      setShowExplanation(v => !v);
      return;
    }
    setShowExplanation(true);
    setExplanationLoading(true);
    setExplanation('');
    try {
      await explainPhrase(
        getLearnPhrase(phrase),
        lang,
        targetLang,
        chunk => setExplanation(prev => prev + chunk),
        usage => addApiCost(usage.costEur)
      );
    } catch {
      setExplanation('Fehler. Bitte versuche es erneut.');
    } finally {
      setExplanationLoading(false);
    }
  };

  const seenCount = topic.phrases.filter(p => progress.seenPhrases.includes(p.id)).length;
  const nativeTopicTitle = (topicTitlesNative[lang] ?? topicTitlesNative['en'])![topicId ?? ''] ?? topic.titleDE;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #0f1117 0%, #131620 100%)' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(15,17,23,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm transition-all"
          style={{ color: '#8b8fa8' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f0ede8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8b8fa8')}
        >
          ← {t('overview', lang)}
        </button>
        <div className="flex items-center gap-2 text-sm" style={{ color: '#8b8fa8' }}>
          <span>{topic.icon}</span>
          <span>{nativeTopicTitle}</span>
        </div>
        {/* Auto-play toggle */}
        <button
          onClick={() => setAutoPlay(v => !v)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all"
          style={{
            background: autoPlay ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
            border: autoPlay ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.1)',
            color: autoPlay ? '#f59e0b' : '#8b8fa8',
          }}
          title="Auto-play German phrase"
        >
          {autoPlay ? '🔊' : '🔇'}
          <span>{autoPlay ? 'Auto' : 'Stumm'}</span>
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${((currentIdx + 1) / totalPhrases) * 100}%`,
            background: 'linear-gradient(90deg, #f59e0b, #fcd34d)',
          }}
        />
      </div>

      {/* Phrase dots */}
      <div className="flex justify-center gap-1.5 pt-5 px-6">
        {topic.phrases.map((_, i) => (
          <button
            key={i}
            onClick={() => handlePhraseView(i)}
            className="rounded-full transition-all duration-200"
            style={{
              width: i === currentIdx ? 20 : 8,
              height: 8,
              background: i < currentIdx || progress.seenPhrases.includes(topic.phrases[i].id)
                ? '#f59e0b' : i === currentIdx ? '#f59e0b' : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>
      <p className="text-center text-xs mt-2" style={{ color: '#8b8fa8' }}>
        {t('phrasesOf', lang, String(currentIdx + 1), String(totalPhrases))} · {seenCount} {t('seen', lang)}
      </p>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
        <div className="w-full max-w-2xl">

          {/* Lernphrase — large, central */}
          <div
            className="rounded-3xl p-8 mb-4 text-center animate-fade-in-up"
            style={{ background: 'rgba(26,29,39,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#8b8fa8', opacity: 0.6 }}>
              {learnLangLabel}
            </p>

            <h1
              className="mb-3 leading-tight"
              style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8', fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 700 }}
            >
              {getLearnPhrase(phrase)}
            </h1>

            {/* Phonetics nur wenn Lernsprache Deutsch ist */}
            {targetLang === 'de' && (
              <>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#f59e0b', opacity: 0.6 }}>
                  {phoneticsLabel[lang] ?? 'Aussprache'}
                </p>
                <p className="text-base font-mono mb-5" style={{ color: 'rgba(240,237,232,0.45)' }}>
                  [{phrase.phonetics}]
                </p>
              </>
            )}

            {/* ── AUDIO CONTROLS ── */}
            <AudioControls
              germanPhrase={getLearnPhrase(phrase)}
              nativeTranslation={getNativeTranslation(phrase)}
              lang={lang}
              learnLangLabel={learnLangLabel}
            />
          </div>

          {/* Übersetzung in Muttersprache */}
          <div
            className="rounded-2xl p-5 mb-4 flex items-center gap-4"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <span className="text-2xl">💬</span>
            <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="flex-1">
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#f59e0b', opacity: 0.7 }}>
                {translationLabel[lang] ?? langNames[lang]?.[lang] ?? 'Übersetzung'}
              </p>
              <p className="text-xl font-semibold" style={{ color: '#f0ede8' }}>
                {getNativeTranslation(phrase)}
              </p>
            </div>
          </div>

          {/* Beispielsatz */}
          <div
            className="rounded-2xl p-5 mb-4"
            style={{ background: 'rgba(26,29,39,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#8b8fa8', opacity: 0.7 }}>
              {t('example', lang)}
            </p>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-base font-semibold mb-1.5" style={{ color: '#f0ede8' }}>
                  {targetLang === 'de' ? phrase.exampleDE : (getT(phrase.exampleTranslations, targetLang) || phrase.exampleDE)}
                </p>
                <p className="text-sm" style={{ color: '#8b8fa8', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
                  {lang === 'de' ? phrase.exampleDE : getT(phrase.exampleTranslations, lang)}
                </p>
              </div>
              <button
                onClick={() => speak(targetLang === 'de' ? phrase.exampleDE : (getT(phrase.exampleTranslations, targetLang) || phrase.exampleDE), 0.8, u => addApiCost(u.costEur))}
                className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}
              >
                ▶
              </button>
            </div>
          </div>

          {/* AI Explanation */}
          <div className="mb-5">
            <button
              onClick={handleExplain}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: showExplanation ? 'rgba(245,158,11,0.12)' : 'rgba(26,29,39,0.6)',
                border: showExplanation ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.08)',
                color: showExplanation ? '#f59e0b' : '#8b8fa8',
              }}
            >
              {t('explain', lang)}
              {explanationLoading && <span className="animate-pulse">...</span>}
            </button>

            {showExplanation && explanation && (
              <div
                className="mt-3 p-4 rounded-xl text-sm animate-fade-in-up"
                style={{
                  background: 'rgba(245,158,11,0.07)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  color: '#d4cfc8',
                  lineHeight: 1.7,
                  direction: lang === 'ar' ? 'rtl' : 'ltr',
                }}
              >
                {explanation}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className="flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{
                background: 'rgba(26,29,39,0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: isFirst ? 'rgba(240,237,232,0.2)' : '#f0ede8',
                cursor: isFirst ? 'default' : 'pointer',
              }}
            >
              {t('back', lang)}
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f1117' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {isLast ? t('toQuiz', lang) : t('next', lang)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
