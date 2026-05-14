import { NextResponse } from 'next/server'

export async function GET() {
  const logs = [
    { id: 'cl1', source: 'BetBoom', matchesCollected: 42, status: 'success', createdAt: new Date().toISOString() },
    { id: 'cl2', source: 'Fonbet', matchesCollected: 38, status: 'success', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'cl3', source: 'BetBoom', matchesCollected: 35, status: 'success', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 'cl4', source: 'Fonbet', matchesCollected: 0, status: 'error', createdAt: new Date(Date.now() - 10800000).toISOString() },
    { id: 'cl5', source: 'BetBoom', matchesCollected: 40, status: 'success', createdAt: new Date(Date.now() - 14400000).toISOString() },
  ]
  return NextResponse.json(logs)
}
