import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const totalMatches = await db.match.count()

    const predictions = await db.prediction.findMany({ include: { match: true } })
    const correctPredictions = predictions.filter((p) => p.isCorrect === true).length
    const avgConfidence =
      predictions.length > 0
        ? predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length
        : 0

    const bets = await db.bet.findMany()
    const wonBets = bets.filter((b) => b.isWin === true)
    const lostBets = bets.filter((b) => b.isWin === false && b.settledAt)
    const totalBets = bets.length
    const totalProfit =
      wonBets.reduce((s, b) => s + (b.payout - b.stake), 0) -
      lostBets.reduce((s, b) => s + b.stake, 0)
    const settledCount = wonBets.length + lostBets.length
    const winRate =
      settledCount > 0
        ? Math.round((wonBets.length / settledCount) * 1000) / 10
        : 0

    return NextResponse.json({
      totalMatches,
      correctPredictions,
      avgConfidence,
      winRate,
      totalBets,
      totalProfit,
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
