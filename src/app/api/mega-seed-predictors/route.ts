import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ═══════════════════════════════════════════════════════════════════════════════
// MEGA SEED: 220+ predictors with rich profiles, bios, specializations, trends
// ═══════════════════════════════════════════════════════════════════════════════

interface PredictorTemplate {
  name: string
  platform: string
  emoji: string
  winRate: number
  totalTips: number
  avgConf: number
  avgOdds: number
  followers: number
  bio: string
  specialization: string
  tags: string
  streak: number
  bestStreak: number
}

const SPECIALIZATIONS = [
  'Liga Pro', 'TT Cup', 'Setka Cup', 'Win Cup', 'TT Star Series',
  'Asian Markets', 'European Leagues', 'Russian TT', 'Chinese Pro',
  'Premier TT', 'Pro Table Tennis', 'Live Betting', 'Pre-match',
  'Underdogs', 'Favorites', 'Value Bets', 'Handicap Special',
  'Total Points', 'All Markets'
]

const BIOS_S = [
  'Elite table tennis analyst with 10+ years experience. Known for precise predictions in Liga Pro and TT Cup.',
  'Professional TT bettor turned analyst. Deep data-driven approach with machine learning models.',
  'Former professional table tennis player. Insider knowledge of player form and mental state.',
  'Statistical genius specializing in Asian table tennis markets. 80%+ accuracy maintained for 2 years.',
  'Full-time TT analyst running a premium VIP channel. Best track record in the community.',
  'Data scientist applying neural networks to TT predictions. Consistently profitable since 2021.',
  'Legendary predictor known for calling upsets before anyone else. Trusted by thousands.',
]

const BIOS_A = [
  'Experienced bettor focusing on Liga Pro and TT Cup. Solid analytical approach.',
  'Table tennis enthusiast with strong track record. Good at spotting value odds.',
  'Former coach turned analyst. Understands player psychology and form cycles.',
  'Dedicated TT researcher. Provides detailed analysis with each prediction.',
  'Building a strong reputation in the TT betting community. Consistent performer.',
  'Combines statistical analysis with gut feeling. Reliable in European leagues.',
]

const BIOS_B = [
  'Casual TT predictor sharing tips for fun. Mixed results but improving.',
  'Part-time analyst focusing mainly on weekend matches.',
  'Learning table tennis betting strategies. Posts occasionally.',
  'Amateur predictor trying different approaches. Some good calls, some misses.',
  'Following the sport casually and sharing picks when confident.',
]

const BIOS_C = [
  'New to TT predictions. Still finding their edge.',
  'Experimental predictor testing various strategies. Inconsistent results.',
  'Hobbyist sharing picks without deep analysis.',
  'Just starting out in the prediction game. Learning from mistakes.',
]

const TAGS_OPTIONS = [
  'value', 'favorites', 'underdogs', 'live', 'pre-match', 'asian',
  'european', 'high-stakes', 'conservative', 'aggressive', 'data-driven',
  'gut-feel', 'trends', 'head-to-head', 'form-analysis', 'upspecialist'
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateMonthlyData(winRate: number, totalTips: number): string {
  const monthlyTips = Math.max(3, Math.floor(totalTips / 12))
  const data: Record<string, { w: number; l: number }> = {}

  for (let i = 0; i < 12; i++) {
    const tips = monthlyTips + rand(-3, 8)
    const variance = rand(-8, 8)
    const adjustedWR = Math.max(15, Math.min(95, winRate + variance))
    const wins = Math.round(tips * (adjustedWR / 100))
    data[MONTHS[i]] = { w: wins, l: tips - wins }
  }

  return JSON.stringify(data)
}

function generateTags(tier: string): string {
  const count = tier === 'S' ? rand(3, 5) : tier === 'A' ? rand(2, 4) : tier === 'B' ? rand(1, 3) : rand(1, 2)
  const shuffled = [...TAGS_OPTIONS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).join(',')
}

function makeName(prefixes: string[], suffixes: string[], num?: number): string {
  return `${pickRandom(prefixes)}${pickRandom(suffixes)}${num !== undefined ? num : ''}`
}

// ─── GENERATE ALL PREDICTORS ─────────────────────────────────────────────────

function generatePredictors(): PredictorTemplate[] {
  const predictors: PredictorTemplate[] = []

  // ═══ S-TIER: 25 predictors (78-82% win rate) ═══
  const sNames = [
    'TT_MindReader', 'ProTableTennis', 'ChampionPicks', 'TT_Elite_Analysis',
    'MasterSpin_Bets', 'AcePicks_TT', 'TableTennisOracle', 'SpinMaster_Elite',
    'TT_DataKing', 'ProRally_Analytics', 'PingPongProphet', 'TopSpin_Academy',
    'TT_ValueHunter', 'ChopBlock_Elite', 'LoopDrive_Pro', 'ServeAce_Master',
    'Backhand_Analyst', 'SmashPoint_Expert', 'TT_InsiderPro', 'PaddleMaster_X',
    'SpinServe_Elite', 'RallyKing_TT', 'TableTennis_Genius', 'TT_ForecastPro',
    'ProSpin_Analytics'
  ]
  const sEmojis = ['👑', '🏆', '💎', '🎯', '⭐', '🧠', '🔥', '🎖', '👑', '🏆',
    '💎', '🎯', '⭐', '🔥', '🧠', '🎖', '👑', '🏆', '💎', '🎯',
    '⭐', '🔥', '🧠', '🎖', '👑']

  for (let i = 0; i < sNames.length; i++) {
    const wr = rand(78, 82)
    predictors.push({
      name: sNames[i],
      platform: pickRandom(['telegram', 'youtube', 'twitter']),
      emoji: sEmojis[i],
      winRate: wr,
      totalTips: rand(300, 900),
      avgConf: (wr / 100) + rand(0, 8) / 100,
      avgOdds: 1.6 + rand(0, 40) / 100,
      followers: rand(5000, 50000),
      bio: pickRandom(BIOS_S),
      specialization: pickRandom(SPECIALIZATIONS),
      tags: generateTags('S'),
      streak: rand(3, 15),
      bestStreak: rand(12, 30),
    })
  }

  // ═══ A-TIER: 55 predictors (65-77% win rate) ═══
  const aPrefixes = ['TT_', 'PingPong', 'Spin', 'Rally', 'TopSpin', 'Chop', 'Loop', 'Serve',
    'Smash', 'Paddle', 'Backhand', 'Forehand', 'TableTennis', 'Pro_', 'Ace']
  const aSuffixes = ['Picks', 'Pro', 'Analytics', 'Bets', 'Tips', 'Expert',
    'Master', 'Elite', 'King', 'Hunter', 'Wizard', 'Guru', 'Ninja', 'Prophet',
    'Scholar', 'Boss', 'Chief', 'Star', 'Legend']

  const usedNames = new Set<string>()
  for (let i = 0; i < 55; i++) {
    let name = makeName(aPrefixes, aSuffixes) + (i > 25 ? rand(1, 99) : '')
    let tries = 0
    while (usedNames.has(name) && tries < 20) {
      name = makeName(aPrefixes, aSuffixes) + rand(1, 999)
      tries++
    }
    usedNames.add(name)
    const wr = rand(65, 77)
    predictors.push({
      name,
      platform: pickRandom(['telegram', 'telegram', 'youtube', 'twitter']),
      emoji: pickRandom(['🟢', '🔵', '🟡', '🟠', '🟣', '✅', '📊', '📈', '🎯', '💪']),
      winRate: wr,
      totalTips: rand(150, 600),
      avgConf: (wr / 100) + rand(-3, 5) / 100,
      avgOdds: 1.5 + rand(0, 50) / 100,
      followers: rand(1000, 20000),
      bio: pickRandom(BIOS_A),
      specialization: pickRandom(SPECIALIZATIONS),
      tags: generateTags('A'),
      streak: rand(2, 10),
      bestStreak: rand(6, 20),
    })
  }

  // ═══ B-TIER: 80 predictors (50-64% win rate) ═══
  const bPrefixes = ['TT_', 'Pong', 'Spin', 'Rally', 'Table', 'Quick', 'Daily', 'Smart',
    'Bet', 'Match', 'Tennis', 'Ball', 'Net', 'Point', 'Game']
  const bSuffixes = ['Picks', 'Tips', 'Bets', 'Daily', 'Quick', 'Smart', 'Bet', 'Today',
    'Now', 'Live', 'Flash', 'Express', 'Combo', 'Safe', 'Easy']

  for (let i = 0; i < 80; i++) {
    let name = makeName(bPrefixes, bSuffixes) + rand(1, 999)
    let tries = 0
    while (usedNames.has(name) && tries < 20) {
      name = makeName(bPrefixes, bSuffixes) + rand(1, 9999)
      tries++
    }
    usedNames.add(name)
    const wr = rand(50, 64)
    predictors.push({
      name,
      platform: pickRandom(['telegram', 'youtube', 'twitter', 'telegram']),
      emoji: pickRandom(['🟡', '🟠', '⚪', '🟤', '🔸', '🔹', '⚡', '🎲', '🎲', '🎲']),
      winRate: wr,
      totalTips: rand(50, 400),
      avgConf: (wr / 100) + rand(-5, 5) / 100,
      avgOdds: 1.4 + rand(0, 60) / 100,
      followers: rand(100, 5000),
      bio: pickRandom(BIOS_B),
      specialization: pickRandom(SPECIALIZATIONS),
      tags: generateTags('B'),
      streak: rand(0, 5),
      bestStreak: rand(3, 12),
    })
  }

  // ═══ C-TIER: 45 predictors (30-49% win rate) ═══
  const cPrefixes = ['TT_', 'Pong', 'Lucky', 'Random', 'Noob', 'Guess', 'Trial', 'Test',
    'Newbie', 'Beginner', 'Amateur', 'Rookie', 'First', 'Try_', 'Mega']
  const cSuffixes = ['Picks', 'Guess', 'Random', 'Lucky', 'Blind', 'Wild', 'Fun', 'Test',
    'Try', 'Shot', 'Throw', 'Spin', 'Hit', 'Play', 'Bet']

  for (let i = 0; i < 45; i++) {
    let name = makeName(cPrefixes, cSuffixes) + rand(1, 9999)
    let tries = 0
    while (usedNames.has(name) && tries < 20) {
      name = makeName(cPrefixes, cSuffixes) + rand(1, 99999)
      tries++
    }
    usedNames.add(name)
    const wr = rand(30, 49)
    predictors.push({
      name,
      platform: pickRandom(['telegram', 'youtube', 'twitter']),
      emoji: pickRandom(['🔴', '🔻', '❌', '💀', '🐌', '🃏', '🎰', '❓', '🤷', '💀']),
      winRate: wr,
      totalTips: rand(20, 300),
      avgConf: (wr / 100) + rand(-5, 5) / 100,
      avgOdds: 1.3 + rand(0, 80) / 100,
      followers: rand(10, 500),
      bio: pickRandom(BIOS_C),
      specialization: pickRandom(SPECIALIZATIONS),
      tags: generateTags('C'),
      streak: rand(-3, 2),
      bestStreak: rand(1, 6),
    })
  }

  // ═══ D-TIER: 20 predictors (18-29% win rate) ═══
  const dNames = [
    'TT_ScamAlert', 'PongScammer', 'FakeTT_Pro', 'LoseMoney_Fast', 'TT_WorstEver',
    'PredictNothing', 'AlwaysWrong_TT', 'TT_Disaster', 'ZeroAccuracy', 'PongLoser_XL',
    'TT_Bankrupt', 'AntiPick_TT', 'WrongWay_Bets', 'TT_MoneyBurn', 'PongTrash',
    'TT_Hopeless', 'PredictionFail', 'TT_NoSkill', 'WorstPicks_Ever', 'TT_Delete'
  ]

  for (let i = 0; i < dNames.length; i++) {
    const wr = rand(18, 29)
    predictors.push({
      name: dNames[i],
      platform: pickRandom(['telegram', 'youtube', 'twitter']),
      emoji: pickRandom(['💀', '☠', '🗑', '⛔', '🚫']),
      winRate: wr,
      totalTips: rand(30, 200),
      avgConf: (wr / 100) + rand(-5, 5) / 100,
      avgOdds: 1.2 + rand(0, 90) / 100,
      followers: rand(0, 100),
      bio: 'Known for consistently poor predictions. Avoid following for bankroll protection.',
      specialization: pickRandom(SPECIALIZATIONS),
      tags: 'scam,avoid,losses',
      streak: rand(-10, -1),
      bestStreak: rand(1, 3),
    })
  }

  return predictors
}

export async function POST() {
  try {
    // Clear existing predictors
    await db.predictor.deleteMany({})

    const templates = generatePredictors()
    let created = 0
    let skipped = 0

    // Use createMany with skipDuplicates for better performance
    const batchSize = 50
    for (let i = 0; i < templates.length; i += batchSize) {
      const batch = templates.slice(i, i + batchSize)
      const data = batch.map(t => {
        const correctTips = Math.round(t.totalTips * (t.winRate / 100))
        const qualityScore = Math.min(
          100,
          t.winRate * 0.5 +
          Math.min(t.totalTips, 500) * 0.02 +
          t.avgConf * 30 +
          (t.bestStreak * 0.5) +
          (t.followers > 1000 ? 5 : 0)
        )

        return {
          name: t.name,
          channel: `@${t.name.toLowerCase().replace(/\s/g, '_')}_${t.platform}`,
          platform: t.platform,
          bio: t.bio,
          specialization: t.specialization,
          avatarEmoji: t.emoji,
          followers: t.followers,
          totalTips: t.totalTips,
          correctTips,
          winRate: t.winRate,
          avgConfidence: t.avgConf,
          avgOdds: t.avgOdds,
          currentStreak: t.streak,
          bestStreak: t.bestStreak,
          monthlyData: generateMonthlyData(t.winRate, t.totalTips),
          tags: t.tags,
          lastActive: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
          verified: t.winRate >= 60 && t.totalTips >= 100,
          qualityScore: Math.round(qualityScore * 100) / 100,
          isActive: t.winRate >= 25,
        }
      })

      try {
        const result = await db.predictor.createMany({ data, skipDuplicates: true })
        created += result.count
      } catch (err) {
        // Fallback: try one by one for this batch
        for (const item of data) {
          try {
            await db.predictor.create({ data: item })
            created++
          } catch {
            skipped++
          }
        }
      }
    }

    // Generate stats
    const all = await db.predictor.findMany()
    const stats = {
      total: all.length,
      byTier: {
        S: all.filter(p => p.qualityScore >= 85).length,
        A: all.filter(p => p.qualityScore >= 65 && p.qualityScore < 85).length,
        B: all.filter(p => p.qualityScore >= 45 && p.qualityScore < 65).length,
        C: all.filter(p => p.qualityScore >= 30 && p.qualityScore < 45).length,
        D: all.filter(p => p.qualityScore < 30).length,
      },
      byPlatform: {
        telegram: all.filter(p => p.platform === 'telegram').length,
        youtube: all.filter(p => p.platform === 'youtube').length,
        twitter: all.filter(p => p.platform === 'twitter').length,
      },
      verified: all.filter(p => p.verified).length,
      active: all.filter(p => p.isActive).length,
      avgWinRate: (all.reduce((s, p) => s + p.winRate, 0) / all.length).toFixed(1),
      avgQuality: (all.reduce((s, p) => s + p.qualityScore, 0) / all.length).toFixed(1),
      top5: all.sort((a, b) => b.qualityScore - a.qualityScore).slice(0, 5).map(p => ({
        name: p.name,
        winRate: p.winRate,
        qualityScore: p.qualityScore,
        platform: p.platform,
      })),
    }

    return NextResponse.json({
      message: `Mega-seed complete: ${created} predictors created, ${skipped} skipped`,
      created,
      skipped,
      stats,
    })
  } catch (error) {
    console.error('Failed to mega-seed predictors:', error)
    return NextResponse.json(
      { error: 'Failed to mega-seed predictors' },
      { status: 500 }
    )
  }
}
