import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get match counts per source (exclude live)
    const betboomCount = await db.match.count({
      where: { source: 'betboom', status: { not: 'live' } },
    })
    const fonbetCount = await db.match.count({
      where: { source: 'fonbet', status: { not: 'live' } },
    })
    const liveCount = await db.match.count({
      where: { status: 'live' },
    })
    const totalCount = await db.match.count()
    const upcomingCount = await db.match.count({
      where: { status: 'upcoming' },
    })
    const finishedCount = await db.match.count({
      where: { status: 'finished' },
    })

    // Get collection logs
    const collectionLogs = await db.collectionLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // Group logs by source
    const logsBySource: Record<string, typeof collectionLogs> = {
      betboom: [],
      fonbet: [],
    }
    for (const log of collectionLogs) {
      if (logsBySource[log.source]) {
        logsBySource[log.source].push(log)
      }
    }

    // Get last sync time per source
    const lastBetboomSync = collectionLogs.find((l) => l.source === 'betboom')?.createdAt || null
    const lastFonbetSync = collectionLogs.find((l) => l.source === 'fonbet')?.createdAt || null

    // Total collection stats
    const totalCollections = await db.collectionLog.count()
    const successfulCollections = await db.collectionLog.count({
      where: { status: 'success' },
    })
    const failedCollections = await db.collectionLog.count({
      where: { status: 'error' },
    })

    // Average collection duration
    const avgDurationResult = await db.collectionLog.aggregate({
      _avg: { duration: true },
    })
    const avgDuration = avgDurationResult._avg.duration || 0

    return NextResponse.json({
      sources: {
        betboom: {
          matchCount: betboomCount,
          lastSync: lastBetboomSync,
          recentLogs: logsBySource.betboom.slice(0, 5),
        },
        fonbet: {
          matchCount: fonbetCount,
          lastSync: lastFonbetSync,
          recentLogs: logsBySource.fonbet.slice(0, 5),
        },
      },
      comparison: {
        betboomCount,
        fonbetCount,
        difference: betboomCount - fonbetCount,
        ratio:
          fonbetCount > 0
            ? Math.round((betboomCount / fonbetCount) * 100) / 100
            : betboomCount > 0
              ? Infinity
              : 0,
      },
      overview: {
        total: totalCount,
        live: liveCount,
        upcoming: upcomingCount,
        finished: finishedCount,
      },
      collection: {
        totalCollections,
        successfulCollections,
        failedCollections,
        successRate:
          totalCollections > 0
            ? Math.round((successfulCollections / totalCollections) * 100)
            : 0,
        avgDurationMs: Math.round(avgDuration),
        recentLogs: collectionLogs.slice(0, 10),
      },
    })
  } catch (error) {
    console.error('Failed to fetch sources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sources' },
      { status: 500 }
    )
  }
}
