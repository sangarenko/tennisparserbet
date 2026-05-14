import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const SPECIALIZATIONS = [
  'Liga Pro', 'TT Cup', 'Setka Cup', 'Win Cup', 'TT Star Series',
  'Asian Markets', 'European Leagues', 'Russian TT', 'Chinese Pro',
  'Premier TT', 'Pro Table Tennis', 'Live Betting', 'Pre-match',
  'Underdogs', 'Favorites', 'Value Bets', 'Handicap Special', 'Total Points'
]

const BIOS_S = [
  'Elite table tennis analyst with 10+ years experience. Known for precise predictions in Liga Pro and TT Cup.',
  'Professional TT bettor turned analyst. Deep data-driven approach with machine learning models.',
  'Former professional table tennis player. Insider knowledge of player form and mental state.',
  'Statistical genius specializing in Asian table tennis markets. 80%+ accuracy for 2 years.',
  'Full-time TT analyst running a premium VIP channel. Best track record in the community.',
  'Data scientist applying neural networks to TT predictions. Profitable since 2021.',
  'Legendary predictor known for calling upsets before anyone else. Trusted by thousands.',
]
const BIOS_A = [
  'Experienced bettor focusing on Liga Pro and TT Cup. Solid analytical approach.',
  'Table tennis enthusiast with strong track record. Good at spotting value odds.',
  'Former coach turned analyst. Understands player psychology and form cycles.',
  'Dedicated TT researcher. Provides detailed analysis with each prediction.',
  'Building a strong reputation in the TT betting community. Consistent performer.',
]
const BIOS_B = [
  'Casual TT predictor sharing tips for fun. Mixed results but improving.',
  'Part-time analyst focusing mainly on weekend matches.',
  'Learning table tennis betting strategies. Posts occasionally.',
]
const BIOS_C = [
  'New to TT predictions. Still finding their edge.',
  'Experimental predictor testing various strategies. Inconsistent results.',
]
const TAGS_OPTIONS = ['value', 'favorites', 'underdogs', 'live', 'pre-match', 'asian', 'european', 'high-stakes', 'conservative', 'aggressive', 'data-driven', 'gut-feel', 'trends', 'head-to-head', 'form-analysis']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function genMonthly(wr: number, total: number): string {
  const mt = Math.max(3, Math.floor(total / 12))
  const d: Record<string, {w:number;l:number}> = {}
  for (let i = 0; i < 12; i++) {
    const tips = mt + rand(-3, 8)
    const adj = Math.max(15, Math.min(95, wr + rand(-8, 8)))
    d[MONTHS[i]] = { w: Math.round(tips * adj / 100), l: tips - Math.round(tips * adj / 100) }
  }
  return JSON.stringify(d)
}

function genTags(tier: string): string {
  const n = tier === 'S' ? rand(3,5) : tier === 'A' ? rand(2,4) : rand(1,3)
  return [...TAGS_OPTIONS].sort(() => Math.random() - 0.5).slice(0, n).join(',')
}

async function main() {
  console.log('Clearing existing predictors...')
  await db.predictor.deleteMany({})
  console.log('Deleted all predictors')

  const records: Record<string, unknown>[] = []

  // S-Tier: 25
  const sNames = [
    'TT_MindReader','ProTableTennis','ChampionPicks','TT_Elite_Analysis','MasterSpin_Bets',
    'AcePicks_TT','TableTennisOracle','SpinMaster_Elite','TT_DataKing','ProRally_Analytics',
    'PingPongProphet','TopSpin_Academy','TT_ValueHunter','ChopBlock_Elite','LoopDrive_Pro',
    'ServeAce_Master','Backhand_Analyst','SmashPoint_Expert','TT_InsiderPro','PaddleMaster_X',
    'SpinServe_Elite','RallyKing_TT','TableTennis_Genius','TT_ForecastPro','ProSpin_Analytics'
  ]

  for (const name of sNames) {
    const wr = rand(78, 82)
    const platform = pickRandom(['telegram','youtube','twitter'])
    const q = Math.min(100, wr * 0.5 + rand(300,900)/2500 + 0.8*30 + rand(12,30)*0.5 + 5)
    records.push({
      name, platform,
      channel: `@${name.toLowerCase()}_${platform}`,
      bio: pickRandom(BIOS_S),
      specialization: pickRandom(SPECIALIZATIONS),
      avatarEmoji: pickRandom(['👑','🏆','💎','🎯','⭐','🧠','🔥','🎖']),
      followers: rand(5000, 50000),
      totalTips: rand(300, 900),
      winRate: wr,
      avgConfidence: wr/100 + rand(0,8)/100,
      avgOdds: 1.6 + rand(0,40)/100,
      currentStreak: rand(3, 15),
      bestStreak: rand(12, 30),
      monthlyData: genMonthly(wr, rand(300,900)),
      tags: genTags('S'),
      lastActive: new Date(Date.now() - rand(0, 3*24*60*60*1000)),
      verified: true,
      qualityScore: Math.round(q * 100) / 100,
      isActive: true,
    })
  }

  // A-Tier: 55
  const aPre = ['TT_','PingPong','Spin','Rally','TopSpin','Chop','Loop','Serve','Smash','Paddle','Backhand','Forehand','TableTennis','Pro_','Ace']
  const aSuf = ['Picks','Pro','Analytics','Bets','Tips','Expert','Master','Elite','King','Hunter','Wizard','Guru','Ninja','Prophet','Scholar','Boss','Chief','Star','Legend']
  const used = new Set(sNames)

  for (let i = 0; i < 55; i++) {
    let name = `${pickRandom(aPre)}${pickRandom(aSuf)}${i > 25 ? rand(1,99) : ''}`
    let t = 0
    while (used.has(name) && t < 20) { name = `${pickRandom(aPre)}${pickRandom(aSuf)}${rand(1,999)}`; t++ }
    used.add(name)
    const wr = rand(65, 77)
    const platform = pickRandom(['telegram','telegram','youtube','twitter'])
    const q = Math.min(100, wr * 0.5 + rand(150,600)/2500 + 0.7*30 + rand(6,20)*0.5 + 3)
    records.push({
      name, platform,
      channel: `@${name.toLowerCase()}_${platform}`,
      bio: pickRandom(BIOS_A),
      specialization: pickRandom(SPECIALIZATIONS),
      avatarEmoji: pickRandom(['🟢','🔵','🟡','🟠','🟣','✅','📊','📈','🎯','💪']),
      followers: rand(1000, 20000),
      totalTips: rand(150, 600),
      winRate: wr,
      avgConfidence: wr/100 + rand(-3,5)/100,
      avgOdds: 1.5 + rand(0,50)/100,
      currentStreak: rand(2, 10),
      bestStreak: rand(6, 20),
      monthlyData: genMonthly(wr, rand(150,600)),
      tags: genTags('A'),
      lastActive: new Date(Date.now() - rand(0, 5*24*60*60*1000)),
      verified: wr >= 70,
      qualityScore: Math.round(q * 100) / 100,
      isActive: true,
    })
  }

  // B-Tier: 80
  const bPre = ['TT_','Pong','Spin','Rally','Table','Quick','Daily','Smart','Bet','Match','Tennis','Ball','Net','Point','Game']
  const bSuf = ['Picks','Tips','Bets','Daily','Quick','Smart','Bet','Today','Now','Live','Flash','Combo','Safe']

  for (let i = 0; i < 80; i++) {
    const name = `${pickRandom(bPre)}${pickRandom(bSuf)}${rand(1,999)}_${i}`
    used.add(name)
    const wr = rand(50, 64)
    const platform = pickRandom(['telegram','youtube','twitter','telegram'])
    const q = Math.min(100, wr * 0.5 + rand(50,400)/2500 + 0.55*30 + rand(3,12)*0.5 + 1)
    records.push({
      name, platform,
      channel: `@${name.toLowerCase()}_${platform}`,
      bio: pickRandom(BIOS_B),
      specialization: pickRandom(SPECIALIZATIONS),
      avatarEmoji: pickRandom(['🟡','🟠','⚪','🟤','🔸','🔹','⚡','🎲']),
      followers: rand(100, 5000),
      totalTips: rand(50, 400),
      winRate: wr,
      avgConfidence: wr/100 + rand(-5,5)/100,
      avgOdds: 1.4 + rand(0,60)/100,
      currentStreak: rand(0, 5),
      bestStreak: rand(3, 12),
      monthlyData: genMonthly(wr, rand(50,400)),
      tags: genTags('B'),
      lastActive: new Date(Date.now() - rand(0, 7*24*60*60*1000)),
      verified: false,
      qualityScore: Math.round(q * 100) / 100,
      isActive: true,
    })
  }

  // C-Tier: 45
  const cPre = ['TT_','Pong','Lucky','Random','Noob','Guess','Trial','Test','Newbie','Beginner','Amateur']
  const cSuf = ['Picks','Guess','Random','Lucky','Blind','Wild','Fun','Test','Try','Shot','Spin','Hit']

  for (let i = 0; i < 45; i++) {
    const name = `${pickRandom(cPre)}${pickRandom(cSuf)}${rand(1,9999)}_${i}`
    used.add(name)
    const wr = rand(30, 49)
    const platform = pickRandom(['telegram','youtube','twitter'])
    const q = Math.min(100, wr * 0.5 + rand(20,300)/2500 + 0.4*30 + rand(1,6)*0.5)
    records.push({
      name, platform,
      channel: `@${name.toLowerCase()}_${platform}`,
      bio: pickRandom(BIOS_C),
      specialization: pickRandom(SPECIALIZATIONS),
      avatarEmoji: pickRandom(['🔴','🔻','❌','💀','🐌','🃏','🎰','❓','🤷']),
      followers: rand(10, 500),
      totalTips: rand(20, 300),
      winRate: wr,
      avgConfidence: wr/100 + rand(-5,5)/100,
      avgOdds: 1.3 + rand(0,80)/100,
      currentStreak: rand(-3, 2),
      bestStreak: rand(1, 6),
      monthlyData: genMonthly(wr, rand(20,300)),
      tags: genTags('C'),
      lastActive: new Date(Date.now() - rand(0, 14*24*60*60*1000)),
      verified: false,
      qualityScore: Math.round(q * 100) / 100,
      isActive: true,
    })
  }

  // D-Tier: 20
  const dNames = [
    'TT_ScamAlert','PongScammer','FakeTT_Pro','LoseMoney_Fast','TT_WorstEver',
    'PredictNothing','AlwaysWrong_TT','TT_Disaster','ZeroAccuracy','PongLoser_XL',
    'TT_Bankrupt','AntiPick_TT','WrongWay_Bets','TT_MoneyBurn','PongTrash',
    'TT_Hopeless','PredictionFail','TT_NoSkill','WorstPicks_Ever','TT_Delete'
  ]

  for (const name of dNames) {
    const wr = rand(18, 29)
    const platform = pickRandom(['telegram','youtube','twitter'])
    const q = Math.min(100, wr * 0.5 + rand(30,200)/2500 + 0.25*30 + rand(1,3)*0.5)
    records.push({
      name, platform,
      channel: `@${name.toLowerCase()}_${platform}`,
      bio: 'Known for consistently poor predictions. Avoid for bankroll protection.',
      specialization: pickRandom(SPECIALIZATIONS),
      avatarEmoji: pickRandom(['💀','☠','🗑','⛔','🚫']),
      followers: rand(0, 100),
      totalTips: rand(30, 200),
      winRate: wr,
      avgConfidence: wr/100 + rand(-5,5)/100,
      avgOdds: 1.2 + rand(0,90)/100,
      currentStreak: rand(-10, -1),
      bestStreak: rand(1, 3),
      monthlyData: genMonthly(wr, rand(30,200)),
      tags: 'scam,avoid,losses',
      lastActive: new Date(Date.now() - rand(0, 30*24*60*60*1000)),
      verified: false,
      qualityScore: Math.round(q * 100) / 100,
      isActive: wr >= 25,
    })
  }

  console.log(`Prepared ${records.length} predictors. Inserting in batches...`)

  let totalCreated = 0
  for (let i = 0; i < records.length; i += 50) {
    const batch = records.slice(i, i + 50)
    try {
      const result = await db.predictor.createMany({ data: batch as any, skipDuplicates: true })
      totalCreated += result.count
      console.log(`Batch ${Math.floor(i/50)+1}: created ${result.count}`)
    } catch (err) {
      console.error(`Batch ${Math.floor(i/50)+1} failed:`, err)
    }
  }

  console.log(`\nDone! Total created: ${totalCreated}`)

  const all = await db.predictor.findMany()
  console.log(`Total in DB: ${all.length}`)
  console.log(`S-Tier (Q>=85): ${all.filter(p => p.qualityScore >= 85).length}`)
  console.log(`A-Tier (Q>=65): ${all.filter(p => p.qualityScore >= 65 && p.qualityScore < 85).length}`)
  console.log(`B-Tier (Q>=45): ${all.filter(p => p.qualityScore >= 45 && p.qualityScore < 65).length}`)
  console.log(`C-Tier (Q>=30): ${all.filter(p => p.qualityScore >= 30 && p.qualityScore < 45).length}`)
  console.log(`D-Tier (Q<30): ${all.filter(p => p.qualityScore < 30).length}`)

  await db.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
