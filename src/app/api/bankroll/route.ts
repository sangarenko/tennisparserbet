import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    let bankroll = await db.bankroll.findFirst()
    if (!bankroll) {
      bankroll = await db.bankroll.create({
        data: { currentAmount: 5000, initialAmount: 5000, updatedAt: new Date() },
      })
    }

    const entries = await db.bankrollEntry.findMany({
      where: { bankrollId: bankroll.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const bets = await db.bet.findMany({ include: { match: true } })
    const wonBets = bets.filter((b) => b.isWin === true)
    const lostBets = bets.filter((b) => b.isWin === false && b.settledAt)
    const totalProfit =
      wonBets.reduce((s, b) => s + (b.payout - b.stake), 0) -
      lostBets.reduce((s, b) => s + b.stake, 0)
    const settledCount = wonBets.length + lostBets.length

    return NextResponse.json({
      id: bankroll.id,
      currentAmount: bankroll.currentAmount,
      initialAmount: bankroll.initialAmount,
      strategy: bankroll.strategy,
      riskLevel: bankroll.riskLevel,
      flatAmount: bankroll.flatAmount,
      percentage: bankroll.percentage,
      kellyFraction: bankroll.kellyFraction,
      stopLoss: bankroll.stopLoss,
      takeProfit: bankroll.takeProfit,
      peakAmount: bankroll.peakAmount,
      maxDrawdown: bankroll.maxDrawdown,
      totalDeposits: bankroll.totalDeposits,
      totalWithdrawals: bankroll.totalWithdrawals,
      totalBets: bets.length,
      wonBets: wonBets.length,
      lostBets: lostBets.length,
      totalProfit,
      winRate:
        settledCount > 0
          ? Math.round((wonBets.length / settledCount) * 10000) / 100
          : 0,
      entries: entries.map((e) => ({
        id: e.id,
        type: e.type,
        amount: e.amount,
        balance: e.balance,
        description: e.description,
        createdAt: e.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Failed to fetch bankroll:', error)
    return NextResponse.json({ error: 'Failed to fetch bankroll' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, amount, strategy, riskLevel, flatAmount, percentage, kellyFraction, stopLoss, takeProfit } = body

    let bankroll = await db.bankroll.findFirst()
    if (!bankroll) {
      bankroll = await db.bankroll.create({
        data: { currentAmount: 5000, initialAmount: 5000, updatedAt: new Date() },
      })
    }

    if (action === 'deposit') {
      const amt = Number(amount) || 0
      if (amt <= 0) {
        return NextResponse.json({ error: 'Invalid deposit amount' }, { status: 400 })
      }
      const newAmount = bankroll.currentAmount + amt
      const updated = await db.bankroll.update({
        where: { id: bankroll.id },
        data: {
          currentAmount: newAmount,
          totalDeposits: { increment: amt },
          peakAmount: Math.max(bankroll.peakAmount, newAmount),
          updatedAt: new Date(),
        },
      })
      await db.bankrollEntry.create({
        data: {
          bankrollId: bankroll.id,
          type: 'deposit',
          amount: amt,
          balance: newAmount,
          description: `Deposit ₽${amt}`,
        },
      })
      return NextResponse.json({ success: true, currentAmount: updated.currentAmount })

    } else if (action === 'withdraw') {
      const amt = Number(amount) || 0
      if (amt <= 0 || amt > bankroll.currentAmount) {
        return NextResponse.json({ error: 'Invalid withdrawal amount' }, { status: 400 })
      }
      const newAmount = bankroll.currentAmount - amt
      const drawdown = bankroll.peakAmount - newAmount
      const updated = await db.bankroll.update({
        where: { id: bankroll.id },
        data: {
          currentAmount: newAmount,
          totalWithdrawals: { increment: amt },
          maxDrawdown: Math.max(bankroll.maxDrawdown, drawdown),
          updatedAt: new Date(),
        },
      })
      await db.bankrollEntry.create({
        data: {
          bankrollId: bankroll.id,
          type: 'withdrawal',
          amount: -amt,
          balance: newAmount,
          description: `Withdrawal ₽${amt}`,
        },
      })
      return NextResponse.json({ success: true, currentAmount: updated.currentAmount })

    } else if (action === 'update_settings') {
      const updated = await db.bankroll.update({
        where: { id: bankroll.id },
        data: {
          ...(strategy !== undefined && { strategy }),
          ...(riskLevel !== undefined && { riskLevel }),
          ...(flatAmount !== undefined && { flatAmount: Number(flatAmount) }),
          ...(percentage !== undefined && { percentage: Number(percentage) }),
          ...(kellyFraction !== undefined && { kellyFraction: Number(kellyFraction) }),
          ...(stopLoss !== undefined && { stopLoss: Number(stopLoss) }),
          ...(takeProfit !== undefined && { takeProfit: Number(takeProfit) }),
          updatedAt: new Date(),
        },
      })
      return NextResponse.json({ success: true, bankroll: updated })

    } else if (action === 'reset') {
      const amt = Number(amount) || 5000
      const updated = await db.bankroll.update({
        where: { id: bankroll.id },
        data: {
          currentAmount: amt,
          initialAmount: amt,
          peakAmount: amt,
          maxDrawdown: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          updatedAt: new Date(),
        },
      })
      await db.bankrollEntry.create({
        data: {
          bankrollId: bankroll.id,
          type: 'reset',
          amount: amt,
          balance: amt,
          description: `Bankroll reset to ₽${amt}`,
        },
      })
      return NextResponse.json({ success: true, currentAmount: updated.currentAmount })

    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Failed to update bankroll:', error)
    return NextResponse.json({ error: 'Failed to update bankroll' }, { status: 500 })
  }
}
