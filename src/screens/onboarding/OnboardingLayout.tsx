import React from 'react';
import { useProgress } from '../../store/ProgressContext';
import { t } from '../../i18n';
import type { Language } from '../../types';

interface OnboardingLayoutProps {
  step: 1 | 2 | 3 | 4;
  total?: 3 | 4;
  children: React.ReactNode;
  onBack?: () => void;
}

export function OnboardingLayout({ step, total = 3, children, onBack }: OnboardingLayoutProps) {
  const { progress } = useProgress();
  const lang = (progress.language ?? 'en') as Language;

  const labels3 = [t('stepNativeLang', lang), t('stepPath', lang), t('stepLevel', lang)];
  const labels4 = [t('stepNativeLang', lang), t('stepTargetLang', lang), t('stepPath', lang), t('stepLevel', lang)];
  const stepLabels = total === 4 ? labels4 : labels3;
  const steps = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between pt-8 px-6 pb-2">
        <div style={{ width: 64 }}>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm transition-all px-3 py-1.5 rounded-lg"
              style={{ color: '#64748b', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#0f172a')}
              onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
            >
              {t('back', lang)}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)' }}
          >
            🇩🇪
          </div>
          <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', color: '#0f172a' }}>
            Linguu
          </span>
        </div>

        <div style={{ width: 64 }} />
      </div>

      {/* Progress indicator */}
      <div className="flex flex-col items-center mb-10">
        <p className="text-xs font-semibold mb-4" style={{ color: 'rgba(79,70,229,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Schritt {step} von {total}
        </p>
        <div className="flex items-center gap-2">
          {steps.map(s => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                  style={
                    s < step
                      ? { background: '#4f46e5', color: '#f8fafc' }
                      : s === step
                      ? { background: 'transparent', border: '2.5px solid #4f46e5', color: '#4f46e5', boxShadow: '0 0 16px rgba(79,70,229,0.45)' }
                      : { background: 'transparent', border: '2px solid rgba(0,0,0,0.08)', color: 'rgba(0,0,0,0.15)' }
                  }
                >
                  {s < step ? '✓' : s}
                </div>
                <span
                  className="text-xs font-medium text-center max-w-16"
                  style={{ color: s === step ? '#0f172a' : s < step ? 'rgba(79,70,229,0.7)' : 'rgba(0,0,0,0.12)', lineHeight: 1.3 }}
                >
                  {stepLabels[s - 1]}
                </span>
              </div>
              {s < total && (
                <div
                  className="w-10 h-0.5 rounded mb-5 transition-all duration-500"
                  style={{ background: s < step ? '#4f46e5' : 'rgba(0,0,0,0.07)' }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-4 pb-16">
        <div className="w-full max-w-2xl animate-fade-in-up">
          {children}
        </div>
      </div>
    </div>
  );
}
