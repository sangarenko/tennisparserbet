import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [all, top10, recentActive] = await Promise.all([
      db.predictor.findMany({ where: { isActive: true } }),
      db.predictor.findMany({
        where: { isActive: true },
        orderBy: { qualityScore: 'desc' },
        take: 10,
      }),
      db.predictor.findMany({
        where: { isActive: true, lastActive: { not: null } },
        orderBy: { lastActive: 'desc' },
        take: 10,
      }),
    ])

    const total = all.length

    // Tier counts
    const tiers = {
      S: all.filter(p => p.qualityScore >= 85).length,
      A: all.filter(p => p.qualityScore >= 65 && p.qualityScore < 85).length,
      B: all.filter(p => p.qualityScore >= 45 && p.qualityScore < 65).length,
      C: all.filter(p => p.qualityScore >= 30 && p.qualityScore < 45).length,
      D: all.filter(p => p.qualityScore < 30).length,
    }

    // Platform counts
    const platforms = {
      telegram: all.filter(p => p.platform === 'telegram').length,
      youtube: all.filter(p => p.platform === 'youtube').length,
      twitter: all.filter(p => p.platform === 'twitter').length,
    }

    // Specialization distribution
    const specs: Record<string, number> = {}
    for (const p of all) {
      if (p.specialization) {
        specs[p.specialization] = (specs[p.specialization] || 0) + 1
      }
    }
    const topSpecializations = Object.entries(specs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }))

    // Win rate distribution
    const winRateDist = [
      { range: '0-20%', count: all.filter(p => p.winRate < 20).length },
      { range: '20-40%', count: all.filter(p => p.winRate >= 20 && p.winRate < 40).length },
      { range: '40-60%', count: all.filter(p => p.winRate >= 40 && p.winRate < 60).length },
      { range: '60-80%', count: all.filter(p => p.winRate >= 60 && p.winRate < 80).length },
      { range: '80-100%', count: all.filter(p => p.winRate >= 80).length },
    ]

    // Monthly performance (aggregate from top predictors)
    const monthlyPerformance: { month: string; avgWR: number; totalTips: number }[] = []
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    for (const month of months) {
      let totalWR = 0
      let totalTips = 0
      let count = 0
      for (const p of top10) {
        try {
          const md = JSON.parse(p.monthlyData || '{}')
          if (md[month]) {
            const w = md[month].w || 0
            const l = md[month].l || 0
            const tips = w + l
            if (tips > 0) {
              totalWR += (w / tips) * 100
              totalTips += tips
              count++
            }
          }
        } catch { /* skip */ }
      }
      monthlyPerformance.push({
        month,
        avgWR: count > 0 ? Math.round(totalWR / count) : 0,
        totalTips,
      })
    }

    // Tag cloud
    const tagCounts: Record<string, number> = {}
    for (const p of all) {
      if (p.tags) {
        for (const tag of p.tags.split(',')) {
          const t = tag.trim()
          if (t) tagCounts[t] = (tagCounts[t] || 0) + 1
        }
      }
    }
    const tagCloud = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([tag, count]) => ({ tag, count }))

    return NextResponse.json({
      total,
      tiers,
      platforms,
      verified: all.filter(p => p.verified).length,
      active: all.filter(p => p.isActive).length,
      avgWinRate: total > 0 ? (all.reduce((s, p) => s + p.winRate, 0) / total).toFixed(1) : '0',
      avgQuality: total > 0 ? (all.reduce((s, p) => s + p.qualityScore, 0) / total).toFixed(1) : '0',
      avgTips: total > 0 ? Math.round(all.reduce((s, p) => s + p.totalTips, 0) / total) : 0,
      avgFollowers: total > 0 ? Math.round(all.reduce((s, p) => s + p.followers, 0) / total) : 0,
      top10: top10.map(p => ({
        id: p.id,
        name: p.name,
        avatarEmoji: p.avatarEmoji,
        platform: p.platform,
        winRate: p.winRate,
        qualityScore: p.qualityScore,
        totalTips: p.totalTips,
        followers: p.followers,
        specialization: p.specialization,
        currentStreak: p.currentStreak,
        bestStreak: p.bestStreak,
        monthlyData: p.monthlyData,
        bio: p.bio,
        tags: p.tags,
      })),
      recentActive: recentActive.map(p => ({
        id: p.id,
        name: p.name,
        lastActive: p.lastActive,
        winRate: p.winRate,
      })),
      topSpecializations,
      winRateDist,
      monthlyPerformance,
      tagCloud,
    })
  } catch (error) {
    console.error('Failed to fetch predictor stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch predictor stats' },
      { status: 500 }
    )
  }
}
