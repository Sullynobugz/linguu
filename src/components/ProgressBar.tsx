interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
  animated?: boolean;
}

export function ProgressBar({ value, color = '#4f46e5', height = 8, animated = false }: ProgressBarProps) {
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.06)', height }}
    >
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: animated
            ? `linear-gradient(90deg, ${color} 0%, #a5b4fc 50%, ${color} 100%)`
            : color,
          backgroundSize: animated ? '200% 100%' : undefined,
          animation: animated ? 'shimmer 2s linear infinite' : undefined,
        }}
      />
    </div>
  );
}
