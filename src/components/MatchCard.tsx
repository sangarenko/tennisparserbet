'use client'

import { motion } from 'framer-motion'
import { Zap, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import type { Match, Prediction } from '@/lib/store'
import { ConfidenceMeter } from './ConfidenceMeter'

interface MatchCardProps {
  match: Match
  onGetPrediction: (match: Match) => void
  onPlaceBet: (match: Match) => void
  isLoading?: boolean
}

export function MatchCard({ match, onGetPrediction, onPlaceBet, isLoading }: MatchCardProps) {
  const statusIcon = () => {
    switch (match.status) {
      case 'live':
        return <Zap className="w-3 h-3 text-neon-red animate-pulse" />
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-neon-green" />
      default:
        return <Clock className="w-3 h-3 text-muted-foreground" />
    }
  }

  const statusColor = () => {
    switch (match.status) {
      case 'live':
        return 'bg-red-500/20 text-red-400 border border-red-500/30'
      case 'completed':
        return 'bg-green-500/20 text-green-400 border border-green-500/30'
      default:
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    }
  }

  const topPrediction = match.predictions?.[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 rounded-xl match-card-glow"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {statusIcon()}
          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColor()}`}>
            {match.status}
          </span>
        </div>
        {match.source && (
          <span className="text-xs text-muted-foreground">{match.source}</span>
        )}
      </div>

      {/* Tournament */}
      {match.tournament && (
        <p className="text-xs text-muted-foreground mb-2 truncate">{match.tournament}</p>
      )}

      {/* Players */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex-1 text-right">
          <p className="text-sm font-semibold truncate">{match.player1}</p>
          {match.odds1 && (
            <span className="text-xs text-neon-orange font-mono">{match.odds1.toFixed(2)}</span>
          )}
        </div>
        <div className="px-3 text-center">
          {match.status === 'completed' || match.status === 'live' ? (
            <span className="text-lg font-bold text-white">
              {match.score1} - {match.score2}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">VS</span>
          )}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold truncate">{match.player2}</p>
          {match.odds2 && (
            <span className="text-xs text-neon-orange font-mono">{match.odds2.toFixed(2)}</span>
          )}
        </div>
      </div>

      {/* Prediction */}
      {topPrediction && (
        <div className="mb-3 p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-neon-purple font-medium">AI Prediction</span>
            {topPrediction.predictor && (
              <span className="text-xs text-muted-foreground">by {topPrediction.predictor}</span>
            )}
          </div>
          <p className="text-sm font-medium text-neon-green mb-2">
            {topPrediction.predictedWinner}
          </p>
          <ConfidenceMeter confidence={topPrediction.confidence} size="sm" />
          {topPrediction.reasoning && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{topPrediction.reasoning}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onGetPrediction(match)}
          disabled={isLoading || match.status === 'completed'}
          className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Analyzing...' : '🔮 Get Prediction'}
        </motion.button>
        {match.status !== 'completed' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPlaceBet(match)}
            className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30 transition-all"
          >
            💰 Place Bet
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
