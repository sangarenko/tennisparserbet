'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp, Clock } from 'lucide-react'
import type { Match, Prediction } from '@/hooks/use-store'
import { ConfidenceMeter } from './confidence-meter'

interface MatchCardProps {
  match: Match
  index: number
  prediction: Prediction | null
  isLoadingPrediction: boolean
  onGetPrediction: (match: Match) => void
}

export function MatchCard({ match, index, prediction, isLoadingPrediction, onGetPrediction }: MatchCardProps) {
  const statusColors: Record<string, string> = {
    upcoming: 'status-upcoming',
    live: 'status-live',
    finished: 'status-finished',
  }

  const sourceColors: Record<string, string> = {
    betboom: 'bg-neon-orange/15 text-neon-orange border border-neon-orange/20',
    fonbet: 'bg-neon-blue/15 text-neon-blue border border-neon-blue/20',
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isPredictedWinner = (player: string) => {
    return prediction?.predictedWinner === player
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="glass-card rounded-xl p-4 hover:neon-glow-green cursor-default"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className={`${statusColors[match.status] || 'status-finished'} text-[10px]`}>
            {match.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-neon-green pulse-live mr-1" />}
            {match.status.toUpperCase()}
          </Badge>
          <Badge className={`${sourceColors[match.source] || ''} text-[10px]`}>
            {match.source}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="size-3" />
          {formatDate(match.startTime)} {formatTime(match.startTime)}
        </div>
      </div>

      {/* League */}
      {match.league && (
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 truncate">
          {match.league}
        </div>
      )}

      {/* Players & Score */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold truncate ${isPredictedWinner(match.player1) ? 'text-neon-green' : ''}`}>
            {match.player1}
            {isPredictedWinner(match.player1) && <TrendingUp className="inline size-3 ml-1" />}
          </div>
          <div className="text-[10px] text-muted-foreground">Player 1</div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
          {match.status === 'finished' || match.status === 'live' ? (
            <>
              <span className={`text-lg font-bold ${match.score1 > match.score2 ? 'text-neon-green' : ''}`}>{match.score1}</span>
              <span className="text-muted-foreground text-xs">:</span>
              <span className={`text-lg font-bold ${match.score2 > match.score1 ? 'text-neon-green' : ''}`}>{match.score2}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground font-medium">VS</span>
          )}
        </div>

        <div className="flex-1 min-w-0 text-right">
          <div className={`text-sm font-semibold truncate ${isPredictedWinner(match.player2) ? 'text-neon-green' : ''}`}>
            {match.player2}
            {isPredictedWinner(match.player2) && <TrendingUp className="inline size-3 ml-1" />}
          </div>
          <div className="text-[10px] text-muted-foreground">Player 2</div>
        </div>
      </div>

      {/* Odds */}
      {match.odds && match.odds.length > 0 && (
        <div className="flex gap-2 mb-3">
          {match.odds.map((odd, i) => (
            <div key={i} className="flex-1 flex items-center justify-between text-[11px] bg-white/[0.03] rounded-md px-2 py-1">
              <span className="text-muted-foreground capitalize">{odd.source}</span>
              <div className="flex gap-2">
                <span className={isPredictedWinner(match.player1) ? 'text-neon-green font-bold' : ''}>{odd.odds1.toFixed(2)}</span>
                <span className="text-muted-foreground">/</span>
                <span className={isPredictedWinner(match.player2) ? 'text-neon-green font-bold' : ''}>{odd.odds2.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prediction Button or Result */}
      {prediction ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 text-xs text-neon-green">
            <Sparkles className="size-3" />
            <span className="font-semibold">AI Prediction</span>
            {prediction.isCorrect === true && <Badge className="bg-neon-green/15 text-neon-green border border-neon-green/20 text-[10px]">✓ WIN</Badge>}
            {prediction.isCorrect === false && <Badge className="bg-neon-red/15 text-neon-red border border-neon-red/20 text-[10px]">✗ LOSS</Badge>}
          </div>
          <ConfidenceMeter confidence={(prediction.confidence || 0) * 100} size="sm" />
          {prediction.analysis && (
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
              {prediction.analysis}
            </p>
          )}
        </motion.div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs h-8 border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10 hover:text-neon-purple"
          onClick={() => onGetPrediction(match)}
          disabled={isLoadingPrediction || match.status === 'finished'}
        >
          <Sparkles className="size-3" />
          {isLoadingPrediction ? 'Analyzing...' : 'Get AI Prediction'}
        </Button>
      )}
    </motion.div>
  )
}
