import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const collectorUrl = 'http://localhost:3004/collect'

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    let response: Response
    try {
      response = await fetch(collectorUrl, {
        method: 'POST',
        signal: controller.signal,
      })
      clearTimeout(timeout)
    } catch (fetchError) {
      clearTimeout(timeout)
      return NextResponse.json(
        {
          error: 'Collector service unreachable',
          message: 'Make sure the collector microservice is running on port 3004',
        },
        { status: 503 }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      status: response.ok ? 'success' : 'error',
      collectorResponse: data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to trigger sync:', error)
    return NextResponse.json(
      { error: 'Failed to trigger sync' },
      { status: 500 }
    )
  }
}
