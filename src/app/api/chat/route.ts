import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, context: chatContext } = body

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    // Gather betting context from DB
    const totalMatches = await db.match.count()
    const bets = await db.bet.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { match: true }
    })
    const aiBets = await db.aiBet.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    })
    const bankroll = await db.bankroll.findFirst()
    const aiBankroll = await db.aiBankroll.findFirst()
    const recentMatches = await db.match.findMany({
      take: 5,
      orderBy: { startTime: 'desc' },
      include: { odds: true }
    })

    const betSummaries = bets.slice(0, 5).map(b => {
      const profit = (b.payout || 0) - b.stake
      return 
    }).join('; ')

    const aiBetSummaries = aiBets.slice(0, 5).map(b =>
      
    ).join('; ')

    const matchSummaries = recentMatches.map(m =>
      
    ).join('; ')

    const contextData = 

    // Try LLM (optional, falls back to rule-based responses)
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()
      const systemPrompt = 
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
      ]
      if (chatContext) {
        const recentMessages = chatContext.split('\n').slice(-8)
        for (const msg of recentMessages) {
          if (msg.startsWith('user:')) messages.push({ role: 'user', content: msg.replace('user:', '').trim() })
          else if (msg.startsWith('assistant:')) messages.push({ role: 'assistant', content: msg.replace('assistant:', '').trim() })
        }
      }
      messages.push({ role: 'user', content: message })
      const completion = await zai.chat.completions.create({ messages, temperature: 0.7 })
      const response = completion.choices[0]?.message?.content
      if (response) return NextResponse.json({ response, source: 'llm' })
    } catch (llmError) {
      console.log('Chat LLM unavailable, using rule-based response')
    }

    // Rule-based fallback responses
    const msg = message.toLowerCase()
    let response = ''

    if (msg.includes('bankroll') || msg.includes('balance') || msg.includes('balans') || msg.includes('bankroll')) {
      response = 
    } else if (msg.includes('predict') || msg.includes('forecast') || msg.includes('prognoz')) {
      const live = recentMatches.filter(m => m.status === 'live')
      if (live.length > 0) {
        const m = live[0]
        response = 
      } else {
        response = 
      }
    } else if (msg.includes('stat') || msg.includes('statist')) {
      const classicWinRate = bankroll?.wonBets && bankroll?.totalBets ? Math.round(bankroll.wonBets / bankroll.totalBets * 100) : 0
      const ragWinRate = aiBankroll?.wonBets && aiBankroll?.totalBets ? Math.round(aiBankroll.wonBets / aiBankroll.totalBets * 100) : 0
      response = 
    } else if (msg.includes('hello') || msg.includes('hi') || msg.includes('help') || msg.includes('privet')) {
      response = 
    } else if (msg.includes('who') || msg.includes('better') || msg.includes('classic') || msg.includes('rag')) {
      const cProfit = bankroll?.totalProfit || 0
      const rProfit = aiBankroll?.totalProfit || 0
      const winner = cProfit > rProfit ? 'Classic AI' : rProfit > cProfit ? 'RAG+ AI' : 'Tied'
      response = 
    } else {
      response = 
    }

    return NextResponse.json({ response, source: 'fallback' })

  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { response: 'Sorry, something went wrong. Please try again.' },
      { status: 200 }
    )
  }
}
