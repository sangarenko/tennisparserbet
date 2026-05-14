import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params
    const decodedName = decodeURIComponent(name)

    const player = await db.player.findUnique({
      where: { name: decodedName },
      include: {
        history: {
          orderBy: { date: 'desc' },
          take: 50,
        },
      },
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // Get recent matches where this player participated
    const recentMatches = await db.match.findMany({
      where: {
        OR: [
          { player1: decodedName },
          { player2: decodedName },
        ],
      },
      include: {
        odds: true,
        predictions: true,
      },
      orderBy: { startTime: 'desc' },
      take: 20,
    })

    // Compute additional stats from history
    const totalMatches = player.wins + player.losses
    const form = player.history.slice(0, 10).map((h) => (h.result === 'win' ? 'W' : 'L')).join('')

    // Win rate over last 10 matches
    const last10 = player.history.slice(0, 10)
    const recentWins = last10.filter((h) => h.result === 'win').length
    const recentWinRate = last10.length > 0 ? (recentWins / last10.length) * 100 : 0

    // Head-to-head stats (extract unique opponents)
    const opponents: Record<string, { wins: number; losses: number }> = {}
    for (const h of player.history) {
      if (!opponents[h.opponent]) {
        opponents[h.opponent] = { wins: 0, losses: 0 }
      }
      if (h.result === 'win') opponents[h.opponent].wins++
      else opponents[h.opponent].losses++
    }

    return NextResponse.json({
      player: {
        ...player,
        totalMatches,
        form,
        recentWinRate: Math.round(recentWinRate * 100) / 100,
      },
      recentMatches,
      headToHead: opponents,
    })
  } catch (error) {
    console.error('Failed to fetch player:', error)
    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    )
  }
}
