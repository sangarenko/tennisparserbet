import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const predictors = await db.predictor.findMany({
      orderBy: { winRate: 'desc' },
      take: 200,
    })

    const result = predictors.map((p) => ({
      id: p.id,
      name: p.name,
      platform: p.platform,
      tier:
        p.qualityScore >= 75
          ? 'S'
          : p.qualityScore >= 60
            ? 'A'
            : p.qualityScore >= 45
              ? 'B'
              : p.qualityScore >= 30
                ? 'C'
                : 'D',
      accuracy: Math.round(p.winRate * 1000) / 10,
      totalPredictions: p.totalTips,
      verified: p.verified,
      bio: p.bio,
      specialization: p.specialization,
      avatarEmoji: p.avatarEmoji,
      followers: p.followers,
      currentStreak: p.currentStreak,
      bestStreak: p.bestStreak,
      tags: p.tags,
      channel: p.channel,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch predictors:', error)
    return NextResponse.json({ error: 'Failed to fetch predictors' }, { status: 500 })
  }
}
