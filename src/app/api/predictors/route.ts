import { NextResponse } from 'next/server'

export async function GET() {
  const predictors = [
    { id: 'pr1', name: 'TT_Analyst_Pro', platform: 'Telegram', tier: 'S', accuracy: 89.2, totalPredictions: 245, verified: true },
    { id: 'pr2', name: 'PingPongOracle', platform: 'Twitter', tier: 'S', accuracy: 86.5, totalPredictions: 312, verified: true },
    { id: 'pr3', name: 'TableTennisGuru', platform: 'Discord', tier: 'A', accuracy: 78.3, totalPredictions: 189, verified: true },
    { id: 'pr4', name: 'SpinMaster_Bets', platform: 'Telegram', tier: 'A', accuracy: 74.8, totalPredictions: 156, verified: false },
    { id: 'pr5', name: 'MatchPointAI', platform: 'Twitter', tier: 'B', accuracy: 68.1, totalPredictions: 98, verified: true },
    { id: 'pr6', name: 'ChopBlockKing', platform: 'Discord', tier: 'B', accuracy: 65.4, totalPredictions: 72, verified: false },
    { id: 'pr7', name: 'TopSpinTips', platform: 'Telegram', tier: 'C', accuracy: 58.7, totalPredictions: 45, verified: false },
    { id: 'pr8', name: 'BackhandWizard', platform: 'Twitter', tier: 'C', accuracy: 55.2, totalPredictions: 38, verified: false },
    { id: 'pr9', name: 'ServeAndVolley', platform: 'Discord', tier: 'D', accuracy: 48.9, totalPredictions: 22, verified: false },
    { id: 'pr10', name: 'RallyRocket', platform: 'Telegram', tier: 'D', accuracy: 42.1, totalPredictions: 15, verified: false },
  ]
  return NextResponse.json(predictors)
}
