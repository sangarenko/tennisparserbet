'use client'

export function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card p-4 rounded-xl animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-16 bg-white/10 rounded-full" />
            <div className="h-5 w-12 bg-white/10 rounded-full" />
          </div>
          <div className="h-3 w-full bg-white/5 rounded mb-2" />
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-24 bg-white/10 rounded" />
            <div className="h-4 w-8 bg-white/10 rounded" />
            <div className="h-4 w-24 bg-white/10 rounded" />
          </div>
          <div className="h-20 w-full bg-white/5 rounded-lg mb-4" />
          <div className="flex gap-2">
            <div className="h-8 flex-1 bg-white/10 rounded-lg" />
            <div className="h-8 flex-1 bg-white/10 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
