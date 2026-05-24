import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
    let player1Stats = await db.player.findFirst({ where: { name: match.player1 } })
    let player2Stats = await db.player.findFirst({ where: { name: match.player2 } })
    if (!player1Stats) {
      player1Stats = await db.player.findFirst({ where: { name: { contains: match.player1.split(' ')[0] } } })
    }
    if (!player2Stats) {
      player2Stats = await db.player.findFirst({ where: { name: { contains: match.player2.split(' ')[0] } } })
    }

    const odds = match.odds[0]
    const odds1 = odds?.odds1 || 0
    const odds2 = odds?.odds2 || 0

    // 3. Build statistical prediction (always works, no LLM needed)
    let predictedWinner = match.player1
    let confidence = 0.55
    let reasoning = ''
    let keyFactors: string[] = []

    // Statistical analysis
    const p1wr = player1Stats ? player1Stats.winRate : 0.5
    const p2wr = player2Stats ? player2Stats.winRate : 0.5
    const p1wins = player1Stats?.wins || 0
    const p2wins = player2Stats?.wins || 0
    const p1losses = player1Stats?.losses || 0
    const p2losses = player2Stats?.losses || 0

    // Calculate implied probability from odds (lower odds = higher probability)
    const impliedP1 = odds1 > 0 ? (1 / odds1) : 0.5
    const impliedP2 = odds2 > 0 ? (1 / odds2) : 0.5

    // Combined score: 40% odds + 30% win rate + 20% total wins + 10% current score
    let score1 = impliedP1 * 0.4 + p1wr * 0.3 + (p1wins / Math.max(p1wins + p2wins, 1)) * 0.2
    let score2 = impliedP2 * 0.4 + p2wr * 0.3 + (p2wins / Math.max(p1wins + p2wins, 1)) * 0.2

    // Factor in current score if match is live
    if (match.status === 'live' && (match.score1 > 0 || match.score2 > 0)) {
      const scoreLead = (match.score1 - match.score2) / 5
      score1 += scoreLead * 0.1
      score2 -= scoreLead * 0.1
      keyFactors.push(`live score ${match.score1}-${match.score2}`)
    }

    if (score1 >= score2) {
      predictedWinner = match.player1
      confidence = Math.min(0.9, Math.max(0.5, score1 / (score1 + score2)))
    } else {
      predictedWinner = match.player2
      confidence = Math.min(0.9, Math.max(0.5, score2 / (score1 + score2)))
    }

    // Build reasoning
    const reasons: string[] = []
    if (odds1 > 0 && odds2 > 0) {
      reasons.push(`Odds favor ${predictedWinner} (${predictedWinner === match.player1 ? odds1 : odds2} vs ${predictedWinner === match.player1 ? odds2 : odds1})`)
      keyFactors.push('odds analysis')
    }
    if (player1Stats && player1Stats.wins > 0) {
      reasons.push(`${match.player1}: ${p1wins}W/${p1losses}L (${Math.round(p1wr * 100)}%)`)
      keyFactors.push('player form')
    }
    if (player2Stats && player2Stats.wins > 0) {
      reasons.push(`${match.player2}: ${p2wins}W/${p2losses}L (${Math.round(p2wr * 100)}%)`)
    }
    if (match.status === 'live') {
      reasons.push(`Match is live (${match.score1}-${match.score2})`)
    }
    reasoning = reasons.join('. ') + '.'

    // 4. Try LLM enhancement (optional, may fail on some servers)
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()
      const context = `Table Tennis Match Prediction Request:
Match: ${match.player1} vs ${match.player2}
League: ${match.league || 'Unknown'}
${odds ? `Odds: ${match.player1} @ ${odds1} | ${match.player2} @ ${odds2}` : 'No odds available'}
${player1Stats ? `Player 1 Stats: Wins=${p1wins}, Losses=${p1losses}, WinRate=${Math.round(p1wr * 100)}%` : 'No stats for Player 1'}
${player2Stats ? `Player 2 Stats: Wins=${p2wins}, Losses=${p2losses}, WinRate=${Math.round(p2wr * 100)}%` : 'No stats for Player 2'}

Statistical analysis suggests: ${predictedWinner} (confidence: ${Math.round(confidence * 100)}%)
Reasoning: ${reasoning}

Do you agree or disagree with this analysis? Respond in JSON: {"predictedWinner": "name", "confidence": 0.0-1.0, "reasoning": "brief analysis", "keyFactors": ["f1","f2","f3"]}`

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert table tennis analyst. Analyze the match data and statistical prediction. Respond in valid JSON only.' },
          { role: 'user', content: context }
        ],
        temperature: 0.3,
      })

      const content = completion.choices[0]?.message?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const aiResp = JSON.parse(jsonMatch[0])
        if (aiResp.predictedWinner && aiResp.confidence) {
          predictedWinner = aiResp.predictedWinner
          confidence = Math.min(Math.max(aiResp.confidence, 0.1), 0.95)
          reasoning = aiResp.reasoning || reasoning
          keyFactors = aiResp.keyFactors || keyFactors
        }
      }
    } catch (llmError) {
      // LLM unavailable - using statistical prediction (this is expected on some servers)
      console.log('LLM unavailable, using statistical prediction')
    }

    // 5. Save prediction to DB
    const prediction = await db.prediction.create({
      data: {
        matchId,
        predictedWinner,
        confidence: Math.min(Math.max(confidence, 0), 1),
        aiModel: 'AI Classic v1',
        analysis: reasoning,
      }
    })

    // 6. Return response
    return NextResponse.json({
      matchId,
      predictions: [{
        id: prediction.id,
        predictedWinner: prediction.predictedWinner,
        confidence: prediction.confidence,
        reasoning: prediction.analysis,
        predictor: 'AI Classic v1',
        timestamp: prediction.createdAt.toISOString(),
        keyFactors
      }]
    })

  } catch (error) {
    console.error('Prediction error:', error)
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    )
  }
}
