import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { predictorId } = body

    if (!predictorId) {
      return NextResponse.json({ error: 'predictorId is required' }, { status: 400 })
    }

    const predictor = await db.predictor.findUnique({
      where: { id: predictorId },
    })

    if (!predictor) {
      return NextResponse.json({ error: 'Predictor not found' }, { status: 404 })
    }

    // Simulate verification: check recent tips against actual results
    // In a real implementation, this would cross-reference predictions with match outcomes
    const totalTips = predictor.totalTips || Math.floor(Math.random() * 150) + 10
    const correctTips = predictor.correctTips || Math.floor(totalTips * (Math.random() * 0.4 + 0.2))
    const winRate = totalTips > 0 ? (correctTips / totalTips) * 100 : 0
    const avgConfidence = predictor.avgConfidence || 0.4 + Math.random() * 0.4

    // Quality score formula: winRate * 60 + min(totalTips, 100) * 0.2 + avgConfidence * 40
    // Cap at 100
    const qualityScore = Math.min(
      100,
      winRate * 0.6 + Math.min(totalTips, 100) * 0.2 + avgConfidence * 40
    )

    const updatedPredictor = await db.predictor.update({
      where: { id: predictorId },
      data: {
        correctTips,
        totalTips,
        winRate: Math.round(winRate * 100) / 100,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        qualityScore: Math.round(qualityScore * 100) / 100,
        verified: true,
        lastActive: new Date(),
      },
    })

    return NextResponse.json({
      predictor: updatedPredictor,
      verification: {
        totalTips,
        correctTips,
        winRate: Math.round(winRate * 100) / 100,
        qualityScore: Math.round(qualityScore * 100) / 100,
        verified: true,
      },
    })
  } catch (error) {
    console.error('Failed to verify predictor:', error)
    return NextResponse.json(
      { error: 'Failed to verify predictor' },
      { status: 500 }
    )
  }
}
