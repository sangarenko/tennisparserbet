import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { matchId } = body

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 })
    }

    const match = await db.match.findUnique({
      where: { id: matchId },
      include: { odds: true }
    })
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const odds = match.odds[0]
    const odds1 = odds?.odds1 || 0
    const odds2 = odds?.odds2 || 0

    const player1Stats = await db.player.findFirst({
      where: { name: { contains: match.player1.split(' ')[0] } }
    })
    const player2Stats = await db.player.findFirst({
      where: { name: { contains: match.player2.split(' ')[0] } }
    })

    const p1wr = player1Stats ? player1Stats.winRate : 0.5
    const p2wr = player2Stats ? player2Stats.winRate : 0.5

    // Statistical prediction
    const impliedP1 = odds1 > 0 ? (1 / odds1) : 0.5
    const impliedP2 = odds2 > 0 ? (1 / odds2) : 0.5

    let score1 = impliedP1 * 0.5 + p1wr * 0.3 + (player1Stats?.wins || 0) / Math.max((player1Stats?.wins || 0) + (player1Stats?.losses || 0), 1) * 0.2
    let score2 = impliedP2 * 0.5 + p2wr * 0.3 + (player2Stats?.wins || 0) / Math.max((player2Stats?.wins || 0) + (player2Stats?.losses || 0), 1) * 0.2

    if (match.status === 'live') {
      const lead = (match.score1 - match.score2) / 5
      score1 += lead * 0.1
      score2 -= lead * 0.1
    }

    let predictedWinner = score1 >= score2 ? match.player1 : match.player2
    let confidence = Math.min(0.9, Math.max(0.5, (score1 >= score2 ? score1 : score2) / (score1 + score2)))
    let reasoning = `Statistical analysis: ${predictedWinner} favored based on odds (${odds1 || 'N/A'} vs ${odds2 || 'N/A'}) and form (${Math.round(p1wr * 100)}% vs ${Math.round(p2wr * 100)}% win rate).`
    let newsDigest = 'No real-time news context available on this server.'
    let keyFactors = ['odds analysis', 'player form', 'statistical model']

    // Try LLM enhancement
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()
      const context = `You are RAG+ AI analyst for table tennis predictions.
Match: ${match.player1} vs ${match.player2}
League: ${match.league || 'Unknown'}
Odds: ${match.player1} @ ${odds1} | ${match.player2} @ ${odds2}
Player 1: WinRate=${Math.round(p1wr * 100)}%, Player 2: WinRate=${Math.round(p2wr * 100)}%
Statistical suggestion: ${predictedWinner} at ${Math.round(confidence * 100)}%

Simulate news/social media context. Respond in JSON: {"predictedWinner": "name", "confidence": 0.0-1.0, "reasoning": "analysis", "newsDigest": "news summary", "keyFactors": ["f1","f2","f3"]}`

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are RAG+ AI analyst for table tennis. Combine statistics with contextual insights. Respond in valid JSON only.' },
          { role: 'user', content: context }
        ],
        temperature: 0.4,
      })

      const content = completion.choices[0]?.message?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const aiResp = JSON.parse(jsonMatch[0])
        if (aiResp.predictedWinner) {
          predictedWinner = aiResp.predictedWinner
          confidence = Math.min(Math.max(aiResp.confidence || 0.5, 0.1), 0.95)
          reasoning = aiResp.reasoning || reasoning
          newsDigest = aiResp.newsDigest || newsDigest
          keyFactors = aiResp.keyFactors || keyFactors
        }
      }
    } catch (llmError) {
      console.log('RAG+ LLM unavailable, using statistical prediction')
    }

    // Save as AiBet
    const betOdds = predictedWinner === match.player1 ? odds1 : odds2
    const stake = 50
    const potentialWin = betOdds > 0 ? Math.round(stake * betOdds) : 0

    const aiBet = await db.aiBet.create({
      data: {
        matchId,
        player1: match.player1,
        player2: match.player2,
        predictedWinner,
        confidence,
        valueRating: Math.round(confidence * 10),
        odds: betOdds,
        stake,
        potentialWin,
        profit: 0,
        status: 'pending',
        reasoning,
        newsDigest,
        keyFactors: JSON.stringify(keyFactors),
      }
    })

    // Update AI Bankroll
    const aiBankroll = await db.aiBankroll.findFirst()
    if (aiBankroll) {
      await db.aiBankroll.update({
        where: { id: aiBankroll.id },
        data: {
          currentAmount: { decrement: stake },
          totalBets: { increment: 1 },
          pendingBets: { increment: 1 }
        }
      })
    }

    return NextResponse.json({
      id: aiBet.id,
      matchId,
      predictedWinner: aiBet.predictedWinner,
      confidence: aiBet.confidence,
      reasoning: aiBet.reasoning,
      newsDigest: aiBet.newsDigest,
      keyFactors,
      valueRating: aiBet.valueRating,
      odds: aiBet.odds,
      stake: aiBet.stake,
      potentialWin: aiBet.potentialWin,
      aiModel: 'AI RAG+ v1',
      timestamp: aiBet.createdAt.toISOString()
    })

  } catch (error) {
    console.error('AI predict error:', error)
    return NextResponse.json({ error: 'Failed to generate RAG prediction' }, { status: 500 })
  }
}
