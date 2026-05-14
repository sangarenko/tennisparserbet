import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ total: 1000, currency: 'USD' })
}

export async function POST(request: Request) {
  const body = await request.json()
  return NextResponse.json({ total: body.total || 1000, currency: body.currency || 'USD' })
}
