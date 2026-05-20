import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProgress } from '../store/ProgressContext';
import { topics } from '../data/content';
import { getEncouragingMessage } from '../api/claude';
import { t, getT, langNames } from '../i18n';
import { useSpeak } from '../hooks/useSpeech';
import type { Language, Level } from '../types';

interface QuizQuestion {
  phraseId: string;
  learnPhrase: string;   // Phrase in Lernsprache (wird angezeigt)
  correct: string;       // Richtige Übersetzung in Muttersprache
  options: string[];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildQuiz(topicId: string, nativeLang: Language, targetLang: Language): QuizQuestion[] {
  const topic = topics.find(tt => tt.id === topicId);
  if (!topic) return [];

  const getLearnPhrase = (p: typeof topic.phrases[0]) =>
    targetLang === 'de' ? p.german : (getT(p.translations, targetLang) || p.german);
  const getNativeAnswer = (p: typeof topic.phrases[0]) =>
    nativeLang === 'de' ? p.german : getT(p.translations, nativeLang);

  const phrases = shuffle(topic.phrases).slice(0, 5);
  return phrases.map(phrase => {
    const correct = getNativeAnswer(phrase);
    const others = shuffle(
      topic.phrases
        .filter(p => p.id !== phrase.id)
        .map(p => getNativeAnswer(p))
        .filter(Boolean)
    ).slice(0, 3);

    return {
      phraseId: phrase.id,
      learnPhrase: getLearnPhrase(phrase),
      correct,
      options: shuffle([correct, ...others]),
    };
  });
}

const topicTitlesNative: Partial<Record<Language, Record<string, string>>> = {
  de: { jobcenter: 'Jobcenter', arzt: 'Arzt', wohnung: 'Wohnung suchen', alltag: 'Alltag', behoerden: 'Behörden', notfall: 'Notfall' },
  ar: { jobcenter: 'مركز العمل', arzt: 'الطبيب', wohnung: 'البحث عن شقة', alltag: 'الحياة اليومية', behoerden: 'الجهات الرسمية', notfall: 'الطوارئ' },
  uk: { jobcenter: 'Центр зайнятості', arzt: 'Лікар', wohnung: 'Пошук квартири', alltag: 'Щоденне життя', behoerden: 'Держоргани', notfall: 'Надзвичайні ситуації' },
  es: { jobcenter: 'Oficina de empleo', arzt: 'Médico', wohnung: 'Buscar apartamento', alltag: 'Vida cotidiana', behoerden: 'Organismos oficiales', notfall: 'Emergencias' },
  en: { jobcenter: 'Job Center', arzt: 'Doctor', wohnung: 'Finding Apartment', alltag: 'Daily Life', behoerden: 'Government Offices', notfall: 'Emergencies' },
  tr: { jobcenter: 'İş Merkezi', arzt: 'Doktor', wohnung: 'Daire Arama', alltag: 'Günlük Yaşam', behoerden: 'Resmi Kurumlar', notfall: 'Acil Durumlar' },
  pl: { jobcenter: 'Urząd Pracy', arzt: 'Lekarz', wohnung: 'Szukanie Mieszkania', alltag: 'Życie Codzienne', behoerden: 'Urzędy', notfall: 'Sytuacje Awaryjne' },
  ro: { jobcenter: 'Oficiul de Șomaj', arzt: 'Medic', wohnung: 'Apartament', alltag: 'Viața Cotidiană', behoerden: 'Instituții', notfall: 'Urgențe' },
  ru: { jobcenter: 'Центр Занятости', arzt: 'Врач', wohnung: 'Поиск Квартиры', alltag: 'Повседневная Жизнь', behoerden: 'Госорганы', notfall: 'Чрезвычайные Ситуации' },
};

export function QuizScreen() {
  const navigate = useNavigate();
  const { topicId } = useParams<{ topicId: string }>();
  const { progress, addXp, markTopicComplete, recordQuizScore, addOpenAiCost, addClaudeCost } = useProgress();
  const lang = (progress.language ?? 'en') as Language;
  const targetLang = (progress.targetLanguage ?? 'de') as Language;
  const learnLangLabel = langNames[targetLang]?.[lang] ?? targetLang;

  const [questions] = useState<QuizQuestion[]>(() => buildQuiz(topicId ?? '', lang, targetLang));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [encouragement, setEncouragement] = useState('');
  const [loadingMsg, setLoadingMsg] = useState(false);

  const { speak } = useSpeak();
  const topic = topics.find(tt => tt.id === topicId);
  const question = questions[currentIdx];
  const nativeTitle = (topicTitlesNative[lang] ?? topicTitlesNative['en'])![topicId ?? ''] ?? (topic?.titleDE ?? '');

  useEffect(() => {
    if (!topic) navigate('/');
  }, [topic, navigate]);

  useEffect(() => {
    if (showResult && topicId) {
      const isPerfect = correct === questions.length;
      addXp(50 + (isPerfect ? 30 : 0));
      markTopicComplete(topicId);
      recordQuizScore(topicId, Math.round((correct / questions.length) * 100), isPerfect);

      setLoadingMsg(true);
      getEncouragingMessage(lang, correct, questions.length, (text, usage) => {
        setEncouragement(text);
        setLoadingMsg(false);
        addClaudeCost(usage.costEur);
      }).catch(() => setLoadingMsg(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult]);

  if (!topic || !question) return null;

  const handleSelect = (option: string) => {
    if (selected !== null) return;
    setSelected(option);
    if (option === question.correct) setCorrect(c => c + 1);

    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(i => i + 1);
        setSelected(null);
      } else {
        setShowResult(true);
      }
    }, 1000);
  };

  // ---- RESULT SCREEN ----
  if (showResult) {
    const score = Math.round((correct / questions.length) * 100);
    const isPerfect = correct === questions.length;
    const xpEarned = 50 + (isPerfect ? 30 : 0);

    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: 'linear-gradient(180deg, #0f1117 0%, #131620 100%)' }}
      >
        <div className="w-full max-w-lg text-center animate-fade-in-up">
          <div className="text-6xl mb-4">{isPerfect ? '🏆' : score >= 60 ? '🌟' : '💪'}</div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8', direction: lang === 'ar' ? 'rtl' : 'ltr' }}
          >
            {t('yourResult', lang)}
          </h1>

          <div className="flex justify-center gap-8 mb-6 mt-6">
            <div className="text-center">
              <div className="text-4xl font-bold" style={{ color: '#f59e0b' }}>
                {correct}/{questions.length}
              </div>
              <div className="text-sm mt-1" style={{ color: '#8b8fa8' }}>{t('correct', lang)}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold" style={{ color: '#10b981' }}>
                +{xpEarned}
              </div>
              <div className="text-sm mt-1" style={{ color: '#8b8fa8' }}>{t('xpEarned', lang)}</div>
            </div>
          </div>

          <div className="w-full h-3 rounded-full mb-6" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${score}%`,
                background: score === 100 ? '#f59e0b' : score >= 60 ? '#10b981' : '#ef4444',
              }}
            />
          </div>

          {/* AI encouragement in native language */}
          {loadingMsg ? (
            <p className="text-sm mb-6" style={{ color: '#8b8fa8' }}>{t('loading', lang)}</p>
          ) : encouragement ? (
            <div
              className="p-4 rounded-xl mb-6 text-sm"
              style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.2)',
                color: '#d4cfc8',
                lineHeight: 1.7,
                direction: lang === 'ar' ? 'rtl' : 'ltr',
              }}
            >
              {encouragement}
            </div>
          ) : null}

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all"
              style={{ background: 'rgba(26,29,39,0.8)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0ede8' }}
            >
              {t('overview', lang)}
            </button>
            <button
              onClick={() => {
                const order: Level[] = ['A1', 'A2', 'B1', 'B2'];
                const nextTopic = topics.find(tt =>
                  !progress.completedTopics.includes(tt.id) &&
                  tt.id !== topicId &&
                  (tt.alwaysUnlocked || tt.requiredLevel === null ||
                    order.indexOf(progress.level) >= order.indexOf(tt.requiredLevel))
                );
                navigate(nextTopic ? `/lesson/${nextTopic.id}` : '/');
              }}
              className="flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f1117' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {t('keepLearning', lang)} →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- QUESTION SCREEN ----
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #0f1117 0%, #131620 100%)' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(15,17,23,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => navigate(`/lesson/${topicId}`)}
          className="text-sm transition-all"
          style={{ color: '#8b8fa8' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f0ede8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8b8fa8')}
        >
          ← {t('lesson', lang)}
        </button>
        <span style={{ color: '#8b8fa8', fontSize: 14 }}>
          {topic.icon} {t('quiz', lang)}: {nativeTitle}
        </span>
        <span className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
          {currentIdx + 1}/{questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${((currentIdx + 1) / questions.length) * 100}%`,
            background: 'linear-gradient(90deg, #10b981, #34d399)',
          }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg animate-fade-in-up">
          {/* German phrase card */}
          <div
            className="rounded-2xl p-8 mb-6 text-center"
            style={{ background: 'rgba(26,29,39,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#8b8fa8' }}>
              {learnLangLabel}
            </p>
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8' }}>
              {question.learnPhrase}
            </h2>
            {/* Play button — hear the phrase */}
            <button
              onClick={() => speak(question.learnPhrase, 0.9, u => addOpenAiCost(u.costEur))}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.12)')}
            >
              🔊 {t('listen', lang)}
            </button>
          </div>

          {/* Question in native language */}
          <p className="text-sm text-center mb-4" style={{ color: '#8b8fa8', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
            {t('whatDoesItMean', lang)}
          </p>

          <div className="grid grid-cols-1 gap-3">
            {question.options.map((option, idx) => {
              let bg = 'rgba(26,29,39,0.8)';
              let border = 'rgba(255,255,255,0.08)';
              let color = '#f0ede8';
              let icon = '';

              if (selected !== null) {
                if (option === question.correct) {
                  bg = 'rgba(16,185,129,0.15)'; border = '#10b981'; color = '#10b981'; icon = '✓';
                } else if (option === selected) {
                  bg = 'rgba(239,68,68,0.15)'; border = '#ef4444'; color = '#ef4444'; icon = '✗';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(option)}
                  disabled={selected !== null}
                  className="text-left px-5 py-4 rounded-xl transition-all duration-200 flex items-center gap-3"
                  style={{ background: bg, border: `2px solid ${border}`, color, cursor: selected !== null ? 'default' : 'pointer' }}
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                  onMouseEnter={e => {
                    if (selected === null) {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.4)';
                      (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.08)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (selected === null) {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                      (e.currentTarget as HTMLElement).style.background = 'rgba(26,29,39,0.8)';
                    }
                  }}
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    {icon || String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-base">{option}</span>
                </button>
              );
            })}
          </div>

          {selected !== null && selected !== question.correct && (
            <div
              className="mt-4 px-4 py-3 rounded-xl text-sm animate-fade-in-up"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', direction: lang === 'ar' ? 'rtl' : 'ltr' }}
            >
              <strong>{t('correctAnswer', lang)}</strong> {question.correct}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
