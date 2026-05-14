import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Comprehensive player database with realistic TT player profiles
const PLAYER_PROFILES: Record<string, { country: string; rank: number; style: string; hand: string }> = {
  // Chinese players
  "Chen M.": { country: "🇨🇳 China", rank: 12, style: "Attacker", hand: "Right" },
  "Wang Y.": { country: "🇨🇳 China", rank: 8, style: "All-round", hand: "Right" },
  "Liu H.": { country: "🇨🇳 China", rank: 15, style: "Defender", hand: "Left" },
  "Zhang W.": { country: "🇨🇳 China", rank: 5, style: "Attacker", hand: "Right" },
  "Li X.": { country: "🇨🇳 China", rank: 22, style: "All-round", hand: "Right" },
  "Wu Q.": { country: "🇨🇳 China", rank: 35, style: "Attacker", hand: "Left" },
  "Yang F.": { country: "🇨🇳 China", rank: 28, style: "Defender", hand: "Right" },
  "Zhou P.": { country: "🇨🇳 China", rank: 42, style: "All-round", hand: "Right" },
  "Huang L.": { country: "🇨🇳 China", rank: 55, style: "Attacker", hand: "Left" },
  "Lin Y.": { country: "🇨🇳 China", rank: 18, style: "All-round", hand: "Right" },
  "Chen J.": { country: "🇨🇳 China", rank: 65, style: "Attacker", hand: "Right" },
  "Chang L.": { country: "🇨🇳 China", rank: 48, style: "Defender", hand: "Left" },
  "Chung W.": { country: "🇨🇳 China", rank: 72, style: "All-round", hand: "Right" },
  "Ho C.": { country: "🇨🇳 China", rank: 38, style: "Attacker", hand: "Right" },
  "Lo K.": { country: "🇨🇳 China", rank: 60, style: "All-round", hand: "Left" },
  "Tang J.": { country: "🇨🇳 China", rank: 33, style: "Attacker", hand: "Right" },
  // Japanese players
  "Tanaka K.": { country: "🇯🇵 Japan", rank: 11, style: "Attacker", hand: "Right" },
  "Suzuki T.": { country: "🇯🇵 Japan", rank: 25, style: "All-round", hand: "Left" },
  "Kobayashi Y.": { country: "🇯🇵 Japan", rank: 19, style: "Attacker", hand: "Right" },
  "Watanabe R.": { country: "🇯🇵 Japan", rank: 30, style: "Defender", hand: "Right" },
  "Sato H.": { country: "🇯🇵 Japan", rank: 44, style: "All-round", hand: "Left" },
  "Ito K.": { country: "🇯🇵 Japan", rank: 16, style: "Attacker", hand: "Right" },
  "Yamamoto S.": { country: "🇯🇵 Japan", rank: 52, style: "All-round", hand: "Right" },
  // Korean players
  "Kim J.": { country: "🇰🇷 South Korea", rank: 9, style: "Attacker", hand: "Right" },
  "Park S.": { country: "🇰🇷 South Korea", rank: 20, style: "All-round", hand: "Left" },
  "Ahn S.": { country: "🇰🇷 South Korea", rank: 34, style: "Attacker", hand: "Right" },
  "Choi W.": { country: "🇰🇷 South Korea", rank: 45, style: "Defender", hand: "Right" },
  "Lee D.": { country: "🇰🇷 South Korea", rank: 27, style: "All-round", hand: "Left" },
  "Yoo H.": { country: "🇰🇷 South Korea", rank: 58, style: "Attacker", hand: "Right" },
  "Shin K.": { country: "🇰🇷 South Korea", rank: 63, style: "All-round", hand: "Right" },
  // Russian players
  "Aleksandrov D.": { country: "🇷🇺 Russia", rank: 7, style: "Attacker", hand: "Right" },
  "Kuznetsov A.": { country: "🇷🇺 Russia", rank: 14, style: "All-round", hand: "Left" },
  "Petrov I.": { country: "🇷🇺 Russia", rank: 23, style: "Attacker", hand: "Right" },
  "Ivanov S.": { country: "🇷🇺 Russia", rank: 31, style: "Defender", hand: "Right" },
  "Sidorov M.": { country: "🇷🇺 Russia", rank: 40, style: "All-round", hand: "Left" },
  "Smirnov N.": { country: "🇷🇺 Russia", rank: 3, style: "Attacker", hand: "Right" },
  "Klimov V.": { country: "🇷🇺 Russia", rank: 47, style: "Attacker", hand: "Right" },
  "Orlov E.": { country: "🇷🇺 Russia", rank: 56, style: "All-round", hand: "Left" },
  "Fedorov G.": { country: "🇷🇺 Russia", rank: 68, style: "Defender", hand: "Right" },
  "Volkov B.": { country: "🇷🇺 Russia", rank: 10, style: "Attacker", hand: "Right" },
  "Sokolov P.": { country: "🇷🇺 Russia", rank: 26, style: "All-round", hand: "Left" },
  // European players
  "Bogdanovic M.": { country: "🇷🇸 Serbia", rank: 37, style: "All-round", hand: "Right" },
  "Horvat L.": { country: "🇭🇷 Croatia", rank: 50, style: "Attacker", hand: "Left" },
  "Novak J.": { country: "🇨🇿 Czech Republic", rank: 43, style: "All-round", hand: "Right" },
  "Kowalski P.": { country: "🇵🇱 Poland", rank: 29, style: "Attacker", hand: "Right" },
  "Nowak T.": { country: "🇵🇱 Poland", rank: 53, style: "Defender", hand: "Left" },
  "Müller H.": { country: "🇩🇪 Germany", rank: 17, style: "All-round", hand: "Right" },
  "Schmidt F.": { country: "🇩🇪 Germany", rank: 24, style: "Attacker", hand: "Left" },
  "Weber K.": { country: "🇦🇹 Austria", rank: 61, style: "All-round", hand: "Right" },
  "Fischer M.": { country: "🇩🇪 Germany", rank: 39, style: "Defender", hand: "Right" },
  "Wagner R.": { country: "🇩🇪 Germany", rank: 46, style: "Attacker", hand: "Left" },
  // Scandinavian players
  "Andersson E.": { country: "🇸🇪 Sweden", rank: 32, style: "All-round", hand: "Right" },
  "Johansson O.": { country: "🇸🇪 Sweden", rank: 49, style: "Attacker", hand: "Left" },
  "Karlsson A.": { country: "🇸🇪 Sweden", rank: 21, style: "Defender", hand: "Right" },
  "Nilsson L.": { country: "🇸🇪 Sweden", rank: 36, style: "All-round", hand: "Right" },
  "Persson M.": { country: "🇸🇪 Sweden", rank: 13, style: "Attacker", hand: "Left" },
  "Bergström L.": { country: "🇸🇪 Sweden", rank: 41, style: "All-round", hand: "Right" },
  "Lindqvist T.": { country: "🇸🇪 Sweden", rank: 57, style: "Defender", hand: "Left" },
  "Magnusson E.": { country: "🇳🇴 Norway", rank: 64, style: "Attacker", hand: "Right" },
  "Olsen K.": { country: "🇳🇴 Norway", rank: 51, style: "All-round", hand: "Right" },
  "Hansen P.": { country: "🇩🇰 Denmark", rank: 66, style: "Attacker", hand: "Left" },
  // Latin American players
  "Garcia R.": { country: "🇧🇷 Brazil", rank: 6, style: "Attacker", hand: "Right" },
  "Martinez C.": { country: "🇦🇷 Argentina", rank: 38, style: "All-round", hand: "Left" },
  "Rodriguez F.": { country: "🇪🇸 Spain", rank: 4, style: "Attacker", hand: "Right" },
  "Torres J.": { country: "🇪🇸 Spain", rank: 54, style: "All-round", hand: "Left" },
  "Sanchez P.": { country: "🇲🇽 Mexico", rank: 59, style: "Attacker", hand: "Right" },
  "Lopez M.": { country: "🇨🇴 Colombia", rank: 62, style: "Defender", hand: "Right" },
  "Gonzalez A.": { country: "🇨🇱 Chile", rank: 70, style: "All-round", hand: "Left" },
  "Hernandez R.": { country: "🇪🇸 Spain", rank: 67, style: "Attacker", hand: "Right" },
  "Diaz J.": { country: "🇦🇷 Argentina", rank: 44, style: "All-round", hand: "Right" },
  "Romero F.": { country: "🇺🇾 Uruguay", rank: 73, style: "Defender", hand: "Left" },
  "Costa N.": { country: "🇧🇷 Brazil", rank: 2, style: "Attacker", hand: "Right" },
  "Silva A.": { country: "🇧🇷 Brazil", rank: 1, style: "All-round", hand: "Right" },
  "Santos R.": { country: "🇧🇷 Brazil", rank: 15, style: "Attacker", hand: "Left" },
  "Ferreira B.": { country: "🇧🇷 Brazil", rank: 19, style: "All-round", hand: "Right" },
  "Oliveira P.": { country: "🇧🇷 Brazil", rank: 33, style: "Attacker", hand: "Right" },
  // Vietnamese/SEA players
  "Nguyen T.": { country: "🇻🇳 Vietnam", rank: 26, style: "Attacker", hand: "Right" },
  "Tran V.": { country: "🇻🇳 Vietnam", rank: 48, style: "All-round", hand: "Left" },
  "Le H.": { country: "🇻🇳 Vietnam", rank: 55, style: "Attacker", hand: "Right" },
  "Pham D.": { country: "🇻🇳 Vietnam", rank: 62, style: "Defender", hand: "Right" },
  "Bui K.": { country: "🇻🇳 Vietnam", rank: 71, style: "All-round", hand: "Left" },
  // Taiwanese players
  "Hsieh C.": { country: "🇹🇼 Taiwan", rank: 11, style: "Attacker", hand: "Right" },
  "Tseng J.": { country: "🇹🇼 Taiwan", rank: 34, style: "All-round", hand: "Left" },
  "Cheng C.": { country: "🇹🇼 Taiwan", rank: 47, style: "Attacker", hand: "Right" },
  "Chou T.": { country: "🇹🇼 Taiwan", rank: 56, style: "Defender", hand: "Right" },
  // Polish players
  "Kucharski W.": { country: "🇵🇱 Poland", rank: 40, style: "All-round", hand: "Right" },
  "Wójcik P.": { country: "🇵🇱 Poland", rank: 58, style: "Attacker", hand: "Left" },
  "Kaminski M.": { country: "🇵🇱 Poland", rank: 65, style: "All-round", hand: "Right" },
  "Lewandowski T.": { country: "🇵🇱 Poland", rank: 50, style: "Defender", hand: "Right" },
  "Zielinski J.": { country: "🇵🇱 Poland", rank: 72, style: "Attacker", hand: "Left" },
}

const LEAGUES = ["TT Cup", "Liga Pro", "Setka Cup", "Win Cup", "TT Star Series", "Premier TT", "Pro Table Tennis"]

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function generatePlayerHistory(playerName: string, profile: { rank: number }, allPlayers: string[]) {
  const opponents = allPlayers.filter(n => n !== playerName)
  const history = []
  const now = Date.now()
  const matchCount = randomInt(30, 80)
  const baseWinRate = Math.max(0.25, Math.min(0.80, 1 - (profile.rank / 100)))

  for (let i = 0; i < matchCount; i++) {
    const opponent = opponents[randomInt(0, opponents.length - 1)]
    const daysAgo = randomInt(1, 180)
    const date = new Date(now - daysAgo * 86400000)
    const isWin = Math.random() < baseWinRate
    const tournament = LEAGUES[randomInt(0, LEAGUES.length - 1)]

    let winnerScore: number
    let loserScore: number
    if (isWin) {
      winnerScore = 3
      loserScore = randomInt(0, 2)
    } else {
      winnerScore = randomInt(0, 2)
      loserScore = 3
    }

    history.push({
      opponent,
      result: isWin ? "win" as const : "loss" as const,
      score: `${winnerScore}-${loserScore}`,
      date,
      tournament,
      odds: randomFloat(1.1, 3.5),
    })
  }

  history.sort((a, b) => b.date.getTime() - a.date.getTime())
  return history
}

export async function POST() {
  try {
    const matches = await db.match.findMany({
      select: { player1: true, player2: true },
      distinct: ['player1', 'player2'],
    })

    const playerNames = new Set<string>()
    for (const m of matches) {
      if (m.player1) playerNames.add(m.player1)
      if (m.player2) playerNames.add(m.player2)
    }

    const allNames = Array.from(playerNames)
    let playersUpdated = 0
    let historyCreated = 0

    for (const name of allNames) {
      const profile = PLAYER_PROFILES[name]

      const rank = profile?.rank || randomInt(50, 150)
      const country = profile?.country || "🌍 Unknown"

      const totalGames = randomInt(40, 100)
      const baseWinRate = Math.max(0.25, Math.min(0.80, 1 - (rank / 100)))
      const wins = Math.round(baseWinRate * totalGames)
      const losses = totalGames - wins
      const winRate = parseFloat(((wins / totalGames) * 100).toFixed(1))
      const avgOdds = randomFloat(1.3, 2.8)

      const historyData = generatePlayerHistory(name, { rank }, allNames)

      const player = await db.player.upsert({
        where: { name },
        create: {
          name,
          country,
          rank,
          wins,
          losses,
          winRate,
          avgOdds,
        },
        update: {
          country,
          rank,
          wins,
          losses,
          winRate,
          avgOdds,
        },
      })

      // Replace history
      await db.playerHistory.deleteMany({ where: { playerId: player.id } })

      const batchSize = 25
      for (let i = 0; i < historyData.length; i += batchSize) {
        const batch = historyData.slice(i, i + batchSize)
        await db.playerHistory.createMany({
          data: batch.map(h => ({
            playerId: player.id,
            opponent: h.opponent,
            result: h.result,
            score: h.score,
            date: h.date,
            tournament: h.tournament,
            odds: h.odds,
          })),
        })
      }

      historyCreated += historyData.length
      playersUpdated++
    }

    const totalPlayers = await db.player.count()
    const totalHistory = await db.playerHistory.count()

    return NextResponse.json({
      message: "Player profiles and history generated",
      playersUpdated,
      historyEntriesCreated: historyCreated,
      totalPlayers,
      totalHistoryEntries: totalHistory,
    })
  } catch (error) {
    console.error("Failed to generate player data:", error)
    return NextResponse.json(
      { error: "Failed to generate player data" },
      { status: 500 }
    )
  }
}
