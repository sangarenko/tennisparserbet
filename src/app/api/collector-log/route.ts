import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Try fetching from collector service first
    let serviceLogs = null
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const response = await fetch('http://localhost:3004/logs', {
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (response.ok) {
        serviceLogs = await response.json()
      }
    } catch {
      // Collector service not available, fall through to DB
    }

    // Always also get DB logs as fallback/backup
    const dbLogs = await db.collectionLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      serviceAvailable: serviceLogs !== null,
      serviceLogs,
      databaseLogs: dbLogs,
      logs: serviceLogs || dbLogs,
    })
  } catch (error) {
    console.error('Failed to fetch collector logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collector logs' },
      { status: 500 }
    )
  }
}
