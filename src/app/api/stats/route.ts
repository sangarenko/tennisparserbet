import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    totalMatches: 156,
    correctPredictions: 112,
    avgConfidence: 0.73,
    winRate: 71.8,
    totalBets: 48,
    totalProfit: 324.50,
  })
}
