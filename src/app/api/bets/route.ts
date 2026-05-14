import { NextResponse } from 'next/server'

export async function GET() {
  const bets = [
    { id: 'b1', matchId: 'm5', predictedWinner: 'Jun Mizutani', odds: 1.65, stake: 50, status: 'won', result: 'correct', profit: 32.50 },
    { id: 'b2', matchId: 'm7', predictedWinner: 'Koki Niwa', odds: 1.35, stake: 100, status: 'won', result: 'correct', profit: 35.00 },
    { id: 'b3', matchId: 'm4', predictedWinner: 'Hugo Calderano', odds: 1.90, stake: 30, status: 'pending', result: null, profit: 0 },
    { id: 'b4', matchId: 'm1', predictedWinner: 'Fan Zhendong', odds: 1.55, stake: 75, status: 'pending', result: null, profit: 0 },
    { id: 'b5', matchId: 'm3', predictedWinner: 'Wang Chuqin', odds: 1.40, stake: 60, status: 'pending', result: null, profit: 0 },
    { id: 'b6', matchId: 'm2', predictedWinner: 'Lin Gaoyuan', odds: 1.75, stake: 40, status: 'lost', result: 'wrong', profit: -40.00 },
  ]
  return NextResponse.json(bets)
}

export async function POST(request: Request) {
  const body = await request.json()
  const bet = {
    id: 'b' + Date.now(),
    matchId: body.matchId,
    predictedWinner: body.predictedWinner,
    odds: body.odds,
    stake: body.stake,
    status: 'pending',
    result: null,
    profit: 0,
  }
  return NextResponse.json(bet)
}
