import { useNavigate } from 'react-router-dom';
import { useProgress } from '../../store/ProgressContext';
import { OnboardingLayout } from './OnboardingLayout';
import type { Language } from '../../types';


const languages: { code: Language; flag: string; native: string; subtitle: string; beta?: boolean }[] = [
  { code: 'ar', flag: '🇸🇦', native: 'العربية',    subtitle: 'اختر العربية' },
  { code: 'uk', flag: '🇺🇦', native: 'Українська', subtitle: 'Оберіть українську' },
  { code: 'ku', flag: '🏔️',  native: 'Kurdî',      subtitle: 'Kurdî hilbijêre' },
  { code: 'es', flag: '🇪🇸', native: 'Español',    subtitle: 'Elige español' },
  { code: 'en', flag: '🇬🇧', native: 'English',    subtitle: 'Choose English', beta: true },
  { code: 'tr', flag: '🇹🇷', native: 'Türkçe',     subtitle: 'Türkçe seç',     beta: true },
  { code: 'ru', flag: '🇷🇺', native: 'Русский',    subtitle: 'Выбери русский', beta: true },
  { code: 'pl', flag: '🇵🇱', native: 'Polski',     subtitle: 'Wybierz polski', beta: true },
  { code: 'ro', flag: '🇷🇴', native: 'Română',     subtitle: 'Alege română',   beta: true },
  { code: 'de', flag: '🇩🇪', native: 'Deutsch',    subtitle: 'Wähle Deutsch',  beta: true },
];

export function Step1Language() {
  const navigate = useNavigate();
  const { setLanguage, progress } = useProgress();

  const handleSelect = (code: Language) => {
    setLanguage(code);
    navigate('/onboarding/target');
  };

  return (
    <OnboardingLayout step={1}>
      <div className="text-center mb-8">
        <h1
          className="text-4xl sm:text-5xl font-bold mb-3"
          style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', color: '#0f172a' }}
        >
          Linguu
        </h1>
        <p className="text-base" style={{ color: '#64748b' }}>
          Wähle deine Muttersprache · Choose your language
        </p>
        <p className="text-sm mt-1" style={{ color: 'rgba(100,116,139,0.6)' }}>
          Выбери · Обери · Seçin · Wybierz · Alege · اختر · Elige
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {languages.map(lang => {
          const selected = progress.language === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="group flex flex-col items-center gap-2 p-5 rounded-2xl transition-all duration-200 relative"
              style={{
                background: selected ? 'rgba(79,70,229,0.15)' : 'rgba(255,255,255,0.9)',
                border: selected ? '2px solid #4f46e5' : '2px solid rgba(0,0,0,0.06)',
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
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.06)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.9)';
                }
              }}
            >
              {lang.beta && (
                <span
                  className="absolute top-2 right-2 text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(100,116,139,0.2)', color: '#64748b', fontSize: '9px', letterSpacing: '0.04em' }}
                >
                  BETA
                </span>
              )}
              <span className="text-4xl">{lang.flag}</span>
              <div className="text-center">
                <div
                  className="text-lg font-semibold"
                  style={{
                    color: lang.beta ? '#64748b' : '#0f172a',
                    direction: lang.code === 'ar' ? 'rtl' : 'ltr',
                  }}
                >
                  {lang.native}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                  {lang.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}
