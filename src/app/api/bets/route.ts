import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const bets = await db.bet.findMany({
      orderBy: { createdAt: 'desc' },
      include: { match: true },
      take: 100,
    })

    const result = bets.map((bet) => ({
      id: bet.id,
      matchId: bet.matchId,
      predictedWinner: bet.predictedWinner,
      odds: bet.odds,
      stake: bet.stake,
      potentialWin: bet.potentialWin,
      result: bet.result,
      isWin: bet.isWin,
      payout: bet.payout,
      status: bet.settledAt
        ? bet.isWin
          ? 'won'
          : 'lost'
        : 'pending',
      profit: bet.isWin
        ? bet.payout - bet.stake
        : bet.settledAt
          ? -bet.stake
          : 0,
      createdAt: bet.createdAt.toISOString(),
      match: bet.match
        ? {
            player1: bet.match.player1,
            player2: bet.match.player2,
          }
        : undefined,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch bets:', error)
    return NextResponse.json({ error: 'Failed to fetch bets' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { matchId, predictedWinner, odds, stake } = body

    if (!matchId || !predictedWinner || !stake) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const bet = await db.bet.create({
      data: {
        matchId,
        predictedWinner,
        odds: odds || 0,
        stake,
        potentialWin: (odds || 0) * stake,
      },
    })

    // Update bankroll
    const bankroll = await db.bankroll.findFirst()
    if (bankroll) {
      const newAmount = bankroll.currentAmount - stake
      await db.bankroll.update({
        where: { id: bankroll.id },
        data: {
          currentAmount: newAmount,
          totalDeposits: { decrement: stake },
          updatedAt: new Date(),
        },
      })
      await db.bankrollEntry.create({
        data: {
          bankrollId: bankroll.id,
          type: 'bet',
          amount: -stake,
          balance: newAmount,
          description: `Bet on ${predictedWinner}`,
          matchId,
        },
      })
    }

    return NextResponse.json(bet, { status: 201 })
  } catch (error) {
    console.error('Failed to create bet:', error)
    return NextResponse.json({ error: 'Failed to create bet' }, { status: 500 })
  }
}
