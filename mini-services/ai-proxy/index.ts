import ZAI from '../../node_modules/z-ai-web-dev-sdk'

const PORT = parseInt(process.env.PORT || '3005')

const zai = await ZAI.create()

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    if (req.method === 'POST' && new URL(req.url).pathname === '/v1/chat/completions') {
      try {
        const body = await req.json()
        const completion = await zai.chat.completions.create({
          messages: body.messages || [],
          thinking: body.thinking || { type: 'disabled' },
        })
        return new Response(JSON.stringify(completion), {
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response('AI Proxy Service', { headers: { 'Content-Type': 'text/plain' } })
  },
})

console.log(`AI Proxy running on port ${PORT}`)
