import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Searches the web for table tennis prediction Twitter/X accounts
// Uses multi-language queries and LLM to parse results into structured data

interface ExtractedTwitterSource {
  name: string;
  handle: string;
  language: string;
  description: string;
  followerCount: number;
  url: string;
  recentPrediction: string;
  predictedWinner: string;
  odds: number | null;
  confidence: number | null;
}

async function searchWeb(query: string, num = 10) {
  const zai = await ZAI.create();
  try {
    const results = await zai.functions.invoke('web_search', { query, num });
    return Array.isArray(results) ? results : [];
  } catch {
    return [];
  }
}

async function parseWithLLM(searchResults: Record<string, unknown>[]): Promise<ExtractedTwitterSource[]> {
  const zai = await ZAI.create();

  const context = searchResults
    .slice(0, 20)
    .map((r, i) => {
      const name = (r.name as string) || '';
      const snippet = (r.snippet as string) || '';
      const url = (r.url as string) || '';
      const host = (r.host_name as string) || '';
      return `[${i + 1}] URL: ${url}\n   Title: ${name}\n   Host: ${host}\n   Snippet: ${snippet}`;
    })
    .join('\n\n');

  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'assistant',
        content: `You are a data extraction expert specializing in table tennis betting and prediction sources. Search results about table tennis prediction Twitter/X accounts are provided below.

Extract structured data about each account found. Return ONLY a valid JSON array, no markdown, no explanation.

Each item must have this exact format:
{
  "name": "Account display name",
  "handle": "@twitter_handle",
  "language": "en|ru|es|zh|other",
  "description": "What the account posts about",
  "followerCount": estimated number (integer, 0 if unknown),
  "url": "https://x.com/... or https://twitter.com/... if found, empty string otherwise",
  "recentPrediction": "Any prediction text found in snippets, empty string if none",
  "predictedWinner": "Player name predicted to win, empty string if none",
  "odds": decimal odds number or null,
  "confidence": confidence percentage 0-100 or null
}

IMPORTANT RULES:
- Only extract Twitter/X accounts (NOT Telegram, NOT websites, NOT YouTube)
- Accounts must be related to TABLE TENNIS predictions/betting/tips
- Skip accounts that are clearly unrelated (e.g., general sports, football, tennis, crypto)
- If a handle is not found, use the best guess with @ prefix
- followerCount should be 0 if not mentioned anywhere
- Be generous — include any account that seems relevant to TT betting
- Include at least the well-known accounts: @TTBeastFree, @TTEdgeAI, @PingPongBets, @TTPredictions`,
      },
      {
        role: 'user',
        content: `Extract table tennis prediction Twitter/X accounts from these search results:\n\n${context}\n\nCurrent time: ${new Date().toISOString()}`,
      },
    ],
    thinking: { type: 'disabled' },
  });

  const reply = completion.choices[0]?.message?.content || '';
  try {
    const jsonMatch = reply.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ExtractedTwitterSource[];
    }
  } catch {
    // Parsing failed
  }
  return [];
}

export async function POST() {
  try {
    // Step 1: Multi-language web search for Twitter/X accounts
    const queries = [
      'table tennis betting predictions twitter',
      'table tennis tips x.com predictions',
      'tt betting tips twitter free',
      'table tennis picks twitter today',
      'настольный теннис ставки твиттер прогноз',
      'теннис настольный прогнозы x.com ставки',
      'tenis de mesa apuestas twitter pronosticos',
      'predicciones tenis de mesa x.com apuestas',
      '乒乓球预测 twitter 推特',
      'table tennis ai predictions x social media',
    ];

    const allResults: Record<string, unknown>[] = [];
    for (const q of queries) {
      const results = await searchWeb(q, 8);
      allResults.push(...results);
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const dedupedResults = allResults.filter((r) => {
      const url = r.url as string;
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });

    // Step 2: Use LLM to parse results into structured account data
    const accounts = await parseWithLLM(dedupedResults);

    let accountsCreated = 0;
    let predictionsCollected = 0;

    // Step 3: Create or update PredictionSource and ExternalPrediction records
    for (const acc of accounts) {
      if (!acc.handle && !acc.name) continue;

      const twitterUrl = acc.url ||
        `https://x.com/${acc.handle.replace('@', '')}` ||
        `https://twitter.com/${acc.handle.replace('@', '')}`;

      // Try to find existing source by URL or name+platform
      const existing = await db.predictionSource.findFirst({
        where: {
          platform: 'twitter',
          OR: [{ url: twitterUrl }, { name: acc.name }],
        },
      });

      let sourceId: string;

      if (existing) {
        await db.predictionSource.update({
          where: { id: existing.id },
          data: {
            url: twitterUrl,
            language: acc.language,
            followerCount: Math.max(acc.followerCount, existing.followerCount),
            verified: acc.followerCount > 500,
            lastActive: new Date(),
            isActive: true,
          },
        });
        sourceId = existing.id;
        accountsCreated++;
      } else {
        const source = await db.predictionSource.create({
          data: {
            name: acc.name || acc.handle,
            platform: 'twitter',
            url: twitterUrl,
            language: acc.language,
            followerCount: acc.followerCount,
            verified: acc.followerCount > 500,
            lastActive: new Date(),
            isActive: true,
          },
        });
        sourceId = source.id;
        accountsCreated++;
      }

      // Create ExternalPrediction if we found a prediction
      if (acc.recentPrediction && acc.recentPrediction.length > 5) {
        await db.externalPrediction.create({
          data: {
            sourceId,
            matchLabel: '',
            player1: '',
            player2: '',
            predictedWinner: acc.predictedWinner || '',
            odds: acc.odds,
            confidence: acc.confidence,
            rawText: acc.recentPrediction,
            collectedAt: new Date(),
          },
        });
        predictionsCollected++;
      }
    }

    return NextResponse.json({
      success: true,
      collectedAt: new Date().toISOString(),
      platform: 'twitter',
      searchQueries: queries.length,
      totalSearchResults: allResults.length,
      uniqueResults: dedupedResults.length,
      accountsFound: accounts.length,
      accountsCreated,
      predictionsCollected,
      accounts: accounts.slice(0, 10).map((a) => ({
        name: a.name,
        handle: a.handle,
        language: a.language,
        followers: a.followerCount,
      })),
    });
  } catch (error) {
    console.error('Collect Twitter error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// Export types for use by collect-all-sources
export type TwitterCollectResult = {
  success: boolean;
  platform: string;
  accountsFound: number;
  accountsCreated: number;
  predictionsCollected: number;
  error?: string;
};
