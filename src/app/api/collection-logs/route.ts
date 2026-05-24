import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const logs = await db.collectionLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const result = logs.map((l) => ({
      id: l.id,
      source: l.source,
      matchesCollected: l.matchesFound,
      status: l.status,
      createdAt: l.createdAt.toISOString(),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch collection logs:', error)
    return NextResponse.json({ error: 'Failed to fetch collection logs' }, { status: 500 })
  }
}
