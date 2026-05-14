import { NextResponse } from 'next/server'

export async function POST() {
  // Simulate source sync
  return NextResponse.json({
    success: true,
    message: 'Sources synced successfully',
    results: [
      { source: 'BetBoom', status: 'success', matches: 42 },
      { source: 'Fonbet', status: 'success', matches: 38 },
    ],
  })
}
