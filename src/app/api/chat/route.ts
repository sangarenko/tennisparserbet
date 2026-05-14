import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { message, context } = body

  // Simulate AI chat response
  const responses = [
    "Based on current form analysis, Fan Zhendong has a 78% probability of winning today's match. His recent forehand conversion rate improved by 12% compared to last month, and he holds a 4-1 head-to-head advantage against Harimoto on indoor courts.",
    "I'd recommend a cautious bankroll approach for this card. With 3 matches available, consider spreading stakes: 40% on the highest confidence pick (Fan Zhendong at 82%), 35% on Wang Chuqin (75%), and 25% on Calderano vs Liang Jingkun which is essentially a coin flip.",
    "The current prediction model shows 73.2% average confidence across all active matches. Our ensemble approach combines statistical modeling, player form analysis, and historical pattern matching. The model accuracy has improved by 5.3% over the past week.",
    "Looking at the betting trends: Player 1 odds have shortened from 1.65 to 1.55 over the last hour, suggesting market confidence in Fan Zhendong. The Kelly Criterion suggests an optimal stake of 3.2% of your bankroll for maximum growth.",
    "Key factors for today's matches: (1) Indoor court favors aggressive playstyles, (2) Tournament fatigue may affect players in back-to-back matches, (3) Historical data shows 68% win rate for higher-ranked players in this tournament format.",
  ]

  const response = context?.includes('confidence') || context?.includes('accuracy')
    ? responses[2]
    : context?.includes('bankroll') || context?.includes('stake')
    ? responses[1]
    : context?.includes('odds') || context?.includes('market')
    ? responses[3]
    : context?.includes('factor') || context?.includes('strategy')
    ? responses[4]
    : responses[0]

  return NextResponse.json({ response })
}
