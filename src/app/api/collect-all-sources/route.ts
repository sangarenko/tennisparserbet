import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Aggregates collection from all sources: Telegram, Twitter, and hardcoded seeds
// Clears old external predictions before collecting new ones

// Inline collection logic (same as collect-telegram and collect-twitter, but called directly)

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

async function parseTelegramChannels(searchResults: Record<string, unknown>[]): Promise<ExtractedSource[]> {
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
- Skip unrelated channels
- Include at least: @ttncup, @TTBeastFree, @tabletennis_bets, @TT_Picks_Pro`,
      },
      {
        role: 'user',
        content: `Extract table tennis prediction Telegram channels:\n\n${context}\n\nCurrent time: ${new Date().toISOString()}`,
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

async function parseTwitterAccounts(searchResults: Record<string, unknown>[]): Promise<ExtractedSource[]> {
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
  "subscriberCount": estimated number (integer, 0 if unknown),
  "url": "https://x.com/... or https://twitter.com/... if found, empty string otherwise",
  "recentPrediction": "Any prediction text found in snippets, empty string if none",
  "predictedWinner": "Player name predicted to win, empty string if none",
  "odds": decimal odds number or null,
  "confidence": confidence percentage 0-100 or null
}

IMPORTANT RULES:
- Only extract Twitter/X accounts (NOT Telegram, NOT websites, NOT YouTube)
- Accounts must be related to TABLE TENNIS predictions/betting/tips
- Skip unrelated accounts
- Include at least: @TTBeastFree, @TTEdgeAI, @PingPongBets, @TTPredictions`,
      },
      {
        role: 'user',
        content: `Extract table tennis prediction Twitter/X accounts:\n\n${context}\n\nCurrent time: ${new Date().toISOString()}`,
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

async function upsertSourceAndPredictions(
  source: ExtractedSource,
  platform: string
): Promise<{ created: boolean; hasPrediction: boolean }> {
  const defaultUrl = platform === 'telegram'
    ? `https://t.me/${source.handle.replace('@', '')}`
    : `https://x.com/${source.handle.replace('@', '')}`;

  const sourceUrl = source.url || defaultUrl;

  const existing = await db.predictionSource.findFirst({
    where: {
      platform,
      OR: [{ url: sourceUrl }, { name: source.name }],
    },
  });

  let sourceId: string;
  let created = false;

  if (existing) {
    await db.predictionSource.update({
      where: { id: existing.id },
      data: {
        url: sourceUrl,
        language: source.language,
        followerCount: Math.max(source.subscriberCount, existing.followerCount),
        verified: source.subscriberCount > 500,
        lastActive: new Date(),
        isActive: true,
      },
    });
    sourceId = existing.id;
  } else {
    const newSource = await db.predictionSource.create({
      data: {
        name: source.name || source.handle,
        platform,
        url: sourceUrl,
        language: source.language,
        followerCount: source.subscriberCount,
        verified: source.subscriberCount > 500,
        lastActive: new Date(),
        isActive: true,
      },
    });
    sourceId = newSource.id;
    created = true;
  }

  const hasPrediction = source.recentPrediction && source.recentPrediction.length > 5;
  if (hasPrediction) {
    await db.externalPrediction.create({
      data: {
        sourceId,
        matchLabel: '',
        player1: '',
        player2: '',
        predictedWinner: source.predictedWinner || '',
        odds: source.odds,
        confidence: source.confidence,
        rawText: source.recentPrediction,
        collectedAt: new Date(),
      },
    });
  }

  return { created, hasPrediction };
}

// Hardcoded known sources to seed if DB is empty
interface KnownSource {
  name: string;
  platform: string;
  url: string;
  language: string;
  followerCount: number;
  verified: boolean;
}

const KNOWN_SOURCES: KnownSource[] = [
  // Telegram
  { name: 'TTN Cup', platform: 'telegram', url: 'https://t.me/ttncup', language: 'en', followerCount: 5000, verified: true },
  { name: 'TT Beast Free', platform: 'telegram', url: 'https://t.me/TTBeastFree', language: 'en', followerCount: 12000, verified: true },
  { name: 'Table Tennis Bets', platform: 'telegram', url: 'https://t.me/tabletennis_bets', language: 'en', followerCount: 3500, verified: false },
  { name: 'TT Picks Pro', platform: 'telegram', url: 'https://t.me/TT_Picks_Pro', language: 'en', followerCount: 2000, verified: false },
  // Twitter/X
  { name: 'TT Beast Free', platform: 'twitter', url: 'https://x.com/TTBeastFree', language: 'en', followerCount: 8000, verified: true },
  { name: 'TT Edge AI', platform: 'twitter', url: 'https://x.com/TTEdgeAI', language: 'en', followerCount: 4000, verified: true },
  { name: 'Ping Pong Bets', platform: 'twitter', url: 'https://x.com/PingPongBets', language: 'en', followerCount: 2500, verified: false },
  { name: 'TT Predictions', platform: 'twitter', url: 'https://x.com/TTPredictions', language: 'en', followerCount: 1800, verified: false },
  // Websites
  { name: 'Oddspedia', platform: 'website', url: 'https://oddspedia.com/table-tennis', language: 'en', followerCount: 500000, verified: true },
  { name: 'Flashscore', platform: 'website', url: 'https://flashscore.com/table-tennis', language: 'en', followerCount: 2000000, verified: true },
  { name: 'SportsGambler', platform: 'website', url: 'https://sportsGambler.com/table-tennis', language: 'en', followerCount: 100000, verified: true },
  { name: 'BettingExpert', platform: 'website', url: 'https://bettingexpert.com/table-tennis', language: 'en', followerCount: 80000, verified: true },
];

async function seedKnownSources() {
  const existingCount = await db.predictionSource.count();
  if (existingCount > 0) return { seeded: 0 };

  let seeded = 0;
  for (const src of KNOWN_SOURCES) {
    await db.predictionSource.create({
      data: {
        name: src.name,
        platform: src.platform,
        url: src.url,
        language: src.language,
        followerCount: src.followerCount,
        verified: src.verified,
        lastActive: new Date(),
        isActive: true,
      },
    });
    seeded++;
  }
  return { seeded };
}

export async function POST() {
  const startTime = Date.now();

  try {
    // Step 0: Clear old external predictions before collecting new ones
    const deletedCount = await db.externalPrediction.deleteMany({});
    console.log(`Cleared ${deletedCount.count} old external predictions`);

    // Step 1: Seed known sources if DB is empty
    const seedResult = await seedKnownSources();

    // Step 2: Collect from Telegram
    const telegramQueries = [
      'table tennis predictions telegram channel',
      'table tennis betting tips telegram group',
      'прогнозы настольный теннис телеграм канал',
      'настольный теннис ставки telegram прогноз',
      'predicciones tenis de mesa telegram canal',
      'pronosticos tenis de mesa telegram apuestas',
      '乒乓球预测 telegram 频道',
    ];

    const telegramResults: Record<string, unknown>[] = [];
    for (const q of telegramQueries) {
      const results = await searchWeb(q, 8);
      telegramResults.push(...results);
    }

    // Deduplicate
    const tgSeen = new Set<string>();
    const tgDeduped = telegramResults.filter((r) => {
      const url = r.url as string;
      if (tgSeen.has(url)) return false;
      tgSeen.add(url);
      return true;
    });

    const telegramChannels = await parseTelegramChannels(tgDeduped);

    let tgCreated = 0;
    let tgPredictions = 0;
    for (const ch of telegramChannels) {
      if (!ch.handle && !ch.name) continue;
      const result = await upsertSourceAndPredictions(ch, 'telegram');
      if (result.created) tgCreated++;
      if (result.hasPrediction) tgPredictions++;
    }

    // Step 3: Collect from Twitter
    const twitterQueries = [
      'table tennis betting predictions twitter',
      'table tennis tips x.com predictions',
      'настольный теннис ставки твиттер прогноз',
      'tenis de mesa apuestas twitter pronosticos',
      '乒乓球预测 twitter',
      'table tennis ai predictions x social media',
    ];

    const twitterResults: Record<string, unknown>[] = [];
    for (const q of twitterQueries) {
      const results = await searchWeb(q, 8);
      twitterResults.push(...results);
    }

    // Deduplicate
    const twSeen = new Set<string>();
    const twDeduped = twitterResults.filter((r) => {
      const url = r.url as string;
      if (twSeen.has(url)) return false;
      twSeen.add(url);
      return true;
    });

    const twitterAccounts = await parseTwitterAccounts(twDeduped);

    let twCreated = 0;
    let twPredictions = 0;
    for (const acc of twitterAccounts) {
      if (!acc.handle && !acc.name) continue;
      const result = await upsertSourceAndPredictions(acc, 'twitter');
      if (result.created) twCreated++;
      if (result.hasPrediction) twPredictions++;
    }

    const elapsed = Date.now() - startTime;

    // Step 4: Return aggregated results
    return NextResponse.json({
      success: true,
      collectedAt: new Date().toISOString(),
      elapsedMs: elapsed,
      oldPredictionsCleared: deletedCount.count,
      knownSourcesSeeded: seedResult.seeded,
      telegram: {
        searchQueries: telegramQueries.length,
        totalResults: telegramResults.length,
        uniqueResults: tgDeduped.length,
        channelsFound: telegramChannels.length,
        channelsCreated: tgCreated,
        predictionsCollected: tgPredictions,
      },
      twitter: {
        searchQueries: twitterQueries.length,
        totalResults: twitterResults.length,
        uniqueResults: twDeduped.length,
        accountsFound: twitterAccounts.length,
        accountsCreated: twCreated,
        predictionsCollected: twPredictions,
      },
      totals: {
        sourcesFound: telegramChannels.length + twitterAccounts.length,
        sourcesCreated: tgCreated + twCreated,
        predictionsCollected: tgPredictions + twPredictions,
      },
    });
  } catch (error) {
    console.error('Collect all sources error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
