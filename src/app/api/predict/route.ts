import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { matchId } = body

  // Simulate AI prediction generation
  const predictions = [
    {
      id: 'pred_' + Date.now() + '_1',
      predictedWinner: body.predictedWinner || 'AI Prediction Winner',
      confidence: 0.65 + Math.random() * 0.30,
      reasoning: 'Analysis based on recent performance metrics, head-to-head records, playing style compatibility, and tournament conditions. The model factors in serve efficiency, rally consistency, and pressure performance.',
      predictor: 'AI Model v3',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'pred_' + Date.now() + '_2',
      predictedWinner: body.predictedWinner || 'AI Prediction Winner',
      confidence: 0.55 + Math.random() * 0.25,
      reasoning: 'Secondary model analysis focusing on form trajectory over the last 30 days, surface preference, and fatigue indicators from recent tournament schedule.',
      predictor: 'AI Model v2 (Ensemble)',
      timestamp: new Date().toISOString(),
    },
  ]

  return NextResponse.json({ matchId, predictions })
}
