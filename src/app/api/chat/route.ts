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
      return `${b.match?.player1 || '?'} vs ${b.match?.player2 || '?'} (${b.status}, profit: ${profit})`
    }).join('; ')

    const aiBetSummaries = aiBets.slice(0, 5).map(b =>
      `${b.player1} vs ${b.player2} (${b.status}, conf: ${b.confidence}, profit: ${b.profit})`
    ).join('; ')

    const matchSummaries = recentMatches.map(m =>
      `${m.player1} vs ${m.player2} (${m.status})`
    ).join('; ')

    const contextData = `Matches: ${matchSummaries}. Bets: ${betSummaries}. AI Bets: ${aiBetSummaries}. Classic bankroll: ${bankroll?.currentAmount}/${bankroll?.initialAmount}, profit: ${bankroll?.totalProfit}, WR: ${bankroll?.wonBets}/${bankroll?.totalBets}. AI bankroll: ${aiBankroll?.currentAmount}/${aiBankroll?.initialAmount}, profit: ${aiBankroll?.totalProfit}, WR: ${aiBankroll?.wonBets}/${aiBankroll?.totalBets}.`

    // Try LLM (optional, falls back to rule-based responses)
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()
      const systemPrompt = `You are TT Predict Pro AI Assistant, an expert in table tennis betting analysis. You have access to the following real-time data:\n\n${contextData}\n\nProvide concise, helpful, data-driven responses about table tennis predictions, betting strategy, and match analysis. Use the actual numbers from the data above in your responses when relevant. Be specific with player names, percentages, and monetary amounts.`
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

    if (msg.includes('bankroll') || msg.includes('balance') || msg.includes('balans')) {
      response = `Classic bankroll: ₽${bankroll?.currentAmount ?? 0} (initial: ₽${bankroll?.initialAmount ?? 0}). Profit: ₽${bankroll?.totalProfit ?? 0}. Win rate: ${bankroll?.totalBets ? Math.round(bankroll.wonBets / bankroll.totalBets * 100) : 0}% (${bankroll?.wonBets}/${bankroll?.totalBets} bets). Strategy: ${bankroll?.strategy ?? 'flat'}, Risk: ${bankroll?.riskLevel ?? 'medium'}.\n\nAI RAG+ bankroll: ₽${aiBankroll?.currentAmount ?? 0} (initial: ₽${aiBankroll?.initialAmount ?? 0}). Profit: ₽${aiBankroll?.totalProfit ?? 0}. Win rate: ${aiBankroll?.totalBets ? Math.round(aiBankroll.wonBets / aiBankroll.totalBets * 100) : 0}% (${aiBankroll?.wonBets}/${aiBankroll?.totalBets} bets).`
    } else if (msg.includes('predict') || msg.includes('forecast') || msg.includes('prognoz')) {
      const live = recentMatches.filter(m => m.status === 'live')
      if (live.length > 0) {
        const m = live[0]
        response = `Live match: ${m.player1} vs ${m.player2} (score: ${m.score1}-${m.score2}). ${m.predictions?.length ? `AI prediction: ${m.predictions[0]?.predictedWinner} (${(m.predictions[0]?.confidence * 100).toFixed(0)}% confidence)` : 'No prediction yet.'}`
      } else {
        response = 'No live matches currently. Check the Matches tab for upcoming fixtures.'
      }
    } else if (msg.includes('stat') || msg.includes('statist')) {
      const classicWinRate = bankroll?.wonBets && bankroll?.totalBets ? Math.round(bankroll.wonBets / bankroll.totalBets * 100) : 0
      const ragWinRate = aiBankroll?.wonBets && aiBankroll?.totalBets ? Math.round(aiBankroll.wonBets / aiBankroll.totalBets * 100) : 0
      response = `Classic AI win rate: ${classicWinRate}% (${bankroll?.wonBets}/${bankroll?.totalBets} bets, profit: ₽${bankroll?.totalProfit ?? 0}). RAG+ AI win rate: ${ragWinRate}% (${aiBankroll?.wonBets}/${aiBankroll?.totalBets} bets, profit: ₽${aiBankroll?.totalProfit ?? 0}).`
    } else if (msg.includes('hello') || msg.includes('hi') || msg.includes('help') || msg.includes('privet')) {
      response = "Hello! I'm TT Predict Pro AI Assistant. I can help you with:\n• Match analysis & predictions\n• Betting strategy & bankroll management\n• Performance statistics\n• AI comparison (Classic vs RAG+)\n\nTry asking me about specific matches, your bankroll, or prediction accuracy!"
    } else if (msg.includes('who') || msg.includes('better') || msg.includes('classic') || msg.includes('rag')) {
      const cProfit = bankroll?.totalProfit || 0
      const rProfit = aiBankroll?.totalProfit || 0
      const winner = cProfit > rProfit ? 'Classic AI' : rProfit > cProfit ? 'RAG+ AI' : 'Tied'
      response = `Classic AI profit: ₽${cProfit}. RAG+ AI profit: ₽${rProfit}. Current leader: ${winner}. ${winner === 'Tied' ? 'Both are performing equally!' : `The ${winner} model is currently outperforming.`}`
    } else {
      response = `I analyzed your request about "${message}". Based on the current data: ${totalMatches} matches tracked, ${bankroll?.totalBets ?? 0} classic bets (profit: ₽${bankroll?.totalProfit ?? 0}), ${aiBankroll?.totalBets ?? 0} AI bets (profit: ₽${aiBankroll?.totalProfit ?? 0}). Try asking me about specific topics like predictions, bankroll, or statistics!`
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
