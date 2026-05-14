'use client'

import { motion } from 'framer-motion'

interface ConfidenceMeterProps {
  confidence: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function ConfidenceMeter({ confidence, size = 'md', showLabel = true }: ConfidenceMeterProps) {
  const clampedConfidence = Math.max(0, Math.min(100, confidence))

  const getColor = (val: number) => {
    if (val < 40) return { bar: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' }
    if (val < 60) return { bar: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' }
    return { bar: '#00ff88', bg: 'rgba(0, 255, 136, 0.15)', text: '#00ff88' }
  }

  const colors = getColor(clampedConfidence)
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }
  const textSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }

  return (
    <div className="flex items-center gap-3 w-full">
      <div
        className={`relative w-full rounded-full overflow-hidden ${heights[size]}`}
        style={{ background: colors.bg }}
      >
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${heights[size]}`}
          style={{ background: colors.bar }}
          initial={{ width: 0 }}
          animate={{ width: `${clampedConfidence}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <span className={`${textSizes[size]} font-bold min-w-[3rem] text-right`} style={{ color: colors.text }}>
          {Math.round(clampedConfidence)}%
        </span>
      )}
    </div>
  )
}
