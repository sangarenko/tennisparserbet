'use client'

import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'

export function LoadingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="glass-card rounded-xl p-4 space-y-3"
        >
          {/* Header badges */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-14 rounded-md" />
              <Skeleton className="h-5 w-14 rounded-md" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>

          {/* League */}
          <Skeleton className="h-3 w-24" />

          {/* Players */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2.5 w-12" />
            </div>
            <Skeleton className="h-10 w-14 rounded-lg" />
            <div className="flex-1 space-y-1 text-right">
              <Skeleton className="h-4 w-full ml-auto" />
              <Skeleton className="h-2.5 w-12 ml-auto" />
            </div>
          </div>

          {/* Odds */}
          <div className="flex gap-2">
            <Skeleton className="h-6 flex-1 rounded-md" />
            <Skeleton className="h-6 flex-1 rounded-md" />
          </div>

          {/* Button */}
          <Skeleton className="h-8 w-full rounded-lg" />
        </motion.div>
      ))}
    </div>
  )
}
