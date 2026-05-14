import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { result } = body

    if (!result || !['win', 'loss', 'void'].includes(result)) {
      return NextResponse.json(
        { error: 'result must be "win", "loss", or "void"' },
        { status: 400 }
      )
    }

    const bet = await db.bet.findUnique({
      where: { id },
      include: { match: true },
    })

    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
    }

    let payout = 0
    let isWin: boolean | null = null

    if (result === 'win') {
      payout = bet.potentialWin
      isWin = true
    } else if (result === 'loss') {
      payout = 0
      isWin = false
    } else if (result === 'void') {
      payout = bet.stake
      isWin = null
    }

    const settledBet = await db.bet.update({
      where: { id },
      data: {
        result,
        isWin,
        payout,
        settledAt: new Date(),
      },
    })

    return NextResponse.json({ bet: settledBet })
  } catch (error) {
    console.error('Failed to settle bet:', error)
    return NextResponse.json(
      { error: 'Failed to settle bet' },
      { status: 500 }
    )
  }
}
