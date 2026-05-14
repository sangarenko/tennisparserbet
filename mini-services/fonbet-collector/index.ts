import ZAI from 'z-ai-web-dev-sdk';

const PORT = 3004;
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 min

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T;
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, ts: Date.now() });
}

async function searchWeb(query: string, num = 10) {
  const zai = await ZAI.create();
  const results = await zai.functions.invoke('web_search', { query, num });
  return Array.isArray(results) ? results : [];
}

// Parse odds from text snippets
function extractOdds(text: string): { player1?: string; player2?: string; odds1?: number; odds2?: number }[] {
  const results: { player1?: string; player2?: string; odds1?: number; odds2?: number }[] = [];
  // Match patterns like "Player1 1.35 Player2 3.20" or "Player1 vs Player2 (1.35 / 3.20)"
  const oddsPattern = /(\d+\.\d+)/g;
  const oddsMatches = text.match(oddsPattern);
  if (oddsMatches && oddsMatches.length >= 2) {
    const o1 = parseFloat(oddsMatches[0]);
    const o2 = parseFloat(oddsMatches[1]);
    if (o1 >= 1.01 && o1 <= 20 && o2 >= 1.01 && o2 <= 20) {
      results.push({ odds1: o1, odds2: o2 });
    }
  }
  return results;
}

// Collect Fonbet table tennis odds
async function collectFonbet() {
  const cached = getCached('fonbet');
  if (cached) return cached;

  const queries = [
    'fonbet table tennis odds today matches',
    'fonbet настольный теннис коэффициенты сегодня',
    'table tennis betting odds today Liga Pro TT Cup',
  ];

  const allMatches: { player1: string; player2: string; tournament: string; odds1: number; odds2: number; source: string }[] = [];

  for (const q of queries) {
    try {
      const results = await searchWeb(q, 10);
      for (const r of (results as { snippet?: string; name?: string; url?: string }[])) {
        const text = `${r.name || ''} ${r.snippet || ''}`;
        // Try to extract player names + odds from snippets
        const nameOdds = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(\d+\.\d+)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(\d+\.\d+)/g;
        let match;
        while ((match = nameOdds.exec(text)) !== null) {
          allMatches.push({
            player1: match[1],
            odds1: parseFloat(match[2]),
            player2: match[3],
            odds2: parseFloat(match[4]),
            tournament: 'Unknown',
            source: r.url || 'web_search',
          });
        }
        // Also try extracting just odds for generic entries
        if (allMatches.length === 0) {
          const odds = extractOdds(text);
          for (const o of odds) {
            if (o.odds1 && o.odds2) {
              allMatches.push({
                player1: 'TBD',
                player2: 'TBD',
                tournament: 'Unknown',
                odds1: o.odds1,
                odds2: o.odds2,
                source: r.url || 'web_search',
              });
            }
          }
        }
      }
    } catch (e) {
      console.error(`Search failed for "${q}":`, e);
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = allMatches.filter(m => {
    const key = `${m.player1}-${m.player2}-${m.odds1}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const data = { matches: unique, collectedAt: new Date().toISOString(), total: unique.length };
  setCache('fonbet', data);
  return data;
}

// Collect prediction sources
async function collectSources() {
  const cached = getCached('sources');
  if (cached) return cached;

  const queries = [
    'table tennis prediction telegram channel tips',
    'table tennis betting tips telegram 2025',
    'настольный теннис прогнозы телеграм каналы',
    'table tennis prediction twitter picks',
    'mejores pronosticos tenis de mesa telegram',
    '卓球予想テレグラムチャンネル',
  ];

  const sources: { name: string; url: string; platform: string; description: string; language: string }[] = [];

  for (const q of queries) {
    try {
      const results = await searchWeb(q, 8);
      for (const r of (results as { name?: string; snippet?: string; url?: string; host_name?: string }[])) {
        const url = r.url || '';
        const host = r.host_name || '';
        let platform = 'website';
        if (host.includes('t.me') || url.includes('t.me') || url.includes('telegram')) platform = 'telegram';
        if (host.includes('twitter.com') || url.includes('twitter.com') || url.includes('x.com')) platform = 'twitter';

        sources.push({
          name: r.name || 'Unknown',
          url,
          platform,
          description: r.snippet || '',
          language: q.match(/[\u0400-\u04FF]/) ? 'ru' : q.match(/[\u4e00-\u9fff]/) ? 'zh' : q.match(/[\u00C0-\u00FF]/) ? 'es' : 'en',
        });
      }
    } catch (e) {
      console.error(`Sources search failed:`, e);
    }
  }

  const seen = new Set<string>();
  const unique = sources.filter(s => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });

  const data = { sources: unique, total: unique.length };
  setCache('sources', data);
  return data;
}

// Collect table tennis news
async function collectNews() {
  const cached = getCached('news');
  if (cached) return cached;

  const queries = [
    'table tennis news today results',
    'настольный теннис новости результаты',
    'table tennis tournament results Liga Pro TT Cup',
  ];

  const articles: { title: string; url: string; snippet: string; source: string; date: string }[] = [];

  for (const q of queries) {
    try {
      const results = await searchWeb(q, 8);
      for (const r of (results as { name?: string; snippet?: string; url?: string; host_name?: string; date?: string }[])) {
        articles.push({
          title: r.name || '',
          url: r.url || '',
          snippet: r.snippet || '',
          source: r.host_name || '',
          date: r.date || '',
        });
      }
    } catch (e) {
      console.error(`News search failed:`, e);
    }
  }

  const data = { articles, total: articles.length };
  setCache('news', data);
  return data;
}

// Find value bets (high odds opportunities)
async function collectValueBets() {
  const cached = getCached('valuebets');
  if (cached) return cached;

  const queries = [
    'table tennis value bet high odds underdog',
    'table tennis upset prediction today',
    'настольный теннис высокая котировка аутсайдер',
    'table tennis long shot betting tips',
  ];

  const valueBets: { match: string; player: string; odds: number; description: string; source: string }[] = [];

  for (const q of queries) {
    try {
      const results = await searchWeb(q, 8);
      for (const r of (results as { name?: string; snippet?: string; url?: string }[])) {
        const text = `${r.name || ''} ${r.snippet || ''}`;
        const oddsPattern = /@?\s*(\d+\.\d+)/g;
        let oMatch;
        while ((oMatch = oddsPattern.exec(text)) !== null) {
          const odds = parseFloat(oMatch[1]);
          if (odds >= 3.0 && odds <= 15.0) {
            valueBets.push({
              match: r.name || '',
              player: 'Value pick',
              odds,
              description: r.snippet || '',
              source: r.url || '',
            });
          }
        }
      }
    } catch (e) {
      console.error(`Value bets search failed:`, e);
    }
  }

  const data = { valueBets, total: valueBets.length };
  setCache('valuebets', data);
  return data;
}

// Deep analysis for specific match
async function collectDeepAnalysis(player1: string, player2: string) {
  const queries = [
    `${player1} ${player2} table tennis head to head`,
    `${player1} ${player2} table tennis prediction`,
    `${player1} vs ${player2} h2h record`,
    `${player1} table tennis recent form results`,
    `${player2} table tennis recent form results`,
  ];

  const data: { query: string; results: { title: string; snippet: string; url: string }[] }[] = [];

  for (const q of queries) {
    try {
      const results = await searchWeb(q, 5);
      data.push({
        query: q,
        results: (results as { name?: string; snippet?: string; url?: string }[]).map(r => ({
          title: r.name || '',
          snippet: r.snippet || '',
          url: r.url || '',
        })),
      });
    } catch {
      data.push({ query: q, results: [] });
    }
  }

  return { player1, player2, data };
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers, status: 204 });

    try {
      // Health
      if (path === '/health' && req.method === 'GET') {
        return Response.json({ status: 'ok', port: PORT, uptime: process.uptime(), cacheSize: cache.size });
      }

      // Collect Fonbet odds
      if (path === '/collect/fonbet' && req.method === 'POST') {
        const data = await collectFonbet();
        return Response.json(data, { headers });
      }

      // Collect prediction sources
      if (path === '/collect/sources' && req.method === 'POST') {
        const data = await collectSources();
        return Response.json(data, { headers });
      }

      // Collect news
      if (path === '/collect/news' && req.method === 'POST') {
        const data = await collectNews();
        return Response.json(data, { headers });
      }

      // Collect value bets
      if (path === '/collect/value-bets' && req.method === 'POST') {
        const data = await collectValueBets();
        return Response.json(data, { headers });
      }

      // Collect all
      if (path === '/collect/all' && req.method === 'POST') {
        const [fonbet, sources, news, valueBets] = await Promise.allSettled([
          collectFonbet(),
          collectSources(),
          collectNews(),
          collectValueBets(),
        ]);
        return Response.json({
          fonbet: fonbet.status === 'fulfilled' ? fonbet.value : { error: String(fonbet.reason) },
          sources: sources.status === 'fulfilled' ? sources.value : { error: String(sources.reason) },
          news: news.status === 'fulfilled' ? news.value : { error: String(news.reason) },
          valueBets: valueBets.status === 'fulfilled' ? valueBets.value : { error: String(valueBets.reason) },
          collectedAt: new Date().toISOString(),
        }, { headers });
      }

      // Deep analysis
      if (path === '/collect/deep' && req.method === 'POST') {
        const body = await req.json();
        const data = await collectDeepAnalysis(body.player1, body.player2);
        return Response.json(data, { headers });
      }

      return Response.json({ error: 'Not found' }, { status: 404, headers });
    } catch (error) {
      console.error('Server error:', error);
      return Response.json({ error: String(error) }, { status: 500, headers });
    }
  },
});

console.log(`🏁 Fonbet Collector running on port ${PORT}`);
