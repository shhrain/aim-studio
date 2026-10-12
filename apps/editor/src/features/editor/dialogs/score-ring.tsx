export function ScoreRing({ score, passed, size = 32 }: { score: number; passed: boolean; size?: number }) {
  const r = (size - 4) / 2
  const c = 2 * Math.PI * r
  const color = passed ? (score >= 90 ? 'var(--color-success)' : 'var(--color-warning)') : 'var(--color-destructive)'
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-muted)" strokeWidth={3} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3} strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} strokeLinecap="round" className="transition-[stroke-dashoffset] duration-500" />
      </svg>
      <span className="absolute font-semibold tabular-nums" style={{ fontSize: size * 0.32, color }}>
        {score}
      </span>
    </span>
  )
}
