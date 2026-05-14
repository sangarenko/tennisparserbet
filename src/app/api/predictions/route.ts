import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const predictions = await db.prediction.findMany({
      include: {
        match: {
          include: {
            tournament: { select: { name: true, icon: true } },
            player1: { select: { name: true, flag: true } },
            player2: { select: { name: true, flag: true } },
          }
        },
        player: { select: { name: true, flag: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error('Predictions API error:', error);
    return NextResponse.json({ predictions: [] });
  }
}
