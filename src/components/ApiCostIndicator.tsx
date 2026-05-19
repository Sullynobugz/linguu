import { useProgress } from '../store/ProgressContext';

export function ApiCostIndicator() {
  const { progress } = useProgress();
  const cost = progress.sessionApiCostEur;

  return (
    <div
      className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
      style={{ background: 'rgba(26,29,39,0.95)', border: '1px solid rgba(245,158,11,0.2)', color: '#8b8fa8' }}
    >
      <span style={{ color: '#f59e0b' }}>◈</span>
      <span>API: €{cost.toFixed(4)}</span>
    </div>
  );
}
