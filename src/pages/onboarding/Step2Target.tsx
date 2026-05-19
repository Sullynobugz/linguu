import { useNavigate } from 'react-router-dom';
import { useProgress } from '../../store/ProgressContext';
import { OnboardingLayout } from './OnboardingLayout';
import type { Language } from '../../types';

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
    navigate('/onboarding/3');
  };

  return (
    <OnboardingLayout step={2} onBack={() => navigate('/onboarding/1')}>
      <div className="text-center mb-8">
        <h1
          className="text-3xl sm:text-4xl font-bold mb-1"
          style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8', direction: uiLang === 'ar' ? 'rtl' : 'ltr' }}
        >
          {label[uiLang] ?? label['en']}
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        {targets.map(lang => {
          const selected = progress.targetLanguage === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="flex items-center gap-5 p-5 rounded-2xl text-left transition-all duration-200"
              style={{
                background: selected ? 'rgba(245,158,11,0.12)' : 'rgba(26,29,39,0.8)',
                border: selected ? '2px solid #f59e0b' : '2px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                if (!selected) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.4)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.07)';
                }
              }}
              onMouseLeave={e => {
                if (!selected) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(26,29,39,0.8)';
                }
              }}
            >
              <span className="text-4xl flex-shrink-0">{lang.flag}</span>
              <div className="flex-1">
                <div className="text-xl font-semibold" style={{ color: '#f0ede8' }}>
                  {lang.native}
                </div>
              </div>
              <div
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{
                  borderColor: selected ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                  background: selected ? '#f59e0b' : 'transparent',
                }}
              >
                {selected && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
              </div>
            </button>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}
