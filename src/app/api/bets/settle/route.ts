import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Settle a specific bet
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { betId, result } = body;

    if (!betId || !result) {
      return NextResponse.json({ error: 'Missing betId or result' }, { status: 400 });
    }

    const bet = await db.bet.findUnique({ where: { id: betId } });
    if (!bet) return NextResponse.json({ error: 'Bet not found' }, { status: 404 });

    let payout = 0;
    if (result === 'won') payout = Math.round(bet.stake * bet.odds);
    if (result === 'voided') payout = bet.stake;

    const updated = await db.bet.update({
      where: { id: betId },
      data: {
        result,
        payout,
        settledAt: result !== 'pending' ? new Date() : null,
      }
    });

    return NextResponse.json({ bet: updated });
  } catch (error) {
    console.error('Settle bet error:', error);
    return NextResponse.json({ error: 'Failed to settle bet' }, { status: 500 });
  }
}
