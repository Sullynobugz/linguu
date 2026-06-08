import { useProgress } from '../store/ProgressContext';

export function ApiCostIndicator() {
  const { progress } = useProgress();
  const openAi = progress.openAiCostEur;
  const claude = progress.claudeCostEur;
  const total = openAi + claude;

  if (total === 0) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
      style={{ background: 'rgba(248,250,252,0.95)', border: '1px solid rgba(79,70,229,0.2)', color: '#64748b' }}
    >
      <span style={{ color: '#10b981' }}>OAI</span>
      <span>€{openAi.toFixed(4)}</span>
      <span style={{ color: 'rgba(0,0,0,0.2)' }}>·</span>
      <span style={{ color: '#818cf8' }}>Claude</span>
      <span>€{claude.toFixed(4)}</span>
    </div>
  );
}
