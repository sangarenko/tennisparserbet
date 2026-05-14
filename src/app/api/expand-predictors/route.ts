import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const ADDITIONAL_PREDICTORS = [
  // Tier S (75-80% win rate) - elite analysts
  { name: "TT_MindReader", platform: "telegram", winRate: 79, totalTips: 420, avgConf: 0.85 },
  { name: "ProTableTennis", platform: "youtube", winRate: 77, totalTips: 680, avgConf: 0.82 },
  { name: "ChampionPicks", platform: "twitter", winRate: 76, totalTips: 310, avgConf: 0.80 },
  { name: "TT_Elite_Analysis", platform: "telegram", winRate: 75, totalTips: 550, avgConf: 0.79 },
  { name: "MasterSpin_Bets", platform: "youtube", winRate: 75, totalTips: 280, avgConf: 0.78 },

  // Tier A (65-74%) - very good
  { name: "PingPongPro_Elite", platform: "telegram", winRate: 74, totalTips: 390, avgConf: 0.76 },
  { name: "TT_DataScience", platform: "youtube", winRate: 73, totalTips: 520, avgConf: 0.75 },
  { name: "SpinServe_Picks", platform: "twitter", winRate: 72, totalTips: 260, avgConf: 0.74 },
  { name: "TableTennis_AI", platform: "telegram", winRate: 71, totalTips: 440, avgConf: 0.73 },
  { name: "BetSmart_TT", platform: "youtube", winRate: 70, totalTips: 350, avgConf: 0.72 },
  { name: "TT_WinStreak", platform: "twitter", winRate: 69, totalTips: 180, avgConf: 0.71 },
  { name: "ProRally_Analysis", platform: "telegram", winRate: 68, totalTips: 610, avgConf: 0.70 },
  { name: "TopSpin_Guru", platform: "youtube", winRate: 67, totalTips: 290, avgConf: 0.69 },
  { name: "ChopBlock_Pro", platform: "telegram", winRate: 66, totalTips: 370, avgConf: 0.68 },
  { name: "TT_ValueBets", platform: "twitter", winRate: 65, totalTips: 480, avgConf: 0.67 },

  // Tier B (55-64%) - decent
  { name: "ServeAce_Analytics", platform: "telegram", winRate: 64, totalTips: 320, avgConf: 0.64 },
  { name: "LoopKing_Picks", platform: "youtube", winRate: 63, totalTips: 250, avgConf: 0.63 },
  { name: "TT_FormTracker", platform: "telegram", winRate: 62, totalTips: 410, avgConf: 0.62 },
  { name: "Backhand_Analysis", platform: "twitter", winRate: 61, totalTips: 190, avgConf: 0.61 },
  { name: "PingPong_Stats", platform: "youtube", winRate: 60, totalTips: 560, avgConf: 0.60 },
  { name: "TT_HeadToHead", platform: "telegram", winRate: 59, totalTips: 340, avgConf: 0.59 },
  { name: "TableTennis_Nerd", platform: "youtube", winRate: 58, totalTips: 720, avgConf: 0.58 },
  { name: "SmashPoint_Bets", platform: "twitter", winRate: 57, totalTips: 210, avgConf: 0.57 },
  { name: "TT_Underdog_Hunter", platform: "telegram", winRate: 56, totalTips: 280, avgConf: 0.56 },
  { name: "RallyRocket", platform: "youtube", winRate: 55, totalTips: 390, avgConf: 0.55 },

  // Tier C (45-54%) - mediocre
  { name: "TT_Casual_Picks", platform: "telegram", winRate: 54, totalTips: 150, avgConf: 0.54 },
  { name: "PongWizard", platform: "youtube", winRate: 53, totalTips: 230, avgConf: 0.53 },
  { name: "TableTennis_Daily", platform: "twitter", winRate: 52, totalTips: 180, avgConf: 0.52 },
  { name: "TT_BetBot", platform: "telegram", winRate: 51, totalTips: 440, avgConf: 0.51 },
  { name: "PingPong_Insider", platform: "youtube", winRate: 50, totalTips: 310, avgConf: 0.50 },
  { name: "TT_MatchPreviews", platform: "telegram", winRate: 49, totalTips: 260, avgConf: 0.49 },
  { name: "SpinShot_Analysis", platform: "twitter", winRate: 48, totalTips: 190, avgConf: 0.48 },
  { name: "QuickPong_Picks", platform: "telegram", winRate: 47, totalTips: 350, avgConf: 0.47 },
  { name: "TT_GuessMaster", platform: "youtube", winRate: 46, totalTips: 420, avgConf: 0.46 },
  { name: "TableTennis_Random", platform: "twitter", winRate: 45, totalTips: 140, avgConf: 0.45 },

  // Tier D (30-44%) - bad
  { name: "TT_LuckyPicks", platform: "telegram", winRate: 44, totalTips: 200, avgConf: 0.44 },
  { name: "PongBluffer", platform: "youtube", winRate: 42, totalTips: 280, avgConf: 0.42 },
  { name: "TT_NoLogic", platform: "twitter", winRate: 40, totalTips: 320, avgConf: 0.40 },
  { name: "RandomTableTennis", platform: "telegram", winRate: 38, totalTips: 180, avgConf: 0.38 },
  { name: "TT_ScamPredict", platform: "youtube", winRate: 35, totalTips: 250, avgConf: 0.35 },
  { name: "PongLoser", platform: "twitter", winRate: 33, totalTips: 160, avgConf: 0.33 },
  { name: "TT_FakeExpert", platform: "telegram", winRate: 30, totalTips: 340, avgConf: 0.30 },
  { name: "ZeroTableTennis", platform: "youtube", winRate: 28, totalTips: 200, avgConf: 0.28 },
  { name: "TT_WorstPicks", platform: "telegram", winRate: 25, totalTips: 120, avgConf: 0.25 },
  { name: "PingPong_Disaster", platform: "twitter", winRate: 22, totalTips: 90, avgConf: 0.22 },
]

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function POST() {
  try {
    let created = 0

    for (const data of ADDITIONAL_PREDICTORS) {
      const correctTips = Math.round(data.totalTips * (data.winRate / 100))
      const qualityScore = Math.min(
        100,
        data.winRate * 0.6 + Math.min(data.totalTips, 100) * 0.2 + data.avgConf * 40
      )

      try {
        await db.predictor.create({
          data: {
            name: data.name,
            channel: `@${data.name.toLowerCase()}`,
            platform: data.platform,
            totalTips: data.totalTips,
            correctTips,
            winRate: data.winRate,
            avgConfidence: data.avgConf,
            lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            verified: data.winRate >= 55,
            qualityScore: Math.round(qualityScore * 100) / 100,
            isActive: true,
          },
        })
        created++
      } catch {
        // Skip duplicates
      }
    }

    const total = await db.predictor.count()

    return NextResponse.json({
      message: `Expanded predictors: ${created} new added`,
      newPredictors: created,
      totalPredictors: total,
    })
  } catch (error) {
    console.error("Failed to expand predictors:", error)
    return NextResponse.json(
      { error: "Failed to expand predictors" },
      { status: 500 }
    )
  }
}
