import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Find all active predictors that should be pruned
    // Criteria: qualityScore < 20 OR winRate < 30%
    const predictorsToPrune = await db.predictor.findMany({
      where: {
        isActive: true,
        OR: [
          { qualityScore: { lt: 20 } },
          { winRate: { lt: 30 } },
        ],
      },
    })

    if (predictorsToPrune.length === 0) {
      return NextResponse.json({
        prunedCount: 0,
        message: 'No predictors to prune',
      })
    }

    // Deactivate all matching predictors
    const result = await db.predictor.updateMany({
      where: {
        id: { in: predictorsToPrune.map((p) => p.id) },
      },
      data: {
        isActive: false,
      },
    })

    return NextResponse.json({
      prunedCount: result.count,
      deactivatedPredictors: predictorsToPrune.map((p) => ({
        id: p.id,
        name: p.name,
        platform: p.platform,
        qualityScore: p.qualityScore,
        winRate: p.winRate,
        reason:
          p.qualityScore < 20
            ? `Quality score too low: ${p.qualityScore.toFixed(1)}`
            : `Win rate too low: ${p.winRate.toFixed(1)}%`,
      })),
      message: `Pruned ${result.count} predictor(s)`,
    })
  } catch (error) {
    console.error('Failed to prune predictors:', error)
    return NextResponse.json(
      { error: 'Failed to prune predictors' },
      { status: 500 }
    )
  }
}
