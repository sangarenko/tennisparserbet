import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    let bankroll = await db.aiBankroll.findFirst()

    if (!bankroll) {
      bankroll = await db.aiBankroll.create({
        data: {
          initialAmount: 5000,
          currentAmount: 5000,
          peakAmount: 5000,
          updatedAt: new Date(),
        },
      })
    }

    // Calculate total profit from settled bets
    const betAgg = await db.aiBet.aggregate({
      _sum: { profit: true },
      _count: true,
      where: { status: { in: ['won', 'lost'] } },
    })
    const totalProfit = betAgg._sum.profit ?? 0

    const wonCount = await db.aiBet.count({ where: { status: 'won' } })
    const lostCount = await db.aiBet.count({ where: { status: 'lost' } })
    const pendingCount = await db.aiBet.count({ where: { status: 'pending' } })
    const totalBetsCount = wonCount + lostCount

    const winRate = totalBetsCount > 0 ? (wonCount / totalBetsCount) * 100 : 0

    return NextResponse.json({
      id: bankroll.id,
      currentAmount: bankroll.currentAmount,
      initialAmount: bankroll.initialAmount,
      peakAmount: bankroll.peakAmount,
      maxDrawdown: bankroll.maxDrawdown,
      totalBets: bankroll.totalBets,
      wonBets: bankroll.wonBets,
      lostBets: bankroll.lostBets,
      pendingBets: pendingCount,
      totalProfit,
      winRate: Math.round(winRate * 100) / 100,
      flatAmount: bankroll.flatAmount,
    })
  } catch (error) {
    console.error('Failed to fetch AI bankroll:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI bankroll' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount } = body

    const resetAmount = typeof amount === 'number' && amount > 0 && Number.isFinite(amount) ? amount : 5000

    // Delete all AI bets
    await db.aiBet.deleteMany()

    // Reset bankroll
    const bankroll = await db.aiBankroll.findFirst()

    if (bankroll) {
      const updated = await db.aiBankroll.update({
        where: { id: bankroll.id },
        data: {
          currentAmount: resetAmount,
          initialAmount: resetAmount,
          peakAmount: resetAmount,
          maxDrawdown: 0,
          totalBets: 0,
          wonBets: 0,
          lostBets: 0,
          pendingBets: 0,
        },
      })
      return NextResponse.json({ success: true, currentAmount: updated.currentAmount })
    }

    const created = await db.aiBankroll.create({
      data: {
        initialAmount: resetAmount,
        currentAmount: resetAmount,
        peakAmount: resetAmount,
      },
    })
    return NextResponse.json({ success: true, currentAmount: created.currentAmount }, { status: 201 })
  } catch (error) {
    console.error('Failed to reset AI bankroll:', error)
    return NextResponse.json(
      { error: 'Failed to reset AI bankroll' },
      { status: 500 }
    )
  }
}
