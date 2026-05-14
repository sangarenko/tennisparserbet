import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { matchId } = body

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 })
    }

    // Fetch match with full details
    const match = await db.match.findUnique({
      where: { id: matchId },
      include: {
        odds: true,
        predictions: true,
        bets: true,
        player1Rel: {
          include: { history: { orderBy: { date: 'desc' }, take: 10 } },
        },
        player2Rel: {
          include: { history: { orderBy: { date: 'desc' }, take: 10 } },
        },
      },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Odds comparison
    const oddsComparison = match.odds.length > 0
      ? {
          sources: match.odds.map((o) => ({
            source: o.source,
            odds1: o.odds1,
            odds2: o.odds2,
            implied1: Math.round((1 / o.odds1) * 10000) / 100,
            implied2: Math.round((1 / o.odds2) * 10000) / 100,
            totalOver: o.totalOver,
            totalUnder: o.totalUnder,
            handicap1: o.handicap1,
            handicap2: o.handicap2,
          })),
          bestOdds1: match.odds.reduce(
            (best, o) => (o.odds1 > best.odds1 ? o : best),
            match.odds[0]
          )?.odds1,
          bestOdds2: match.odds.reduce(
            (best, o) => (o.odds2 > best.odds2 ? o : best),
            match.odds[0]
          )?.odds2,
        }
      : { sources: [], bestOdds1: null, bestOdds2: null }

    // Prediction summary
    const predictionSummary = {
      totalPredictions: match.predictions.length,
      player1Predictions: match.predictions.filter((p) => p.predictedWinner === 'player1').length,
      player2Predictions: match.predictions.filter((p) => p.predictedWinner === 'player2').length,
      avgConfidence:
        match.predictions.length > 0
          ? Math.round(
              (match.predictions.reduce((sum, p) => sum + p.confidence, 0) /
                match.predictions.length) *
                10000
            ) / 100
          : 0,
      models: match.predictions.map((p) => ({
        model: p.aiModel,
        predictedWinner: p.predictedWinner,
        confidence: p.confidence,
        analysis: p.analysis,
      })),
    }

    // Player history summary
    const player1History = match.player1Rel
      ? {
          name: match.player1Rel.name,
          country: match.player1Rel.country,
          wins: match.player1Rel.wins,
          losses: match.player1Rel.losses,
          winRate: match.player1Rel.winRate,
          recentForm: match.player1Rel.history
            .slice(0, 10)
            .map((h) => (h.result === 'win' ? 'W' : 'L'))
            .join(''),
        }
      : null

    const player2History = match.player2Rel
      ? {
          name: match.player2Rel.name,
          country: match.player2Rel.country,
          wins: match.player2Rel.wins,
          losses: match.player2Rel.losses,
          winRate: match.player2Rel.winRate,
          recentForm: match.player2Rel.history
            .slice(0, 10)
            .map((h) => (h.result === 'win' ? 'L' : 'W'))
            .join(''),
        }
      : null

    // AI deep analysis
    let aiAnalysis = null
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()

      const analysisPrompt = `Perform a deep analysis of this table tennis match:

Match: ${match.player1} vs ${match.player2}
League: ${match.league || 'Unknown'}
Status: ${match.status}
Score: ${match.score1}-${match.score2}

Player 1 (${match.player1}): ${player1History ? `Record: ${player1History.wins}W-${player1History.losses}L, Win Rate: ${player1History.winRate}%, Form: ${player1History.recentForm || 'N/A'}` : 'No history data'}
Player 2 (${match.player2}): ${player2History ? `Record: ${player2History.wins}W-${player2History.losses}L, Win Rate: ${player2History.winRate}%, Form: ${player2History.recentForm || 'N/A'}` : 'No history data'}

Odds: ${oddsComparison.sources.map((o) => `${o.source}: ${match.player1} @ ${o.odds1}, ${match.player2} @ ${o.odds2}`).join('; ') || 'No odds'}
Predictions: ${predictionSummary.totalPredictions} predictions, ${predictionSummary.avgConfidence}% avg confidence

Provide a concise analysis covering: key factors, value assessment, and recommended approach. Be data-driven.`

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'assistant',
            content:
              'You are a professional table tennis betting analyst. Provide deep, data-driven analysis of matches. Be concise but thorough.',
          },
          { role: 'user', content: analysisPrompt },
        ],
        thinking: { type: 'disabled' },
      })

      aiAnalysis = completion.choices?.[0]?.message?.content || null
    } catch {
      aiAnalysis = null
    }

    return NextResponse.json({
      match: {
        id: match.id,
        source: match.source,
        league: match.league,
        player1: match.player1,
        player2: match.player2,
        startTime: match.startTime,
        status: match.status,
        score1: match.score1,
        score2: match.score2,
        winner: match.winner,
      },
      oddsComparison,
      predictionSummary,
      player1History,
      player2History,
      aiAnalysis,
      betCount: match.bets.length,
    })
  } catch (error) {
    console.error('Failed to analyze match:', error)
    return NextResponse.json(
      { error: 'Failed to analyze match' },
      { status: 500 }
    )
  }
}
