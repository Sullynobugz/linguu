interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
  animated?: boolean;
}

export function ProgressBar({ value, color = '#f59e0b', height = 8, animated = false }: ProgressBarProps) {
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.08)', height }}
    >
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: animated
            ? `linear-gradient(90deg, ${color} 0%, #fcd34d 50%, ${color} 100%)`
            : color,
          backgroundSize: animated ? '200% 100%' : undefined,
          animation: animated ? 'shimmer 2s linear infinite' : undefined,
        }}
      />
    </div>
  );
}
