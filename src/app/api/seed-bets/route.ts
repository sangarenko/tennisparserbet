import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

export async function POST() {
  try {
    // Get finished matches with odds for realistic bet history
    const finishedMatches = await db.match.findMany({
      where: {
        status: "finished",
        winner: { not: null },
        odds: { some: {} },
      },
      include: { odds: true },
      take: 80,
      orderBy: { startTime: "desc" },
    })

    let betsCreated = 0
    const now = Date.now()

    for (const match of finishedMatches) {
      if (!match.winner || match.odds.length === 0) continue

      const odds = match.odds[0]
      // Skip if bet already exists for this match
      const existing = await db.bet.count({ where: { matchId: match.id } })
      if (existing > 0) continue

      // 60% chance we "placed" a bet on this match
      if (Math.random() > 0.6) continue

      const predictedWinner = Math.random() > 0.5 ? "player1" : "player2"
      const betOdds = predictedWinner === "player1" ? odds.odds1 : odds.odds2
      const stake = randomFloat(5, 100)
      const potentialWin = parseFloat((stake * betOdds).toFixed(2))
      const isWin = predictedWinner === match.winner
      const result = isWin ? "win" : "loss"
      const payout = isWin ? potentialWin : 0

      const daysAgo = randomInt(1, 14)
      const createdAt = new Date(now - daysAgo * 86400000)

      await db.bet.create({
        data: {
          matchId: match.id,
          predictedWinner,
          odds: betOdds,
          stake,
          potentialWin,
          result,
          payout,
          isWin,
          createdAt,
          settledAt: new Date(createdAt.getTime() + 7200000), // 2h after bet
        },
      })

      betsCreated++
    }

    // Create some pending bets on upcoming matches
    const upcomingMatches = await db.match.findMany({
      where: { status: { in: ["upcoming", "live"] } },
      include: { odds: true },
      take: 15,
      orderBy: { startTime: "asc" },
    })

    let pendingBets = 0
    for (const match of upcomingMatches) {
      if (match.odds.length === 0) continue

      const existing = await db.bet.count({ where: { matchId: match.id } })
      if (existing > 0) continue

      const odds = match.odds[0]
      const predictedWinner = Math.random() > 0.5 ? "player1" : "player2"
      const betOdds = predictedWinner === "player1" ? odds.odds1 : odds.odds2
      const stake = randomFloat(10, 50)
      const potentialWin = parseFloat((stake * betOdds).toFixed(2))

      await db.bet.create({
        data: {
          matchId: match.id,
          predictedWinner,
          odds: betOdds,
          stake,
          potentialWin,
          result: "pending",
          payout: 0,
          isWin: null,
          createdAt: new Date(),
        },
      })

      pendingBets++
    }

    const totalBets = await db.bet.count()
    const settledBets = await db.bet.count({ where: { result: { in: ["win", "loss"] } } })
    const pendingCount = await db.bet.count({ where: { result: "pending" } })

    return NextResponse.json({
      message: "Bet history seeded",
      settledBetsCreated: betsCreated,
      pendingBetsCreated: pendingBets,
      totalBets,
      settled: settledBets,
      pending: pendingCount,
    })
  } catch (error) {
    console.error("Failed to seed bets:", error)
    return NextResponse.json(
      { error: "Failed to seed bets" },
      { status: 500 }
    )
  }
}
