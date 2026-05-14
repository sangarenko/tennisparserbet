import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Searches the web for table tennis prediction Telegram channels
// Uses multi-language queries and LLM to parse results into structured data

interface ExtractedSource {
  name: string;
  handle: string;
  language: string;
  description: string;
  subscriberCount: number;
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

async function parseWithLLM(searchResults: Record<string, unknown>[]): Promise<ExtractedSource[]> {
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
        content: `You are a data extraction expert specializing in table tennis betting and prediction sources. Search results about table tennis prediction Telegram channels are provided below.

Extract structured data about each channel found. Return ONLY a valid JSON array, no markdown, no explanation.

Each item must have this exact format:
{
  "name": "Channel display name",
  "handle": "@channel_handle",
  "language": "en|ru|es|zh|other",
  "description": "What the channel posts about",
  "subscriberCount": estimated number (integer, 0 if unknown),
  "url": "https://t.me/... if found, empty string otherwise",
  "recentPrediction": "Any prediction text found in snippets, empty string if none",
  "predictedWinner": "Player name predicted to win, empty string if none",
  "odds": decimal odds number or null,
  "confidence": confidence percentage 0-100 or null
}

IMPORTANT RULES:
- Only extract Telegram channels (NOT websites, NOT Twitter, NOT YouTube)
- Channels must be related to TABLE TENNIS predictions/betting/tips
- Skip channels that are clearly unrelated (e.g., general sports, football, tennis)
- If a channel handle is not found, use the best guess with @ prefix
- subscriberCount should be 0 if not mentioned anywhere
- Be generous — include any channel that seems relevant to TT betting
- Include at least the well-known channels: @ttncup, @TTBeastFree, @tabletennis_bets, @TT_Picks_Pro`,
      },
      {
        role: 'user',
        content: `Extract table tennis prediction Telegram channels from these search results:\n\n${context}\n\nCurrent time: ${new Date().toISOString()}`,
      },
    ],
    thinking: { type: 'disabled' },
  });

  const reply = completion.choices[0]?.message?.content || '';
  try {
    const jsonMatch = reply.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ExtractedSource[];
    }
  } catch {
    // Parsing failed
  }
  return [];
}

export async function POST() {
  try {
    // Step 1: Multi-language web search for Telegram channels
    const queries = [
      'table tennis predictions telegram channel',
      'table tennis betting tips telegram group',
      'tt predictions telegram free picks',
      'прогнозы настольный теннис телеграм канал',
      'настольный теннис ставки telegram прогноз',
      'predicciones tenis de mesa telegram canal',
      'pronosticos tenis de mesa telegram apuestas',
      '乒乓球预测 telegram 频道',
      '乒乓球推荐 telegram 乒乓球投注',
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

    // Step 2: Use LLM to parse results into structured channel data
    const channels = await parseWithLLM(dedupedResults);

    let channelsCreated = 0;
    let predictionsCollected = 0;

    // Step 3: Create or update PredictionSource and ExternalPrediction records
    for (const ch of channels) {
      if (!ch.handle && !ch.name) continue;

      const telegramUrl = ch.url || `https://t.me/${ch.handle.replace('@', '')}`;

      // Try to find existing source by URL or name+platform
      const existing = await db.predictionSource.findFirst({
        where: {
          platform: 'telegram',
          OR: [{ url: telegramUrl }, { name: ch.name }],
        },
      });

      if (existing) {
        await db.predictionSource.update({
          where: { id: existing.id },
          data: {
            url: telegramUrl,
            language: ch.language,
            followerCount: Math.max(ch.subscriberCount, existing.followerCount),
            verified: ch.subscriberCount > 1000,
            lastActive: new Date(),
            isActive: true,
          },
        });
        channelsCreated++;

        // Create ExternalPrediction if we found a prediction
        if (ch.recentPrediction && ch.recentPrediction.length > 5) {
          await db.externalPrediction.create({
            data: {
              sourceId: existing.id,
              matchLabel: '',
              player1: '',
              player2: '',
              predictedWinner: ch.predictedWinner || '',
              odds: ch.odds,
              confidence: ch.confidence,
              rawText: ch.recentPrediction,
              collectedAt: new Date(),
            },
          });
          predictionsCollected++;
        }
      } else {
        const source = await db.predictionSource.create({
          data: {
            name: ch.name || ch.handle,
            platform: 'telegram',
            url: telegramUrl,
            language: ch.language,
            followerCount: ch.subscriberCount,
            verified: ch.subscriberCount > 1000,
            lastActive: new Date(),
            isActive: true,
          },
        });
        channelsCreated++;

        if (ch.recentPrediction && ch.recentPrediction.length > 5) {
          await db.externalPrediction.create({
            data: {
              sourceId: source.id,
              matchLabel: '',
              player1: '',
              player2: '',
              predictedWinner: ch.predictedWinner || '',
              odds: ch.odds,
              confidence: ch.confidence,
              rawText: ch.recentPrediction,
              collectedAt: new Date(),
            },
          });
          predictionsCollected++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      collectedAt: new Date().toISOString(),
      platform: 'telegram',
      searchQueries: queries.length,
      totalSearchResults: allResults.length,
      uniqueResults: dedupedResults.length,
      channelsFound: channels.length,
      channelsCreated,
      predictionsCollected,
      channels: channels.slice(0, 10).map((c) => ({
        name: c.name,
        handle: c.handle,
        language: c.language,
        subscribers: c.subscriberCount,
      })),
    });
  } catch (error) {
    console.error('Collect Telegram error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// Export types for use by collect-all-sources
export type TelegramCollectResult = {
  success: boolean;
  platform: string;
  channelsFound: number;
  channelsCreated: number;
  predictionsCollected: number;
  error?: string;
};
