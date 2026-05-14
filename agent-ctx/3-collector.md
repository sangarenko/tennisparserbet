# Task 3 - Collector Microservice

## Status: ✅ Completed

## Summary
Built the collector microservice at `/home/z/my-project/mini-services/collector/` on port 3004. This service collects table tennis match data from BetBoom and Fonbet (mock data) and stores it in the shared SQLite database via Prisma.

## What Was Built

### Files Created
- `mini-services/collector/package.json` - Service manifest with express, cors, prisma, node-cron
- `mini-services/collector/prisma/schema.prisma` - Full schema mirroring main project, pointing to `../../db/custom.db`
- `mini-services/collector/index.ts` - Main service file with all routes, collectors, and cron scheduler

### Dependencies Installed
- express (5.2.1), cors (2.8.6), prisma@6 (6.19.3), @prisma/client@6 (6.19.3), node-cron (4.2.1)

### Endpoints (all verified working)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check - returns service status |
| GET | `/status` | Last 10 collection logs + match totals per source |
| POST | `/collect` | Trigger collection from both BetBoom and Fonbet |
| POST | `/collect/betboom` | Collect from BetBoom only (15-30 matches) |
| POST | `/collect/fonbet` | Collect from Fonbet only (12-25 matches) |
| GET | `/logs` | Latest 50 collection logs |
| GET | `/sources` | Per-source stats (total/live/upcoming/finished + league breakdown) |

### Data Generation
- **BetBoom**: 15-30 matches per run, externalId format `bb_{timestamp}_{i}_{hash}`, odds 1.2-3.5, leagues: TT Cup, Liga Pro, Setka Cup, Win Cup, TT Star Series
- **Fonbet**: 12-25 matches per run, externalId format `fonbet_{timestamp}_{i}_{hash}`, odds 1.15-3.8, leagues: Liga Pro, TT Cup, Premier TT, Pro Table Tennis, Setka Cup. Includes totals (40%) and handicaps (40%) for some matches.
- **Player pool**: 80 realistic TT player names (Chinese, Russian, Japanese, Korean, European, etc.)
- **Status mix**: ~70% upcoming, ~15% live, ~15% finished

### Key Design Decisions
- Upsert logic by `externalId` prevents duplicates on re-runs
- Player upsert ensures FK constraints are satisfied before match creation
- Raw JSON stored in `rawJson` field for each match
- `BookmakerOdds` entries created alongside each match
- Auto-collection every 5 minutes via node-cron
- Graceful shutdown on SIGINT/SIGTERM

### Issues Encountered & Resolved
1. **Prisma v7 vs v6 incompatibility**: Collector installed prisma@7.x by default, but main project uses 6.x. Fixed by pinning `prisma@6 @prisma/client@6`.
2. **Foreign key constraint on Match creation**: `player1`/`player2` fields reference `Player.name`. Fixed by adding `player.upsert()` calls before match creation.
3. **Background process management**: Used `(bun index.ts &) ` pattern to keep service running in the background.

### Current Data Stats
After verification runs: **81 total matches** (45 BetBoom + 36 Fonbet), with proper status distribution and league breakdowns.

### Service Running
Started with `bun --hot index.ts` on port 3004 with hot-reload enabled.
