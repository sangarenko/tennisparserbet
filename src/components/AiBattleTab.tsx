'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Zap,
  Trophy,
  TrendingUp,
  TrendingDown,
  Brain,
  Bot,
  Swords,
  RefreshCw,
  CheckCircle2,
  MinusCircle,
  ArrowRight,
  ChevronDown,
  Loader2,
  Flame,
  Scale,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { Match } from '@/lib/store'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ClassicBankroll {
  currentAmount: number
  initialAmount: number
  peakAmount: number
  totalBets: number
  wonBets: number
  lostBets: number
  totalProfit: number
  winRate: number
}

interface RagBankroll {
  currentAmount: number
  initialAmount: number
  peakAmount: number
  totalBets: number
  wonBets: number
  lostBets: number
  totalProfit: number
  winRate: number
}

interface ClassicBet {
  id: string
  matchId: string
  predictedWinner: string
  odds?: number
  stake: number
  profit: number
  status: string
  createdAt?: string
  match?: { player1: string; player2: string }
}

interface RagBet {
  id: string
  matchId: string
  player1: string
  player2: string
  predictedWinner: string
  confidence: number
  odds: number
  stake: number
  profit: number
  status: string
  reasoning: string
  newsDigest: string
  createdAt?: string
}

interface ClassicPrediction {
  id: string
  predictedWinner: string
  confidence: number
  reasoning: string
  predictor: string
  keyFactors: string[]
}

interface RagPrediction {
  predictedWinner: string
  confidence: number
  reasoning: string
  newsDigest: string
  keyFactors: string[]
  aiModel: string
}

interface AiBattleTabProps {
  matches: Match[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatMoney(v: number) {
  return `₽${v.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function pct(v: number) {
  return `${Math.round(v * 100) / 100}%`
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AiBattleTab({ matches }: AiBattleTabProps) {
  // ── State ─────────────────────────────────────────────────────────────────
  const [classicBankroll, setClassicBankroll] = useState<ClassicBankroll | null>(null)
  const [ragBankroll, setRagBankroll] = useState<RagBankroll | null>(null)
  const [classicBets, setClassicBets] = useState<ClassicBet[]>([])
  const [ragBets, setRagBets] = useState<RagBet[]>([])
  const [selectedMatchId, setSelectedMatchId] = useState('')
  const [classicPrediction, setClassicPrediction] = useState<ClassicPrediction | null>(null)
  const [ragPrediction, setRagPrediction] = useState<RagPrediction | null>(null)
  const [isPredicting, setIsPredicting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // ── Fetch data on mount ───────────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [cBankRes, rBankRes, cBetsRes, rBetsRes] = await Promise.allSettled([
        fetch('/api/bankroll').then((r) => r.json()),
        fetch('/api/ai-bankroll').then((r) => r.json()),
        fetch('/api/bets').then((r) => r.json()),
        fetch('/api/ai-bets').then((r) => r.json()),
      ])

      if (cBankRes.status === 'fulfilled' && cBankRes.value.id) setClassicBankroll(cBankRes.value)
      if (rBankRes.status === 'fulfilled' && rBankRes.value.id) setRagBankroll(rBankRes.value)
      if (cBankRes.status === 'fulfilled' && Array.isArray(cBetsRes.value)) setClassicBets(cBetsRes.value)
      if (rBankRes.status === 'fulfilled' && Array.isArray(rBetsRes.value)) setRagBets(rBetsRes.value)
    } catch (err) {
      console.error('Failed to fetch battle data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // ── Predict Both handler ──────────────────────────────────────────────────
  const handlePredictBoth = useCallback(async () => {
    if (!selectedMatchId) return
    setIsPredicting(true)
    setClassicPrediction(null)
    setRagPrediction(null)

    const [classicRes, ragRes] = await Promise.allSettled([
      fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: selectedMatchId }),
      }).then((r) => r.json()),
      fetch('/api/ai-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: selectedMatchId }),
      }).then((r) => r.json()),
    ])

    if (classicRes.status === 'fulfilled' && classicRes.value.predictions?.length > 0) {
      setClassicPrediction(classicRes.value.predictions[0])
    }
    if (ragRes.status === 'fulfilled' && ragRes.value.predictedWinner) {
      setRagPrediction(ragRes.value)
    }

    setIsPredicting(false)

    // Refresh bankrolls & bets
    fetchAllData()
  }, [selectedMatchId, fetchAllData])

  // ── Derived stats ─────────────────────────────────────────────────────────
  const classicStats = useMemo(() => {
    const settled = classicBets.filter((b) => b.status === 'won' || b.status === 'lost')
    const won = classicBets.filter((b) => b.status === 'won')
    const totalStaked = classicBets.reduce((s, b) => s + b.stake, 0)
    const totalProfit = classicBets.reduce((s, b) => s + b.profit, 0)
    const avgConf =
      classicBets.length > 0
        ? classicBets.reduce((s, b) => s + b.odds, 0) / classicBets.length
        : 0
    return {
      totalBets: classicBets.length,
      settled: settled.length,
      won: won.length,
      totalStaked,
      totalProfit,
      winRate: settled.length > 0 ? (won.length / settled.length) * 100 : 0,
      roi: totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0,
      avgConf,
    }
  }, [classicBets])

  const ragStats = useMemo(() => {
    const settled = ragBets.filter((b) => b.status === 'won' || b.status === 'lost')
    const won = ragBets.filter((b) => b.status === 'won')
    const totalStaked = ragBets.reduce((s, b) => s + b.stake, 0)
    const totalProfit = ragBets.reduce((s, b) => s + b.profit, 0)
    const avgConf =
      ragBets.length > 0
        ? ragBets.reduce((s, b) => s + b.confidence, 0) / ragBets.length
        : 0
    return {
      totalBets: ragBets.length,
      settled: settled.length,
      won: won.length,
      totalStaked,
      totalProfit,
      winRate: settled.length > 0 ? (won.length / settled.length) * 100 : 0,
      roi: totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0,
      avgConf,
    }
  }, [ragBets])

  // ── Comparison logic ──────────────────────────────────────────────────────
  const getWinner = useCallback(
    (metric: 'winRate' | 'profit' | 'roi' | 'avgConf' | 'totalBets'): 'classic' | 'rag' | 'tie' | null => {
      if (metric === 'totalBets') return null // no winner for count
      const cVal =
        metric === 'winRate' ? classicStats.winRate
        : metric === 'profit' ? classicStats.totalProfit
        : metric === 'roi' ? classicStats.roi
        : classicStats.avgConf * 100
      const rVal =
        metric === 'winRate' ? ragStats.winRate
        : metric === 'profit' ? ragStats.totalProfit
        : metric === 'roi' ? ragStats.roi
        : ragStats.avgConf * 100
      const threshold = metric === 'profit' ? 50 : 2
      if (Math.abs(cVal - rVal) < threshold) return 'tie'
      return cVal > rVal ? 'classic' : 'rag'
    },
    [classicStats, ragStats]
  )

  const isDisagreement =
    classicPrediction &&
    ragPrediction &&
    classicPrediction.predictedWinner !== ragPrediction.predictedWinner

  // ── Recent bets (max 5 per side) ─────────────────────────────────────────
  const recentClassicBets = classicBets.slice(0, 5)
  const recentRagBets = ragBets.slice(0, 5)

  const selectedMatch = matches.find((m) => m.id === selectedMatchId)

  // ── Match options (upcoming or live) ──────────────────────────────────────
  const availableMatches = matches.filter(
    (m) => m.status === 'upcoming' || m.status === 'live'
  )

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-neon-purple animate-spin" />
          <span className="text-sm text-muted-foreground">Loading AI Battle data...</span>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── Header ─────────────────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-xl"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-orange to-neon-red flex items-center justify-center">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold gradient-text">AI Battle</h2>
            <p className="text-xs text-muted-foreground">
              Who predicts better? Classic vs RAG+ head-to-head comparison
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={fetchAllData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh Data
          </button>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── Side-by-Side AI Panels ─────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── AI Classic Panel ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-neon-blue/20 to-neon-blue/5 px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-neon-blue" />
              <h3 className="text-sm font-bold text-neon-blue">AI Classic</h3>
              <Badge className="bg-neon-blue/10 text-neon-blue border-neon-blue/20 text-[10px] px-1.5 py-0">
                Stats-based
              </Badge>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  Balance
                </p>
                <p className="text-xl font-bold text-neon-blue">
                  {formatMoney(classicBankroll?.currentAmount ?? 5000)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  Win Rate
                </p>
                <p className="text-xl font-bold">
                  {pct(classicBankroll?.winRate ?? classicStats.winRate)}
                </p>
                <Progress value={classicBankroll?.winRate ?? classicStats.winRate} className="mt-1 h-1" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  Total Bets
                </p>
                <p className="text-lg font-bold">{classicBankroll?.totalBets ?? classicStats.totalBets}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  Profit
                </p>
                <p
                  className={`text-lg font-bold ${
                    (classicBankroll?.totalProfit ?? classicStats.totalProfit) >= 0
                      ? 'text-neon-green'
                      : 'text-neon-red'
                  }`}
                >
                  {(classicBankroll?.totalProfit ?? classicStats.totalProfit) >= 0 ? '+' : ''}
                  {formatMoney(classicBankroll?.totalProfit ?? classicStats.totalProfit)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  ROI
                </p>
                <p
                  className={`text-lg font-bold ${
                    classicStats.roi >= 0 ? 'text-neon-green' : 'text-neon-red'
                  }`}
                >
                  {pct(classicStats.roi)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  Peak
                </p>
                <p className="text-lg font-bold text-neon-purple">
                  {formatMoney(classicBankroll?.peakAmount ?? 5000)}
                </p>
              </div>
            </div>

            {/* Recent Bets */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                Recent Bets
              </p>
              {recentClassicBets.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 py-2">No bets yet</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                  {recentClassicBets.map((bet) => (
                    <div
                      key={bet.id}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium truncate">
                          {bet.match
                            ? `${bet.match.player1} vs ${bet.match.player2}`
                            : `#${bet.matchId.slice(-6)}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {bet.predictedWinner}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span
                          className={`text-[11px] font-bold ${
                            bet.status === 'won'
                              ? 'text-neon-green'
                              : bet.status === 'lost'
                                ? 'text-neon-red'
                                : 'text-neon-orange'
                          }`}
                        >
                          {bet.status === 'won'
                            ? `+${formatMoney(bet.profit)}`
                            : bet.status === 'lost'
                              ? formatMoney(bet.profit)
                              : 'pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── AI RAG+ Panel ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-neon-purple/20 to-neon-purple/5 px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-neon-purple" />
              <h3 className="text-sm font-bold text-neon-purple">AI RAG+</h3>
              <Badge className="bg-neon-purple/10 text-neon-purple border-neon-purple/20 text-[10px] px-1.5 py-0">
                News + Stats
              </Badge>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  Balance
                </p>
                <p className="text-xl font-bold text-neon-purple">
                  {formatMoney(ragBankroll?.currentAmount ?? 5000)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  Win Rate
                </p>
                <p className="text-xl font-bold">
                  {pct(ragBankroll?.winRate ?? ragStats.winRate)}
                </p>
                <Progress value={ragBankroll?.winRate ?? ragStats.winRate} className="mt-1 h-1" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  Total Bets
                </p>
                <p className="text-lg font-bold">{ragBankroll?.totalBets ?? ragStats.totalBets}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  Profit
                </p>
                <p
                  className={`text-lg font-bold ${
                    (ragBankroll?.totalProfit ?? ragStats.totalProfit) >= 0
                      ? 'text-neon-green'
                      : 'text-neon-red'
                  }`}
                >
                  {(ragBankroll?.totalProfit ?? ragStats.totalProfit) >= 0 ? '+' : ''}
                  {formatMoney(ragBankroll?.totalProfit ?? ragStats.totalProfit)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  ROI
                </p>
                <p
                  className={`text-lg font-bold ${
                    ragStats.roi >= 0 ? 'text-neon-green' : 'text-neon-red'
                  }`}
                >
                  {pct(ragStats.roi)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  Peak
                </p>
                <p className="text-lg font-bold text-neon-purple">
                  {formatMoney(ragBankroll?.peakAmount ?? 5000)}
                </p>
              </div>
            </div>

            {/* Recent Bets */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                Recent Bets
              </p>
              {recentRagBets.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 py-2">No bets yet</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                  {recentRagBets.map((bet) => (
                    <div
                      key={bet.id}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium truncate">
                          {bet.player1} vs {bet.player2}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {bet.predictedWinner}
                          <span className="ml-1.5 text-neon-purple">
                            {pct(bet.confidence * 100)}
                          </span>
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span
                          className={`text-[11px] font-bold ${
                            bet.status === 'won'
                              ? 'text-neon-green'
                              : bet.status === 'lost'
                                ? 'text-neon-red'
                                : 'text-neon-orange'
                          }`}
                        >
                          {bet.status === 'won'
                            ? `+${formatMoney(bet.profit)}`
                            : bet.status === 'lost'
                              ? formatMoney(bet.profit)
                              : 'pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── Head-to-Head Comparison Table ──────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
          <Scale className="w-4 h-4 text-neon-orange" />
          <h3 className="text-sm font-bold">Head-to-Head Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 px-5 text-muted-foreground font-medium">Metric</th>
                <th className="text-center py-3 px-3 text-neon-blue font-medium">
                  <span className="flex items-center justify-center gap-1">
                    <Brain className="w-3 h-3" />
                    Classic
                  </span>
                </th>
                <th className="text-center py-3 px-3 text-neon-purple font-medium">
                  <span className="flex items-center justify-center gap-1">
                    <Bot className="w-3 h-3" />
                    RAG+
                  </span>
                </th>
                <th className="text-center py-3 px-5 text-muted-foreground font-medium">
                  Winner
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  label: 'Win Rate',
                  cVal: pct(classicStats.winRate),
                  rVal: pct(ragStats.winRate),
                  metric: 'winRate' as const,
                },
                {
                  label: 'Total Profit',
                  cVal: `${classicStats.totalProfit >= 0 ? '+' : ''}${formatMoney(classicStats.totalProfit)}`,
                  rVal: `${ragStats.totalProfit >= 0 ? '+' : ''}${formatMoney(ragStats.totalProfit)}`,
                  metric: 'profit' as const,
                },
                {
                  label: 'ROI',
                  cVal: pct(classicStats.roi),
                  rVal: pct(ragStats.roi),
                  metric: 'roi' as const,
                },
                {
                  label: 'Avg Confidence',
                  cVal: `${pct(classicStats.avgConf * 100)}`,
                  rVal: `${pct(ragStats.avgConf * 100)}`,
                  metric: 'avgConf' as const,
                },
                {
                  label: 'Total Bets',
                  cVal: String(classicStats.totalBets),
                  rVal: String(ragStats.totalBets),
                  metric: 'totalBets' as const,
                },
              ].map((row) => {
                const winner = getWinner(row.metric)
                return (
                  <tr
                    key={row.label}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-5 font-medium">{row.label}</td>
                    <td
                      className={`py-3 px-3 text-center ${
                        winner === 'classic' ? 'bg-neon-blue/[0.06]' : ''
                      }`}
                    >
                      {row.cVal}
                    </td>
                    <td
                      className={`py-3 px-3 text-center ${
                        winner === 'rag' ? 'bg-neon-purple/[0.06]' : ''
                      }`}
                    >
                      {row.rVal}
                    </td>
                    <td className="py-3 px-5 text-center">
                      {winner === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : winner === 'tie' ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-white/[0.04] border-white/[0.08] text-muted-foreground"
                        >
                          <MinusCircle className="w-2.5 h-2.5 mr-0.5" />
                          TIE
                        </Badge>
                      ) : winner === 'classic' ? (
                        <Badge className="text-[10px] bg-neon-blue/10 text-neon-blue border-neon-blue/20 px-1.5">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                          Classic
                        </Badge>
                      ) : (
                        <Badge className="text-[10px] bg-neon-purple/10 text-neon-purple border-neon-purple/20 px-1.5">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                          RAG+
                        </Badge>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── Predict Match — Both AIs ───────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
          <Flame className="w-4 h-4 text-neon-orange" />
          <h3 className="text-sm font-bold">Predict Match — Both AIs Analyze</h3>
        </div>
        <div className="p-5 space-y-5">
          {/* Match Selector */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium">
              Select a match to analyze
            </label>
            <div className="relative">
              <select
                value={selectedMatchId}
                onChange={(e) => {
                  setSelectedMatchId(e.target.value)
                  setClassicPrediction(null)
                  setRagPrediction(null)
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white appearance-none focus:outline-none focus:border-neon-purple/50 transition-all cursor-pointer"
              >
                <option value="" className="bg-[#0a0a0f]">
                  Choose a match...
                </option>
                {availableMatches.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#0a0a0f]">
                    {m.league ? `[${m.league}] ` : ''}
                    {m.player1} vs {m.player2}
                    {m.status === 'live' ? ' (LIVE)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Predict Button */}
          <button
            onClick={handlePredictBoth}
            disabled={!selectedMatchId || isPredicting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-neon-blue/20 via-neon-purple/20 to-neon-purple/20 text-white font-medium text-sm border border-neon-purple/20 hover:from-neon-blue/30 hover:via-neon-purple/30 hover:to-neon-purple/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPredicting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing match...
              </>
            ) : (
              <>
                <Swords className="w-4 h-4" />
                Predict Both
              </>
            )}
          </button>

          {/* ── Prediction Results ────────────────────────────────────── */}
          {isPredicting && (
            <div className="flex items-center justify-center gap-3 py-8">
              <div className="w-2 h-2 rounded-full bg-neon-blue animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-neon-purple animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-neon-blue animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}

          {!isPredicting && classicPrediction && ragPrediction && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Disagreement Badge */}
              {isDisagreement && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center"
                >
                  <Badge className="bg-neon-orange/15 text-neon-orange border border-neon-orange/30 px-3 py-1 text-xs font-bold">
                    <Zap className="w-3.5 h-3.5 mr-1" />
                    DISAGREEMENT! Different predictions detected
                  </Badge>
                </motion.div>
              )}

              {/* Side-by-side results */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
                {/* Classic Prediction */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-xl border border-neon-blue/20 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-neon-blue/15 to-neon-blue/5 px-4 py-3 border-b border-neon-blue/10">
                    <div className="flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-neon-blue" />
                      <span className="text-xs font-bold text-neon-blue">AI Classic</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3 bg-white/[0.02]">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Predicted Winner
                      </p>
                      <p className="text-sm font-bold text-neon-blue">
                        {classicPrediction.predictedWinner}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Confidence
                      </p>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={classicPrediction.confidence * 100}
                          className="flex-1 h-1.5"
                        />
                        <span className="text-xs font-mono text-neon-blue">
                          {pct(classicPrediction.confidence * 100)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                        Reasoning
                      </p>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {classicPrediction.reasoning}
                      </p>
                    </div>
                    {classicPrediction.keyFactors?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          Key Factors
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {classicPrediction.keyFactors.map((f, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-[10px] bg-white/[0.04] border-white/[0.08] text-muted-foreground"
                            >
                              {f}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* VS Divider */}
                <div className="flex items-center justify-center py-8 md:py-0">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.3 }}
                    className="text-2xl font-black gradient-text select-none"
                    style={{
                      textShadow: '0 0 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(0, 212, 255, 0.3)',
                    }}
                  >
                    VS
                  </motion.div>
                </div>

                {/* RAG+ Prediction */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-xl border border-neon-purple/20 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-neon-purple/15 to-neon-purple/5 px-4 py-3 border-b border-neon-purple/10">
                    <div className="flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-neon-purple" />
                      <span className="text-xs font-bold text-neon-purple">AI RAG+</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3 bg-white/[0.02]">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Predicted Winner
                      </p>
                      <p className="text-sm font-bold text-neon-purple">
                        {ragPrediction.predictedWinner}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Confidence
                      </p>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={ragPrediction.confidence * 100}
                          className="flex-1 h-1.5"
                        />
                        <span className="text-xs font-mono text-neon-purple">
                          {pct(ragPrediction.confidence * 100)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                        Reasoning
                      </p>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {ragPrediction.reasoning}
                      </p>
                    </div>
                    {ragPrediction.newsDigest && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          News Context
                        </p>
                        <p className="text-xs text-gray-400 leading-relaxed italic">
                          {ragPrediction.newsDigest}
                        </p>
                      </div>
                    )}
                    {ragPrediction.keyFactors?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          Key Factors
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {ragPrediction.keyFactors.map((f, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-[10px] bg-white/[0.04] border-white/[0.08] text-muted-foreground"
                            >
                              {f}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Agreement Summary */}
              {!isDisagreement && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-2 py-2"
                >
                  <Trophy className="w-4 h-4 text-neon-green" />
                  <span className="text-xs text-neon-green font-medium">
                    Both AIs agree on {classicPrediction.predictedWinner}!
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* No match selected */}
          {!isPredicting && !classicPrediction && !ragPrediction && selectedMatchId && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Click &quot;Predict Both&quot; to let both AIs analyze this match
            </p>
          )}

          {!isPredicting && !selectedMatchId && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Select a match above to start the AI battle
            </p>
          )}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── Scoreboard Summary ────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {classicBankroll && ragBankroll && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5 rounded-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-bold">Overall Leader</h3>
          </div>
          <div className="flex items-center justify-center gap-6">
            <div
              className={`text-center px-6 py-4 rounded-xl ${
                classicBankroll.totalProfit > ragBankroll.totalProfit
                  ? 'bg-neon-blue/[0.08] border border-neon-blue/20 shadow-[0_0_20px_rgba(0,212,255,0.1)]'
                  : 'bg-white/[0.02] border border-white/[0.04]'
              } transition-all`}
            >
              <Brain className="w-5 h-5 text-neon-blue mx-auto mb-1" />
              <p className="text-xs text-muted-foreground mb-0.5">Classic</p>
              <p
                className={`text-lg font-bold ${
                  classicBankroll.totalProfit >= 0 ? 'text-neon-green' : 'text-neon-red'
                }`}
              >
                {classicBankroll.totalProfit >= 0 ? '+' : ''}
                {formatMoney(classicBankroll.totalProfit)}
              </p>
            </div>

            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Profit
              </span>
            </div>

            <div
              className={`text-center px-6 py-4 rounded-xl ${
                ragBankroll.totalProfit > classicBankroll.totalProfit
                  ? 'bg-neon-purple/[0.08] border border-neon-purple/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                  : 'bg-white/[0.02] border border-white/[0.04]'
              } transition-all`}
            >
              <Bot className="w-5 h-5 text-neon-purple mx-auto mb-1" />
              <p className="text-xs text-muted-foreground mb-0.5">RAG+</p>
              <p
                className={`text-lg font-bold ${
                  ragBankroll.totalProfit >= 0 ? 'text-neon-green' : 'text-neon-red'
                }`}
              >
                {ragBankroll.totalProfit >= 0 ? '+' : ''}
                {formatMoney(ragBankroll.totalProfit)}
              </p>
            </div>
          </div>

          {classicBankroll.totalProfit !== ragBankroll.totalProfit && (
            <p className="text-center text-xs text-muted-foreground mt-3">
              {classicBankroll.totalProfit > ragBankroll.totalProfit
                ? 'AI Classic is leading in total profit'
                : 'AI RAG+ is leading in total profit'}
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
}
