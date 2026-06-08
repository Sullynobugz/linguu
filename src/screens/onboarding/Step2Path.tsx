import { useNavigate } from 'react-router-dom';
import { useProgress } from '../../store/ProgressContext';
import { OnboardingLayout } from './OnboardingLayout';
import { t } from '../../i18n';
import type { Path, Language } from '../../types';

const paths: {
  id: Path;
  icon: string;
  titles: Record<Language, string>;
  subtitles: Record<Language, string>;
  titleDE: string;
}[] = [
  {
    id: 'einbuergerung',
    icon: '🪪',
    titleDE: 'Einbürgerung',
    titles: {
      de: 'Weg zur Einbürgerung',
      ar: 'طريق التجنيس',
      uk: 'Шлях до громадянства',
      es: 'Camino a la ciudadanía',
      en: 'Path to Citizenship',
      tr: 'Vatandaşlık Yolu',
      pl: 'Droga do obywatelstwa',
      ro: 'Drumul spre cetățenie',
      ru: 'Путь к гражданству',
    },
    subtitles: {
      de: 'Einbürgerungstest, B1-Niveau, Voraussetzungen für die deutsche Staatsbürgerschaft',
      ar: 'اختبار التجنيس، مستوى B1، متطلبات الجنسية الألمانية',
      uk: 'Тест на натуралізацію, рівень B1, вимоги до громадянства',
      es: 'Test de naturalización, nivel B1, requisitos de ciudadanía alemana',
      en: 'Naturalization test, B1 level, German citizenship requirements',
      tr: 'Vatandaşlık testi, B1 seviyesi, Alman vatandaşlığı gereklilikleri',
      pl: 'Test naturalizacyjny, poziom B1, wymagania obywatelstwa niemieckiego',
      ro: 'Test de naturalizare, nivel B1, cerințele cetățeniei germane',
      ru: 'Тест на натурализацию, уровень B1, требования к гражданству Германии',
    },
  },
  {
    id: 'neu',
    icon: '🧭',
    titleDE: 'Neu in Deutschland',
    titles: {
      de: 'Neu in Deutschland',
      ar: 'جديد في ألمانيا',
      uk: 'Новий у Німеччині',
      es: 'Nuevo en Alemania',
      en: 'New in Germany',
      tr: 'Almanya\'da Yeniyim',
      pl: 'Nowy w Niemczech',
      ro: 'Nou în Germania',
      ru: 'Новый в Германии',
    },
    subtitles: {
      de: 'Behörden, Wohnen, Gesundheit, Alltag',
      ar: 'الإجراءات الحكومية، السكن، الصحة، الحياة اليومية',
      uk: 'Держоргани, житло, здоров\'я, щоденне життя',
      es: 'Oficinas, vivienda, salud, vida cotidiana',
      en: 'Government offices, housing, health, daily life',
      tr: 'Resmi kurumlar, konut, sağlık, günlük yaşam',
      pl: 'Urzędy, mieszkanie, zdrowie, życie codzienne',
      ro: 'Instituții, locuință, sănătate, viața de zi cu zi',
      ru: 'Госорганы, жильё, здоровье, повседневная жизнь',
    },
  },
  {
    id: 'beruf',
    icon: '💼',
    titleDE: 'Beruf & Karriere',
    titles: {
      de: 'Beruf & Karriere',
      ar: 'العمل والمهنة',
      uk: 'Робота та кар\'єра',
      es: 'Trabajo y carrera',
      en: 'Work & Career',
      tr: 'İş ve Kariyer',
      pl: 'Praca i kariera',
      ro: 'Muncă și carieră',
      ru: 'Работа и карьера',
    },
    subtitles: {
      de: 'Jobsuche, Kollegen, Bewerbungen',
      ar: 'البحث عن عمل، الزملاء، التقديم للوظائف',
      uk: 'Пошук роботи, колеги, заявки на роботу',
      es: 'Búsqueda de empleo, compañeros, solicitudes',
      en: 'Job search, colleagues, job applications',
      tr: 'İş arama, meslektaşlar, iş başvuruları',
      pl: 'Poszukiwanie pracy, współpracownicy, podania o pracę',
      ro: 'Căutarea unui loc de muncă, colegi, cereri de angajare',
      ru: 'Поиск работы, коллеги, заявления о приёме на работу',
    },
  },
  {
    id: 'sprache',
    icon: '📚',
    titleDE: 'Sprache vertiefen',
    titles: {
      de: 'Sprache vertiefen',
      ar: 'تعميق اللغة',
      uk: 'Поглиблення мови',
      es: 'Profundizar el idioma',
      en: 'Deepen Language Skills',
      tr: 'Dili Derinleştir',
      pl: 'Pogłębianie języka',
      ro: 'Aprofundarea limbii',
      ru: 'Углублённое изучение языка',
    },
    subtitles: {
      de: 'Grammatik, Gespräch, deutsche Kultur',
      ar: 'القواعد، المحادثة، الثقافة الألمانية',
      uk: 'Граматика, розмова, німецька культура',
      es: 'Gramática, conversación, cultura alemana',
      en: 'Grammar, conversation, German culture',
      tr: 'Dilbilgisi, konuşma, Alman kültürü',
      pl: 'Gramatyka, konwersacja, kultura niemiecka',
      ro: 'Gramatică, conversație, cultură germană',
      ru: 'Грамматика, разговор, немецкая культура',
    },
  },
];

export function Step2Path() {
  const navigate = useNavigate();
  const { setPath, progress } = useProgress();
  const lang = (progress.language ?? 'en') as Language;

  const handleSelect = (id: Path) => {
    setPath(id);
    navigate('/onboarding/3');
  };

  return (
    <OnboardingLayout
      step={3}
      total={4}
      onBack={() => navigate('/onboarding/target')}
    >
      <div className="text-center mb-8">
        <h1
          className="text-3xl sm:text-4xl font-bold mb-1"
          style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8', direction: lang === 'ar' ? 'rtl' : 'ltr' }}
        >
          {t('choosePath', lang)}
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        {paths.map(path => {
          const selected = progress.path === path.id;
          const isEinbuergerung = path.id === 'einbuergerung';
          const accent = isEinbuergerung ? '#6366f1' : '#f59e0b';
          const accentAlpha = isEinbuergerung ? 'rgba(99,102,241,0.35)' : 'rgba(245,158,11,0.35)';
          return (
            <button
              key={path.id}
              onClick={() => handleSelect(path.id)}
              className="onboarding-row flex items-center gap-5 p-5 rounded-2xl text-left"
              style={{
                background: selected
                  ? isEinbuergerung ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.12)'
                  : 'rgba(26,29,39,0.8)',
                border: selected
                  ? `2px solid ${accent}`
                  : isEinbuergerung
                  ? '2px solid rgba(99,102,241,0.25)'
                  : '2px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                if (!selected) {
                  (e.currentTarget as HTMLElement).style.borderColor = accentAlpha;
                  (e.currentTarget as HTMLElement).style.background = 'rgba(26,29,39,1)';
                }
              }}
              onMouseLeave={e => {
                if (!selected) {
                  (e.currentTarget as HTMLElement).style.borderColor = isEinbuergerung ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.08)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(26,29,39,0.8)';
                }
              }}
            >
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: selected ? `${accent}20` : 'rgba(255,255,255,0.05)' }}
              >
                {path.icon}
              </div>

              <div className="flex-1" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <div className="text-xl font-bold" style={{ color: '#f0ede8' }}>
                  {path.titles[lang]}
                </div>
                <div className="text-sm mt-0.5" style={{ color: accent, opacity: 0.85 }}>
                  {path.titleDE}
                </div>
                <p className="text-sm mt-1" style={{ color: '#8b8fa8' }}>
                  {path.subtitles[lang]}
                </p>
                {isEinbuergerung && (
                  <span
                    className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.4)' }}
                  >
                    {t('zielB1', lang)}
                  </span>
                )}
              </div>

              {/* Status / Arrow */}
              {selected ? (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: accent, color: '#fff', fontSize: 16, fontWeight: 700 }}
                >
                  ✓
                </div>
              ) : (
                <span className="row-arrow text-2xl flex-shrink-0" style={{ color: accent }}>→</span>
              )}
            </button>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}
