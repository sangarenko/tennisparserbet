import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const matches = await db.match.findMany({
      orderBy: { startTime: 'desc' },
      include: { odds: true, predictions: true, bets: true },
      take: 200,
    })

    const result = matches.map((m) => {
      const odds = m.odds.length > 0 ? m.odds[0] : null
      return {
        id: m.id,
        player1: m.player1,
        player2: m.player2,
        source: m.source,
        sport: m.sport,
        league: m.league,
        startTime: m.startTime.toISOString(),
        status: m.status,
        score1: m.score1,
        score2: m.score2,
        winner: m.winner,
        odds1: odds?.odds1,
        odds2: odds?.odds2,
        tournament: m.league,
        predictions: m.predictions.map((p) => ({
          id: p.id,
          predictedWinner: p.predictedWinner,
          confidence: p.confidence,
          reasoning: p.analysis,
          predictor: p.aiModel,
          timestamp: p.createdAt.toISOString(),
        })),
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch matches:', error)
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}
