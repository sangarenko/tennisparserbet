'use client'

import { motion } from 'framer-motion'
import { useState, useCallback } from 'react'
import { Wallet, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, History, Settings } from 'lucide-react'

interface BankrollTabProps {
  bankroll: { total: number; currency: string }
  bets: Array<{
    id: string
    matchId: string
    predictedWinner: string
    odds?: number
    stake: number
    status: string
    result?: string
    profit: number
  }>
  onSetBankroll: (amount: number) => void
}

export function BankrollTab({ bankroll, bets, onSetBankroll }: BankrollTabProps) {
  const [showSetDialog, setShowSetDialog] = useState(false)
  const [inputAmount, setInputAmount] = useState('')

  const totalBets = bets.length
  const wonBets = bets.filter((b) => b.status === 'won')
  const lostBets = bets.filter((b) => b.status === 'lost')
  const pendingBets = bets.filter((b) => b.status === 'pending')
  const totalStaked = bets.reduce((sum, b) => sum + b.stake, 0)
  const totalProfit = bets.reduce((sum, b) => sum + b.profit, 0)
  const winRate = totalBets > 0 ? ((wonBets.length / totalBets) * 100).toFixed(1) : '0.0'

  const handleSet = useCallback(() => {
    const amount = parseFloat(inputAmount)
    if (isNaN(amount) || amount <= 0) return
    onSetBankroll(amount)
    setInputAmount('')
    setShowSetDialog(false)
  }, [inputAmount, onSetBankroll])

  const recentBets = [...bets].sort((a, b) => {
    const da = new Date(a.id).getTime()
    const db = new Date(b.id).getTime()
    return db - da
  }).slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-neon-green/10">
              <Wallet className="w-6 h-6 text-neon-green" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Balance</p>
              <p className="text-3xl font-bold text-neon-green">
                {bankroll.currency} {bankroll.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSetDialog(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-white/[0.06] hover:bg-white/[0.1] transition-all"
          >
            <Settings className="w-3 h-3" />
            Set Balance
          </button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-3 h-3 text-neon-orange" />
            <span className="text-xs text-muted-foreground">Total Staked</span>
          </div>
          <p className="text-lg font-bold">${totalStaked.toFixed(2)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            {totalProfit >= 0 ? (
              <TrendingUp className="w-3 h-3 text-neon-green" />
            ) : (
              <TrendingDown className="w-3 h-3 text-neon-red" />
            )}
            <span className="text-xs text-muted-foreground">Net Profit</span>
          </div>
          <p className={`text-lg font-bold ${totalProfit >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
            {totalProfit >= 0 ? '+' : ''}{bankroll.currency} {totalProfit.toFixed(2)}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="w-3 h-3 text-neon-green" />
            <span className="text-xs text-muted-foreground">Won</span>
          </div>
          <p className="text-lg font-bold text-neon-green">{wonBets.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownRight className="w-3 h-3 text-neon-red" />
            <span className="text-xs text-muted-foreground">Lost</span>
          </div>
          <p className="text-lg font-bold text-neon-red">{lostBets.length}</p>
        </motion.div>
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card p-6 rounded-xl"
      >
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-neon-purple" />
          <h3 className="text-sm font-semibold">Betting Summary</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
            <p className="text-lg font-bold text-neon-blue">{winRate}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Bets</p>
            <p className="text-lg font-bold">{totalBets}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Pending</p>
            <p className="text-lg font-bold text-neon-orange">{pendingBets.length}</p>
          </div>
        </div>
      </motion.div>

      {/* Recent Bets Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 rounded-xl"
      >
        <h3 className="text-sm font-semibold mb-4">Recent Bets</h3>
        {recentBets.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No bets placed yet</p>
        ) : (
          <div className="overflow-x-auto">
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
                {recentBets.map((bet) => (
                  <tr key={bet.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-2 text-muted-foreground">#{bet.matchId.slice(-6)}</td>
                    <td className="py-2">{bet.predictedWinner}</td>
                    <td className="py-2 text-right">${bet.stake.toFixed(2)}</td>
                    <td className="py-2 text-right text-neon-orange">{bet.odds?.toFixed(2) || '-'}</td>
                    <td className={`py-2 text-right font-medium ${bet.profit >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                      {bet.profit >= 0 ? '+' : ''}{bet.profit.toFixed(2)}
                    </td>
                    <td className="py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        bet.status === 'won'
                          ? 'bg-green-500/20 text-green-400'
                          : bet.status === 'lost'
                          ? 'bg-red-500/20 text-red-400'
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

      {/* Set Balance Dialog */}
      {showSetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 rounded-xl w-full max-w-sm mx-4"
          >
            <h3 className="text-sm font-semibold mb-4">Set Bankroll Balance</h3>
            <input
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder="Enter amount..."
              className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-purple/50 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowSetDialog(false)}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-white/[0.06] hover:bg-white/[0.1] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSet}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30 transition-all"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
