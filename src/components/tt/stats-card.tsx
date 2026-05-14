'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  change?: number
  color?: string
  index?: number
}

export function StatsCard({ icon: Icon, label, value, change, color = '#00ff88', index = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="glass-card rounded-xl p-4 flex items-center gap-4"
    >
      <div
        className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
        style={{ background: `${color}15` }}
      >
        <Icon className="size-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
        <div className="text-xl font-bold tracking-tight">{value}</div>
      </div>
      {change !== undefined && change !== 0 && (
        <div className={`text-xs font-semibold ${change > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
          {change > 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </motion.div>
  )
}
