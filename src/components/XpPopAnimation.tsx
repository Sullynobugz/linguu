import { useProgress } from '../store/ProgressContext';

export function XpPopAnimation() {
  const { xpAnimation } = useProgress();

  if (xpAnimation === null) return null;

  return (
    <div
      className="fixed top-1/2 left-1/2 pointer-events-none z-50 font-bold text-2xl"
      style={{
        transform: 'translate(-50%, -50%)',
        color: '#4f46e5',
        textShadow: '0 0 20px rgba(79,70,229,0.8)',
        animation: 'xpPop 1s ease forwards',
      }}
    >
      +{xpAnimation} XP
    </div>
  );
}
