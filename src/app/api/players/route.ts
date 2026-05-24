import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const players = await db.player.findMany({
      orderBy: { winRate: 'desc' },
      take: 200,
    })

    const result = players.map((p) => ({
      id: p.id,
      name: p.name,
      country: p.country,
      rank: p.rank ?? 0,
      wins: p.wins,
      losses: p.losses,
      winRate: p.winRate,
      avgOdds: p.avgOdds,
      rating: Math.round(p.winRate * 100 + p.wins * 2 - p.losses * 1.5),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch players:', error)
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })
  }
}
