import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const PREDICTOR_DATA = [
  // Top tier (60-75% win rate) - ~10 predictors
  { name: 'TT_Picks_Pro', platform: 'telegram', winRate: 72, totalTips: 180, avgConf: 0.78 },
  { name: 'TableTennisGuru', platform: 'youtube', winRate: 70, totalTips: 250, avgConf: 0.75 },
  { name: 'PingPongMaster', platform: 'telegram', winRate: 68, totalTips: 320, avgConf: 0.72 },
  { name: 'SpinKing_TT', platform: 'twitter', winRate: 66, totalTips: 150, avgConf: 0.70 },
  { name: 'TT_Analytics', platform: 'youtube', winRate: 65, totalTips: 420, avgConf: 0.68 },
  { name: 'ProPaddle', platform: 'telegram', winRate: 64, totalTips: 200, avgConf: 0.73 },
  { name: 'AcePredictor', platform: 'twitter', winRate: 63, totalTips: 175, avgConf: 0.71 },
  { name: 'ChopBlock_Bets', platform: 'telegram', winRate: 62, totalTips: 290, avgConf: 0.67 },
  { name: 'TT_Oracle', platform: 'youtube', winRate: 61, totalTips: 500, avgConf: 0.65 },
  { name: 'SmashBet', platform: 'telegram', winRate: 60, totalTips: 130, avgConf: 0.69 },

  // Good tier (55-60% win rate) - ~10 predictors
  { name: 'BetKing_TT', platform: 'telegram', winRate: 58, totalTips: 210, avgConf: 0.64 },
  { name: 'TT_Insider', platform: 'twitter', winRate: 57, totalTips: 340, avgConf: 0.62 },
  { name: 'PaddlePredict', platform: 'youtube', winRate: 56, totalTips: 160, avgConf: 0.63 },
  { name: 'TableTennisPro', platform: 'telegram', winRate: 55, totalTips: 280, avgConf: 0.60 },
  { name: 'LoopDrive_Bet', platform: 'telegram', winRate: 55, totalTips: 190, avgConf: 0.61 },
  { name: 'TT_Winners', platform: 'twitter', winRate: 54, totalTips: 230, avgConf: 0.59 },
  { name: 'SpinServe_Analysis', platform: 'youtube', winRate: 53, totalTips: 310, avgConf: 0.58 },
  { name: 'PingPongProphet', platform: 'telegram', winRate: 52, totalTips: 270, avgConf: 0.57 },
  { name: 'RallyMaster', platform: 'twitter', winRate: 51, totalTips: 145, avgConf: 0.56 },
  { name: 'TT_Edge', platform: 'telegram', winRate: 50, totalTips: 380, avgConf: 0.55 },

  // Mediocre tier (40-55% win rate) - ~15 predictors
  { name: 'TT_Bets_Daily', platform: 'telegram', winRate: 48, totalTips: 220, avgConf: 0.52 },
  { name: 'PongPredictor', platform: 'youtube', winRate: 47, totalTips: 180, avgConf: 0.50 },
  { name: 'TableTennisTips', platform: 'twitter', winRate: 46, totalTips: 350, avgConf: 0.49 },
  { name: 'TT_SmartBet', platform: 'telegram', winRate: 45, totalTips: 260, avgConf: 0.48 },
  { name: 'BackhandWinner', platform: 'telegram', winRate: 44, totalTips: 150, avgConf: 0.47 },
  { name: 'ServeAce_Picks', platform: 'youtube', winRate: 43, totalTips: 200, avgConf: 0.46 },
  { name: 'TT_BettingBot', platform: 'telegram', winRate: 42, totalTips: 440, avgConf: 0.45 },
  { name: 'PingPongPicks', platform: 'twitter', winRate: 41, totalTips: 170, avgConf: 0.44 },
  { name: 'Forehand_Forecast', platform: 'telegram', winRate: 40, totalTips: 300, avgConf: 0.43 },
  { name: 'TT_MatchDay', platform: 'telegram', winRate: 40, totalTips: 130, avgConf: 0.42 },
  { name: 'Topspin_Tips', platform: 'youtube', winRate: 39, totalTips: 190, avgConf: 0.41 },
  { name: 'ChopPredict', platform: 'twitter', winRate: 38, totalTips: 240, avgConf: 0.40 },
  { name: 'TT_DailyPicks', platform: 'telegram', winRate: 38, totalTips: 210, avgConf: 0.42 },
  { name: 'PaddlePower', platform: 'telegram', winRate: 37, totalTips: 160, avgConf: 0.39 },
  { name: 'SpinShot_Bets', platform: 'youtube', winRate: 36, totalTips: 280, avgConf: 0.38 },

  // Bad tier (25-38% win rate) - ~15 predictors
  { name: 'TT_Lucky_Guess', platform: 'telegram', winRate: 35, totalTips: 120, avgConf: 0.37 },
  { name: 'RandomPong', platform: 'twitter', winRate: 34, totalTips: 90, avgConf: 0.36 },
  { name: 'TT_GambleBot', platform: 'telegram', winRate: 33, totalTips: 250, avgConf: 0.35 },
  { name: 'PingPong_Hype', platform: 'youtube', winRate: 32, totalTips: 180, avgConf: 0.34 },
  { name: 'TT_QuickPick', platform: 'telegram', winRate: 31, totalTips: 200, avgConf: 0.33 },
  { name: 'BetBlind_TT', platform: 'twitter', winRate: 30, totalTips: 140, avgConf: 0.32 },
  { name: 'TT_NoobTips', platform: 'telegram', winRate: 29, totalTips: 170, avgConf: 0.31 },
  { name: 'PongScam', platform: 'telegram', winRate: 28, totalTips: 320, avgConf: 0.30 },
  { name: 'TT_FakeGuru', platform: 'youtube', winRate: 27, totalTips: 110, avgConf: 0.29 },
  { name: 'LoseMoney_TT', platform: 'twitter', winRate: 26, totalTips: 230, avgConf: 0.28 },
  { name: 'TT_TrollPicks', platform: 'telegram', winRate: 25, totalTips: 150, avgConf: 0.27 },
  { name: 'ZeroSpin_Bet', platform: 'telegram', winRate: 25, totalTips: 100, avgConf: 0.26 },
  { name: 'TT_Wildcard', platform: 'youtube', winRate: 28, totalTips: 190, avgConf: 0.30 },
  { name: 'NetBall_Picks', platform: 'telegram', winRate: 30, totalTips: 210, avgConf: 0.32 },
  { name: 'TableTennis_Joe', platform: 'twitter', winRate: 27, totalTips: 80, avgConf: 0.29 },
]

export async function POST() {
  try {
    // Clear existing and re-seed
    await db.predictor.deleteMany({})

    // Generate realistic data from the template
    const predictors = PREDICTOR_DATA.map((data) => {
      const correctTips = Math.round(data.totalTips * (data.winRate / 100))
      // Quality score: winRate * 0.6 + min(totalTips, 100) * 0.2 + avgConf * 40
      const qualityScore = Math.min(
        100,
        data.winRate * 0.6 + Math.min(data.totalTips, 100) * 0.2 + data.avgConf * 40
      )

      return {
        name: data.name,
        channel: `@${data.name.toLowerCase()}`,
        platform: data.platform,
        totalTips: data.totalTips,
        correctTips,
        winRate: data.winRate,
        avgConfidence: data.avgConf,
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        verified: Math.random() > 0.3,
        qualityScore: Math.round(qualityScore * 100) / 100,
        isActive: true,
      }
    })

    // Seed in batches to handle unique constraints
    const created = []
    for (const predictor of predictors) {
      try {
        const p = await db.predictor.create({ data: predictor })
        created.push(p)
      } catch {
        // Skip if already exists
      }
    }

    return NextResponse.json({
      message: `Successfully seeded ${created.length} predictors`,
      seededCount: created.length,
      total: PREDICTOR_DATA.length,
    })
  } catch (error) {
    console.error('Failed to seed predictors:', error)
    return NextResponse.json(
      { error: 'Failed to seed predictors' },
      { status: 500 }
    )
  }
}
