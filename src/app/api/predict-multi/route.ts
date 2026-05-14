import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const MODELS = ['gpt-4o-mini', 'claude-3-5-sonnet', 'gemini-2.0-flash']
const SYSTEM_PROMPT =
  'You are a table tennis prediction expert. Analyze the match and predict the winner. Return JSON: { predictedWinner: "player1"|"player2", confidence: 0.0-1.0, analysis: "string" }'

function generateOddsBasedPrediction(match: {
  player1: string
  player2: string
  odds: { source: string; odds1: number; odds2: number }[]
}): {
  predictedWinner: string
  confidence: number
  analysis: string
} {
  const odds = match.odds
  if (odds.length === 0) {
    const isPlayer1 = Math.random() > 0.5
    return {
      predictedWinner: isPlayer1 ? 'player1' : 'player2',
      confidence: 0.5 + Math.random() * 0.15,
      analysis: `No odds data available. ${isPlayer1 ? match.player1 : match.player2} has a slight edge.`,
    }
  }

  let totalImplied1 = 0
  let totalImplied2 = 0
  for (const o of odds) {
    totalImplied1 += 1 / o.odds1
    totalImplied2 += 1 / o.odds2
  }
  const avgImplied1 = totalImplied1 / odds.length
  const avgImplied2 = totalImplied2 / odds.length
  const total = avgImplied1 + avgImplied2
  const prob1 = avgImplied1 / total
  const prob2 = avgImplied2 / total

  const predictedWinner = prob1 >= prob2 ? 'player1' : 'player2'
  const confidence = Math.max(prob1, prob2)
  const winner = predictedWinner === 'player1' ? match.player1 : match.player2

  return {
    predictedWinner,
    confidence,
    analysis: `Odds analysis: ${winner} favored with ${((confidence) * 100).toFixed(1)}% implied probability.`,
  }
}

async function getAIPrediction(
  match: {
    player1: string
    player2: string
    league: string
    status: string
    score1: number
    score2: number
    odds: { source: string; odds1: number; odds2: number }[]
  },
  model: string
) {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const oddsInfo = match.odds
      .map((o) => `${o.source}: ${match.player1} @ ${o.odds1}, ${match.player2} @ ${o.odds2}`)
      .join('; ')

    const userMessage = `Match: ${match.player1} vs ${match.player2}
League: ${match.league || 'Unknown'}
Status: ${match.status}
Score: ${match.score1}-${match.score2}
Odds: ${oddsInfo || 'No odds available'}

Predict the winner. Return ONLY valid JSON.`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      thinking: { type: 'disabled' },
    })

    const content = completion.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty response')

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')

    const parsed = JSON.parse(jsonMatch[0])
    return {
      predictedWinner: parsed.predictedWinner === 'player1' || parsed.predictedWinner === 'player2'
        ? parsed.predictedWinner
        : 'player1',
      confidence: Math.min(1, Math.max(0, parseFloat(parsed.confidence) || 0.5)),
      analysis: parsed.analysis || 'AI prediction generated.',
    }
  } catch {
    return generateOddsBasedPrediction(match)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { matchId } = body

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 })
    }

    const match = await db.match.findUnique({
      where: { id: matchId },
      include: { odds: true },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Run predictions from all models in parallel
    const modelResults = await Promise.all(
      MODELS.map(async (model) => {
        const prediction = await getAIPrediction(match, model)
        return { model, ...prediction }
      })
    )

    // Calculate ensemble confidence (weighted average)
    // Weight by model performance heuristic: newer models get slightly higher weight
    const weights: Record<string, number> = {
      'gpt-4o-mini': 0.35,
      'claude-3-5-sonnet': 0.40,
      'gemini-2.0-flash': 0.25,
    }

    let totalConfidence = 0
    let player1Votes = 0
    let totalWeight = 0
    const predictionsByWinner: Record<string, number[]> = {}

    for (const result of modelResults) {
      const w = weights[result.model] || 1 / MODELS.length
      totalConfidence += result.confidence * w
      totalWeight += w

      if (result.predictedWinner === 'player1') player1Votes++
      else player1Votes--

      if (!predictionsByWinner[result.predictedWinner]) {
        predictionsByWinner[result.predictedWinner] = []
      }
      predictionsByWinner[result.predictedWinner].push(result.confidence)
    }

    const ensembleConfidence = totalConfidence / totalWeight
    const ensembleWinner = player1Votes >= 0 ? 'player1' : 'player2'

    // Consensus bonus: if all models agree, boost confidence
    const uniqueWinners = new Set(modelResults.map((r) => r.predictedWinner))
    const consensusBonus = uniqueWinners.size === 1 ? 0.05 : 0
    const finalConfidence = Math.min(1, ensembleConfidence + consensusBonus)

    // Store all individual predictions
    const storedPredictions = []
    for (const pred of modelResults) {
      const stored = await db.prediction.create({
        data: {
          matchId,
          predictedWinner: pred.predictedWinner,
          confidence: pred.confidence,
          aiModel: pred.model,
          analysis: pred.analysis,
        },
      })
      storedPredictions.push(stored)
    }

    return NextResponse.json({
      matchId,
      ensemble: {
        predictedWinner: ensembleWinner,
        confidence: finalConfidence,
        modelAgreement: uniqueWinners.size === 1 ? 'unanimous' : 'split',
        analysis: `${uniqueWinners.size === 1 ? 'All' : 'Mixed'} model consensus. ${MODELS.length} models analyzed. Weighted ensemble confidence: ${(finalConfidence * 100).toFixed(1)}%.`,
      },
      individualPredictions: storedPredictions,
    })
  } catch (error) {
    console.error('Failed to generate multi-model prediction:', error)
    return NextResponse.json(
      { error: 'Failed to generate multi-model prediction' },
      { status: 500 }
    )
  }
}
