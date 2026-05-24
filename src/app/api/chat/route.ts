import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

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
    const bankroll = await db.bankroll.findFirst()
    const recentMatches = await db.match.findMany({
      take: 5,
      orderBy: { startTime: 'desc' },
      include: { odds: true }
    })

    const betSummaries = bets.slice(0, 5).map(b => {
      const profit = (b.payout || 0) - b.stake
      return `${b.predictedWinner} @ ${b.odds} - ${b.isWin ? 'WON' : (b.settledAt ? 'LOST' : 'PENDING')} (${profit >= 0 ? '+' : ''}${profit}₽)`
    }).join('; ')

    const matchSummaries = recentMatches.map(m =>
      `${m.player1} vs ${m.player2} (${m.status}, odds: ${m.odds[0]?.odds1 || '?'}/${m.odds[0]?.odds2 || '?'})`
    ).join('; ')

    const systemPrompt = `You are TT Predict Pro AI Assistant - an expert in table tennis betting analysis and strategy. You help users with:
- Match analysis and predictions
- Bankroll management strategies
- Understanding odds and value bets
- Betting psychology and discipline

Current user data:
- Total matches tracked: ${totalMatches}
- Bankroll: ${bankroll?.currentAmount || 0}₽ (${bankroll?.strategy || 'flat'} strategy, ${bankroll?.riskLevel || 'medium'} risk)
- Recent bets: ${betSummaries || 'No bets yet'}
- Recent matches: ${matchSummaries || 'No recent matches'}

Keep responses concise (2-4 sentences). Use data to support your advice. Speak in the same language as the user.`

    const zai = await ZAI.create()
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ]

    // Add recent chat context (last 8 messages)
    if (chatContext) {
      const recentMessages = chatContext.split('\n').slice(-8)
      for (const msg of recentMessages) {
        if (msg.startsWith('user:')) {
          messages.push({ role: 'user', content: msg.replace('user:', '').trim() })
        } else if (msg.startsWith('assistant:')) {
          messages.push({ role: 'assistant', content: msg.replace('assistant:', '').trim() })
        }
      }
    }

    // Add current message
    messages.push({ role: 'user', content: message })

    const completion = await zai.chat.completions.create({
      messages,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'
    return NextResponse.json({ response })

  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { response: 'Sorry, something went wrong. Please try again.' },
      { status: 200 } // Return 200 with error message to avoid UI breaking
    )
  }
}
