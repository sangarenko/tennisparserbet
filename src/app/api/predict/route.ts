import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { matchId } = body

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 })
    }

    // 1. Get match with odds
    const match = await db.match.findUnique({
      where: { id: matchId },
      include: { odds: true, predictions: true }
    })
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // 2. Get player stats and history
    const player1History = await db.playerHistory.findMany({
      where: { opponent: match.player2 },
      take: 10,
      orderBy: { date: 'desc' }
    })
    const player2History = await db.playerHistory.findMany({
      where: { opponent: match.player1 },
      take: 10,
      orderBy: { date: 'desc' }
    })

    let player1Stats = await db.player.findFirst({ where: { name: match.player1 } })
    let player2Stats = await db.player.findFirst({ where: { name: match.player2 } })

    // Fallback: search by first name / contains
    if (!player1Stats) {
      player1Stats = await db.player.findFirst({ where: { name: { contains: match.player1.split(' ')[0] } } })
    }
    if (!player2Stats) {
      player2Stats = await db.player.findFirst({ where: { name: { contains: match.player2.split(' ')[0] } } })
    }

    // 3. Get recent predictions for this match's players
    const recentPredictions = await db.prediction.findMany({
      where: {
        match: {
          OR: [
            { player1: match.player1 },
            { player2: match.player1 },
            { player1: match.player2 },
            { player2: match.player2 }
          ]
        }
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    })

    // 4. Build context for LLM
    const odds = match.odds[0]
    const context = `Table Tennis Match Prediction Request:
Match: ${match.player1} vs ${match.player2}
League/Tournament: ${match.league || 'Unknown'}
Status: ${match.status}
${match.score1 !== 0 || match.score2 !== 0 ? `Current Score: ${match.score1}-${match.score2}` : ''}
${odds ? `Odds: ${match.player1} @ ${odds.odds1} | ${match.player2} @ ${odds.odds2}${odds.totalOver ? ` | Total Over: ${odds.totalOver}` : ''}` : ''}
${player1Stats ? `Player 1 (${match.player1}) Stats: Wins=${player1Stats.wins}, Losses=${player1Stats.losses}, WinRate=${Math.round(player1Stats.winRate * 100)}%${player1Stats.country ? ', Country=' + player1Stats.country : ''}` : 'No stats for Player 1'}
${player2Stats ? `Player 2 (${match.player2}) Stats: Wins=${player2Stats.wins}, Losses=${player2Stats.losses}, WinRate=${Math.round(player2Stats.winRate * 100)}%${player2Stats.country ? ', Country=' + player2Stats.country : ''}` : 'No stats for Player 2'}
${player1History.length > 0 ? `Head-to-Head (Player 1 vs Player 2): ${player1History.map(h => h.result + ' ' + (h.score || '')).join(', ')}` : 'No H2H data'}
${recentPredictions.length > 0 ? `Previous AI predictions accuracy for these players: ${recentPredictions.filter(p => p.isCorrect).length}/${recentPredictions.length} correct` : ''}

Analyze this match and provide your prediction. Respond in JSON format:
{"predictedWinner": "Player Name", "confidence": 0.0-1.0, "reasoning": "Detailed analysis in 2-3 sentences", "keyFactors": ["factor1", "factor2", "factor3"]}`

    // 5. Call LLM
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an expert table tennis analyst and betting advisor. You analyze player statistics, head-to-head records, odds, and form to make predictions. Always respond in valid JSON format. Be concise but insightful.' },
        { role: 'user', content: context }
      ],
      temperature: 0.3,
    })

    // 6. Parse response
    let aiResponse: {
      predictedWinner: string
      confidence: number
      reasoning: string
      keyFactors: string[]
    }
    try {
      const content = completion.choices[0]?.message?.content || ''
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0])
      } else {
        // Fallback: use the text as reasoning with a reasonable prediction
        aiResponse = {
          predictedWinner: (odds && odds.odds1 < odds.odds2) ? match.player1 : match.player2,
          confidence: 0.6,
          reasoning: content.substring(0, 300),
          keyFactors: ['odds analysis', 'AI assessment']
        }
      }
    } catch {
      aiResponse = {
        predictedWinner: match.player1,
        confidence: 0.55,
        reasoning: 'AI analysis unavailable - default prediction based on available data.',
        keyFactors: ['default']
      }
    }

    // 7. Save prediction to DB
    const prediction = await db.prediction.create({
      data: {
        matchId,
        predictedWinner: aiResponse.predictedWinner || match.player1,
        confidence: Math.min(Math.max(aiResponse.confidence || 0.5, 0), 1),
        aiModel: 'AI Classic v1',
        analysis: aiResponse.reasoning || '',
      }
    })

    // 8. Return response
    const predictions = [{
      id: prediction.id,
      predictedWinner: prediction.predictedWinner,
      confidence: prediction.confidence,
      reasoning: prediction.analysis,
      predictor: 'AI Classic v1',
      timestamp: prediction.createdAt.toISOString(),
      keyFactors: aiResponse.keyFactors || []
    }]

    return NextResponse.json({ matchId, predictions })

  } catch (error) {
    console.error('Prediction error:', error)
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    )
  }
}
