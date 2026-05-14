'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet, TrendingUp, AlertTriangle, Plus, ArrowUpRight, ArrowDownRight,
  Zap, Shield, Target, RotateCcw, Settings, DollarSign, Activity,
  ChevronDown, Info, CheckCircle, XCircle, Clock, PieChart
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'

interface BankrollData {
  id: string
  initialAmount: number
  currentAmount: number
  strategy: string
  riskLevel: string
  flatAmount: number
  percentage: number
  kellyFraction: number
  stopLoss: number
  takeProfit: number
  peakAmount: number
  maxDrawdown: number
  totalDeposits: number
  totalWithdrawals: number
  profit: number
  roi: number
  currentStreak: number
  bestStreak: number
  riskOfRuin: number
  suggestedStake: number
  balanceHistory: { date: string; balance: number; type: string; description: string }[]
  entries: { id: string; type: string; amount: number; balance: number; description: string; createdAt: string }[]
  totalEntries: number
  settledBets: number
  totalWins: number
  totalLosses: number
}

const STRATEGIES = [
  { value: 'flat', label: 'Flat Betting', icon: '🎲', desc: 'Fixed amount per bet regardless of bankroll', color: '#00d4ff' },
  { value: 'percentage', label: '% of Bankroll', icon: '📊', desc: 'Fixed percentage of current bankroll per bet', color: '#a855f7' },
  { value: 'kelly', label: "Kelly Criterion", icon: '🧠', desc: 'Mathematically optimal stake based on edge & odds', color: '#00ff88' },
  { value: 'dalembert', label: "D'Alembert", icon: '📈', desc: 'Increase stake after loss, decrease after win', color: '#f472b6' },
]

const RISK_LEVELS = [
  { value: 'low', label: 'Conservative', color: '#00ff88', emoji: '🛡️' },
  { value: 'medium', label: 'Balanced', color: '#00d4ff', emoji: '⚖️' },
  { value: 'high', label: 'Aggressive', color: '#f59e0b', emoji: '🔥' },
  { value: 'aggressive', label: 'YOLO', color: '#ef4444', emoji: '💀' },
]

interface BankrollTabProps {
  store: any
  stats: any
  bets: any[]
  onRefresh: () => void
}

export function BankrollTab({ store, stats, bets, onRefresh }: BankrollTabProps) {
  const [bankroll, setBankroll] = useState<BankrollData | null>(null)
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [depositOpen, setDepositOpen] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [betOpen, setBetOpen] = useState(false)
  const [betMatchId, setBetMatchId] = useState('')
  const [betWinner, setBetWinner] = useState('')
  const [betOdds, setBetOdds] = useState('')
  const [betStake, setBetStake] = useState('')
  const [settings, setSettings] = useState({
    strategy: 'flat',
    riskLevel: 'medium',
    flatAmount: '100',
    percentage: '3',
    kellyFraction: '0.25',
    stopLoss: '',
    takeProfit: '',
  })

  const fetchBankroll = useCallback(async () => {
    try {
      const res = await fetch('/api/bankroll')
      if (res.ok) {
        const data = await res.json()
        setBankroll(data)
        setSettings({
          strategy: data.strategy,
          riskLevel: data.riskLevel,
          flatAmount: String(data.flatAmount),
          percentage: String(data.percentage),
          kellyFraction: String(data.kellyFraction),
          stopLoss: data.stopLoss ? String(data.stopLoss) : '',
          takeProfit: data.takeProfit ? String(data.takeProfit) : '',
        })
      }
    } catch { /* noop */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchBankroll() }, [fetchBankroll])

  const handleUpdateSettings = async () => {
    try {
      await fetch('/api/bankroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          strategy: settings.strategy,
          riskLevel: settings.riskLevel,
          flatAmount: parseFloat(settings.flatAmount) || 100,
          percentage: parseFloat(settings.percentage) || 3,
          kellyFraction: parseFloat(settings.kellyFraction) || 0.25,
          stopLoss: parseFloat(settings.stopLoss) || 0,
          takeProfit: parseFloat(settings.takeProfit) || 0,
        }),
      })
      fetchBankroll()
      setSettingsOpen(false)
    } catch { /* noop */ }
  }

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount)
    if (!amount || amount <= 0) return
    try {
      await fetch('/api/bankroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deposit', amount }),
      })
      fetchBankroll()
      setDepositOpen(false)
      setDepositAmount('')
    } catch { /* noop */ }
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0) return
    try {
      await fetch('/api/bankroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'withdraw', amount }),
      })
      fetchBankroll()
      setWithdrawOpen(false)
      setWithdrawAmount('')
    } catch { /* noop */ }
  }

  const handlePlaceBet = async () => {
    if (!betMatchId || !betWinner || !betOdds || !betStake) return
    const match = store.matches.find((m: any) => m.id === betMatchId)
    if (!match) return
    try {
      await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: betMatchId,
          predictedWinner: betWinner,
          odds: parseFloat(betOdds),
          stake: parseFloat(betStake),
        }),
      })
      onRefresh()
      setBetOpen(false)
      setBetMatchId('')
      setBetWinner('')
      setBetOdds('')
      setBetStake('')
    } catch { /* noop */ }
  }

  const match = store.matches.find((m: any) => m.id === betMatchId)

  const handleSimBet = async (result: 'win' | 'loss') => {
    const stake = parseFloat(betStake) || bankroll?.suggestedStake || 100
    const odds = parseFloat(betOdds) || 1.85
    const payout = result === 'win' ? stake * odds : 0
    try {
      await fetch('/api/bankroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_bet_result',
          betResult: result,
          stakeAmount: stake,
          payoutAmount: payout,
          odds,
          player1: match?.player1 || 'Player 1',
          player2: match?.player2 || 'Player 2',
        }),
      })
      fetchBankroll()
    } catch { /* noop */ }
  }

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const risk = RISK_LEVELS.find(r => r.value === settings.riskLevel)
  const strat = STRATEGIES.find(s => s.value === settings.strategy)

  // Chart data
  const chartData = bankroll?.balanceHistory.map((h, i) => ({
    name: i === 0 ? 'Start' : `#${i}`,
    balance: h.balance,
    type: h.type,
  })) || []

  // Entry type icon
  const entryIcon = (type: string) => {
    switch (type) {
      case 'bet_win': return <CheckCircle className="size-3 text-neon-green" />
      case 'bet_loss': return <XCircle className="size-3 text-neon-red" />
      case 'deposit': return <ArrowUpRight className="size-3 text-neon-blue" />
      case 'withdrawal': return <ArrowDownRight className="size-3 text-neon-orange" />
      case 'adjustment': return <RotateCcw className="size-3 text-neon-purple" />
      default: return <Activity className="size-3 text-muted-foreground" />
    }
  }

  const entryColor = (type: string) => {
    switch (type) {
      case 'bet_win': return 'text-neon-green'
      case 'bet_loss': return 'text-neon-red'
      case 'deposit': return 'text-neon-blue'
      case 'withdrawal': return 'text-neon-orange'
      case 'adjustment': return 'text-neon-purple'
      default: return 'text-muted-foreground'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-white/5 rounded w-1/3 mb-3" />
            <div className="h-8 bg-white/5 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Hero Balance Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-5 sm:p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-neon-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-purple/5 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Current Bankroll</span>
                <Badge className="text-[9px] px-1.5 py-0" style={{
                  backgroundColor: `${risk?.color}15`,
                  color: risk?.color,
                  border: `1px solid ${risk?.color}30`,
                }}>
                  {risk?.emoji} {risk?.label}
                </Badge>
              </div>
              <div className="text-3xl sm:text-4xl font-bold tracking-tight" style={{
                background: bankroll && bankroll.profit >= 0
                  ? 'linear-gradient(135deg, #00ff88, #00d4ff)'
                  : 'linear-gradient(135deg, #ef4444, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {fmt(bankroll?.currentAmount || 0)}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                <span>Profit: <span className={bankroll && bankroll.profit >= 0 ? 'text-neon-green font-semibold' : 'text-neon-red font-semibold'}>
                  {(bankroll?.profit ?? 0) >= 0 ? '+' : ''}{fmt(bankroll?.profit || 0)}
                </span></span>
                <span>ROI: <span className={bankroll && bankroll.roi >= 0 ? 'text-neon-green font-semibold' : 'text-neon-red font-semibold'}>
                  {bankroll?.roi?.toFixed(1) || '0.0'}%
                </span></span>
                <span>Peak: <span className="text-foreground font-medium">{fmt(bankroll?.peakAmount || 0)}</span></span>
                <span>Drawdown: <span className="text-neon-orange font-medium">-{fmt(bankroll?.maxDrawdown || 0)}</span></span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5">
                    <Settings className="size-3" /> Strategy
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card bg-background border-white/[0.08] max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Settings className="size-4 text-neon-purple" />
                      Bankroll Strategy
                    </DialogTitle>
                    <DialogDescription>Configure your betting strategy and risk management</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Strategy Selection */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block font-medium">Betting Strategy</label>
                      <div className="grid grid-cols-2 gap-2">
                        {STRATEGIES.map(s => (
                          <button
                            key={s.value}
                            onClick={() => setSettings({ ...settings, strategy: s.value })}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              settings.strategy === s.value
                                ? 'border-white/20 bg-white/[0.06]'
                                : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="text-base mb-1">{s.icon}</div>
                            <div className="text-xs font-semibold" style={{ color: settings.strategy === s.value ? s.color : undefined }}>{s.label}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Risk Level */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block font-medium">Risk Level</label>
                      <div className="grid grid-cols-4 gap-2">
                        {RISK_LEVELS.map(r => (
                          <button
                            key={r.value}
                            onClick={() => setSettings({ ...settings, riskLevel: r.value })}
                            className={`p-2 rounded-lg border text-center transition-all text-[10px] ${
                              settings.riskLevel === r.value
                                ? 'border-white/20 bg-white/[0.06]'
                                : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="text-lg mb-0.5">{r.emoji}</div>
                            <div className="font-medium" style={{ color: settings.riskLevel === r.value ? r.color : undefined }}>{r.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Strategy-specific params */}
                    <div className="grid grid-cols-2 gap-3">
                      {settings.strategy === 'flat' && (
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Flat Stake ($)</label>
                          <Input type="number" value={settings.flatAmount} onChange={(e) => setSettings({ ...settings, flatAmount: e.target.value })} className="h-9 text-xs" />
                        </div>
                      )}
                      {(settings.strategy === 'percentage' || settings.strategy === 'dalembert') && (
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">% of Bankroll</label>
                          <Input type="number" step="0.5" value={settings.percentage} onChange={(e) => setSettings({ ...settings, percentage: e.target.value })} className="h-9 text-xs" />
                        </div>
                      )}
                      {settings.strategy === 'kelly' && (
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Kelly Fraction</label>
                          <Input type="number" step="0.05" value={settings.kellyFraction} onChange={(e) => setSettings({ ...settings, kellyFraction: e.target.value })} className="h-9 text-xs" />
                          <p className="text-[10px] text-muted-foreground mt-1">Quarter Kelly (0.25) recommended</p>
                        </div>
                      )}
                    </div>

                    <Separator className="bg-white/[0.06]" />

                    {/* Stop-loss / Take-profit */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                          <AlertTriangle className="size-3 text-neon-red" /> Stop Loss ($)
                        </label>
                        <Input type="number" placeholder="0 = off" value={settings.stopLoss} onChange={(e) => setSettings({ ...settings, stopLoss: e.target.value })} className="h-9 text-xs" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                          <Target className="size-3 text-neon-green" /> Take Profit ($)
                        </label>
                        <Input type="number" placeholder="0 = off" value={settings.takeProfit} onChange={(e) => setSettings({ ...settings, takeProfit: e.target.value })} className="h-9 text-xs" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button size="sm" onClick={handleUpdateSettings} className="bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30">
                      Save Settings
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5">
                    <ArrowUpRight className="size-3 text-neon-green" /> Deposit
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card bg-background border-white/[0.08] max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="text-neon-green">Deposit Funds</DialogTitle>
                  </DialogHeader>
                  <Input type="number" placeholder="Amount..." value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="h-10" autoFocus />
                  <DialogFooter>
                    <Button size="sm" onClick={handleDeposit} className="bg-neon-green/20 text-neon-green hover:bg-neon-green/30">Confirm Deposit</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5">
                    <ArrowDownRight className="size-3 text-neon-orange" /> Withdraw
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card bg-background border-white/[0.08] max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="text-neon-orange">Withdraw Funds</DialogTitle>
                  </DialogHeader>
                  <Input type="number" placeholder="Amount..." value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="h-10" autoFocus />
                  <p className="text-[10px] text-muted-foreground">Available: {fmt(bankroll?.currentAmount || 0)}</p>
                  <DialogFooter>
                    <Button size="sm" onClick={handleWithdraw} className="bg-neon-orange/20 text-neon-orange hover:bg-neon-orange/30">Confirm Withdraw</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={betOpen} onOpenChange={setBetOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="text-xs gap-1.5 bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 border-0">
                    <Plus className="size-3" /> New Bet
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card bg-background border-white/[0.08]">
                  <DialogHeader>
                    <DialogTitle>Place a Bet</DialogTitle>
                    <DialogDescription>Select a match and your prediction</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Match</label>
                      <Select value={betMatchId} onValueChange={setBetMatchId}>
                        <SelectTrigger className="w-full h-9 text-xs"><SelectValue placeholder="Select match" /></SelectTrigger>
                        <SelectContent>
                          {store.matches.filter((m: any) => m.status !== 'finished').slice(0, 50).map((m: any) => (
                            <SelectItem key={m.id} value={m.id} className="text-xs">
                              {m.player1} vs {m.player2} ({m.league || m.source})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Predicted Winner</label>
                      <Select value={betWinner} onValueChange={setBetWinner}>
                        <SelectTrigger className="w-full h-9 text-xs"><SelectValue placeholder="Select winner" /></SelectTrigger>
                        <SelectContent>
                          {match && (<>
                            <SelectItem value="player1">{match.player1}</SelectItem>
                            <SelectItem value="player2">{match.player2}</SelectItem>
                          </>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Odds</label>
                        <Input type="number" step="0.01" placeholder="1.85" value={betOdds} onChange={(e) => setBetOdds(e.target.value)} className="h-9 text-xs" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Stake</label>
                        <Input type="number" step="1" placeholder={String(bankroll?.suggestedStake || 100)} value={betStake} onChange={(e) => setBetStake(e.target.value)} className="h-9 text-xs" />
                      </div>
                    </div>
                    {betOdds && betStake && (
                      <div className="text-xs bg-white/[0.03] rounded-lg p-2 flex justify-between">
                        <span className="text-muted-foreground">Potential win:</span>
                        <span className="text-neon-green font-semibold">{fmt(parseFloat(betOdds) * parseFloat(betStake))}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Info className="size-3" /> Suggested stake: <span className="text-neon-purple font-medium">{fmt(bankroll?.suggestedStake || 0)}</span> ({strat?.label})
                    </p>
                  </div>
                  <DialogFooter>
                    <Button size="sm" onClick={handlePlaceBet} disabled={!betMatchId || !betWinner || !betOdds || !betStake} className="bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30">
                      Place Bet
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Quick Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { icon: DollarSign, label: 'Suggested Stake', value: fmt(bankroll?.suggestedStake || 0), color: strat?.color || '#a855f7', sub: strat?.label },
          { icon: bankroll && bankroll.currentStreak > 0 ? TrendingUp : AlertTriangle, label: 'Streak', value: `${bankroll?.currentStreak || 0}`, color: bankroll && bankroll.currentStreak > 0 ? '#00ff88' : '#ef4444', sub: `Best: ${bankroll?.bestStreak || 0}` },
          { icon: Shield, label: 'Risk of Ruin', value: `${((bankroll?.riskOfRuin || 0) * 100).toFixed(1)}%`, color: (bankroll?.riskOfRuin || 0) > 0.3 ? '#ef4444' : '#00ff88', sub: (bankroll?.riskOfRuin || 0) > 0.3 ? 'High risk!' : 'Manageable' },
          { icon: Activity, label: 'Bets Settled', value: `${bankroll?.settledBets || 0}`, color: '#00d4ff', sub: `${bankroll?.totalWins || 0}W / ${bankroll?.totalLosses || 0}L` },
          { icon: Zap, label: 'Win Rate', value: bankroll?.settledBets ? `${((bankroll?.totalWins || 0) / bankroll?.settledBets * 100).toFixed(1)}%` : '0%', color: bankroll?.settledBets && (bankroll?.totalWins || 0) / bankroll?.settledBets > 0.5 ? '#00ff88' : '#f59e0b', sub: 'Settled bets' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="glass-card bg-transparent border-white/[0.06]">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <stat.icon className="size-3.5" style={{ color: stat.color }} />
                  <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                </div>
                <div className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{stat.sub}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Balance Chart ── */}
      <div className="glass-card rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="size-4 text-neon-green" />
          Balance History
        </h3>
        {chartData.length > 1 ? (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="brGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={bankroll && bankroll.profit >= 0 ? "#00ff88" : "#ef4444"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={bankroll && bankroll.profit >= 0 ? "#00ff88" : "#ef4444"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <RechartsTooltip contentStyle={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Balance']} />
                <ReferenceLine y={bankroll?.initialAmount || 0} stroke="rgba(255,255,255,0.2)" strokeDasharray="5 5" label={{ value: 'Start', fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                <Area type="monotone" dataKey="balance" stroke={bankroll && bankroll.profit >= 0 ? "#00ff88" : "#ef4444"} fill="url(#brGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
            <div className="text-center">
              <Activity className="size-8 mx-auto mb-2 opacity-30" />
              <p>Place bets to see balance history</p>
              <p className="text-xs mt-1">Strategy: {strat?.emoji} {strat?.label}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Strategy Info Card ── */}
      <div className="glass-card rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Settings className="size-4 text-neon-purple" />
          Active Strategy
        </h3>
        <div className="flex items-start gap-4">
          <div className="text-3xl">{strat?.emoji}</div>
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: strat?.color }}>{strat?.label}</div>
            <p className="text-xs text-muted-foreground mt-1">{strat?.desc}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {bankroll?.stopLoss ? (
                <Badge className="text-[10px] bg-neon-red/10 text-neon-red border border-neon-red/20">
                  Stop Loss: {fmt(bankroll.stopLoss)}
                </Badge>
              ) : null}
              {bankroll?.takeProfit ? (
                <Badge className="text-[10px] bg-neon-green/10 text-neon-green border border-neon-green/20">
                  Take Profit: {fmt(bankroll.takeProfit)}
                </Badge>
              ) : null}
              <Badge className="text-[10px]" style={{ backgroundColor: `${risk?.color}15`, color: risk?.color, border: `1px solid ${risk?.color}30` }}>
                {risk?.emoji} {risk?.label} Risk
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ── Transaction History ── */}
      <div className="glass-card rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Clock className="size-4 text-neon-blue" />
          Transaction History
        </h3>
        {bankroll && bankroll.entries.length > 0 ? (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {bankroll.entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                {entryIcon(entry.type)}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{entry.description}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-xs font-semibold ${entryColor(entry.type)}`}>
                    {entry.amount >= 0 ? '+' : ''}{fmt(entry.amount)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{fmt(entry.balance)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-6">
            No transactions yet. Place bets or deposit funds to get started.
          </p>
        )}
      </div>
    </div>
  )
}
