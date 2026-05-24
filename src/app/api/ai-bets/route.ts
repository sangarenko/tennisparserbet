import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const bets = await db.aiBet.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const mapped = bets.map((b) => ({
      id: b.id,
      matchId: b.matchId,
      player1: b.player1,
      player2: b.player2,
      predictedWinner: b.predictedWinner,
      confidence: b.confidence,
      valueRating: b.valueRating,
      odds: b.odds,
      stake: b.stake,
      potentialWin: b.potentialWin,
      profit: b.profit,
      status: b.status,
      reasoning: b.reasoning,
      newsDigest: b.newsDigest,
      keyFactors: b.keyFactors,
      createdAt: b.createdAt.toISOString(),
      settledAt: b.settledAt?.toISOString() ?? null,
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    console.error('Failed to fetch AI bets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI bets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      matchId,
      player1,
      player2,
      predictedWinner,
      confidence,
      valueRating,
      odds,
      stake,
      reasoning,
      newsDigest,
      keyFactors,
    } = body

    if (!matchId || !predictedWinner) {
      return NextResponse.json(
        { error: 'matchId and predictedWinner are required' },
        { status: 400 }
      )
    }

    const potentialWin = (odds && stake) ? odds * stake : 0

    const bet = await db.aiBet.create({
      data: {
        matchId,
        player1: player1 || '',
        player2: player2 || '',
        predictedWinner,
        confidence: confidence ?? 0.5,
        valueRating: valueRating ?? 5,
        odds: odds ?? 0,
        stake: stake ?? 50,
        potentialWin,
        reasoning: reasoning || '',
        newsDigest: newsDigest || '',
        keyFactors: JSON.stringify(keyFactors || []),
      },
    })

    // Update AI bankroll: decrement stake
    const bankroll = await db.aiBankroll.findFirst()
    if (bankroll && stake > 0) {
      const newAmount = Math.max(0, bankroll.currentAmount - stake)
      await db.aiBankroll.update({
        where: { id: bankroll.id },
        data: {
          currentAmount: newAmount,
          totalBets: { increment: 1 },
          pendingBets: { increment: 1 },
        },
      })
    }

    return NextResponse.json({
      id: bet.id,
      ...bet,
      createdAt: bet.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create AI bet:', error)
    return NextResponse.json(
      { error: 'Failed to create AI bet' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { betId, won } = body

    if (!betId || typeof won !== 'boolean') {
      return NextResponse.json(
        { error: 'betId and won (boolean) are required' },
        { status: 400 }
      )
    }

    const bet = await db.aiBet.findUnique({ where: { id: betId } })
    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
    }

    if (bet.status !== 'pending') {
      return NextResponse.json({ error: 'Bet already settled' }, { status: 400 })
    }

    const profit = won ? bet.potentialWin - bet.stake : -bet.stake
    const status = won ? 'won' : 'lost'

    const updated = await db.aiBet.update({
      where: { id: betId },
      data: {
        status,
        profit,
        settledAt: new Date(),
      },
    })

    // Update AI bankroll
    const bankroll = await db.aiBankroll.findFirst()
    if (bankroll) {
      const newAmount = Math.max(0, bankroll.currentAmount + (won ? bet.potentialWin : 0))
      const peakAmount = Math.max(bankroll.peakAmount, newAmount)
      const drawdown = bankroll.peakAmount - newAmount
      const maxDrawdown = Math.max(bankroll.maxDrawdown, drawdown)

      await db.aiBankroll.update({
        where: { id: bankroll.id },
        data: {
          currentAmount: newAmount,
          peakAmount,
          maxDrawdown,
          pendingBets: { decrement: 1 },
          ...(won ? { wonBets: { increment: 1 } } : { lostBets: { increment: 1 } }),
        },
      })
    }

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      profit,
    })
  } catch (error) {
    console.error('Failed to settle AI bet:', error)
    return NextResponse.json(
      { error: 'Failed to settle AI bet' },
      { status: 500 }
    )
  }
}
