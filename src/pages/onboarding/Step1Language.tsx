import { useNavigate } from 'react-router-dom';
import { useProgress } from '../../store/ProgressContext';
import { OnboardingLayout } from './OnboardingLayout';
import type { Language } from '../../types';


const languages: { code: Language; flag: string; native: string; subtitle: string }[] = [
  { code: 'de', flag: '🇩🇪', native: 'Deutsch',    subtitle: 'Wähle Deutsch' },
  { code: 'ar', flag: '🇸🇦', native: 'العربية',    subtitle: 'اختر العربية' },
  { code: 'tr', flag: '🇹🇷', native: 'Türkçe',     subtitle: 'Türkçe seç' },
  { code: 'uk', flag: '🇺🇦', native: 'Українська', subtitle: 'Оберіть українську' },
  { code: 'ru', flag: '🇷🇺', native: 'Русский',    subtitle: 'Выбери русский' },
  { code: 'pl', flag: '🇵🇱', native: 'Polski',     subtitle: 'Wybierz polski' },
  { code: 'ro', flag: '🇷🇴', native: 'Română',     subtitle: 'Alege română' },
  { code: 'es', flag: '🇪🇸', native: 'Español',    subtitle: 'Elige español' },
  { code: 'en', flag: '🇬🇧', native: 'English',    subtitle: 'Choose English' },
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
          style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8' }}
        >
          Linguu
        </h1>
        <p className="text-base" style={{ color: '#8b8fa8' }}>
          Wähle deine Muttersprache · Choose your language
        </p>
        <p className="text-sm mt-1" style={{ color: 'rgba(139,143,168,0.6)' }}>
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
              className="group flex flex-col items-center gap-2 p-5 rounded-2xl transition-all duration-200"
              style={{
                background: selected ? 'rgba(245,158,11,0.15)' : 'rgba(26,29,39,0.8)',
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
              <span className="text-4xl">{lang.flag}</span>
              <div className="text-center">
                <div
                  className="text-lg font-semibold"
                  style={{
                    color: '#f0ede8',
                    direction: lang.code === 'ar' ? 'rtl' : 'ltr',
                  }}
                >
                  {lang.native}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#8b8fa8' }}>
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
