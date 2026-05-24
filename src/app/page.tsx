'use client'

import React, { useState, useCallback, useEffect, useRef, useMemo, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  TrendingUp,
  BarChart3,
  Bot,
  Wallet,
  Database,
  Users,
  PieChart as PieChartIcon,
  Search,
  RefreshCw,
  Send,
  Clock,
  Trophy,
  Target,
  Activity,
  ChevronRight,
  Globe,
  Shield,
  Star,
  CheckCircle2,
  XCircle,
  Eye,
  Sparkles,
  CircleDot,
  Flame,
  UserCheck,
  Settings,
  Trash2,
  ExternalLink,
  Layers,
  Swords,
  Brain,
  AlertTriangle,
  X,
  Timer,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useAppStore } from '@/lib/store'
import { MatchCard } from '@/components/MatchCard'
import { StatsCard } from '@/components/StatsCard'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { BankrollTab } from '@/components/BankrollTab'
import { AiBattleTab } from '@/components/AiBattleTab'

// ─── useFetchOnMount hook ───────────────────────────────────────────────────
function useFetchOnMount() {
  const store = useAppStore()

  const fetchAll = useCallback(async () => {
    await Promise.allSettled([
      store.fetchMatches(),
      store.fetchBets(),
      store.fetchStats(),
      store.fetchPlayers(),
      store.fetchPredictors(),
      store.fetchCollectionLogs(),
      store.fetchBankroll(),
      store.fetchAiBankroll(),
    ])
  }, [store])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return fetchAll
}

// ─── useClock hook ──────────────────────────────────────────────────────────
function useClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])
  return time
}

// ─── Animated counter hook (unused, available for future use) ────────────

// ─── getQualityBadge ────────────────────────────────────────────────────────
function getQualityBadge(tier: string) {
  const config: Record<string, { color: string; bg: string; border: string }> = {
    S: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' },
    A: { color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/30' },
    B: { color: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/30' },
    C: { color: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/30' },
    D: { color: 'text-neon-red', bg: 'bg-neon-red/10', border: 'border-neon-red/30' },
  }
  const c = config[tier] || config.D
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold ${c.color} ${c.bg} border ${c.border}`}>
      {tier}
    </span>
  )
}

// ─── Tooltip style for charts ───────────────────────────────────────────────
const chartTooltipStyle = {
  background: 'rgba(15,15,25,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  fontSize: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
}

const CONFIDENCE_COLORS = ['#ef4444', '#f59e0b', '#00d4ff', '#00ff88', '#a855f7']

// ─── Predictor emoji map ────────────────────────────────────────────────────
const predictorEmojis: Record<string, string> = {
  Telegram: '📱',
  Twitter: '🐦',
  Discord: '💬',
}

// ─── Toast system ───────────────────────────────────────────────────────────
interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border backdrop-blur-xl ${
              toast.type === 'success'
                ? 'bg-neon-green/10 border-neon-green/20 text-neon-green'
                : toast.type === 'error'
                  ? 'bg-neon-red/10 border-neon-red/20 text-neon-red'
                  : 'bg-neon-blue/10 border-neon-blue/20 text-neon-blue'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            {toast.type === 'error' && <XCircle className="w-4 h-4 flex-shrink-0" />}
            {toast.type === 'info' && <Sparkles className="w-4 h-4 flex-shrink-0" />}
            <span className="max-w-[300px]">{toast.message}</span>
            <button onClick={() => onRemove(toast.id)} className="ml-2 hover:opacity-70 flex-shrink-0">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─── Match Detail Modal ─────────────────────────────────────────────────────
interface MatchDetailModalProps {
  match: {
    id: string
    player1: string
    player2: string
    status: string
    odds1?: number
    odds2?: number
    score1?: number
    score2?: number
    tournament?: string
    source?: string
    league?: string
    startTime?: string
    predictions?: { predictedWinner: string; confidence: number; reasoning: string; predictor?: string }[]
  } | null
  onClose: () => void
}

function MatchDetailModal({ match, onClose }: MatchDetailModalProps) {
  if (!match) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-card rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              match.status === 'live' ? 'bg-neon-red/20' : match.status === 'completed' ? 'bg-neon-green/20' : 'bg-neon-blue/20'
            }`}>
              {match.status === 'live' ? <Zap className="w-5 h-5 text-neon-red animate-pulse" /> :
                match.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-neon-green" /> :
                  <Clock className="w-5 h-5 text-neon-blue" />}
            </div>
            <div>
              <h2 className="text-lg font-bold">Match Details</h2>
              <p className="text-xs text-muted-foreground capitalize">{match.status}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tournament */}
        {(match.tournament || match.league) && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <p className="text-xs text-muted-foreground">{match.tournament || match.league}</p>
            {match.startTime && <p className="text-xs text-muted-foreground mt-0.5">{new Date(match.startTime).toLocaleString()}</p>}
          </div>
        )}

        {/* Players & Score */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="text-center flex-1">
            <p className="text-lg font-bold">{match.player1}</p>
            {match.odds1 && <p className="text-sm text-neon-orange font-mono">{match.odds1.toFixed(2)}</p>}
          </div>
          <div className="px-4">
            <div className="text-2xl font-black gradient-text">
              {match.score1 !== undefined && match.score2 !== undefined
                ? `${match.score1} - ${match.score2}`
                : 'VS'}
            </div>
          </div>
          <div className="text-center flex-1">
            <p className="text-lg font-bold">{match.player2}</p>
            {match.odds2 && <p className="text-sm text-neon-orange font-mono">{match.odds2.toFixed(2)}</p>}
          </div>
        </div>

        {/* Source */}
        {match.source && (
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Source: {match.source}</span>
          </div>
        )}

        {/* Predictions */}
        {match.predictions && match.predictions.length > 0 && (
          <div className="space-y-3 mt-4">
            <h3 className="text-sm font-semibold">AI Predictions</h3>
            {match.predictions.map((pred, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-neon-purple font-medium">{pred.predictor || `AI #${i + 1}`}</span>
                  <span className={`text-xs font-mono ${pred.confidence >= 0.7 ? 'text-neon-green' : pred.confidence >= 0.5 ? 'text-neon-orange' : 'text-neon-red'}`}>
                    {(pred.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm font-bold text-neon-green mb-2">{pred.predictedWinner}</p>
                <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full progress-gradient-green" style={{ width: `${pred.confidence * 100}%` }} />
                </div>
                {pred.reasoning && <p className="text-xs text-muted-foreground leading-relaxed">{pred.reasoning}</p>}
              </div>
            ))}
          </div>
        )}

        <Separator className="my-4 bg-white/[0.06]" />

        {/* Odds Comparison */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Odds Comparison</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-center">
              <p className="text-xs text-muted-foreground mb-1">{match.player1}</p>
              <p className="text-xl font-bold text-neon-orange">{match.odds1 ? match.odds1.toFixed(2) : 'N/A'}</p>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-center">
              <p className="text-xs text-muted-foreground mb-1">{match.player2}</p>
              <p className="text-xl font-bold text-neon-orange">{match.odds2 ? match.odds2.toFixed(2) : 'N/A'}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Page Content (inner component to avoid conditional hooks) ──────────────
function PageContent() {
  const store = useAppStore()

  // Fetch data on mount
  const refreshAll = useFetchOnMount()

  // Clock
  const clock = useClock()

  // Toasts
  const { toasts, addToast, removeToast } = useToasts()

  // ─── State ──────────────────────────────────────────────────────────────
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Predictor filters
  const [predictorSearch, setPredictorSearch] = useState('')
  const [predictorPlatform, setPredictorPlatform] = useState('all')
  const [predictorTier, setPredictorTier] = useState('all')
  const [predictorStats, setPredictorStats] = useState(false)

  // Loading
  const [loadingPredictionId, setLoadingPredictionId] = useState<string | null>(null)

  // Active tab
  const [activeTab, setActiveTab] = useState('predictions')

  // Match detail modal
  const [selectedMatch, setSelectedMatch] = useState<MatchDetailModalProps['match']>(null)

  // ─── Computed Stats ─────────────────────────────────────────────────────
  const liveMatches = store.matches.filter((m) => m.status === 'live')
  const liveMatchesCount = liveMatches.length
  const totalPredictions = store.matches.reduce(
    (sum, m) => sum + (m.predictions?.length || 0),
    0
  )
  const correctPredictions = store.stats?.correctPredictions || 0
  const winRate = store.stats?.winRate || 0

  // AI Battle stat: matches with both AI predictions
  const battleMatches = store.matches.filter(
    (m) => m.predictions && m.predictions.length >= 2
  )
  const battleAgreementRate = battleMatches.length > 0
    ? Math.round(
        (battleMatches.filter(
          (m) =>
            m.predictions![0].predictedWinner === m.predictions![1].predictedWinner
        ).length /
          battleMatches.length) *
          100
      )
    : 0

  // ─── Dynamic Analytics Data (Bug 4 Fix) ──────────────────────────────
  const analyticsChartData = useMemo(() => {
    // Generate from matches data: group by day
    const dayMap: Record<string, { predictions: number; correct: number }> = {}
    store.matches.forEach((m) => {
      const day = m.startTime
        ? new Date(m.startTime).toLocaleDateString('en-US', { weekday: 'short' })
        : 'Unknown'
      if (!dayMap[day]) dayMap[day] = { predictions: 0, correct: 0 }
      if (m.predictions && m.predictions.length > 0) {
        dayMap[day].predictions += m.predictions.length
        // Estimate correct based on predictions that match winner
        m.predictions.forEach((p) => {
          if (m.winner && p.predictedWinner === m.winner) {
            dayMap[day].correct++
          }
        })
      }
    })
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    // Use store.bets as fallback for prediction data
    if (Object.keys(dayMap).length === 0 && store.bets.length > 0) {
      const betDayMap: Record<string, { predictions: number; correct: number }> = {}
      store.bets.forEach((b) => {
        const day = b.createdAt
          ? new Date(b.createdAt).toLocaleDateString('en-US', { weekday: 'short' })
          : 'Unknown'
        if (!betDayMap[day]) betDayMap[day] = { predictions: 0, correct: 0 }
        betDayMap[day].predictions++
        if (b.status === 'won') betDayMap[day].correct++
      })
      return days.map((d) => betDayMap[d] || { name: d, predictions: 0, correct: 0 })
    }
    return days.map((d) => ({ name: d, ...dayMap[d] }))
  }, [store.matches, store.bets])

  const confidenceData = useMemo(() => {
    // Generate from match predictions confidence
    const buckets = [0, 0, 0, 0, 0]
    store.matches.forEach((m) => {
      m.predictions?.forEach((p) => {
        const conf = p.confidence * 100
        if (conf <= 20) buckets[0]++
        else if (conf <= 40) buckets[1]++
        else if (conf <= 60) buckets[2]++
        else if (conf <= 80) buckets[3]++
        else buckets[4]++
      })
    })
    const hasData = buckets.some((b) => b > 0)
    if (hasData) {
      return [
        { name: '0-20%', value: buckets[0] },
        { name: '20-40%', value: buckets[1] },
        { name: '40-60%', value: buckets[2] },
        { name: '60-80%', value: buckets[3] },
        { name: '80-100%', value: buckets[4] },
      ]
    }
    return [
      { name: '0-20%', value: 5 },
      { name: '20-40%', value: 8 },
      { name: '40-60%', value: 15 },
      { name: '60-80%', value: 28 },
      { name: '80-100%', value: 44 },
    ]
  }, [store.matches])

  const sourceData = useMemo(() => {
    // Generate from collectionLogs
    const sourceMap: Record<string, number> = {}
    store.collectionLogs.forEach((log) => {
      sourceMap[log.source] = (sourceMap[log.source] || 0) + log.matchesCollected
    })
    const entries = Object.entries(sourceMap)
    if (entries.length > 0) {
      const total = entries.reduce((s, [, v]) => s + v, 0)
      return entries.map(([name, value], i) => ({
        name,
        value: Math.round((value / total) * 100),
        color: ['#00ff88', '#a855f7', '#00d4ff', '#f59e0b', '#ef4444'][i % 5],
      }))
    }
    return [
      { name: 'BetBoom', value: 45, color: '#00ff88' },
      { name: 'Fonbet', value: 35, color: '#a855f7' },
      { name: 'Manual', value: 20, color: '#00d4ff' },
    ]
  }, [store.collectionLogs])

  const roiData = useMemo(() => {
    // Generate from bets data: ROI per week
    if (store.bets.length === 0) {
      return [
        { name: 'Week 1', roi: 0 },
        { name: 'Week 2', roi: 0 },
        { name: 'Week 3', roi: 0 },
        { name: 'Week 4', roi: 0 },
      ]
    }
    const weekMap: Record<string, { staked: number; profit: number }> = {}
    store.bets.forEach((b) => {
      if (!b.createdAt) return
      const week = new Date(b.createdAt)
      const weekKey = `Week ${Math.ceil(week.getDate() / 7)}`
      if (!weekMap[weekKey]) weekMap[weekKey] = { staked: 0, profit: 0 }
      weekMap[weekKey].staked += b.stake
      weekMap[weekKey].profit += b.profit
    })
    return Object.entries(weekMap).map(([name, data]) => ({
      name,
      roi: data.staked > 0 ? parseFloat(((data.profit / data.staked) * 100).toFixed(1)) : 0,
    }))
  }, [store.bets])

  // ─── Filtered Data ──────────────────────────────────────────────────────
  const [matchFilter, setMatchFilter] = useState('all')

  const filteredMatches = store.matches.filter((m) => {
    if (matchFilter === 'live') return m.status === 'live'
    if (matchFilter === 'upcoming') return m.status === 'upcoming'
    if (matchFilter === 'completed') return m.status === 'completed'
    if (matchFilter === 'predicted') return m.predictions && m.predictions.length > 0
    return true
  })

  const filteredPredictors = store.predictors.filter((p) => {
    if (predictorSearch && !p.name.toLowerCase().includes(predictorSearch.toLowerCase())) return false
    if (predictorPlatform !== 'all' && p.platform !== predictorPlatform) return false
    if (predictorTier !== 'all' && p.tier !== predictorTier) return false
    return true
  })

  // ─── Live match ticker data ────────────────────────────────────────────
  const tickerMatches = useMemo(() => {
    const live = store.matches.filter((m) => m.status === 'live')
    const upcoming = store.matches
      .filter((m) => m.status === 'upcoming')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5)
    return [...live, ...upcoming]
  }, [store.matches])

  // ─── Sources stats from real data (Bug 3 Fix) ─────────────────────────
  const betboomLogs = useMemo(() => {
    return store.collectionLogs.filter((l) => l.source.toLowerCase().includes('betboom'))
  }, [store.collectionLogs])

  const fonbetLogs = useMemo(() => {
    return store.collectionLogs.filter((l) => l.source.toLowerCase().includes('fonbet'))
  }, [store.collectionLogs])

  const betboomStats = useMemo(() => {
    const totalMatches = betboomLogs.reduce((s, l) => s + l.matchesCollected, 0)
    const successLogs = betboomLogs.filter((l) => l.status === 'success')
    const successRate = betboomLogs.length > 0 ? Math.round((successLogs.length / betboomLogs.length) * 100) : 0
    const lastLog = betboomLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    const lastSync = lastLog ? getTimeAgo(new Date(lastLog.createdAt)) : 'Never'
    return { totalMatches, successRate, lastSync }
  }, [betboomLogs])

  const fonbetStats = useMemo(() => {
    const totalMatches = fonbetLogs.reduce((s, l) => s + l.matchesCollected, 0)
    const successLogs = fonbetLogs.filter((l) => l.status === 'success')
    const successRate = fonbetLogs.length > 0 ? Math.round((successLogs.length / fonbetLogs.length) * 100) : 0
    const lastLog = fonbetLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    const lastSync = lastLog ? getTimeAgo(new Date(lastLog.createdAt)) : 'Never'
    return { totalMatches, successRate, lastSync }
  }, [fonbetLogs])

  // ─── Auto-scroll chat ───────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [store.chatMessages])

  // ─── Event Handlers ─────────────────────────────────────────────────────

  const handleGetPrediction = useCallback(async (match: { id: string; player1: string; player2: string; odds1?: number; odds2?: number }) => {
    setLoadingPredictionId(match.id)
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id }),
      })
      if (res.ok) {
        const data = await res.json()
        const predictions = data.predictions || []
        if (predictions.length > 0) {
          store.updateMatch(match.id, { predictions })
          addToast(`Prediction generated for ${match.player1} vs ${match.player2}`, 'success')
        }
      } else {
        addToast('Failed to get prediction', 'error')
      }
    } catch (err) {
      console.error('Prediction error:', err)
      addToast('Network error getting prediction', 'error')
    } finally {
      setLoadingPredictionId(null)
    }
  }, [store, addToast])

  // Bug 2 Fix: Ensure chat properly handles responses
  const handleSendChat = useCallback(async () => {
    if (!chatInput.trim() || isChatLoading) return

    const userMessage = chatInput.trim()
    const userMsg = { role: 'user' as const, content: userMessage }
    store.addChatMessage(userMsg)
    setChatInput('')
    setIsChatLoading(true)

    try {
      const context = [...store.chatMessages, userMsg].slice(-10).map((m) => `${m.role}: ${m.content}`).join('\n')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, context }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        const reply = data.response || data.message || data.content || data.reply || 'Sorry, I could not generate a response.'
        store.addChatMessage({ role: 'assistant', content: reply })
      } else {
        store.addChatMessage({ role: 'assistant', content: 'Sorry, the server returned an error. Please try again.' })
        addToast('Chat API returned an error', 'error')
      }
    } catch (err: any) {
      console.error('Chat error:', err)
      if (err.name === 'AbortError') {
        store.addChatMessage({ role: 'assistant', content: 'Sorry, the request timed out. Please try again.' })
      } else {
        store.addChatMessage({ role: 'assistant', content: 'Sorry, something went wrong. Please try again.' })
      }
      addToast('Chat error occurred', 'error')
    } finally {
      setIsChatLoading(false)
    }
  }, [chatInput, isChatLoading, store, addToast])

  const handlePlaceBet = useCallback((match: { id: string; player1: string; player2: string; odds1?: number; odds2?: number }) => {
    setActiveTab('bankroll')
  }, [])

  // ─── Quick chat actions ────────────────────────────────────────────────
  const quickActions = [
    { label: '📊 Analyze today\'s matches', message: 'Analyze all today\'s table tennis matches and give me your best picks' },
    { label: '💰 Bankroll strategy', message: 'What bankroll management strategy do you recommend for table tennis betting?' },
    { label: '🔍 Top predictors', message: 'Which predictors have the highest accuracy this month?' },
    { label: '📈 ROI analysis', message: 'What\'s my current ROI and how can I improve it?' },
  ]

  // ─── Tab items ──────────────────────────────────────────────────────────
  const tabs = [
    { value: 'predictions', label: 'Matches', icon: Target },
    { value: 'ai-battle', label: 'AI Battle', icon: Zap },
    { value: 'analytics', label: 'Analytics', icon: BarChart3 },
    { value: 'chat', label: 'AI Chat', icon: Bot },
    { value: 'bankroll', label: 'Bankroll', icon: Wallet },
    { value: 'sources', label: 'Sources', icon: Database },
    { value: 'predictors', label: 'Predictors', icon: Users },
  ]

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      {/* ── Background Grid + Blobs ──────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-grid-pattern" />
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-neon-green/[0.07] blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-neon-purple/[0.07] blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-neon-blue/[0.07] blur-[120px] animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 min-h-screen flex flex-col">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green to-neon-blue flex items-center justify-center">
                <Trophy className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">TT Predict Pro</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Table Tennis Predictions</p>
              </div>
            </div>

            {/* Clock & Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <Clock className="w-3.5 h-3.5 text-neon-blue" />
                <span className="text-xs font-mono text-muted-foreground">
                  {clock.toLocaleTimeString('en-US', { hour12: false })}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="relative w-2.5 h-2.5">
                  <div className="absolute inset-0 rounded-full bg-neon-green live-pulse-ring" />
                  <div className="absolute inset-0 rounded-full bg-neon-green" />
                </div>
                <span className="text-xs font-semibold text-neon-green tracking-wider">LIVE</span>
              </div>
            </div>
          </div>

          {/* ── Animated Gradient Border Line ──────────────────────────────── */}
          <div className="header-glow-line mb-4" />

          {/* ── Live Match Ticker ─────────────────────────────────────────── */}
          {tickerMatches.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4 overflow-hidden rounded-lg bg-white/[0.02] border border-white/[0.04]"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 px-3 py-2 bg-neon-red/10 border-r border-white/[0.04]">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-neon-red animate-pulse" />
                    <span className="text-[10px] font-bold text-neon-red uppercase tracking-wider">Live</span>
                  </div>
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="ticker-scroll flex gap-6 py-2 px-4 whitespace-nowrap">
                    {[...tickerMatches, ...tickerMatches].map((m, i) => (
                      <div key={`${m.id}-${i}`} className="flex items-center gap-2 text-xs flex-shrink-0">
                        <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'live' ? 'bg-neon-red animate-pulse' : 'bg-neon-blue'}`} />
                        <span className="text-muted-foreground">{m.player1}</span>
                        <span className="text-neon-orange font-mono font-medium">
                          {m.status === 'live' && m.score1 !== undefined ? `${m.score1}-${m.score2}` : 'vs'}
                        </span>
                        <span className="text-muted-foreground">{m.player2}</span>
                        {m.odds1 && <span className="text-muted-foreground/60">({m.odds1.toFixed(2)}/{m.odds2?.toFixed(2)})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Quick Stats Row ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatsCard
              title="Total Matches"
              value={store.matches.length || store.stats?.totalMatches || 0}
              icon={Layers}
              color="#00d4ff"
              subtitle="Tracked today"
            />
            <StatsCard
              title="Live Now"
              value={liveMatchesCount}
              icon={Zap}
              color="#ef4444"
              subtitle="In progress"
            />
            <StatsCard
              title="AI Predictions"
              value={totalPredictions}
              icon={Sparkles}
              color="#a855f7"
              subtitle="Generated today"
            />
            <StatsCard
              title="Win Rate"
              value={`${winRate}%`}
              icon={TrendingUp}
              color="#00ff88"
              subtitle={`${correctPredictions} correct`}
            />
            <StatsCard
              title="AI Battle"
              value={battleMatches.length}
              icon={Swords}
              color="#f59e0b"
              subtitle={`${battleAgreementRate}% agree`}
            />
          </div>
        </motion.header>

        {/* ── Tab Navigation ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/[0.04] border border-white/[0.06] p-1 h-auto flex-wrap gap-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-purple/15 data-[state=active]:to-neon-blue/15 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-neon-purple/20 data-[state=active]:shadow-[0_0_12px_rgba(168,85,247,0.15)]`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* ── Tab 1: Predictions ────────────────────────────────────── */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <TabsContent value="predictions" className="mt-6">
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { key: 'all', label: 'All Matches' },
                    { key: 'live', label: '🔴 Live' },
                    { key: 'upcoming', label: '📅 Upcoming' },
                    { key: 'completed', label: '✅ Completed' },
                    { key: 'predicted', label: '🔮 Predicted' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setMatchFilter(f.key)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        matchFilter === f.key
                          ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30 shadow-[0_0_8px_rgba(168,85,247,0.15)]'
                          : 'bg-white/[0.04] text-muted-foreground border border-white/[0.06] hover:bg-white/[0.08]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 sm:ml-auto">
                  <span className="text-xs text-muted-foreground">{filteredMatches.length} matches</span>
                  <button
                    onClick={() => {
                      refreshAll()
                      addToast('Refreshing match data...', 'info')
                    }}
                    className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Match Grid */}
              {store.matches.length === 0 ? (
                <LoadingSkeleton />
              ) : filteredMatches.length === 0 ? (
                <EmptyState
                  icon={Target}
                  title="No Matches Found"
                  description="No matches match your current filter. Try changing the filter."
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {filteredMatches.map((match) => (
                        <div key={match.id} className="cursor-pointer" onClick={() => setSelectedMatch(match)}>
                          <MatchCard
                            match={match}
                            onGetPrediction={handleGetPrediction}
                            onPlaceBet={handlePlaceBet}
                            isLoading={loadingPredictionId === match.id}
                          />
                        </div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* ── Bet History Table ─────────────────────────────────── */}
                  {store.bets.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="glass-card p-6 rounded-xl mt-6"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-4 h-4 text-neon-purple" />
                        <h3 className="text-sm font-semibold">Recent Bet History</h3>
                      </div>
                      <div className="overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-white/[0.06]">
                              <th className="text-left py-2 text-muted-foreground font-medium">Match</th>
                              <th className="text-left py-2 text-muted-foreground font-medium">Prediction</th>
                              <th className="text-right py-2 text-muted-foreground font-medium">Stake</th>
                              <th className="text-right py-2 text-muted-foreground font-medium">Profit</th>
                              <th className="text-center py-2 text-muted-foreground font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {store.bets.slice(0, 10).map((bet) => (
                              <tr key={bet.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                                <td className="py-2 text-muted-foreground">
                                  {bet.match ? `${bet.match.player1} vs ${bet.match.player2}` : `#${bet.matchId.slice(-6)}`}
                                </td>
                                <td className="py-2">{bet.predictedWinner}</td>
                                <td className="py-2 text-right">₽{bet.stake.toFixed(0)}</td>
                                <td className={`py-2 text-right font-medium ${bet.profit >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                                  {bet.profit >= 0 ? '+' : ''}₽{bet.profit.toFixed(0)}
                                </td>
                                <td className="py-2 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                    bet.status === 'won' ? 'bg-neon-green/20 text-neon-green'
                                      : bet.status === 'lost' ? 'bg-neon-red/20 text-neon-red'
                                      : 'bg-neon-orange/20 text-neon-orange'
                                  }`}>
                                    {bet.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </TabsContent>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* ── Tab 2: AI Battle ──────────────────────────────────────── */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <TabsContent value="ai-battle" className="mt-6">
              <AiBattleTab matches={store.matches} />
            </TabsContent>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* ── Tab 3: Analytics ──────────────────────────────────────── */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <TabsContent value="analytics" className="mt-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Avg Confidence</p>
                  <p className="text-2xl font-bold text-neon-green">{(store.stats?.avgConfidence || 0) * 100}%</p>
                  <div className="mt-2 h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full rounded-full progress-gradient-green" style={{ width: `${(store.stats?.avgConfidence || 0) * 100}%` }} />
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Total Bets</p>
                  <p className="text-2xl font-bold text-neon-blue">{store.stats?.totalBets || 0}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Total Profit</p>
                  <p className={`text-2xl font-bold ${(store.stats?.totalProfit || 0) >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                    ₽{(store.stats?.totalProfit || 0).toFixed(2)}
                  </p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                  <p className="text-2xl font-bold text-neon-purple">{winRate}%</p>
                </motion.div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Predictions Over Time */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-neon-green" />
                    <h3 className="text-sm font-semibold">Predictions Over Time</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={analyticsChartData}>
                      <defs>
                        <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="corrGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Legend />
                      <Area type="monotone" dataKey="predictions" stroke="#a855f7" strokeWidth={2} fill="url(#predGrad)" />
                      <Area type="monotone" dataKey="correct" stroke="#00ff88" strokeWidth={2} fill="url(#corrGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Confidence Distribution */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 rounded-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-neon-purple" />
                    <h3 className="text-sm font-semibold">Confidence Distribution</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={confidenceData}>
                      <defs>
                        {confidenceData.map((_, i) => (
                          <linearGradient key={`barGrad${i}`} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CONFIDENCE_COLORS[i % CONFIDENCE_COLORS.length]} stopOpacity={1} />
                            <stop offset="95%" stopColor={CONFIDENCE_COLORS[i % CONFIDENCE_COLORS.length]} stopOpacity={0.4} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {confidenceData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#barGrad${index})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Source Comparison - PieChart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 rounded-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <PieChartIcon className="w-4 h-4 text-neon-blue" />
                    <h3 className="text-sm font-semibold">Source Comparison</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <defs>
                        {sourceData.map((entry, index) => (
                          <linearGradient key={`pieGrad${index}`} id={`pieGrad${index}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                            <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie data={sourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                        {sourceData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#pieGrad${index})`} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* ROI Trend */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 rounded-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-neon-orange" />
                    <h3 className="text-sm font-semibold">ROI Trend (%)</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={roiData}>
                      <defs>
                        <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Area type="monotone" dataKey="roi" stroke="#00ff88" strokeWidth={2} fill="url(#roiGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* Player Leaderboard Table */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <h3 className="text-sm font-semibold">Player Leaderboard</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left py-2 text-muted-foreground font-medium">Rank</th>
                        <th className="text-left py-2 text-muted-foreground font-medium">Player</th>
                        <th className="text-left py-2 text-muted-foreground font-medium hidden md:table-cell">Country</th>
                        <th className="text-center py-2 text-muted-foreground font-medium">W</th>
                        <th className="text-center py-2 text-muted-foreground font-medium">L</th>
                        <th className="text-center py-2 text-muted-foreground font-medium hidden sm:table-cell">Win%</th>
                        <th className="text-right py-2 text-muted-foreground font-medium">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {store.players.slice(0, 10).map((player) => {
                        const winPct = player.wins + player.losses > 0 ? ((player.wins / (player.wins + player.losses)) * 100).toFixed(1) : '0.0'
                        const rankColor = player.rank <= 3 ? 'text-yellow-400' : player.rank <= 5 ? 'text-neon-blue' : 'text-muted-foreground'
                        return (
                          <tr key={player.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5"><span className={`font-bold ${rankColor}`}>#{player.rank}</span></td>
                            <td className="py-2.5 font-medium">{player.name}</td>
                            <td className="py-2.5 text-muted-foreground hidden md:table-cell">{player.country}</td>
                            <td className="py-2.5 text-center text-neon-green">{player.wins}</td>
                            <td className="py-2.5 text-center text-neon-red">{player.losses}</td>
                            <td className="py-2.5 text-center hidden sm:table-cell">
                              <div className="flex items-center gap-1.5 justify-center">
                                <div className="w-16 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                                  <div className="h-full rounded-full progress-gradient-green" style={{ width: `${parseFloat(winPct)}%` }} />
                                </div>
                                <span className="text-muted-foreground">{winPct}%</span>
                              </div>
                            </td>
                            <td className="py-2.5 text-right font-mono font-bold text-neon-purple">{player.rating}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </TabsContent>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* ── Tab 4: AI Assistant ───────────────────────────────────── */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <TabsContent value="chat" className="mt-6">
              <div className="glass-card rounded-xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 320px)', minHeight: '500px' }}>
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">TT Predict AI</h3>
                    <p className="text-xs text-muted-foreground">Ask me anything about table tennis predictions</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="px-4 py-3 border-b border-white/[0.06] flex gap-2 overflow-x-auto">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => {
                        setChatInput(action.message)
                      }}
                      className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all text-muted-foreground hover:text-white whitespace-nowrap"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {store.chatMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-neon-purple/20 to-neon-purple/10 text-white border border-neon-purple/20 rounded-br-sm'
                          : 'bg-white/[0.06] text-gray-200 border border-white/[0.06] rounded-bl-sm'
                      }`}>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Sparkles className="w-3 h-3 text-neon-purple" />
                            <span className="text-xs font-medium text-neon-purple">AI Assistant</span>
                          </div>
                        )}
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                  {isChatLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                      <div className="bg-white/[0.06] border border-white/[0.06] rounded-xl rounded-bl-sm px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-neon-purple typing-dot" />
                          <div className="w-2 h-2 rounded-full bg-neon-purple typing-dot" />
                          <div className="w-2 h-2 rounded-full bg-neon-purple typing-dot" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="px-4 py-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendChat()
                        }
                      }}
                      placeholder="Ask about predictions, strategy, bankroll..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-neon-purple/50 transition-all"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSendChat}
                      disabled={!chatInput.trim() || isChatLoading}
                      className="p-2.5 rounded-xl bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* ── Tab 5: Bankroll ───────────────────────────────────────── */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <TabsContent value="bankroll" className="mt-6">
              <BankrollTab />
            </TabsContent>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* ── Tab 6: Sources (Bug 3 Fix: Real Data) ─────────────────── */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <TabsContent value="sources" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* BetBoom Source Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-neon-green" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">BetBoom</h3>
                        <p className="text-xs text-muted-foreground">Primary odds source</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${betboomLogs.length > 0 ? 'bg-neon-green' : 'bg-neon-red'}`} />
                      <span className={`text-xs ${betboomLogs.length > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                        {betboomLogs.length > 0 ? 'Connected' : 'No data'}
                      </span>
                    </div>
                  </div>
                  <Separator className="my-4 bg-white/[0.06]" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Matches Collected</p>
                      <p className="text-lg font-bold">{betboomStats.totalMatches || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Last Sync</p>
                      <p className="text-lg font-bold text-neon-blue">{betboomStats.lastSync}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                      <p className={`text-lg font-bold ${betboomStats.successRate >= 80 ? 'text-neon-green' : betboomStats.successRate >= 50 ? 'text-neon-orange' : 'text-neon-red'}`}>
                        {betboomStats.successRate > 0 ? `${betboomStats.successRate}%` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Collection Runs</p>
                      <p className="text-lg font-bold">{betboomLogs.length}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Fonbet Source Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neon-purple/10 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-neon-purple" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">Fonbet</h3>
                        <p className="text-xs text-muted-foreground">Secondary odds source</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${fonbetLogs.length > 0 ? 'bg-neon-green' : 'bg-neon-red'}`} />
                      <span className={`text-xs ${fonbetLogs.length > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                        {fonbetLogs.length > 0 ? 'Connected' : 'No data'}
                      </span>
                    </div>
                  </div>
                  <Separator className="my-4 bg-white/[0.06]" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Matches Collected</p>
                      <p className="text-lg font-bold">{fonbetStats.totalMatches || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Last Sync</p>
                      <p className="text-lg font-bold text-neon-blue">{fonbetStats.lastSync}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                      <p className={`text-lg font-bold ${fonbetStats.successRate >= 80 ? 'text-neon-green' : fonbetStats.successRate >= 50 ? 'text-neon-orange' : 'text-neon-red'}`}>
                        {fonbetStats.successRate > 0 ? `${fonbetStats.successRate}%` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Collection Runs</p>
                      <p className="text-lg font-bold">{fonbetLogs.length}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Collection Logs */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 rounded-xl md:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-neon-blue" />
                      <h3 className="text-sm font-semibold">Collection Logs</h3>
                      <Badge className="bg-white/[0.06] text-muted-foreground border-white/[0.08] text-[10px]">
                        {store.collectionLogs.length} entries
                      </Badge>
                    </div>
                  </div>
                  {store.collectionLogs.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">No collection logs yet. The collector may not have run yet.</p>
                  ) : (
                    <div className="overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.06]">
                            <th className="text-left py-2 text-muted-foreground font-medium">Source</th>
                            <th className="text-center py-2 text-muted-foreground font-medium">Matches</th>
                            <th className="text-center py-2 text-muted-foreground font-medium">Status</th>
                            <th className="text-right py-2 text-muted-foreground font-medium">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {store.collectionLogs.map((log) => (
                            <tr key={log.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                              <td className="py-2 font-medium">{log.source}</td>
                              <td className="py-2 text-center">{log.matchesCollected}</td>
                              <td className="py-2 text-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                                  log.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {log.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                  {log.status}
                                </span>
                              </td>
                              <td className="py-2 text-right text-muted-foreground">
                                {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              </div>
            </TabsContent>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* ── Tab 7: Predictors ─────────────────────────────────────── */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <TabsContent value="predictors" className="mt-6">
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={predictorSearch}
                    onChange={(e) => setPredictorSearch(e.target.value)}
                    placeholder="Search predictors..."
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-neon-purple/50 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={predictorPlatform} onChange={(e) => setPredictorPlatform(e.target.value)} className="px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-neon-purple/50">
                    <option value="all">All Platforms</option>
                    <option value="Telegram">Telegram</option>
                    <option value="Twitter">Twitter</option>
                    <option value="Discord">Discord</option>
                  </select>
                  <select value={predictorTier} onChange={(e) => setPredictorTier(e.target.value)} className="px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-neon-purple/50">
                    <option value="all">All Tiers</option>
                    <option value="S">S Tier</option>
                    <option value="A">A Tier</option>
                    <option value="B">B Tier</option>
                    <option value="C">C Tier</option>
                    <option value="D">D Tier</option>
                  </select>
                  <button
                    onClick={() => setPredictorStats(!predictorStats)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                      predictorStats ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/30' : 'bg-white/[0.06] text-muted-foreground border-white/[0.08]'
                    }`}
                  >
                    <BarChart3 className="w-3 h-3" />
                    Stats
                  </button>
                </div>
              </div>

              {/* Predictor Grid */}
              {filteredPredictors.length === 0 ? (
                <EmptyState icon={Users} title="No Predictors Found" description="No predictors match your current filters." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPredictors.map((predictor, index) => {
                    const avatarEmoji = predictor.avatarEmoji || predictorEmojis[predictor.platform || ''] || null
                    return (
                      <motion.div
                        key={predictor.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="glass-card glass-card-hover p-4 rounded-xl"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 flex items-center justify-center border border-white/[0.06] text-sm">
                              {avatarEmoji ? <span className="text-base">{avatarEmoji}</span> : <span className="text-sm font-bold text-white">{predictor.name.charAt(0).toUpperCase()}</span>}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold">{predictor.name}</h4>
                                {predictor.verified && <Shield className="w-3 h-3 text-neon-blue" />}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {predictor.platform && <span className="text-xs text-muted-foreground">{predictor.platform}</span>}
                                {getQualityBadge(predictor.tier)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-white/[0.04]">
                            <p className="text-xs text-muted-foreground mb-0.5">Accuracy</p>
                            <p className="text-sm font-bold" style={{ color: predictor.accuracy >= 80 ? '#00ff88' : predictor.accuracy >= 65 ? '#00d4ff' : predictor.accuracy >= 50 ? '#f59e0b' : '#ef4444' }}>
                              {predictor.accuracy}%
                            </p>
                          </div>
                          <div className="p-2 rounded-lg bg-white/[0.04]">
                            <p className="text-xs text-muted-foreground mb-0.5">Predictions</p>
                            <p className="text-sm font-bold">{predictor.totalPredictions}</p>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${predictor.accuracy}%`,
                                background: predictor.accuracy >= 80 ? 'linear-gradient(90deg, #00ff88, #00d4ff)' : predictor.accuracy >= 65 ? 'linear-gradient(90deg, #00d4ff, #a855f7)' : predictor.accuracy >= 50 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : '#ef4444',
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          {predictor.verified ? (
                            <div className="flex items-center gap-1.5 text-neon-green"><CheckCircle2 className="w-3 h-3" /><span className="text-xs">Verified</span></div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-neon-orange"><AlertTriangle className="w-3 h-3" /><span className="text-xs">Unverified</span></div>
                          )}
                          <button className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1">
                            View Profile <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer className="mt-auto pt-8 pb-4 text-center">
          <Separator className="mb-4 bg-white/[0.06]" />
          <p className="text-xs text-muted-foreground">TT Predict Pro &copy; 2025</p>
        </footer>
      </div>

      {/* ── Match Detail Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedMatch && (
          <MatchDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
        )}
      </AnimatePresence>

      {/* ── Toast Notifications ──────────────────────────────────────────── */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ─── Main Page Export (with mounted check for SSR hydration safety) ────────────
const emptySubscribe = () => () => {}
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

export default function Page() {
  const isMounted = useIsMounted()

  if (!isMounted) return null

  return <PageContent />
}
