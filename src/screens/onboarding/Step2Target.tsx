import { useNavigate } from 'react-router-dom';
import { useProgress } from '../../store/ProgressContext';
import { OnboardingLayout } from './OnboardingLayout';
import type { Language } from '../../types';

// Name jeder Sprache in der jeweiligen UI-Sprache
const nameInLang: Record<Language, Partial<Record<Language, string>>> = {
  de: { de: 'Deutsch',    en: 'German',    ar: 'الألمانية',    uk: 'Німецька',    ru: 'Немецкий',    tr: 'Almanca',     pl: 'Niemiecki',  ro: 'Germană',  es: 'Alemán'   },
  en: { de: 'Englisch',   en: 'English',   ar: 'الإنجليزية',   uk: 'Англійська',  ru: 'Английский',  tr: 'İngilizce',   pl: 'Angielski',  ro: 'Engleză',  es: 'Inglés'   },
  tr: { de: 'Türkisch',   en: 'Turkish',   ar: 'التركية',      uk: 'Турецька',    ru: 'Турецкий',    tr: 'Türkçe',      pl: 'Turecki',    ro: 'Turcă',    es: 'Turco'    },
  ar: { de: 'Arabisch',   en: 'Arabic',    ar: 'العربية',      uk: 'Арабська',    ru: 'Арабский',    tr: 'Arapça',      pl: 'Arabski',    ro: 'Arabă',    es: 'Árabe'    },
  es: { de: 'Spanisch',   en: 'Spanish',   ar: 'الإسبانية',    uk: 'Іспанська',   ru: 'Испанский',   tr: 'İspanyolca',  pl: 'Hiszpański', ro: 'Spaniolă', es: 'Español'  },
  uk: { de: 'Ukrainisch', en: 'Ukrainian', ar: 'الأوكرانية',   uk: 'Українська',  ru: 'Украинский',  tr: 'Ukraynaca',   pl: 'Ukraiński',  ro: 'Ucraineană', es: 'Ucraniano' },
  ru: { de: 'Russisch',   en: 'Russian',   ar: 'الروسية',      uk: 'Російська',   ru: 'Русский',     tr: 'Rusça',       pl: 'Rosyjski',   ro: 'Rusă',     es: 'Ruso'     },
  pl: { de: 'Polnisch',   en: 'Polish',    ar: 'البولندية',    uk: 'Польська',    ru: 'Польский',    tr: 'Lehçe',       pl: 'Polski',     ro: 'Poloneză', es: 'Polaco'   },
  ro: { de: 'Rumänisch',  en: 'Romanian',  ar: 'الرومانية',    uk: 'Румунська',   ru: 'Румынский',   tr: 'Rumence',     pl: 'Rumuński',   ro: 'Română',   es: 'Rumano'   },
};

const targets: { code: Language; flag: string; native: string }[] = [
  { code: 'de', flag: '🇩🇪', native: 'Deutsch'    },
  { code: 'en', flag: '🇬🇧', native: 'English'    },
  { code: 'tr', flag: '🇹🇷', native: 'Türkçe'     },
  { code: 'ar', flag: '🇸🇦', native: 'العربية'    },
  { code: 'es', flag: '🇪🇸', native: 'Español'    },
  { code: 'uk', flag: '🇺🇦', native: 'Українська' },
  { code: 'ru', flag: '🇷🇺', native: 'Русский'    },
  { code: 'pl', flag: '🇵🇱', native: 'Polski'     },
  { code: 'ro', flag: '🇷🇴', native: 'Română'     },
];

const label: Record<Language, string> = {
  de: 'Welche Sprache möchtest du lernen?',
  en: 'Which language do you want to learn?',
  ar: 'ما اللغة التي تريد تعلمها؟',
  tr: 'Hangi dili öğrenmek istiyorsun?',
  uk: 'Яку мову ти хочеш вивчати?',
  ru: 'Какой язык ты хочешь учить?',
  pl: 'Jakiego języka chcesz się uczyć?',
  ro: 'Ce limbă vrei să înveți?',
  es: '¿Qué idioma quieres aprender?',
};

export function Step2Target() {
  const navigate = useNavigate();
  const { setTargetLanguage, progress } = useProgress();
  const uiLang = (progress.language ?? 'en') as Language;

  const handleSelect = (code: Language) => {
    setTargetLanguage(code);
    navigate('/onboarding/2');
  };

  // Eigene Muttersprache kann nicht Lernsprache sein
  const filteredTargets = targets.filter(lang => lang.code !== uiLang);

  return (
    <OnboardingLayout step={2} total={4} onBack={() => navigate('/onboarding/1')}>
      <div className="text-center mb-8">
        <h1
          className="text-3xl sm:text-4xl font-bold mb-1"
          style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', color: '#0f172a', direction: uiLang === 'ar' ? 'rtl' : 'ltr' }}
        >
          {label[uiLang] ?? label['en']}
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        {filteredTargets.map(lang => {
          const selected = progress.targetLanguage === lang.code;
          const isRecommended = lang.code === 'de' && uiLang !== 'de';
          return (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="onboarding-row flex items-center gap-5 p-5 rounded-2xl text-left"
              style={{
                background: selected ? 'rgba(79,70,229,0.12)' : 'rgba(255,255,255,0.9)',
                border: selected ? '2px solid #4f46e5' : isRecommended ? '2px solid rgba(79,70,229,0.3)' : '2px solid rgba(0,0,0,0.06)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                if (!selected) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(79,70,229,0.4)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(79,70,229,0.07)';
                }
              }}
              onMouseLeave={e => {
                if (!selected) {
                  (e.currentTarget as HTMLElement).style.borderColor = isRecommended ? 'rgba(79,70,229,0.3)' : 'rgba(0,0,0,0.06)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.9)';
                }
              }}
            >
              <span className="text-5xl flex-shrink-0">{lang.flag}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold" style={{ color: '#0f172a' }}>
                    {lang.native}
                  </div>
                  {isRecommended && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: 'rgba(79,70,229,0.2)', color: '#4f46e5', border: '1px solid rgba(79,70,229,0.4)' }}
                    >
                      ★ Empfohlen
                    </span>
                  )}
                </div>
                {nameInLang[lang.code]?.[uiLang] && nameInLang[lang.code][uiLang] !== lang.native && (
                  <div className="text-sm mt-0.5" style={{ color: '#64748b' }}>
                    {nameInLang[lang.code][uiLang]}
                  </div>
                )}
              </div>
              {selected ? (
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#4f46e5', color: '#f8fafc', fontSize: 16, fontWeight: 700 }}>
                  ✓
                </div>
              ) : (
                <span className="row-arrow text-2xl flex-shrink-0" style={{ color: 'rgba(79,70,229,0.6)' }}>→</span>
              )}
            </button>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}
