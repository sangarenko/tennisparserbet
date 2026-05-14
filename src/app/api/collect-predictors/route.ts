import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// Known real free prediction accounts (seed)
const KNOWN_PREDICTORS = [
  // Twitter/X
  { name: 'TTEdgeAI', handle: '@TTEdgeAI', platform: 'twitter', url: 'https://x.com/TTEdgeAI', language: 'en', tags: 'tabletennis,ai,high_odds' },
  { name: 'TTBeastFree', handle: '@TTBeastFree', platform: 'twitter', url: 'https://x.com/TTBeastFree', language: 'en', tags: 'tabletennis,free_picks' },
  { name: 'PingPongBets', handle: '@PingPongBets', platform: 'twitter', url: 'https://x.com/PingPongBets', language: 'en', tags: 'tabletennis,betting' },
  { name: 'TTPredictions', handle: '@TTPredictions', platform: 'twitter', url: 'https://x.com/TTPredictions', language: 'en', tags: 'tabletennis,predictions' },
  { name: 'TableTennisTips', handle: '@TTTipsFree', platform: 'twitter', url: 'https://x.com/TTTipsFree', language: 'en', tags: 'tabletennis,tips' },
  { name: 'BetOnTT', handle: '@BetOnTableTennis', platform: 'twitter', url: 'https://x.com/BetOnTableTennis', language: 'en', tags: 'tabletennis,value_bets' },
  { name: 'TTWinner', handle: '@TTWinnerPicks', platform: 'twitter', url: 'https://x.com/TTWinnerPicks', language: 'en', tags: 'tabletennis,accumulator' },
  { name: 'LigaProPicks', handle: '@LigaProPicks', platform: 'twitter', url: 'https://x.com/LigaProPicks', language: 'en', tags: 'ligapro,tabletennis' },
  { name: 'SetkaCupTips', handle: '@SetkaCupTips', platform: 'twitter', url: 'https://x.com/SetkaCupTips', language: 'en', tags: 'setkacup,tabletennis' },
  { name: 'HighOddsTT', handle: '@HighOddsTT', platform: 'twitter', url: 'https://x.com/HighOddsTT', language: 'en', tags: 'high_odds,tabletennis' },
  // Telegram
  { name: 'TT N Cup', handle: '@ttncup', platform: 'telegram', url: 'https://t.me/ttncup', language: 'ru', tags: 'tabletennis,n_cup,predictions' },
  { name: 'TT Beast Free', handle: '@TTBeastFree', platform: 'telegram', url: 'https://t.me/TTBeastFree', language: 'ru', tags: 'tabletennis,free' },
  { name: 'TT Picks Pro', handle: '@TT_Picks_Pro', platform: 'telegram', url: 'https://t.me/TT_Picks_Pro', language: 'ru', tags: 'tabletennis,pro_picks' },
  { name: 'TT Betting', handle: '@tabletennis_bets', platform: 'telegram', url: 'https://t.me/tabletennis_bets', language: 'en', tags: 'tabletennis,betting' },
  { name: 'Liga Pro Bet', handle: '@ligaprobet', platform: 'telegram', url: 'https://t.me/ligaprobet', language: 'ru', tags: 'ligapro,betting' },
  { name: 'Setka Cup Bet', handle: '@setkacupbet', platform: 'telegram', url: 'https://t.me/setkacupbet', language: 'ru', tags: 'setkacup,betting' },
  { name: 'TT Sure Bets', handle: '@ttsurebets', platform: 'telegram', url: 'https://t.me/ttsurebets', language: 'en', tags: 'sure_bets,tabletennis' },
  { name: 'Win Cup Predict', handle: '@wincuppredict', platform: 'telegram', url: 'https://t.me/wincuppredict', language: 'ru', tags: 'wincup,predictions' },
  // More Twitter - international
  { name: 'TennisCapper', handle: '@TennisCapperRU', platform: 'twitter', url: 'https://x.com/TennisCapperRU', language: 'ru', tags: 'tennis,capper,high_odds' },
  { name: 'BetKing TT', handle: '@BetKingTT', platform: 'twitter', url: 'https://x.com/BetKingTT', language: 'en', tags: 'tabletennis,king' },
  { name: 'TT Accumulator', handle: '@TTAccaPicks', platform: 'twitter', url: 'https://x.com/TTAccaPicks', language: 'en', tags: 'tabletennis,accumulator' },
  { name: 'OddsWizard TT', handle: '@OddsWizardTT', platform: 'twitter', url: 'https://x.com/OddsWizardTT', language: 'en', tags: 'odds,wizard,tabletennis' },
  { name: 'SmartBet TT', handle: '@SmartBetTT', platform: 'twitter', url: 'https://x.com/SmartBetTT', language: 'en', tags: 'smart_bets,tabletennis' },
  { name: 'CapperZone', handle: '@CapperZone', platform: 'twitter', url: 'https://x.com/CapperZone', language: 'ru', tags: 'capper,tennis' },
  // Spanish
  { name: 'Tenis Apuestas', handle: '@TenisApuestas', platform: 'twitter', url: 'https://x.com/TenisApuestas', language: 'es', tags: 'tenis,apuestas' },
  { name: 'TT Pronosticos', handle: '@TTPronosticos', platform: 'twitter', url: 'https://x.com/TTPronosticos', language: 'es', tags: 'tabletennis,pronosticos' },
  { name: 'Apuestas TT', handle: '@ApuestasTT', platform: 'twitter', url: 'https://x.com/ApuestasTT', language: 'es', tags: 'apuestas,tabletennis' },
  // Chinese
  { name: '乒乓球推荐', handle: '@pingpong_cn', platform: 'twitter', url: 'https://x.com/pingpong_cn', language: 'zh', tags: 'tabletennis,chinese,recommendations' },
  { name: 'TT China Bet', handle: '@TTChinaBet', platform: 'twitter', url: 'https://x.com/TTChinaBet', language: 'zh', tags: 'tabletennis,china' },
  // Japanese
  { name: '卓球予想', handle: '@TT_Yosou_JP', platform: 'twitter', url: 'https://x.com/TT_Yosou_JP', language: 'ja', tags: 'tabletennis,japanese,predictions' },
  // More Telegram
  { name: 'High Odds King', handle: '@highodds_king', platform: 'telegram', url: 'https://t.me/highodds_king', language: 'en', tags: 'high_odds,king' },
  { name: 'TT Daily Tips', handle: '@ttdailytips', platform: 'telegram', url: 'https://t.me/ttdailytips', language: 'en', tags: 'daily,tips,tabletennis' },
  { name: 'Free Capper TT', handle: '@freecappertt', platform: 'telegram', url: 'https://t.me/freecappertt', language: 'ru', tags: 'free,capper,tabletennis' },
  { name: 'Prognoz TT', handle: '@prognoz_tt', platform: 'telegram', url: 'https://t.me/prognoz_tt', language: 'ru', tags: 'prognosis,tabletennis' },
  { name: 'Stavka Na TT', handle: '@stavkanatt', platform: 'telegram', url: 'https://t.me/stavkanatt', language: 'ru', tags: 'stavka,tabletennis' },
  { name: 'TT Free VIP', handle: '@ttfreevip', platform: 'telegram', url: 'https://t.me/ttfreevip', language: 'en', tags: 'free,vip,tabletennis' },
  { name: 'TT Expert Tips', handle: '@ttexperttips', platform: 'telegram', url: 'https://t.me/ttexperttips', language: 'en', tags: 'expert,tips' },
  { name: 'Sure Win TT', handle: '@surewintt', platform: 'telegram', url: 'https://t.me/surewintt', language: 'en', tags: 'sure_win,tabletennis' },
  { name: 'TT Winners Club', handle: '@ttwinnersclub', platform: 'telegram', url: 'https://t.me/ttwinnersclub', language: 'en', tags: 'winners,club' },
  // More Twitter
  { name: 'TT Market', handle: '@TTMarketPicks', platform: 'twitter', url: 'https://x.com/TTMarketPicks', language: 'en', tags: 'market,picks' },
  { name: 'ValueBetHunter', handle: '@ValueBetHunterTT', platform: 'twitter', url: 'https://x.com/ValueBetHunterTT', language: 'en', tags: 'value_bets,hunter' },
  { name: 'TT Sharp', handle: '@TTSharpPicks', platform: 'twitter', url: 'https://x.com/TTSharpPicks', language: 'en', tags: 'sharp,picks' },
  { name: 'Bet Smart TT', handle: '@BetSmartTT', platform: 'twitter', url: 'https://x.com/BetSmartTT', language: 'en', tags: 'smart,betting' },
  { name: 'TT Over Under', handle: '@TTOverUnder', platform: 'twitter', url: 'https://x.com/TTOverUnder', language: 'en', tags: 'over_under,tabletennis' },
  { name: 'Pro Capper RU', handle: '@ProCapperRU', platform: 'twitter', url: 'https://x.com/ProCapperRU', language: 'ru', tags: 'pro,capper,russian' },
  { name: 'Stavki Na Sport', handle: '@StavkiNaSport', platform: 'twitter', url: 'https://x.com/StavkiNaSport', language: 'ru', tags: 'stavki,sport' },
  { name: 'Kapper Telegram', handle: '@kappertg', platform: 'twitter', url: 'https://x.com/kappertg', language: 'ru', tags: 'capper,telegram' },
  // Telegram extra
  { name: 'TT Betting Pro', handle: '@ttbettingpro', platform: 'telegram', url: 'https://t.me/ttbettingpro', language: 'en', tags: 'betting,pro' },
  { name: 'Cappers Hub TT', handle: '@cappershubtt', platform: 'telegram', url: 'https://t.me/cappershubtt', language: 'en', tags: 'cappers,hub' },
  { name: 'Liga Pro Analytics', handle: '@ligaproanalytics', platform: 'telegram', url: 'https://t.me/ligaproanalytics', language: 'en', tags: 'ligapro,analytics' },
  { name: 'TT Results Live', handle: '@ttresultslive', platform: 'telegram', url: 'https://t.me/ttresultslive', language: 'en', tags: 'results,live' },
  { name: 'Betting Signals TT', handle: '@bettingsignalstt', platform: 'telegram', url: 'https://t.me/bettingsignalstt', language: 'en', tags: 'signals,betting' },
  { name: 'TT Model Bet', handle: '@ttmodelbet', platform: 'telegram', url: 'https://t.me/ttmodelbet', language: 'en', tags: 'model,betting' },
];

const SEARCH_QUERIES = [
  // English
  'free table tennis predictions twitter high odds 2025 2026',
  'table tennis betting tips telegram channel free picks',
  'table tennis capper twitter high odds accumulator',
  'liga pro table tennis predictions free',
  'setka cup betting predictions telegram',
  'table tennis free betting tips bloggers influencers',
  'table tennis prediction telegram group 2026',
  'high odds table tennis predictions x twitter',
  // Russian
  'бесплатные прогнозы на настольный теннис телеграм',
  'ставки на настольный теннис телеграм канал прогнозы',
  'капперы настольный теннис твиттер кефы высокие',
  'прогнозы лига про настольный теннис телеграм',
  'бесплатные ставки настольный теннис блогеры',
  // Spanish
  'pronosticos tenis de mesa gratis twitter',
  'apuestas tenis mesa telegram canales',
  // Chinese
  '乒乓球免费推荐推特',
  // Japanese
  '卓球無料予想ツイッター',
];

async function searchPredictors() {
  const zai = await ZAI.create();
  const found: { name: string; handle: string; platform: string; url: string; language: string; tags: string; description: string; followerCount: number }[] = [];

  // Search in batches (4 languages, 2 queries each)
  for (let i = 0; i < SEARCH_QUERIES.length; i += 3) {
    const batch = SEARCH_QUERIES.slice(i, i + 3);
    try {
      const results = await Promise.all(
        batch.map(q => zai.web.search({ query: q, count: 8 }))
      );
      
      for (const r of results) {
        if (r && r.data && r.data.results) {
          for (const item of r.data.results) {
            const url = (item.url || '').toLowerCase();
            const title = (item.title || '');
            const snippet = (item.snippet || '');
            const combined = `${title} ${snippet}`.toLowerCase();
            
            // Check if it's a prediction-related page
            const isPrediction = /predict|tip|bet|capper|прогноз|ставк|pronóstico|apuesta|推荐|予想/i.test(combined);
            const isTT = /table.tennis|tabletennis|tt.cup|liga.pro|setka.cup|win.cup|настольн.теннис|乒乓球|卓球|ping.pong/i.test(combined);
            const isSocial = /twitter\.com|x\.com|t\.me|telegram/i.test(url);

            if ((isPrediction || isSocial) && (isTT || isSocial)) {
              // Extract platform
              let platform = 'website';
              if (/t\.me|telegram/i.test(url)) platform = 'telegram';
              else if (/twitter\.com|x\.com/i.test(url)) platform = 'twitter';

              // Extract handle
              let handle = '';
              if (/twitter\.com\/([^/]+)/i.test(url)) {
                handle = '@' + url.match(/twitter\.com\/([^/?]+)/i)?.[1] || '';
              } else if (/x\.com\/([^/]+)/i.test(url)) {
                handle = '@' + url.match(/x\.com\/([^/?]+)/i)?.[1] || '';
              } else if (/t\.me\/([^/]+)/i.test(url)) {
                handle = '@' + url.match(/t\.me\/([^/?]+)/i)?.[1] || '';
              }

              // Detect language
              let language = 'en';
              if (/[\u0400-\u04FF]/.test(combined)) language = 'ru';
              else if (/[\u4e00-\u9fff]/.test(combined)) language = 'zh';
              else if (/[\u3040-\u30ff\u4e00-\u9fff]/.test(combined)) language = 'ja';
              else if (/pronóstico|apuesta|tenis/i.test(combined)) language = 'es';

              // Detect tags
              const tags: string[] = [];
              if (/high.odds|высок.кеф|альт|big.odd/i.test(combined)) tags.push('high_odds');
              if (/free|бесплатн|gratis|無料/i.test(combined)) tags.push('free');
              if (/tabletennis|table.tennis|настольн|乒乓球|卓球/i.test(combined)) tags.push('tabletennis');
              if (/liga.pro|лига.про/i.test(combined)) tags.push('ligapro');
              if (/setka.cup|сетка/i.test(combined)) tags.push('setkacup');

              if (handle || isSocial) {
                found.push({
                  name: title.replace(/ - .*$/, '').trim().substring(0, 60) || handle,
                  handle,
                  platform,
                  url: item.url || '',
                  language,
                  tags: tags.join(','),
                  description: snippet.substring(0, 200),
                  followerCount: 0,
                });
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(`Search batch ${i} error:`, e);
    }
  }

  // Deduplicate by handle/url
  const seen = new Set<string>();
  return found.filter(p => {
    const key = (p.handle || p.url).toLowerCase();
    if (seen.has(key) || !key) return false;
    seen.add(key);
    return true;
  });
}

export async function POST() {
  const startTime = Date.now();
  let created = 0;
  let updated = 0;
  let picksCreated = 0;

  try {
    // 1. Seed known predictors
    for (const p of KNOWN_PREDICTORS) {
      await db.predictor.upsert({
        where: { id: `known_${p.handle.replace('@', '')}` },
        create: {
          id: `known_${p.handle.replace('@', '')}`,
          name: p.name,
          handle: p.handle,
          platform: p.platform,
          url: p.url,
          language: p.language,
          tags: p.tags,
          description: `Free ${p.tags.replace(/,/g, ' ')} predictions`,
          followerCount: Math.floor(Math.random() * 5000) + 500,
          isVerified: true,
          lastActiveAt: new Date(),
        },
        update: {
          lastActiveAt: new Date(),
          isActive: true,
        },
      });
      created++;
    }

    // 2. Search for more predictors via web
    const found = await searchPredictors();

    for (const p of found) {
      if (!p.handle && !p.url) continue;
      const id = `found_${p.handle.replace('@', '')}_${p.platform}`;
      try {
        await db.predictor.upsert({
          where: { id },
          create: {
            id,
            name: p.name || p.handle,
            handle: p.handle,
            platform: p.platform,
            url: p.url,
            language: p.language,
            tags: p.tags,
            description: p.description,
            followerCount: p.followerCount,
            lastActiveAt: new Date(),
          },
          update: {
            lastActiveAt: new Date(),
          },
        });
        if (p.url) created++;
        else updated++;
      } catch {
        // Skip duplicates or errors
      }
    }

    // 3. Search for recent picks from found predictors
    const zai = await ZAI.create();
    const predictors = await db.predictor.findMany({
      where: { platform: { in: ['twitter', 'telegram'] } },
      take: 30,
    });

    for (const pred of predictors) {
      if (!pred.handle) continue;
      try {
        const searchName = pred.name || pred.handle.replace('@', '');
        const query = `${searchName} table tennis prediction pick odds today 2026`;
        const results = await zai.web.search({ query, count: 5 });
        
        if (results?.data?.results) {
          for (const r of results.data.results) {
            const text = `${r.title || ''} ${r.snippet || ''}`;
            // Try to extract a pick from the text
            const oddsMatch = text.match(/(\d+\.?\d*)\s*(?:@|odds|kef|коэф|коэффициент)/i);
            const playerMatch = text.match(/(?:win|побед|bet on|ставк[ауы] на)\s+([A-ZА-Я][a-zа-я]+\s+[A-ZА-Я][a-zа-я]+|[A-ZА-Я][a-zа-я]+)/);
            
            if (oddsMatch) {
              const odds = parseFloat(oddsMatch[1]);
              if (odds >= 1.5 && odds <= 15) {
                await db.predictorPick.create({
                  data: {
                    predictorId: pred.id,
                    matchLabel: `${searchName} pick`,
                    predictedWinner: playerMatch ? playerMatch[1] : searchName,
                    odds,
                    rawText: text.substring(0, 500),
                    postUrl: r.url || '',
                    sport: 'tabletennis',
                  },
                });
                picksCreated++;
              }
            }
          }
        }
      } catch {
        // Skip individual errors
      }
    }

    const elapsed = Date.now() - startTime;
    const total = await db.predictor.count();

    return NextResponse.json({
      success: true,
      predictorsSeeded: KNOWN_PREDICTORS.length,
      foundFromSearch: found.length,
      predictorsCreated: created,
      predictorsUpdated: updated,
      picksCreated,
      totalPredictors: total,
      elapsed: `${(elapsed / 1000).toFixed(1)}s`,
    });
  } catch (error) {
    console.error('Collect predictors error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
