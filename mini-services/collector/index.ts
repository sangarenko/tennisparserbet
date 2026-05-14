import express from "express";
import cors from "cors";
import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasourceUrl: "file:/home/z/my-project/db/custom.db",
});
const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// Player & League Data Pools
// ============================================================

const TT_PLAYERS = [
  "Aleksandrov D.", "Chen M.", "Wang Y.", "Liu H.", "Zhang W.",
  "Li X.", "Kim J.", "Park S.", "Tanaka K.", "Suzuki T.",
  "Kuznetsov A.", "Petrov I.", "Ivanov S.", "Sidorov M.", "Smirnov N.",
  "Chen J.", "Wu Q.", "Yang F.", "Zhou P.", "Huang L.",
  "Bogdanovic M.", "Horvat L.", "Novak J.", "Kowalski P.", "Nowak T.",
  "Garcia R.", "Martinez C.", "Rodriguez F.", "Torres J.", "Sanchez P.",
  "Nguyen T.", "Tran V.", "Le H.", "Pham D.", "Bui K.",
  "Müller H.", "Schmidt F.", "Weber K.", "Fischer M.", "Wagner R.",
  "Kobayashi Y.", "Watanabe R.", "Sato H.", "Ito K.", "Yamamoto S.",
  "Lin Y.", "Hsieh C.", "Tseng J.", "Cheng C.", "Chou T.",
  "Klimov V.", "Orlov E.", "Fedorov G.", "Volkov B.", "Sokolov P.",
  "Andersson E.", "Johansson O.", "Karlsson A.", "Nilsson L.", "Persson M.",
  "Costa N.", "Silva A.", "Santos R.", "Ferreira B.", "Oliveira P.",
  "Lopez M.", "Gonzalez A.", "Hernandez R.", "Diaz J.", "Romero F.",
  "Ahn S.", "Choi W.", "Lee D.", "Yoo H.", "Shin K.",
  "Chang L.", "Chung W.", "Ho C.", "Lo K.", "Tang J.",
  "Kucharski W.", "Wójcik P.", "Kaminski M.", "Lewandowski T.", "Zielinski J.",
  "Bergström L.", "Lindqvist T.", "Magnusson E.", "Olsen K.", "Hansen P.",
];

const BETBOOM_LEAGUES = ["TT Cup", "Liga Pro", "Setka Cup", "Win Cup", "TT Star Series"];
const FONBET_LEAGUES = ["Liga Pro", "TT Cup", "Premier TT", "Pro Table Tennis", "Setka Cup"];

function pickRandom<T>(arr: T[], count?: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return count ? shuffled.slice(0, count) : shuffled.slice(0, 1);
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

// ============================================================
// BetBoom Collector
// ============================================================

function generateBetBoomMatches() {
  const count = randomInt(15, 30);
  const matches: any[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const [p1, p2] = pickRandom(TT_PLAYERS, 2);
    const league = BETBOOM_LEAGUES[randomInt(0, BETBOOM_LEAGUES.length - 1)];
    const hoursOffset = randomBetween(-2, 4);
    const startTime = new Date(now.getTime() + hoursOffset * 3600000);

    const rand = Math.random();
    let status: string;
    let score1 = 0;
    let score2 = 0;
    let winner: string | null = null;

    if (rand < 0.15) {
      status = "finished";
      score1 = randomInt(0, 4);
      score2 = randomInt(0, 4);
      winner = score1 > score2 ? "player1" : score2 > score1 ? "player2" : null;
    } else if (rand < 0.3) {
      status = "live";
      score1 = randomInt(0, 3);
      score2 = randomInt(0, 3);
    } else {
      status = "upcoming";
    }

    const odds1 = parseFloat(randomBetween(1.2, 3.5).toFixed(2));
    const odds2 = parseFloat(randomBetween(1.2, 3.5).toFixed(2));

    const externalId = `bb_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}`;

    matches.push({
      externalId,
      source: "betboom",
      sport: "table_tennis",
      league,
      player1: p1,
      player2: p2,
      startTime,
      status,
      score1,
      score2,
      winner,
      odds1,
      odds2,
      rawJson: JSON.stringify({
        source: "betboom",
        externalId,
        league,
        player1: p1,
        player2: p2,
        startTime: startTime.toISOString(),
        status,
        score1,
        score2,
        odds1,
        odds2,
      }),
    });
  }

  return matches;
}

async function collectBetBoom() {
  const start = Date.now();
  try {
    const matches = generateBetBoomMatches();
    let matchesNew = 0;
    let matchesUpdated = 0;

    for (const m of matches) {
      // Ensure players exist in DB
      await prisma.player.upsert({
        where: { name: m.player1 },
        update: {},
        create: { name: m.player1 },
      });
      await prisma.player.upsert({
        where: { name: m.player2 },
        update: {},
        create: { name: m.player2 },
      });

      const existing = await prisma.match.findUnique({
        where: { externalId: m.externalId },
      });

      if (existing) {
        await prisma.match.update({
          where: { externalId: m.externalId },
          data: {
            status: m.status,
            score1: m.score1,
            score2: m.score2,
            winner: m.winner,
            rawJson: m.rawJson,
          },
        });
        matchesUpdated++;
      } else {
        await prisma.match.create({
          data: {
            externalId: m.externalId,
            source: m.source,
            sport: m.sport,
            league: m.league,
            player1: m.player1,
            player2: m.player2,
            startTime: m.startTime,
            status: m.status,
            score1: m.score1,
            score2: m.score2,
            winner: m.winner,
            rawJson: m.rawJson,
            odds: {
              create: {
                source: "betboom",
                odds1: m.odds1,
                odds2: m.odds2,
              },
            },
          },
        });
        matchesNew++;
      }
    }

    await prisma.collectionLog.create({
      data: {
        source: "betboom",
        status: "success",
        matchesFound: matches.length,
        matchesNew,
        matchesUpdated,
        duration: Date.now() - start,
      },
    });

    return { source: "betboom", found: matches.length, new: matchesNew, updated: matchesUpdated, duration: Date.now() - start };
  } catch (error: any) {
    await prisma.collectionLog.create({
      data: {
        source: "betboom",
        status: "error",
        error: error.message || String(error),
        duration: Date.now() - start,
      },
    });
    throw error;
  }
}

// ============================================================
// Fonbet Collector
// ============================================================

function generateFonbetMatches() {
  const count = randomInt(12, 25);
  const matches: any[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const [p1, p2] = pickRandom(TT_PLAYERS, 2);
    const league = FONBET_LEAGUES[randomInt(0, FONBET_LEAGUES.length - 1)];
    const hoursOffset = randomBetween(-2, 4);
    const startTime = new Date(now.getTime() + hoursOffset * 3600000);

    const rand = Math.random();
    let status: string;
    let score1 = 0;
    let score2 = 0;
    let winner: string | null = null;

    if (rand < 0.12) {
      status = "finished";
      score1 = randomInt(0, 4);
      score2 = randomInt(0, 4);
      winner = score1 > score2 ? "player1" : score2 > score1 ? "player2" : null;
    } else if (rand < 0.28) {
      status = "live";
      score1 = randomInt(0, 3);
      score2 = randomInt(0, 3);
    } else {
      status = "upcoming";
    }

    // Fonbet uses slightly different odds ranges
    const odds1 = parseFloat(randomBetween(1.15, 3.8).toFixed(2));
    const odds2 = parseFloat(randomBetween(1.15, 3.8).toFixed(2));

    const hash = Math.random().toString(36).slice(2, 10);
    const externalId = `fonbet_${Date.now()}_${i}_${hash}`;

    // Some matches have totals and handicaps
    const hasTotals = Math.random() > 0.4;
    const hasHandicap = Math.random() > 0.6;
    const totalValue = parseFloat(randomBetween(4.5, 8.5).toFixed(1));
    const totalOver = hasTotals ? parseFloat(randomBetween(1.6, 2.3).toFixed(2)) : null;
    const totalUnder = hasTotals ? parseFloat(randomBetween(1.5, 2.2).toFixed(2)) : null;
    const handicapValue = parseFloat(randomBetween(-2.5, 2.5).toFixed(1));
    const handicap1 = hasHandicap ? parseFloat(randomBetween(1.7, 2.4).toFixed(2)) : null;
    const handicap2 = hasHandicap ? parseFloat(randomBetween(1.6, 2.3).toFixed(2)) : null;

    matches.push({
      externalId,
      source: "fonbet",
      sport: "table_tennis",
      league,
      player1: p1,
      player2: p2,
      startTime,
      status,
      score1,
      score2,
      winner,
      odds1,
      odds2,
      totalOver,
      totalUnder,
      handicap1,
      handicap2,
      totalValue,
      handicapValue,
      rawJson: JSON.stringify({
        source: "fonbet",
        externalId,
        league,
        player1: p1,
        player2: p2,
        startTime: startTime.toISOString(),
        status,
        score1,
        score2,
        odds1,
        odds2,
        totalOver,
        totalUnder,
        handicap1,
        handicap2,
        totalValue,
        handicapValue,
      }),
    });
  }

  return matches;
}

async function collectFonbet() {
  const start = Date.now();
  try {
    const matches = generateFonbetMatches();
    let matchesNew = 0;
    let matchesUpdated = 0;

    for (const m of matches) {
      // Ensure players exist in DB
      await prisma.player.upsert({
        where: { name: m.player1 },
        update: {},
        create: { name: m.player1 },
      });
      await prisma.player.upsert({
        where: { name: m.player2 },
        update: {},
        create: { name: m.player2 },
      });

      const existing = await prisma.match.findUnique({
        where: { externalId: m.externalId },
      });

      if (existing) {
        await prisma.match.update({
          where: { externalId: m.externalId },
          data: {
            status: m.status,
            score1: m.score1,
            score2: m.score2,
            winner: m.winner,
            rawJson: m.rawJson,
          },
        });
        matchesUpdated++;
      } else {
        await prisma.match.create({
          data: {
            externalId: m.externalId,
            source: m.source,
            sport: m.sport,
            league: m.league,
            player1: m.player1,
            player2: m.player2,
            startTime: m.startTime,
            status: m.status,
            score1: m.score1,
            score2: m.score2,
            winner: m.winner,
            rawJson: m.rawJson,
            odds: {
              create: {
                source: "fonbet",
                odds1: m.odds1,
                odds2: m.odds2,
                totalOver: m.totalOver,
                totalUnder: m.totalUnder,
                handicap1: m.handicap1,
                handicap2: m.handicap2,
              },
            },
          },
        });
        matchesNew++;
      }
    }

    await prisma.collectionLog.create({
      data: {
        source: "fonbet",
        status: "success",
        matchesFound: matches.length,
        matchesNew,
        matchesUpdated,
        duration: Date.now() - start,
      },
    });

    return { source: "fonbet", found: matches.length, new: matchesNew, updated: matchesUpdated, duration: Date.now() - start };
  } catch (error: any) {
    await prisma.collectionLog.create({
      data: {
        source: "fonbet",
        status: "error",
        error: error.message || String(error),
        duration: Date.now() - start,
      },
    });
    throw error;
  }
}

// ============================================================
// Express Routes
// ============================================================

// Health check
app.get("/", (_req, res) => {
  res.json({ service: "tt-collector", status: "running", port: 3004, timestamp: new Date().toISOString() });
});

// Last collection status
app.get("/status", async (_req, res) => {
  try {
    const logs = await prisma.collectionLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const betboomTotal = await prisma.match.count({ where: { source: "betboom" } });
    const fonbetTotal = await prisma.match.count({ where: { source: "fonbet" } });
    res.json({
      lastCollections: logs,
      totalMatches: { betboom: betboomTotal, fonbet: fonbetTotal, all: betboomTotal + fonbetTotal },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Collect from all sources
app.post("/collect", async (_req, res) => {
  try {
    const betboom = await collectBetBoom();
    const fonbet = await collectFonbet();
    res.json({ success: true, results: [betboom, fonbet] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Collect from BetBoom only
app.post("/collect/betboom", async (_req, res) => {
  try {
    const result = await collectBetBoom();
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Collect from Fonbet only
app.post("/collect/fonbet", async (_req, res) => {
  try {
    const result = await collectFonbet();
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get collection logs (latest 50)
app.get("/logs", async (_req, res) => {
  try {
    const logs = await prisma.collectionLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ logs, total: logs.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get source statistics (match counts per source)
app.get("/sources", async (_req, res) => {
  try {
    const betboomAll = await prisma.match.count({ where: { source: "betboom" } });
    const fonbetAll = await prisma.match.count({ where: { source: "fonbet" } });

    const betboomLive = await prisma.match.count({ where: { source: "betboom", status: "live" } });
    const fonbetLive = await prisma.match.count({ where: { source: "fonbet", status: "live" } });

    const betboomUpcoming = await prisma.match.count({ where: { source: "betboom", status: "upcoming" } });
    const fonbetUpcoming = await prisma.match.count({ where: { source: "fonbet", status: "upcoming" } });

    const betboomFinished = await prisma.match.count({ where: { source: "betboom", status: "finished" } });
    const fonbetFinished = await prisma.match.count({ where: { source: "fonbet", status: "finished" } });

    // League breakdown per source
    const betboomLeagues = await prisma.match.groupBy({
      by: ["league"],
      where: { source: "betboom" },
      _count: true,
    });

    const fonbetLeagues = await prisma.match.groupBy({
      by: ["league"],
      where: { source: "fonbet" },
      _count: true,
    });

    res.json({
      betboom: {
        total: betboomAll,
        live: betboomLive,
        upcoming: betboomUpcoming,
        finished: betboomFinished,
        leagues: betboomLeagues.map((l) => ({ league: l.league, count: l._count })),
      },
      fonbet: {
        total: fonbetAll,
        live: fonbetLive,
        upcoming: fonbetUpcoming,
        finished: fonbetFinished,
        leagues: fonbetLeagues.map((l) => ({ league: l.league, count: l._count })),
      },
      totalMatches: betboomAll + fonbetAll,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Auto-schedule: collect every 5 minutes
// ============================================================

cron.schedule("*/5 * * * *", async () => {
  console.log(`[cron] Auto-collect triggered at ${new Date().toISOString()}`);
  try {
    await collectBetBoom();
    await collectFonbet();
    console.log("[cron] Auto-collect completed successfully");
  } catch (error: any) {
    console.error("[cron] Auto-collect failed:", error.message);
  }
});

// ============================================================
// Start Server
// ============================================================

const PORT = 3004;
app.listen(PORT, () => {
  console.log(`[tt-collector] Service running on port ${PORT}`);
  console.log(`[tt-collector] Endpoints:`);
  console.log(`  GET  /            - Health check`);
  console.log(`  GET  /status      - Last collection status`);
  console.log(`  POST /collect     - Collect from all sources`);
  console.log(`  POST /collect/betboom - Collect from BetBoom`);
  console.log(`  POST /collect/fonbet  - Collect from Fonbet`);
  console.log(`  GET  /logs        - Collection logs (latest 50)`);
  console.log(`  GET  /sources     - Source statistics`);
  console.log(`[tt-collector] Auto-schedule: every 5 minutes`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n[tt-collector] Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n[tt-collector] Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});
