'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Settings,
  Brain,
  Bot,
  Swords,
  RefreshCw,
  Download,
  Upload,
  Loader2,
  CheckCircle2,
  MinusCircle,
  Scale,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ClassicBankroll {
  currentAmount: number
  initialAmount: number
  peakAmount: number
  maxDrawdown: number
  totalBets: number
  wonBets: number
  lostBets: number
  totalProfit: number
  winRate: number
  strategy: string
  riskLevel: string
  flatAmount: number
  percentage: number
  kellyFraction: number
  entries?: BankrollEntry[]
}

interface RagBankroll {
  currentAmount: number
  initialAmount: number
  peakAmount: number
  maxDrawdown: number
  totalBets: number
  wonBets: number
  lostBets: number
  pendingBets: number
  totalProfit: number
  winRate: number
  flatAmount: number
}

interface BankrollEntry {
  id: string
  type: string
  amount: number
  balance: number
  description: string
  createdAt: string
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
  keyFactors: string[]
  createdAt?: string
}

type ActiveView = 'classic' | 'rag' | 'compare'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatMoney(v: number) {
  return `₽${v.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function pct(v: number) {
  return `${Math.round(v * 100) / 100}%`
}

const tooltipStyle = {
  background: 'rgba(15,15,25,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#fff',
}

// ─── Component ──────────────────────────────────────────────────────────────

export function BankrollTab() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [classicBr, setClassicBr] = useState<ClassicBankroll | null>(null)
  const [ragBr, setRagBr] = useState<RagBankroll | null>(null)
  const [classicBets, setClassicBets] = useState<ClassicBet[]>([])
  const [ragBets, setRagBets] = useState<RagBet[]>([])
  const [activeView, setActiveView] = useState<ActiveView>('classic')
  const [isLoading, setIsLoading] = useState(true)
  const [showActionDialog, setShowActionDialog] = useState<'deposit' | 'withdraw' | null>(null)
  const [actionBankroll, setActionBankroll] = useState<'classic' | 'rag'>('classic')
  const [actionAmount, setActionAmount] = useState('')
  const [isActioning, setIsActioning] = useState(false)

  // ── Fetch data on mount ───────────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [cBrRes, rBrRes, cBetsRes, rBetsRes] = await Promise.allSettled([
        fetch('/api/bankroll').then((r) => r.json()),
        fetch('/api/ai-bankroll').then((r) => r.json()),
        fetch('/api/bets').then((r) => r.json()),
        fetch('/api/ai-bets').then((r) => r.json()),
      ])

      if (cBrRes.status === 'fulfilled' && cBrRes.value?.id) setClassicBr(cBrRes.value)
      if (rBrRes.status === 'fulfilled' && rBrRes.value?.id) setRagBr(rBrRes.value)
      if (cBetsRes.status === 'fulfilled' && Array.isArray(cBetsRes.value)) setClassicBets(cBetsRes.value)
      if (rBetsRes.status === 'fulfilled' && Array.isArray(rBetsRes.value)) setRagBets(rBetsRes.value)
    } catch (err) {
      console.error('Failed to fetch bankroll data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // ── Derived stats ─────────────────────────────────────────────────────────
  const classicStats = useMemo(() => {
    const pending = classicBets.filter((b) => b.status === 'pending').length
    const totalStaked = classicBets.reduce((s, b) => s + b.stake, 0)
    const totalProfit = classicBets.reduce((s, b) => s + b.profit, 0)
    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0
    return { pending, totalStaked, totalProfit, roi }
  }, [classicBets])

  const ragStats = useMemo(() => {
    const pending = ragBets.filter((b) => b.status === 'pending').length
    const totalStaked = ragBets.reduce((s, b) => s + b.stake, 0)
    const totalProfit = ragBets.reduce((s, b) => s + b.profit, 0)
    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0
    return { pending, totalStaked, totalProfit, roi }
  }, [ragBets])

  // ── Quick action handler ──────────────────────────────────────────────────
  const handleQuickAction = useCallback((action: 'deposit' | 'withdraw', target: 'classic' | 'rag') => {
    setActionBankroll(target)
    setActionAmount('')
    setShowActionDialog(action)
  }, [])

  const handleConfirmAction = useCallback(async () => {
    const amount = parseFloat(actionAmount)
    if (isNaN(amount) || amount <= 0) return
    setIsActioning(true)
    try {
      const endpoint = actionBankroll === 'classic' ? '/api/bankroll' : '/api/ai-bankroll'
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: showActionDialog, amount }),
      })
      fetchAllData()
    } catch (err) {
      console.error('Action error:', err)
    } finally {
      setIsActioning(false)
      setShowActionDialog(null)
    }
  }, [actionAmount, actionBankroll, showActionDialog, fetchAllData])

  // ── Comparison logic ──────────────────────────────────────────────────────
  const getWinner = useCallback(
    (metric: 'balance' | 'winRate' | 'profit' | 'roi'): 'classic' | 'rag' | 'tie' => {
      const cVal = metric === 'balance'
        ? classicBr?.currentAmount ?? 5000
        : metric === 'winRate'
        ? classicBr?.winRate ?? 0
        : metric === 'profit'
        ? classicBr?.totalProfit ?? 0
        : classicStats.roi
      const rVal = metric === 'balance'
        ? ragBr?.currentAmount ?? 5000
        : metric === 'winRate'
        ? ragBr?.winRate ?? 0
        : metric === 'profit'
        ? ragBr?.totalProfit ?? 0
        : ragStats.roi
      const threshold = metric === 'profit' ? 50 : 2
      if (Math.abs(cVal - rVal) < threshold) return 'tie'
      return cVal > rVal ? 'classic' : 'rag'
    },
    [classicBr, ragBr, classicStats.roi, ragStats.roi]
  )

  // ── Chart data from entries ──────────────────────────────────────────────
  const classicChartData = useMemo(() => {
    if (!classicBr?.entries?.length) return []
    return classicBr.entries
      .filter((e) => e.type === 'bet_won' || e.type === 'bet_lost' || e.type === 'deposit' || e.type === 'withdrawal' || e.type === 'reset')
      .slice(-20)
      .map((e) => ({
        name: new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        balance: e.balance,
      }))
  }, [classicBr?.entries])

  const ragChartData = useMemo(() => {
    if (!ragBr?.entries?.length) return []
    return (ragBr as any).entries
      ?.filter((e: any) => e.type === 'bet_won' || e.type === 'bet_lost' || e.type === 'deposit' || e.type === 'withdrawal')
      ?.slice(-20)
      ?.map((e: any) => ({
        name: new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        balance: e.balance,
      })) || []
  }, [ragBr])

  // ── Sorted bets ──────────────────────────────────────────────────────────
  const recentClassicBets = [...classicBets]
    .sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return db - da
    })
    .slice(0, 10)

  const recentRagBets = [...ragBets]
    .sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return db - da
    })
    .slice(0, 10)

  const strategyLabel = classicBr?.strategy ? classicBr.strategy.charAt(0).toUpperCase() + classicBr.strategy.slice(1) : 'Flat'
  const riskLabel = classicBr?.riskLevel ? classicBr.riskLevel.charAt(0).toUpperCase() + classicBr.riskLevel.slice(1) : 'Medium'

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-neon-purple animate-spin" />
          <span className="text-sm text-muted-foreground">Loading bankroll data...</span>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── Header with View Toggle ─────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green to-neon-blue flex items-center justify-center">
              <Wallet className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-lg font-bold gradient-text">Bankroll Management</h2>
              <p className="text-xs text-muted-foreground">
                Combined: {formatMoney((classicBr?.currentAmount ?? 5000) + (ragBr?.currentAmount ?? 5000))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAllData}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white/[0.04] rounded-lg border border-white/[0.06] w-fit">
          {[
            { key: 'classic' as const, label: 'Classic Bankroll', icon: Brain, color: 'text-neon-blue' },
            { key: 'rag' as const, label: 'AI RAG+ Bankroll', icon: Bot, color: 'text-neon-purple' },
            { key: 'compare' as const, label: 'Comparison', icon: Scale, color: 'text-neon-orange' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeView === tab.key
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <tab.icon className={`w-3 h-3 ${activeView === tab.key ? tab.color : ''}`} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── Classic Bankroll View ───────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeView === 'classic' && (
        <div className="space-y-6">
          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-neon-green/10">
                  <Wallet className="w-6 h-6 text-neon-green" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Classic Bankroll Balance</p>
                  <p className="text-3xl font-bold text-neon-green">
                    {formatMoney(classicBr?.currentAmount ?? 5000)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuickAction('deposit', 'classic')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-neon-green/10 text-neon-green border border-neon-green/20 hover:bg-neon-green/20 transition-all"
                >
                  <Download className="w-3 h-3" />
                  Deposit
                </button>
                <button
                  onClick={() => handleQuickAction('withdraw', 'classic')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-neon-red/10 text-neon-red border border-neon-red/20 hover:bg-neon-red/20 transition-all"
                >
                  <Upload className="w-3 h-3" />
                  Withdraw
                </button>
              </div>
            </div>
            {/* Strategy & Risk */}
            <div className="flex items-center gap-4 mt-2">
              <Badge className="bg-neon-blue/10 text-neon-blue border-neon-blue/20 text-[10px]">
                {strategyLabel}
              </Badge>
              <Badge className={`text-[10px] ${
                riskLabel === 'High' || riskLabel === 'Aggressive'
                  ? 'bg-neon-red/10 text-neon-red border-neon-red/20'
                  : riskLabel === 'Low' || riskLabel === 'Conservative'
                  ? 'bg-neon-green/10 text-neon-green border-neon-green/20'
                  : 'bg-neon-orange/10 text-neon-orange border-neon-orange/20'
              } border`}>
                {riskLabel}
              </Badge>
              {classicBr?.flatAmount > 0 && (
                <span className="text-xs text-muted-foreground">
                  Flat: <span className="text-white font-medium">₽{classicBr.flatAmount}</span>
                </span>
              )}
            </div>
          </motion.div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3 h-3 text-neon-orange" />
                <span className="text-xs text-muted-foreground">Total Staked</span>
              </div>
              <p className="text-lg font-bold">{formatMoney(classicStats.totalStaked)}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                {(classicBr?.totalProfit ?? 0) >= 0 ? <TrendingUp className="w-3 h-3 text-neon-green" /> : <TrendingDown className="w-3 h-3 text-neon-red" />}
                <span className="text-xs text-muted-foreground">Net Profit</span>
              </div>
              <p className={`text-lg font-bold ${(classicBr?.totalProfit ?? 0) >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                {(classicBr?.totalProfit ?? 0) >= 0 ? '+' : ''}{formatMoney(classicBr?.totalProfit ?? 0)}
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpRight className="w-3 h-3 text-neon-green" />
                <span className="text-xs text-muted-foreground">Won</span>
              </div>
              <p className="text-lg font-bold text-neon-green">{classicBr?.wonBets ?? 0}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownRight className="w-3 h-3 text-neon-red" />
                <span className="text-xs text-muted-foreground">Lost</span>
              </div>
              <p className="text-lg font-bold text-neon-red">{classicBr?.lostBets ?? 0}</p>
            </motion.div>
          </div>

          {/* Summary Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-neon-purple" />
              <h3 className="text-sm font-semibold">Betting Summary</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                <p className="text-lg font-bold text-neon-blue">{pct(classicBr?.winRate ?? 0)}</p>
                <div className="mt-1 h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full rounded-full progress-gradient-blue" style={{ width: `${classicBr?.winRate ?? 0}%` }} />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Bets</p>
                <p className="text-lg font-bold">{classicBr?.totalBets ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Pending</p>
                <p className="text-lg font-bold text-neon-orange">{classicStats.pending}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Peak</p>
                <p className="text-lg font-bold text-neon-green">{formatMoney(classicBr?.peakAmount ?? 5000)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">ROI</p>
                <p className={`text-lg font-bold ${classicStats.roi >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>{pct(classicStats.roi)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Max Drawdown</p>
                <p className="text-lg font-bold text-neon-red">{formatMoney(classicBr?.maxDrawdown ?? 0)}</p>
              </div>
            </div>
          </motion.div>

          {/* Balance Chart */}
          {classicChartData.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-neon-green" />
                <h3 className="text-sm font-semibold">Balance History</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={classicChartData}>
                  <defs>
                    <linearGradient id="classicBalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="balance" stroke="#00ff88" strokeWidth={2} fill="url(#classicBalGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Recent Transactions */}
          {classicBr?.entries && classicBr.entries.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6 rounded-xl">
              <h3 className="text-sm font-semibold mb-4">Recent Transactions</h3>
              <div className="overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-2 text-muted-foreground font-medium">Type</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Description</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Amount</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classicBr.entries.slice(0, 15).map((entry) => (
                      <tr key={entry.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            entry.type === 'deposit' ? 'bg-green-500/20 text-green-400'
                            : entry.type === 'withdrawal' ? 'bg-red-500/20 text-red-400'
                            : entry.type === 'bet' ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="py-2 text-muted-foreground">{entry.description}</td>
                        <td className={`py-2 text-right font-medium ${entry.amount >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                          {entry.amount >= 0 ? '+' : ''}₽{entry.amount.toFixed(2)}
                        </td>
                        <td className="py-2 text-right">₽{entry.balance.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Recent Bets Table */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-6 rounded-xl">
            <h3 className="text-sm font-semibold mb-4">Recent Bets</h3>
            {recentClassicBets.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No bets placed yet</p>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-2 text-muted-foreground font-medium">Match</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Prediction</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Stake</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Odds</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Profit</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentClassicBets.map((bet) => (
                      <tr key={bet.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="py-2 text-muted-foreground">
                          {bet.match ? `${bet.match.player1} vs ${bet.match.player2}` : `#${bet.matchId.slice(-6)}`}
                        </td>
                        <td className="py-2">{bet.predictedWinner}</td>
                        <td className="py-2 text-right">₽{bet.stake.toFixed(2)}</td>
                        <td className="py-2 text-right text-neon-orange">{bet.odds?.toFixed(2) || '-'}</td>
                        <td className={`py-2 text-right font-medium ${bet.profit >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                          {bet.profit >= 0 ? '+' : ''}₽{bet.profit.toFixed(2)}
                        </td>
                        <td className="py-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            bet.status === 'won' ? 'bg-green-500/20 text-green-400'
                            : bet.status === 'lost' ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {bet.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── AI RAG+ Bankroll View ───────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeView === 'rag' && (
        <div className="space-y-6">
          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-neon-purple/10">
                  <Bot className="w-6 h-6 text-neon-purple" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">AI RAG+ Bankroll Balance</p>
                  <p className="text-3xl font-bold text-neon-purple">
                    {formatMoney(ragBr?.currentAmount ?? 5000)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuickAction('deposit', 'rag')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-neon-green/10 text-neon-green border border-neon-green/20 hover:bg-neon-green/20 transition-all"
                >
                  <Download className="w-3 h-3" />
                  Deposit
                </button>
                <button
                  onClick={() => handleQuickAction('withdraw', 'rag')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-neon-red/10 text-neon-red border border-neon-red/20 hover:bg-neon-red/20 transition-all"
                >
                  <Upload className="w-3 h-3" />
                  Withdraw
                </button>
              </div>
            </div>
            {/* Strategy & Flat Amount */}
            <div className="flex items-center gap-4 mt-2">
              <Badge className="bg-neon-purple/10 text-neon-purple border-neon-purple/20 text-[10px]">
                AI RAG+ (News + Stats)
              </Badge>
              {ragBr?.flatAmount > 0 && (
                <span className="text-xs text-muted-foreground">
                  Flat: <span className="text-white font-medium">₽{ragBr.flatAmount}</span>
                </span>
              )}
            </div>
          </motion.div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3 h-3 text-neon-orange" />
                <span className="text-xs text-muted-foreground">Total Staked</span>
              </div>
              <p className="text-lg font-bold">{formatMoney(ragStats.totalStaked)}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                {(ragBr?.totalProfit ?? 0) >= 0 ? <TrendingUp className="w-3 h-3 text-neon-green" /> : <TrendingDown className="w-3 h-3 text-neon-red" />}
                <span className="text-xs text-muted-foreground">Net Profit</span>
              </div>
              <p className={`text-lg font-bold ${(ragBr?.totalProfit ?? 0) >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                {(ragBr?.totalProfit ?? 0) >= 0 ? '+' : ''}{formatMoney(ragBr?.totalProfit ?? 0)}
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpRight className="w-3 h-3 text-neon-green" />
                <span className="text-xs text-muted-foreground">Won</span>
              </div>
              <p className="text-lg font-bold text-neon-green">{ragBr?.wonBets ?? 0}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownRight className="w-3 h-3 text-neon-red" />
                <span className="text-xs text-muted-foreground">Lost</span>
              </div>
              <p className="text-lg font-bold text-neon-red">{ragBr?.lostBets ?? 0}</p>
            </motion.div>
          </div>

          {/* Summary Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-neon-purple" />
              <h3 className="text-sm font-semibold">Betting Summary</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                <p className="text-lg font-bold text-neon-purple">{pct(ragBr?.winRate ?? 0)}</p>
                <div className="mt-1 h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full rounded-full progress-gradient-purple" style={{ width: `${ragBr?.winRate ?? 0}%` }} />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Bets</p>
                <p className="text-lg font-bold">{ragBr?.totalBets ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Pending</p>
                <p className="text-lg font-bold text-neon-orange">{ragStats.pending}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Peak</p>
                <p className="text-lg font-bold text-neon-green">{formatMoney(ragBr?.peakAmount ?? 5000)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">ROI</p>
                <p className={`text-lg font-bold ${ragStats.roi >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>{pct(ragStats.roi)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Max Drawdown</p>
                <p className="text-lg font-bold text-neon-red">{formatMoney(ragBr?.maxDrawdown ?? 0)}</p>
              </div>
            </div>
          </motion.div>

          {/* Recent Bets Table with News Digest + Key Factors */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-6 rounded-xl">
            <h3 className="text-sm font-semibold mb-4">Recent AI Bets</h3>
            {recentRagBets.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No AI bets placed yet</p>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-2 text-muted-foreground font-medium">Match</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Prediction</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Conf.</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Stake</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Odds</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Profit</th>
                      <th className="text-left py-2 text-muted-foreground font-medium hidden lg:table-cell">News Digest</th>
                      <th className="text-left py-2 text-muted-foreground font-medium hidden xl:table-cell">Key Factors</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRagBets.map((bet) => (
                      <tr key={bet.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="py-2 text-muted-foreground">
                          {bet.player1} vs {bet.player2}
                        </td>
                        <td className="py-2 font-medium">{bet.predictedWinner}</td>
                        <td className="py-2 text-right text-neon-purple">{pct(bet.confidence * 100)}</td>
                        <td className="py-2 text-right">₽{bet.stake.toFixed(2)}</td>
                        <td className="py-2 text-right text-neon-orange">{bet.odds?.toFixed(2) || '-'}</td>
                        <td className={`py-2 text-right font-medium ${bet.profit >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                          {bet.profit >= 0 ? '+' : ''}₽{bet.profit.toFixed(2)}
                        </td>
                        <td className="py-2 text-muted-foreground hidden lg:table-cell max-w-[150px]">
                          <p className="truncate text-[10px]">{bet.newsDigest || '-'}</p>
                        </td>
                        <td className="py-2 hidden xl:table-cell max-w-[120px]">
                          <div className="flex flex-wrap gap-0.5">
                            {(bet.keyFactors || []).slice(0, 2).map((f, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded text-[9px] bg-white/[0.04] border border-white/[0.06] text-muted-foreground whitespace-nowrap">
                                {f}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            bet.status === 'won' ? 'bg-green-500/20 text-green-400'
                            : bet.status === 'lost' ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {bet.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── Comparison View ─────────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeView === 'compare' && (
        <div className="space-y-6">
          {/* Combined Balance */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-orange to-neon-red flex items-center justify-center">
                <Swords className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Financial Comparison</h3>
                <p className="text-xs text-muted-foreground">
                  Combined total: {formatMoney((classicBr?.currentAmount ?? 5000) + (ragBr?.currentAmount ?? 5000))}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Side-by-side financial panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Classic Panel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-neon-blue/20 to-neon-blue/5 px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-neon-blue" />
                  <h3 className="text-sm font-bold text-neon-blue">Classic Bankroll</h3>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Balance</p>
                    <p className="text-xl font-bold text-neon-blue">{formatMoney(classicBr?.currentAmount ?? 5000)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Win Rate</p>
                    <p className="text-xl font-bold">{pct(classicBr?.winRate ?? 0)}</p>
                    <div className="mt-1 h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full rounded-full progress-gradient-blue" style={{ width: `${classicBr?.winRate ?? 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Total Profit</p>
                    <p className={`text-lg font-bold ${(classicBr?.totalProfit ?? 0) >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                      {(classicBr?.totalProfit ?? 0) >= 0 ? '+' : ''}{formatMoney(classicBr?.totalProfit ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">ROI</p>
                    <p className={`text-lg font-bold ${classicStats.roi >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>{pct(classicStats.roi)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Total Bets</p>
                    <p className="text-lg font-bold">{classicBr?.totalBets ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Peak</p>
                    <p className="text-lg font-bold text-neon-purple">{formatMoney(classicBr?.peakAmount ?? 5000)}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* RAG+ Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card rounded-xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-neon-purple/20 to-neon-purple/5 px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-neon-purple" />
                  <h3 className="text-sm font-bold text-neon-purple">AI RAG+ Bankroll</h3>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Balance</p>
                    <p className="text-xl font-bold text-neon-purple">{formatMoney(ragBr?.currentAmount ?? 5000)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Win Rate</p>
                    <p className="text-xl font-bold">{pct(ragBr?.winRate ?? 0)}</p>
                    <div className="mt-1 h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full rounded-full progress-gradient-purple" style={{ width: `${ragBr?.winRate ?? 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Total Profit</p>
                    <p className={`text-lg font-bold ${(ragBr?.totalProfit ?? 0) >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                      {(ragBr?.totalProfit ?? 0) >= 0 ? '+' : ''}{formatMoney(ragBr?.totalProfit ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">ROI</p>
                    <p className={`text-lg font-bold ${ragStats.roi >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>{pct(ragStats.roi)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Total Bets</p>
                    <p className="text-lg font-bold">{ragBr?.totalBets ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Peak</p>
                    <p className="text-lg font-bold text-neon-purple">{formatMoney(ragBr?.peakAmount ?? 5000)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Head-to-Head Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
              <Scale className="w-4 h-4 text-neon-orange" />
              <h3 className="text-sm font-bold">Head-to-Head Financial Comparison</h3>
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
                    <th className="text-center py-3 px-5 text-muted-foreground font-medium">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Balance', cVal: formatMoney(classicBr?.currentAmount ?? 5000), rVal: formatMoney(ragBr?.currentAmount ?? 5000), metric: 'balance' as const },
                    { label: 'Win Rate', cVal: pct(classicBr?.winRate ?? 0), rVal: pct(ragBr?.winRate ?? 0), metric: 'winRate' as const },
                    { label: 'Total Profit', cVal: `${(classicBr?.totalProfit ?? 0) >= 0 ? '+' : ''}${formatMoney(classicBr?.totalProfit ?? 0)}`, rVal: `${(ragBr?.totalProfit ?? 0) >= 0 ? '+' : ''}${formatMoney(ragBr?.totalProfit ?? 0)}`, metric: 'profit' as const },
                    { label: 'ROI', cVal: pct(classicStats.roi), rVal: pct(ragStats.roi), metric: 'roi' as const },
                    { label: 'Total Bets', cVal: String(classicBr?.totalBets ?? 0), rVal: String(ragBr?.totalBets ?? 0), metric: 'roi' as const },
                  ].map((row) => {
                    const winner = row.label === 'Total Bets' ? null : getWinner(row.metric)
                    return (
                      <tr key={row.label} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-5 font-medium">{row.label}</td>
                        <td className={`py-3 px-3 text-center ${winner === 'classic' ? 'bg-neon-blue/[0.06]' : ''}`}>{row.cVal}</td>
                        <td className={`py-3 px-3 text-center ${winner === 'rag' ? 'bg-neon-purple/[0.06]' : ''}`}>{row.rVal}</td>
                        <td className="py-3 px-5 text-center">
                          {!winner ? (
                            <span className="text-muted-foreground">-</span>
                          ) : winner === 'tie' ? (
                            <Badge variant="outline" className="text-[10px] bg-white/[0.04] border-white/[0.08] text-muted-foreground">
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

          {/* Combined Total Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-4 h-4 text-neon-green" />
              <h3 className="text-sm font-semibold">Combined Portfolio</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Balance</p>
                <p className="text-lg font-bold text-neon-green">
                  {formatMoney((classicBr?.currentAmount ?? 5000) + (ragBr?.currentAmount ?? 5000))}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Profit</p>
                <p className={`text-lg font-bold ${((classicBr?.totalProfit ?? 0) + (ragBr?.totalProfit ?? 0)) >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                  {((classicBr?.totalProfit ?? 0) + (ragBr?.totalProfit ?? 0)) >= 0 ? '+' : ''}
                  {formatMoney((classicBr?.totalProfit ?? 0) + (ragBr?.totalProfit ?? 0))}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Bets</p>
                <p className="text-lg font-bold">{(classicBr?.totalBets ?? 0) + (ragBr?.totalBets ?? 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Best Performer</p>
                <p className="text-lg font-bold">
                  {getWinner('profit') === 'classic' ? (
                    <span className="text-neon-blue">Classic</span>
                  ) : getWinner('profit') === 'rag' ? (
                    <span className="text-neon-purple">RAG+</span>
                  ) : (
                    <span className="text-muted-foreground">Tie</span>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── Action Dialog (Deposit/Withdraw) ────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showActionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 rounded-xl w-full max-w-sm mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">
                {showActionDialog === 'deposit' ? '💰 Deposit' : '💸 Withdraw'} to{' '}
                {actionBankroll === 'classic' ? 'Classic' : 'AI RAG+'} Bankroll
              </h3>
              <button
                onClick={() => setShowActionDialog(null)}
                className="text-muted-foreground hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Amount (₽)</label>
                <input
                  type="number"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-neon-purple/50"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowActionDialog(null)}
                  className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-white/[0.06] hover:bg-white/[0.1] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={!actionAmount || parseFloat(actionAmount) <= 0 || isActioning}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    showActionDialog === 'deposit'
                      ? 'bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30'
                      : 'bg-neon-red/20 text-neon-red border border-neon-red/30 hover:bg-neon-red/30'
                  }`}
                >
                  {isActioning ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    `Confirm ${showActionDialog === 'deposit' ? 'Deposit' : 'Withdrawal'}`
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
