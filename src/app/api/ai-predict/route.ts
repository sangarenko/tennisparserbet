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

    const match = await db.match.findUnique({
      where: { id: matchId },
      include: { odds: true }
    })
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const odds = match.odds[0]
    const player1Stats = await db.player.findFirst({
      where: { name: { contains: match.player1.split(' ')[0] } }
    })
    const player2Stats = await db.player.findFirst({
      where: { name: { contains: match.player2.split(' ')[0] } }
    })

    const context = `You are an AI analyst that uses BOTH statistical data AND news/context analysis for predictions.

Match: ${match.player1} vs ${match.player2}
League: ${match.league || 'Unknown'}
${odds ? `Odds: ${match.player1} @ ${odds.odds1} | ${match.player2} @ ${odds.odds2}` : 'No odds available'}
${player1Stats ? `Player 1: Wins=${player1Stats.wins}, Losses=${player1Stats.losses}, WinRate=${Math.round(player1Stats.winRate * 100)}%` : ''}
${player2Stats ? `Player 2: Wins=${player2Stats.wins}, Losses=${player2Stats.losses}, WinRate=${Math.round(player2Stats.winRate * 100)}%` : ''}

Simulate having access to recent news and social media sentiment. Consider:
1. Recent form and momentum
2. Possible injuries or fatigue
3. Tournament importance and motivation
4. Playing style matchups
5. Historical performance in similar conditions

Respond in JSON: {"predictedWinner": "name", "confidence": 0.0-1.0, "reasoning": "2-3 sentences", "newsDigest": "Summary of simulated news context", "keyFactors": ["factor1","factor2","factor3"]}`

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are RAG+ AI analyst for table tennis. Combine statistical analysis with contextual/news insights. Always respond in valid JSON.' },
        { role: 'user', content: context }
      ],
      temperature: 0.4,
    })

    let aiResponse: {
      predictedWinner: string
      confidence: number
      reasoning: string
      newsDigest: string
      keyFactors: string[]
    }
    try {
      const content = completion.choices[0]?.message?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0])
      } else {
        aiResponse = {
          predictedWinner: match.player1,
          confidence: 0.55,
          reasoning: content.substring(0, 300),
          newsDigest: 'No additional context',
          keyFactors: ['stats', 'odds']
        }
      }
    } catch {
      aiResponse = {
        predictedWinner: match.player1,
        confidence: 0.55,
        reasoning: 'Analysis unavailable',
        newsDigest: '',
        keyFactors: []
      }
    }

    // Save as AiBet
    const betOdds = aiResponse.predictedWinner === match.player1
      ? (odds?.odds1 || 0)
      : (odds?.odds2 || 0)
    const stake = 50
    const potentialWin = betOdds > 0 ? Math.round(stake * betOdds) : 0

    const aiBet = await db.aiBet.create({
      data: {
        matchId,
        player1: match.player1,
        player2: match.player2,
        predictedWinner: aiResponse.predictedWinner || match.player1,
        confidence: Math.min(Math.max(aiResponse.confidence || 0.5, 0), 1),
        valueRating: Math.round((aiResponse.confidence || 0.5) * 10),
        odds: betOdds,
        stake,
        potentialWin,
        profit: 0,
        status: 'pending',
        reasoning: aiResponse.reasoning || '',
        newsDigest: aiResponse.newsDigest || '',
        keyFactors: JSON.stringify(aiResponse.keyFactors || []),
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
      keyFactors: aiResponse.keyFactors || [],
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
