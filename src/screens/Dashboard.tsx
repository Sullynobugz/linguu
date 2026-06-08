import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../store/ProgressContext';
import { getWidCode, setWidCode as saveWidCode, clearWidCode } from '../lib/widTracking';
import { ProgressBar } from '../components/ProgressBar';
import { topics, topicOrder } from '../data/content';
import { allBadges } from '../data/badges';
import { getXpForLevel, getNextLevel } from '../store/progress';
import { t } from '../i18n';
import { BilingualText } from '../components/BilingualText';
import type { Level, Language } from '../types';

const levelColors: Record<Level, string> = {
  A1: '#10b981',
  A2: '#3b82f6',
  B1: '#8b5cf6',
  B2: '#f59e0b',
};

const levelBadgeLabels: Record<Level, string> = {
  A1: 'A1 → A2',
  A2: 'A2 → B1',
  B1: 'B1 → B2',
  B2: 'B2 ★',
};

const topicTitles: Partial<Record<Language, Record<string, string>>> = {
  ar: { jobcenter: 'عند مركز العمل', arzt: 'عند الطبيب', wohnung: 'البحث عن شقة', alltag: 'الحياة اليومية', behoerden: 'الجهات الرسمية', notfall: 'حالات الطوارئ', schule: 'المدرسة والأطفال', freizeit: 'الترفيه والاندماج' },
  uk: { jobcenter: 'У центрі зайнятості', arzt: 'У лікаря', wohnung: 'Пошук квартири', alltag: 'Повсякденне життя', behoerden: 'Держоргани', notfall: 'Надзвичайні ситуації', schule: 'Школа та діти', freizeit: 'Дозвілля та інтеграція' },
  es: { jobcenter: 'En la oficina de empleo', arzt: 'En el médico', wohnung: 'Buscar apartamento', alltag: 'Vida cotidiana', behoerden: 'Organismos oficiales', notfall: 'Emergencias', schule: 'Escuela e hijos', freizeit: 'Ocio e integración' },
  en: { jobcenter: 'At the Job Center', arzt: 'At the Doctor', wohnung: 'Finding an Apartment', alltag: 'Daily Life', behoerden: 'Government Offices', notfall: 'Emergencies', schule: 'School & Children', freizeit: 'Leisure & Integration' },
  ku: { jobcenter: 'Li Navenda Karê', arzt: 'Li Bijîşk', wohnung: 'Lêgerîna Malê', alltag: 'Jiyana Rojane', behoerden: 'Dezgehên Fermî', notfall: 'Rewşên Acîl', schule: 'Dibistan û Zarok', freizeit: 'Demxweşî û Entegrasyon' },
  tr: { jobcenter: 'İş Merkezinde', arzt: 'Doktorda', wohnung: 'Daire Arama', alltag: 'Günlük Yaşam', behoerden: 'Resmi Kurumlar', notfall: 'Acil Durumlar', schule: 'Okul ve Çocuklar', freizeit: 'Boş Zaman ve Entegrasyon' },
  pl: { jobcenter: 'W Urzędzie Pracy', arzt: 'U lekarza', wohnung: 'Szukanie mieszkania', alltag: 'Życie codzienne', behoerden: 'Urzędy państwowe', notfall: 'Sytuacje awaryjne', schule: 'Szkoła i dzieci', freizeit: 'Czas wolny i integracja' },
  ro: { jobcenter: 'La Oficiul de șomaj', arzt: 'La medic', wohnung: 'Căutare apartament', alltag: 'Viața cotidiană', behoerden: 'Instituții oficiale', notfall: 'Urgențe', schule: 'Școală și copii', freizeit: 'Timp liber și integrare' },
  ru: { jobcenter: 'В центре занятости', arzt: 'У врача', wohnung: 'Поиск квартиры', alltag: 'Повседневная жизнь', behoerden: 'Государственные органы', notfall: 'Чрезвычайные ситуации', schule: 'Школа и дети', freizeit: 'Досуг и интеграция' },
};

const topicSubtitles: Partial<Record<Language, Record<string, string>>> = {
  ar: { jobcenter: 'المواعيد، الوثائق، الأسئلة', arzt: 'الأعراض، المواعيد الطبية', wohnung: 'الإيجار، العقود، الجيران', alltag: 'التسوق، المواصلات', behoerden: 'التسجيل، النماذج', notfall: 'السلامة أولاً — متاح دائماً', schule: 'المدارس، الحضانة، الدعم', freizeit: 'رياضة، ثقافة، أنشطة اجتماعية' },
  uk: { jobcenter: 'Записи, документи, запитання', arzt: 'Симптоми, лікарські записи', wohnung: 'Оренда, договори, сусіди', alltag: 'Шопінг, транспорт', behoerden: 'Реєстрація, форми', notfall: 'Безпека перш за все — завжди доступно', schule: 'Школи, садочки, підтримка', freizeit: 'Спорт, культура, соціальна участь' },
  es: { jobcenter: 'Citas, documentos, preguntas', arzt: 'Síntomas, citas médicas', wohnung: 'Alquiler, contratos, vecinos', alltag: 'Compras, transporte', behoerden: 'Registro, formularios', notfall: 'Seguridad primero — siempre disponible', schule: 'Colegios, guarderías, apoyo', freizeit: 'Deporte, cultura, vida social' },
  en: { jobcenter: 'Appointments, documents, questions', arzt: 'Symptoms, medical appointments', wohnung: 'Rent, contracts, neighbors', alltag: 'Shopping, transport', behoerden: 'Registration, forms', notfall: 'Safety first — always available', schule: 'Schools, daycare, support', freizeit: 'Sport, culture, social life' },
  ku: { jobcenter: 'Randevû, belge, pirsan', arzt: 'Nîşan, randevûyên bijîşkî', wohnung: 'Kirê, girêbest, cînar', alltag: 'Kirîn, veguhastî', behoerden: 'Tomarkirin, form', notfall: 'Ewlehî pêşî ye — her tim peyda ye', schule: 'Dibistan, kreş, piştgirî', freizeit: 'Werzîş, çand, jiyana civakî' },
  tr: { jobcenter: 'Randevular, belgeler, sorular', arzt: 'Belirtiler, doktor randevuları', wohnung: 'Kira, sözleşmeler, komşular', alltag: 'Alışveriş, ulaşım', behoerden: 'Kayıt, formlar', notfall: 'Güvenlik önce — her zaman erişilebilir', schule: 'Okullar, anaokul, destek', freizeit: 'Spor, kültür, sosyal yaşam' },
  pl: { jobcenter: 'Wizyty, dokumenty, pytania', arzt: 'Objawy, wizyty lekarskie', wohnung: 'Wynajem, umowy, sąsiedzi', alltag: 'Zakupy, transport', behoerden: 'Rejestracja, formularze', notfall: 'Bezpieczeństwo przede wszystkim — zawsze dostępne', schule: 'Szkoły, przedszkola, wsparcie', freizeit: 'Sport, kultura, życie towarzyskie' },
  ro: { jobcenter: 'Programări, documente, întrebări', arzt: 'Simptome, programări medicale', wohnung: 'Chirie, contracte, vecini', alltag: 'Cumpărături, transport', behoerden: 'Înregistrare, formulare', notfall: 'Siguranța pe primul loc — mereu disponibil', schule: 'Școli, grădinițe, sprijin', freizeit: 'Sport, cultură, viață socială' },
  ru: { jobcenter: 'Записи, документы, вопросы', arzt: 'Симптомы, записи к врачу', wohnung: 'Аренда, договоры, соседи', alltag: 'Покупки, транспорт', behoerden: 'Регистрация, формы', notfall: 'Безопасность прежде всего — всегда доступно', schule: 'Школы, детские сады, поддержка', freizeit: 'Спорт, культура, общественная жизнь' },
};

function isTopicUnlocked(_id: string, userLevel: Level, alwaysUnlocked: boolean, requiredLevel: Level | null): boolean {
  if (alwaysUnlocked) return true;
  if (requiredLevel === null) return true;
  const order: Level[] = ['A1', 'A2', 'B1', 'B2'];
  return order.indexOf(userLevel) >= order.indexOf(requiredLevel);
}

export function Dashboard() {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const lang = (progress.language ?? 'en') as Language;
  const path = progress.path ?? 'neu';

  const orderedIds = topicOrder[path];
  const orderedTopics = orderedIds.map(id => topics.find(tt => tt.id === id)!).filter(Boolean);

  const [widCode, setWidCodeState] = useState<string | null>(null);
  const [showWidInput, setShowWidInput] = useState(false);
  const [widInput, setWidInput] = useState('');

  useEffect(() => {
    // Auto-fill WID-Code from URL param ?wid=WID-XXXXX (gesetzt von WID-App)
    const params = new URLSearchParams(window.location.search)
    const urlWid = params.get('wid')
    if (urlWid && urlWid.length >= 4) {
      saveWidCode(urlWid)
      setWidCodeState(urlWid.trim().toUpperCase())
      // URL-Param entfernen ohne Reload
      const url = new URL(window.location.href)
      url.searchParams.delete('wid')
      window.history.replaceState({}, '', url.toString())
    } else {
      setWidCodeState(getWidCode())
    }
  }, []);

  const { min, max } = getXpForLevel(progress.level);
  const nextLevel = getNextLevel(progress.level);
  const xpInLevel = progress.xp - min;
  const xpNeeded = max - min;
  const progressPct = Math.min(100, (xpInLevel / xpNeeded) * 100);

  const unearnedBadges = allBadges.filter(b => !progress.badges.includes(b.id));
  const nextBadge = unearnedBadges[0];

  const totalHours = Math.floor(progress.totalTimeMinutes / 60);
  const totalMins = Math.floor(progress.totalTimeMinutes % 60);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0f1117 0%, #131620 100%)' }}>
      {/* Top Bar */}
      <div
        className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(15,17,23,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            🇩🇪
          </div>
          <div>
            <span style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8', fontWeight: 700, fontSize: 20 }}>
              Linguu
            </span>
            <p className="text-[10px] leading-none" style={{ color: '#8b8fa8' }}>
              WID · Linguu · JobMate
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span>🔥</span>
            <span className="font-semibold text-sm" style={{ color: '#f0ede8' }}>{progress.streak}</span>
          </div>
          <div
            className="px-3 py-1 rounded-full text-sm font-semibold"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
          >
            ⚡ {progress.xp} XP
          </div>
          <div
            className="px-3 py-1 rounded-full text-sm font-bold"
            style={{
              background: `${levelColors[progress.level]}15`,
              color: levelColors[progress.level],
              border: `1px solid ${levelColors[progress.level]}40`,
            }}
          >
            {levelBadgeLabels[progress.level]}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* WID-Code Banner */}
        {widCode ? (
          <div
            className="flex items-center justify-between rounded-xl px-4 py-2.5 mb-5 animate-fade-in-up"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            <div className="flex items-center gap-2">
              <span style={{ color: '#10b981', fontSize: 14 }}>🔗</span>
              <span className="text-sm font-semibold" style={{ color: '#10b981' }}>
                WID-Programm verknüpft: {widCode}
              </span>
              <span className="text-xs" style={{ color: 'rgba(16,185,129,0.6)' }}>
                · Lektionen, Quiz und Assessment fließen ins Reporting
              </span>
            </div>
            <button
              onClick={() => { clearWidCode(); setWidCodeState(null); }}
              className="text-xs px-2 py-0.5 rounded transition-all"
              style={{ color: 'rgba(16,185,129,0.5)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(16,185,129,0.5)')}
            >
              ✕
            </button>
          </div>
        ) : showWidInput ? (
          <div
            className="rounded-xl px-4 py-3 mb-5 animate-fade-in-up"
            style={{ background: 'rgba(26,29,39,0.8)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <p className="text-xs mb-2" style={{ color: '#8b8fa8' }}>
              WID-Code eingeben, um Lernfortschritt an deinen Koordinator zu melden
            </p>
            <div className="flex gap-2">
              <input
                value={widInput}
                onChange={e => setWidInput(e.target.value.toUpperCase())}
                onKeyDown={e => {
                  if (e.key === 'Enter' && widInput.length >= 4) {
                    saveWidCode(widInput);
                    setWidCodeState(widInput);
                    setShowWidInput(false);
                    setWidInput('');
                  }
                }}
                placeholder="z. B. AB12CD"
                maxLength={12}
                className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-transparent outline-none"
                style={{ border: '1px solid rgba(255,255,255,0.12)', color: '#f0ede8' }}
                autoFocus
              />
              <button
                disabled={widInput.length < 4}
                onClick={() => {
                  saveWidCode(widInput);
                  setWidCodeState(widInput);
                  setShowWidInput(false);
                  setWidInput('');
                }}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{ background: widInput.length >= 4 ? '#f59e0b' : 'rgba(255,255,255,0.08)', color: widInput.length >= 4 ? '#0f1117' : '#8b8fa8' }}
              >
                OK
              </button>
              <button
                onClick={() => { setShowWidInput(false); setWidInput(''); }}
                className="px-2 py-1.5 rounded-lg text-sm"
                style={{ color: '#8b8fa8' }}
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowWidInput(true)}
            className="flex items-center gap-1.5 mb-4 text-xs transition-all"
            style={{ color: 'rgba(139,143,168,0.4)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(139,143,168,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(139,143,168,0.4)')}
          >
            <span>🔗</span>
            <span>WID-Code verknüpfen</span>
          </button>
        )}

        {/* Progress Card */}
        <div
          className="rounded-2xl p-6 mb-8 animate-fade-in-up"
          style={{ background: 'rgba(26,29,39,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8', fontSize: 22, fontWeight: 700, margin: 0 }}>
                <BilingualText native={t('yourProgress', lang)} de={t('yourProgress', 'de')} lang={lang} />
              </h2>
              <p className="text-sm mt-1" style={{ color: '#8b8fa8' }}>
                {xpInLevel} / {xpNeeded} XP · {t('xpUntilLevel', lang)} {nextLevel ?? progress.level}
              </p>
            </div>
            <div className="flex gap-3 text-sm" style={{ color: '#8b8fa8' }}>
              <span>📅 {progress.activeDays} {t('days', lang)}</span>
              <span>·</span>
              <span>⏱ {totalHours}h {totalMins}m</span>
            </div>
          </div>

          {/* Level path visual */}
          <div className="flex items-center gap-2 mb-4">
            {(['A1', 'A2', 'B1', 'B2'] as Level[]).map((lvl, idx) => (
              <div key={lvl} className="flex items-center gap-2 flex-1">
                <div className="flex flex-col items-center gap-1" style={{ flex: '0 0 auto' }}>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                    style={
                      progress.level === lvl
                        ? { background: levelColors[lvl], color: '#fff', boxShadow: `0 0 16px ${levelColors[lvl]}60` }
                        : progress.xp >= getXpForLevel(lvl).min
                        ? { background: `${levelColors[lvl]}30`, color: levelColors[lvl], border: `2px solid ${levelColors[lvl]}` }
                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '2px solid rgba(255,255,255,0.1)' }
                    }
                  >
                    {lvl}
                  </div>
                </div>
                {idx < 3 && (
                  <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    {progress.level === lvl && (
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressPct}%`, background: levelColors[lvl] }} />
                    )}
                    {progress.xp >= getXpForLevel((['A1', 'A2', 'B1', 'B2'] as Level[])[idx + 1]).min && (
                      <div className="h-full rounded-full w-full" style={{ background: levelColors[lvl] }} />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <ProgressBar value={progressPct} animated />
          <p className="text-xs mt-2 text-right" style={{ color: '#8b8fa8' }}>
            {Math.round(progressPct)}% {t('completed', lang)}
          </p>
        </div>

        {/* Today's suggestion */}
        {(() => {
          const suggested = orderedTopics.find(tt =>
            !progress.completedTopics.includes(tt.id) &&
            isTopicUnlocked(tt.id, progress.level, tt.alwaysUnlocked, tt.requiredLevel)
          );
          if (!suggested) return null;
          return (
            <div
              className="action-card rounded-2xl p-5 mb-6 cursor-pointer animate-fade-in-up"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.14), rgba(245,158,11,0.06))',
                border: '1.5px solid rgba(245,158,11,0.35)',
              }}
              onClick={() => navigate(`/lesson/${suggested.id}`)}
            >
              <p className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                ⭐ <BilingualText native={t('todayRecommended', lang)} de={t('todayRecommended', 'de')} lang={lang} />
              </p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0" style={{ background: 'rgba(245,158,11,0.12)' }}>
                  {suggested.icon}
                </div>
                <div className="flex-1" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  <h3 style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8', fontSize: 20, fontWeight: 700, margin: 0 }}>
                    {(topicTitles[lang] ?? topicTitles['en'])![suggested.id] ?? suggested.titleDE}
                  </h3>
                  <p className="text-xs mt-0.5 mb-1" style={{ color: '#f59e0b', opacity: 0.7 }}>
                    {suggested.titleDE}
                  </p>
                  <p className="text-sm" style={{ color: '#8b8fa8' }}>
                    {(topicSubtitles[lang] ?? topicSubtitles['en'])![suggested.id] ?? suggested.subtitleDE}
                  </p>
                </div>
                <div
                  className="flex flex-col items-center gap-1 px-5 py-3 rounded-xl font-bold text-sm shrink-0"
                  style={{ background: '#f59e0b', color: '#0f1117', minWidth: 80 }}
                >
                  <BilingualText native={t('start', lang)} de={t('start', 'de')} lang={lang} />
                  <span className="action-arrow text-base">→</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Vocab flashcard entry */}
        {(() => {
          const vm = progress.vocabMastery ?? {};
          const total = topics.reduce((s, tt) => s + tt.phrases.length, 0);
          const masteredCount = Object.values(vm).filter(v => v === 2).length;
          return (
            <div
              className="action-card rounded-2xl p-5 mb-6 cursor-pointer animate-fade-in-up"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.06))',
                border: '1.5px solid rgba(99,102,241,0.3)',
              }}
              onClick={() => navigate('/vocab')}
            >
              <p className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                🃏 <BilingualText native={t('vocabDash', lang)} de={t('vocabDash', 'de')} lang={lang} />
              </p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0" style={{ background: 'rgba(99,102,241,0.1)' }}>
                  🃏
                </div>
                <div className="flex-1" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  <h3 style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8', fontSize: 18, fontWeight: 700, margin: 0 }}>
                    {t('vocabTitle', lang)}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: '#8b8fa8' }}>
                    {masteredCount} / {total} {t('masteredCount', lang)}
                  </p>
                  <div className="mt-2 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${total > 0 ? (masteredCount / total) * 100 : 0}%`, background: '#6366f1' }} />
                  </div>
                </div>
                <div
                  className="flex flex-col items-center gap-1 px-5 py-3 rounded-xl font-bold text-sm shrink-0"
                  style={{ background: '#6366f1', color: '#fff', minWidth: 80 }}
                >
                  <BilingualText native={t('start', lang)} de={t('start', 'de')} lang={lang} />
                  <span className="action-arrow text-base">→</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Einbürgerungs-Widget — nur für diesen Pfad */}
        {path === 'einbuergerung' && (
          <div
            className="action-card rounded-2xl p-5 mb-6 cursor-pointer animate-fade-in-up"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.14), rgba(99,102,241,0.06))',
              border: '1.5px solid rgba(99,102,241,0.45)',
            }}
            onClick={() => navigate('/einbuergerung')}
          >
            <p className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              🪪 <BilingualText native={t('einbuergerungWidget', lang)} de={t('einbuergerungWidget', 'de')} lang={lang} />
            </p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0" style={{ background: 'rgba(99,102,241,0.12)' }}>
                🪪
              </div>
              <div className="flex-1" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <h3 style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8', fontSize: 18, fontWeight: 700, margin: 0 }}>
                  <BilingualText native={t('b1Goal', lang)} de={t('b1Goal', 'de')} lang={lang} />
                </h3>
                <p className="text-sm mt-1" style={{ color: '#8b8fa8' }}>
                  {t('einbuergerungWidgetSub', lang)}
                </p>
              </div>
              <div
                className="flex flex-col items-center gap-1 px-5 py-3 rounded-xl font-bold text-sm shrink-0"
                style={{ background: '#6366f1', color: '#fff', minWidth: 80 }}
              >
                <BilingualText native={t('einbuergerungWidgetCta', lang)} de={t('einbuergerungWidgetCta', 'de')} lang={lang} />
                <span className="action-arrow text-base">→</span>
              </div>
            </div>
          </div>
        )}

        {/* Topic Cards */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">📚</span>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8' }}>
            <BilingualText native={t('yourTopics', lang)} de={t('yourTopics', 'de')} lang={lang} />
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {orderedTopics.map((topic, idx) => {
            const unlocked = isTopicUnlocked(topic.id, progress.level, topic.alwaysUnlocked, topic.requiredLevel);
            const completed = progress.completedTopics.includes(topic.id);
            const seenCount = topic.phrases.filter(p => progress.seenPhrases.includes(p.id)).length;
            const quizScore = progress.quizScores[topic.id];
            const progressPct = (seenCount / topic.phrases.length) * 100;

            return (
              <div
                key={topic.id}
                className={`topic-card rounded-2xl p-5 animate-fade-in-up${unlocked ? ' unlocked' : ''}`}
                style={{
                  background: unlocked ? 'rgba(26,29,39,0.9)' : 'rgba(20,23,32,0.6)',
                  border: completed
                    ? '1.5px solid rgba(245,158,11,0.4)'
                    : unlocked
                    ? '1.5px solid rgba(255,255,255,0.08)'
                    : '1px solid rgba(255,255,255,0.04)',
                  opacity: unlocked ? 1 : 0.55,
                  animationDelay: `${idx * 60}ms`,
                }}
                onClick={() => unlocked && navigate(`/lesson/${topic.id}`)}
                onMouseEnter={e => {
                  if (unlocked) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.4)';
                }}
                onMouseLeave={e => {
                  if (unlocked) (e.currentTarget as HTMLElement).style.borderColor = completed ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)';
                }}
              >
                {/* Header row: icon + status */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                    style={{
                      background: completed
                        ? 'rgba(245,158,11,0.15)'
                        : unlocked
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    {!unlocked ? '🔒' : topic.icon}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {completed ? (
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: 'rgba(245,158,11,0.18)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)' }}>
                        ✓ <BilingualText native={t('done', lang)} de={t('done', 'de')} lang={lang} />
                      </span>
                    ) : seenCount > 0 && unlocked ? (
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(245,158,11,0.09)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                        {seenCount}/{topic.phrases.length}
                      </span>
                    ) : null}
                    {quizScore !== undefined && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: '#8b8fa8' }}>
                        Quiz {quizScore}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3
                  className="font-bold mb-0.5"
                  style={{ fontFamily: 'Fraunces, serif', color: unlocked ? '#f0ede8' : 'rgba(240,237,232,0.35)', fontSize: 17, direction: lang === 'ar' ? 'rtl' : 'ltr' }}
                >
                  {unlocked ? ((topicTitles[lang] ?? topicTitles['en'])![topic.id] ?? topic.titleDE) : topic.titleDE}
                </h3>
                {unlocked && (
                  <p className="text-xs mb-1" style={{ color: '#f59e0b', opacity: 0.65 }}>
                    {topic.titleDE}
                  </p>
                )}
                <p className="text-xs mb-4" style={{ color: unlocked ? '#8b8fa8' : 'rgba(139,143,168,0.35)', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
                  {unlocked
                    ? ((topicSubtitles[lang] ?? topicSubtitles['en'])![topic.id] ?? topic.subtitleDE)
                    : `${t('unlockedFrom', lang)} ${topic.requiredLevel}`}
                </p>

                {unlocked && (
                  <ProgressBar value={progressPct} height={4} />
                )}

                {/* CTA — appears on hover via CSS */}
                {unlocked && (
                  <div className="topic-cta">
                    <div
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold"
                      style={{
                        background: completed ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.18)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245,158,11,0.3)',
                      }}
                    >
                      {completed ? '🔄' : '▶'}
                      <BilingualText
                        native={completed ? t('start', lang) : t('start', lang)}
                        de={completed ? 'Wiederholen' : 'Lektion starten'}
                        lang={lang}
                      />
                      <span style={{ opacity: 0.6 }}>→</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Badges */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">🏅</span>
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8' }}>
              <BilingualText native={t('badges', lang)} de={t('badges', 'de')} lang={lang} />
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {allBadges.map(badge => {
              const earned = progress.badges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className="rounded-xl p-4 text-center transition-all duration-200"
                  style={{
                    background: earned ? 'rgba(245,158,11,0.1)' : 'rgba(26,29,39,0.5)',
                    border: earned ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(255,255,255,0.06)',
                    opacity: earned ? 1 : 0.5,
                  }}
                  title={badge.description[lang]}
                >
                  <div className="text-3xl mb-2" style={{ filter: earned ? 'none' : 'grayscale(1)' }}>
                    {badge.icon}
                  </div>
                  <p className="text-xs font-semibold" style={{ color: earned ? '#f59e0b' : '#8b8fa8' }}>
                    {badge.name[lang] ?? badge.name['en']}
                  </p>
                  {earned && (
                    <p className="text-xs mt-1" style={{ color: 'rgba(139,143,168,0.6)', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
                      {badge.description[lang]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {nextBadge && (
            <p className="text-xs mt-3 text-center" style={{ color: '#8b8fa8', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
              {t('nextBadge', lang)} {nextBadge.icon} <strong style={{ color: '#f0ede8' }}>{nextBadge.name[lang] ?? nextBadge.name['en']}</strong> — {nextBadge.description[lang]}
            </p>
          )}
        </div>

        {/* Report link */}
        <div className="text-center pb-8">
          <button
            onClick={() => navigate('/report')}
            className="inline-flex items-center gap-2 text-sm transition-all duration-200 px-5 py-2.5 rounded-xl font-medium"
            style={{ color: '#8b8fa8', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f59e0b'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#8b8fa8'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            📊 <BilingualText native={t('reportLink', lang)} de={t('reportLink', 'de')} lang={lang} />
          </button>
        </div>
      </div>
    </div>
  );
}
