import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, thinking } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 })
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages,
      thinking: thinking || { type: 'disabled' },
    })

    return NextResponse.json(completion)
  } catch (error: any) {
    console.error('AI proxy error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
