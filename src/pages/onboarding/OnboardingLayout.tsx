import React from 'react';

interface OnboardingLayoutProps {
  step: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  onBack?: () => void;
}

export function OnboardingLayout({ step, children, onBack }: OnboardingLayoutProps) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #0f1117 0%, #131620 100%)' }}
    >
      {/* Top row: back button (left) + logo (center) */}
      <div className="flex items-center justify-between pt-8 px-6 pb-2">
        <div style={{ width: 64 }}>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm transition-all px-3 py-1.5 rounded-lg"
              style={{ color: '#8b8fa8', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f0ede8')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8b8fa8')}
            >
              ← Zurück
            </button>
          )}
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            🇩🇪
          </div>
          <span
            className="text-2xl font-bold"
            style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8' }}
          >
            Linguu
          </span>
        </div>

        <div style={{ width: 64 }} />
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center mb-10">
        <div className="flex items-center gap-3">
          {[1, 2, 3, 4].map(s => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300"
                  style={
                    s < step
                      ? { background: '#f59e0b', color: '#0f1117' }
                      : s === step
                      ? {
                          background: 'transparent',
                          border: '2px solid #f59e0b',
                          color: '#f59e0b',
                          boxShadow: '0 0 12px rgba(245,158,11,0.4)',
                        }
                      : {
                          background: 'transparent',
                          border: '2px solid rgba(255,255,255,0.15)',
                          color: 'rgba(255,255,255,0.3)',
                        }
                  }
                >
                  {s < step ? '✓' : s}
                </div>
                <span
                  className="text-xs hidden sm:block"
                  style={{ color: s <= step ? '#8b8fa8' : 'rgba(255,255,255,0.2)' }}
                >
                  {s === 1 ? 'Muttersprache' : s === 2 ? 'Lernsprache' : s === 3 ? 'Lernpfad' : 'Level'}
                </span>
              </div>
              {s < 4 && (
                <div
                  className="w-8 h-0.5 rounded transition-all duration-500"
                  style={{ background: s < step ? '#f59e0b' : 'rgba(255,255,255,0.1)' }}
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
