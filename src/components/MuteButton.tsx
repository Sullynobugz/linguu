import { useAudio } from '../store/AudioContext';

export function MuteButton() {
  const { muted, toggle } = useAudio();

  return (
    <button
      onClick={toggle}
      title={muted ? 'Ton einschalten' : 'Ton ausschalten'}
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 1000,
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: muted ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.07)',
        border: muted ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(255,255,255,0.12)',
        color: muted ? '#f87171' : '#8b8fa8',
        fontSize: 18,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.2s',
      }}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
