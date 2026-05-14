'use client'

interface ConfidenceMeterProps {
  confidence: number
  size?: 'sm' | 'md' | 'lg'
}

export function ConfidenceMeter({ confidence, size = 'md' }: ConfidenceMeterProps) {
  const pct = Math.round(confidence * 100)
  const getColor = () => {
    if (pct >= 80) return '#00ff88'
    if (pct >= 60) return '#00d4ff'
    if (pct >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const heights: Record<string, string> = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }
  const textSizes: Record<string, string> = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${heights[size]} bg-white/10 rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: getColor(),
            boxShadow: `0 0 8px ${getColor()}`,
          }}
        />
      </div>
      <span className={`${textSizes[size]} font-mono font-bold`} style={{ color: getColor() }}>
        {pct}%
      </span>
    </div>
  )
}
