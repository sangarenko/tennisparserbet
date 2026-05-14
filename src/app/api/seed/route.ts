import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Seed data - runs ONCE, deletes all existing data first
export async function POST() {
  try {
    // Delete in reverse FK order
    await db.valueBet.deleteMany();
    await db.modelPrediction.deleteMany();
    await db.aIModel.deleteMany();
    await db.newsArticle.deleteMany();
    await db.externalPrediction.deleteMany();
    await db.predictionSource.deleteMany();
    await db.bet.deleteMany();
    await db.bookmakerOdds.deleteMany();
    await db.prediction.deleteMany();
    await db.headToHead.deleteMany();
    await db.match.deleteMany();
    await db.player.deleteMany();
    await db.tournament.deleteMany();

    // === TOURNAMENTS ===
    const tournaments = await Promise.all([
      db.tournament.create({ data: { name: 'Liga Pro', icon: '🏆', country: 'International', tier: 'pro' } }),
      db.tournament.create({ data: { name: 'TT Cup', icon: '🥇', country: 'International', tier: 'pro' } }),
      db.tournament.create({ data: { name: 'Setka Cup', icon: '🏅', country: 'International', tier: 'pro' } }),
      db.tournament.create({ data: { name: 'Win Cup', icon: '⭐', country: 'International', tier: 'pro' } }),
      db.tournament.create({ data: { name: 'Ukrainian TT League', icon: '🇺🇦', country: 'Ukraine', tier: 'league' } }),
    ]);

    // === PLAYERS ===
    const playerData = [
      { name: 'Zhang Wei', country: 'Китай', flag: '🇨🇳', rating: 2847, wins: 342, losses: 78, winsLast10: 9, formStreak: 9, playStyle: 'offensive' },
      { name: 'Li Chen', country: 'Китай', flag: '🇨🇳', rating: 2791, wins: 298, losses: 92, winsLast10: 7, formStreak: 5, playStyle: 'balanced' },
      { name: 'Wang Hao', country: 'Китай', flag: '🇨🇳', rating: 2756, wins: 267, losses: 103, winsLast10: 8, formStreak: 4, playStyle: 'offensive' },
      { name: 'Liu Yang', country: 'Китай', flag: '🇨🇳', rating: 2712, wins: 245, losses: 118, winsLast10: 6, formStreak: 2, playStyle: 'defensive' },
      { name: 'Ivan Petrov', country: 'Россия', flag: '🇷🇺', rating: 2589, wins: 201, losses: 87, winsLast10: 6, formStreak: 3, playStyle: 'balanced' },
      { name: 'Alexei Smirnov', country: 'Россия', flag: '🇷🇺', rating: 2534, wins: 178, losses: 94, winsLast10: 5, formStreak: -2, playStyle: 'offensive' },
      { name: 'Dmitri Koval', country: 'Россия', flag: '🇷🇺', rating: 2487, wins: 156, losses: 102, winsLast10: 4, formStreak: -4, playStyle: 'defensive' },
      { name: 'Pavel Novak', country: 'Чехия', flag: '🇨🇿', rating: 2512, wins: 189, losses: 91, winsLast10: 7, formStreak: 1, playStyle: 'balanced' },
      { name: 'Tomas Cerny', country: 'Чехия', flag: '🇨🇿', rating: 2467, wins: 167, losses: 98, winsLast10: 5, formStreak: -1, playStyle: 'serve_volley' },
      { name: 'Andriy Bondar', country: 'Украина', flag: '🇺🇦', rating: 2489, wins: 174, losses: 89, winsLast10: 8, formStreak: 7, playStyle: 'offensive' },
      { name: 'Oleksandr Kovalchuk', country: 'Украина', flag: '🇺🇦', rating: 2445, wins: 158, losses: 107, winsLast10: 3, formStreak: -3, playStyle: 'balanced' },
      { name: 'Arman Kazakov', country: 'Казахстан', flag: '🇰🇿', rating: 2423, wins: 145, losses: 98, winsLast10: 7, formStreak: 3, playStyle: 'balanced' },
      { name: 'Daniyar Nurgaliyev', country: 'Казахстан', flag: '🇰🇿', rating: 2389, wins: 132, losses: 112, winsLast10: 4, formStreak: -5, playStyle: 'defensive' },
      { name: 'Carlos Mendez', country: 'Испания', flag: '🇪🇸', rating: 2478, wins: 171, losses: 93, winsLast10: 5, formStreak: -2, playStyle: 'offensive' },
      { name: 'Javier Ruiz', country: 'Испания', flag: '🇪🇸', rating: 2434, wins: 152, losses: 101, winsLast10: 4, formStreak: 0, playStyle: 'defensive' },
      { name: 'Kenji Tanaka', country: 'Япония', flag: '🇯🇵', rating: 2623, wins: 223, losses: 84, winsLast10: 8, formStreak: 6, playStyle: 'offensive' },
      { name: 'Yuki Yamamoto', country: 'Япония', flag: '🇯🇵', rating: 2578, wins: 198, losses: 92, winsLast10: 6, formStreak: 2, playStyle: 'balanced' },
    ];

    const players = await Promise.all(
      playerData.map(p => db.player.create({ data: p }))
    );

    const p = (name: string) => players.find(pl => pl.name === name)!.id;

    // === MATCHES ===
    const now = new Date();
    const h = (hours: number) => new Date(now.getTime() + hours * 3600000);

    const matchData = [
      // Upcoming matches (user said: no live analysis, collect odds once a day)
      { p1: p('Zhang Wei'), p2: p('Ivan Petrov'), t: tournaments[0].id, start: h(1), status: 'upcoming', o1: 1.35, o2: 3.20, botd: true, sets1: 0, sets2: 0 },
      { p1: p('Pavel Novak'), p2: p('Alexei Smirnov'), t: tournaments[0].id, start: h(2), status: 'upcoming', o1: 2.10, o2: 1.75, botd: false, sets1: 0, sets2: 0 },
      { p1: p('Carlos Mendez'), p2: p('Wang Hao'), t: tournaments[1].id, start: h(3), status: 'upcoming', o1: 4.50, o2: 1.18, botd: false, sets1: 0, sets2: 0 },
      { p1: p('Kenji Tanaka'), p2: p('Andriy Bondar'), t: tournaments[2].id, start: h(4), status: 'upcoming', o1: 1.90, o2: 1.95, botd: false, sets1: 0, sets2: 0 },
      { p1: p('Arman Kazakov'), p2: p('Daniyar Nurgaliyev'), t: tournaments[3].id, start: h(5), status: 'upcoming', o1: 2.40, o2: 1.55, botd: false, sets1: 0, sets2: 0 },
      { p1: p('Li Chen'), p2: p('Kenji Tanaka'), t: tournaments[0].id, start: h(6), status: 'upcoming', o1: 1.55, o2: 2.45, botd: false, sets1: 0, sets2: 0 },
      { p1: p('Tomas Cerny'), p2: p('Daniyar Nurgaliyev'), t: tournaments[1].id, start: h(7), status: 'upcoming', o1: 3.80, o2: 1.25, botd: false, sets1: 0, sets2: 0 },
      { p1: p('Dmitri Koval'), p2: p('Oleksandr Kovalchuk'), t: tournaments[4].id, start: h(8), status: 'upcoming', o1: 2.80, o2: 1.42, botd: false, sets1: 0, sets2: 0 },
      { p1: p('Liu Yang'), p2: p('Yuki Yamamoto'), t: tournaments[2].id, start: h(9), status: 'upcoming', o1: 1.65, o2: 2.25, botd: false, sets1: 0, sets2: 0 },
      { p1: p('Alexei Smirnov'), p2: p('Carlos Mendez'), t: tournaments[3].id, start: h(10), status: 'upcoming', o1: 1.45, o2: 2.75, botd: false, sets1: 0, sets2: 0 },
      { p1: p('Andriy Bondar'), p2: p('Dmitri Koval'), t: tournaments[0].id, start: h(11), status: 'upcoming', o1: 1.80, o2: 2.05, botd: false, sets1: 0, sets2: 0 },
      { p1: p('Daniyar Nurgaliyev'), p2: p('Ivan Petrov'), t: tournaments[1].id, start: h(12), status: 'upcoming', o1: 5.20, o2: 1.14, botd: false, sets1: 0, sets2: 0 },
      { p1: p('Oleksandr Kovalchuk'), p2: p('Pavel Novak'), t: tournaments[4].id, start: h(13), status: 'upcoming', o1: 7.50, o2: 1.08, botd: false, sets1: 0, sets2: 0 },
      { p1: p('Arman Kazakov'), p2: p('Javier Ruiz'), t: tournaments[3].id, start: h(14), status: 'upcoming', o1: 1.70, o2: 2.15, botd: false, sets1: 0, sets2: 0 },
      // Completed matches (for accuracy stats)
      { p1: p('Wang Hao'), p2: p('Carlos Mendez'), t: tournaments[1].id, start: h(-24), status: 'completed', o1: 1.45, o2: 2.70, botd: false, sets1: 3, sets2: 1, winner: p('Wang Hao') },
      { p1: p('Kenji Tanaka'), p2: p('Dmitri Koval'), t: tournaments[2].id, start: h(-25), status: 'completed', o1: 2.10, o2: 1.75, botd: false, sets1: 3, sets2: 0, winner: p('Kenji Tanaka') },
      { p1: p('Pavel Novak'), p2: p('Li Chen'), t: tournaments[0].id, start: h(-26), status: 'completed', o1: 1.90, o2: 1.90, botd: false, sets1: 1, sets2: 3, winner: p('Li Chen') },
      { p1: p('Andriy Bondar'), p2: p('Arman Kazakov'), t: tournaments[3].id, start: h(-27), status: 'completed', o1: 3.40, o2: 1.30, botd: false, sets1: 3, sets2: 2, winner: p('Andriy Bondar') },
      { p1: p('Ivan Petrov'), p2: p('Javier Ruiz'), t: tournaments[3].id, start: h(-28), status: 'completed', o1: 1.60, o2: 2.30, botd: false, sets1: 3, sets2: 1, winner: p('Ivan Petrov') },
      { p1: p('Tomas Cerny'), p2: p('Yuki Yamamoto'), t: tournaments[2].id, start: h(-29), status: 'completed', o1: 2.30, o2: 1.60, botd: false, sets1: 1, sets2: 3, winner: p('Yuki Yamamoto') },
      { p1: p('Zhang Wei'), p2: p('Daniyar Nurgaliyev'), t: tournaments[1].id, start: h(-30), status: 'completed', o1: 1.20, o2: 4.50, botd: false, sets1: 3, sets2: 0, winner: p('Zhang Wei') },
      { p1: p('Oleksandr Kovalchuk'), p2: p('Liu Yang'), t: tournaments[4].id, start: h(-31), status: 'completed', o1: 4.10, o2: 1.25, botd: false, sets1: 1, sets2: 3, winner: p('Liu Yang') },
      { p1: p('Li Chen'), p2: p('Dmitri Koval'), t: tournaments[0].id, start: h(-48), status: 'completed', o1: 1.35, o2: 3.10, botd: false, sets1: 3, sets2: 0, winner: p('Li Chen') },
      { p1: p('Zhang Wei'), p2: p('Tomas Cerny'), t: tournaments[1].id, start: h(-49), status: 'completed', o1: 1.25, o2: 3.80, botd: false, sets1: 3, sets2: 0, winner: p('Zhang Wei') },
    ];

    const matches = await Promise.all(
      matchData.map(m => db.match.create({
        data: {
          player1Id: m.p1, player2Id: m.p2, tournamentId: m.t,
          startTime: m.start, status: m.status, isBetOfTheDay: m.botd,
          sets1: m.sets1, sets2: m.sets2, winnerId: m.winner,
        }
      }))
    );

    // === BOOKMAKER ODDS ===
    await Promise.all(
      matchData.map((m, i) => db.bookmakerOdds.create({
        data: { matchId: matches[i].id, source: 'fonbet', odds1: m.o1, odds2: m.o2 }
      }))
    );

    // === PREDICTIONS (AI analysis for each match) ===
    function calcPrediction(p1Rating: number, p2Rating: number, odds1: number, odds2: number) {
      const total = p1Rating + p2Rating;
      const baseProb = p1Rating / total;
      // Adjust by odds (if odds are very high, maybe bookmaker knows something)
      const bookImplied1 = 1 / odds1;
      const bookImplied2 = 1 / odds2;
      const bookTotal = bookImplied1 + bookImplied2;
      const adjImplied1 = bookImplied1 / bookTotal;

      const weightRating = 0.6;
      const weightBook = 0.4;
      const aiProb = baseProb * weightRating + adjImplied1 * weightBook;

      const predictedWinner = aiProb > 0.5 ? 'player1' : 'player2';
      const confidence = Math.min(95, Math.max(50, 50 + Math.abs(aiProb - 0.5) * 150));
      const bookmakerImplied = predictedWinner === 'player1' ? adjImplied1 : (1 / odds2) / bookTotal;
      const edge = aiProb * 100 - bookmakerImplied * 100;
      const isValue = edge > 10 && confidence > 55;

      return { predictedWinner, confidence: Math.round(confidence), edge: Math.round(edge), isValue, aiProb: Math.round(aiProb * 100) };
    }

    const predMap = new Map<string, number>(); // matchIndex -> prediction winner playerId
    for (let i = 0; i < matchData.length; i++) {
      const m = matchData[i];
      const p1 = playerData.find(pl => pl.name === players.find(pp => pp.id === m.p1)?.name)!;
      const p2 = playerData.find(pl => pl.name === players.find(pp => pp.id === m.p2)?.name)!;
      const pred = calcPrediction(p1.rating, p2.rating, m.o1, m.o2);

      const winnerId = pred.predictedWinner === 'player1' ? m.p1 : m.p2;
      const predictedOdds = pred.predictedWinner === 'player1' ? m.o1 : m.o2;
      predMap.set(matches[i].id, winnerId);

      await db.prediction.create({
        data: {
          matchId: matches[i].id,
          playerId: winnerId,
          aiProbability: pred.aiProb,
          confidence: pred.confidence,
          bookmakerOdds: predictedOdds,
          valueScore: pred.edge,
          isValueBet: pred.isValue,
          analysis: `AI анализ на основе ${p1.wins}W/${p1.losses}L (рейтинг ${p1.rating}) vs ${p2.wins}W/${p2.losses}L (рейтинг ${p2.rating}). Форма: ${p1.name} ${p1.winsLast10}/10 последних, ${p2.name} ${p2.winsLast10}/10. Стиль: ${p1.playStyle} vs ${p2.playStyle}.`,
          recommendation: pred.isValue ? `Value bet на ${pred.predictedWinner === 'player1' ? p1.name : p2.name} @ ${predictedOdds.toFixed(2)} (edge +${pred.edge}%)` : `Рекомендуется ставка на ${pred.predictedWinner === 'player1' ? p1.name : p2.name}`,
          modelUsed: 'ensemble',
          isCorrect: m.status === 'completed' ? winnerId === m.winner : null,
          settledAt: m.status === 'completed' ? new Date() : null,
        }
      });
    }

    // === VALUE BETS ===
    for (let i = 0; i < matchData.length; i++) {
      const m = matchData[i];
      if (m.status === 'upcoming') {
        const p1 = playerData.find(pl => pl.name === players.find(pp => pp.id === m.p1)?.name)!;
        const p2 = playerData.find(pl => pl.name === players.find(pp => pp.id === m.p2)?.name)!;
        const pred = calcPrediction(p1.rating, p2.rating, m.o1, m.o2);
        if (pred.isValue || Math.max(m.o1, m.o2) >= 3.0) {
          const highOddsPlayer = m.o1 > m.o2 ? m.p1 : m.p2;
          const highOdds = Math.max(m.o1, m.o2);
          const highOddsName = players.find(pp => pp.id === highOddsPlayer)?.name ?? '';
          await db.valueBet.create({
            data: {
              matchId: matches[i].id,
              playerName: highOddsName,
              odds: highOdds,
              aiProbability: pred.aiProb,
              bookmakerImplied: Math.round((1 / highOdds) * 100),
              edge: pred.edge,
              confidence: pred.confidence,
              recommendation: highOdds >= 5.0 ? '🔥 Высокий коэффициент — маловероятный исход с хорошим бонусом' : pred.isValue ? '💎 Value bet — коэффициент выше ожидаемого' : '📊 Анализируется',
            }
          });
        }
      }
    }

    // === BETS ===
    await Promise.all([
      db.bet.create({ data: { match: { connect: { id: matches[0].id } }, matchLabel: 'Zhang Wei vs Ivan Petrov', selection: 'Zhang Wei', odds: 1.35, stake: 5000, result: 'pending', payout: 0, aiSuggested: true, aiProbability: 78, isValueBet: false } }),
      db.bet.create({ data: { match: { connect: { id: matches[1].id } }, matchLabel: 'Pavel Novak vs Alexei Smirnov', selection: 'Alexei Smirnov', odds: 1.75, stake: 3000, result: 'pending', payout: 0, aiSuggested: true, aiProbability: 65, isValueBet: false } }),
      db.bet.create({ data: { match: { connect: { id: matches[14].id } }, matchLabel: 'Wang Hao vs Carlos Mendez', selection: 'Wang Hao', odds: 1.45, stake: 4000, result: 'won', payout: 5800, aiSuggested: true, aiProbability: 82, isValueBet: false, settledAt: h(-23) } }),
      db.bet.create({ data: { match: { connect: { id: matches[15].id } }, matchLabel: 'Kenji Tanaka vs Dmitri Koval', selection: 'Kenji Tanaka', odds: 2.10, stake: 2000, result: 'won', payout: 4200, aiSuggested: true, aiProbability: 70, isValueBet: true, settledAt: h(-24) } }),
      db.bet.create({ data: { match: { connect: { id: matches[16].id } }, matchLabel: 'Pavel Novak vs Li Chen', selection: 'Pavel Novak', odds: 1.90, stake: 3500, result: 'lost', payout: 0, aiSuggested: false, aiProbability: 52, isValueBet: false, settledAt: h(-25) } }),
      db.bet.create({ data: { match: { connect: { id: matches[17].id } }, matchLabel: 'Andriy Bondar vs Arman Kazakov', selection: 'Andriy Bondar', odds: 3.40, stake: 1500, result: 'won', payout: 5100, aiSuggested: true, aiProbability: 38, isValueBet: true, settledAt: h(-26) } }),
      db.bet.create({ data: { match: { connect: { id: matches[18].id } }, matchLabel: 'Ivan Petrov vs Javier Ruiz', selection: 'Ivan Petrov', odds: 1.60, stake: 5000, result: 'won', payout: 8000, aiSuggested: true, aiProbability: 72, isValueBet: false, settledAt: h(-27) } }),
      db.bet.create({ data: { match: { connect: { id: matches[19].id } }, matchLabel: 'Tomas Cerny vs Yuki Yamamoto', selection: 'Tomas Cerny', odds: 2.30, stake: 2000, result: 'lost', payout: 0, aiSuggested: false, aiProbability: 45, isValueBet: false, settledAt: h(-28) } }),
      db.bet.create({ data: { match: { connect: { id: matches[20].id } }, matchLabel: 'Zhang Wei vs Daniyar Nurgaliyev', selection: 'Zhang Wei', odds: 1.20, stake: 8000, result: 'won', payout: 9600, aiSuggested: true, aiProbability: 88, isValueBet: false, settledAt: h(-29) } }),
      db.bet.create({ data: { match: { connect: { id: matches[21].id } }, matchLabel: 'Oleksandr Kovalchuk vs Liu Yang', selection: 'Oleksandr Kovalchuk', odds: 4.10, stake: 1000, result: 'lost', payout: 0, aiSuggested: false, aiProbability: 28, isValueBet: false, settledAt: h(-30) } }),
    ]);

    // === PREDICTION SOURCES ===
    await Promise.all([
      db.predictionSource.create({ data: { name: '@ttncup', platform: 'telegram', url: 'https://t.me/ttncup', language: 'ru', followerCount: 5200, verified: true, accuracy: 72, totalPicks: 340, lastActive: h(-1), isActive: true } }),
      db.predictionSource.create({ data: { name: '@TTBeastFree', platform: 'telegram', url: 'https://t.me/TTBeastFree', language: 'en', followerCount: 12400, verified: false, accuracy: 65, totalPicks: 890, lastActive: h(-2), isActive: true } }),
      db.predictionSource.create({ data: { name: '@Table_Tips', platform: 'telegram', url: 'https://t.me/Table_Tips', language: 'en', followerCount: 3200, verified: false, accuracy: 58, totalPicks: 210, lastActive: h(-5), isActive: true } }),
      db.predictionSource.create({ data: { name: 'SportsGambler', platform: 'website', url: 'https://www.sportsgambler.com/betting-tips/table-tennis', language: 'en', followerCount: 85000, verified: true, accuracy: 68, totalPicks: 1200, lastActive: h(-0.5), isActive: true } }),
      db.predictionSource.create({ data: { name: 'PingPongBets', platform: 'website', url: 'https://pingpongbets.com/tips', language: 'en', followerCount: 15000, verified: false, accuracy: 63, totalPicks: 560, lastActive: h(-1), isActive: true } }),
      db.predictionSource.create({ data: { name: 'Oddspedia', platform: 'website', url: 'https://oddspedia.com/table-tennis/tips', language: 'en', followerCount: 120000, verified: true, accuracy: 70, totalPicks: 2300, lastActive: h(-0.2), isActive: true } }),
      db.predictionSource.create({ data: { name: 'TTEdge AI', platform: 'website', url: 'https://ttedge.ai', language: 'en', followerCount: 8000, verified: true, accuracy: 74, totalPicks: 420, lastActive: h(-1), isActive: true } }),
      db.predictionSource.create({ data: { name: 'Live2Sport', platform: 'website', url: 'https://live2sport.com/Table-Tennis.php', language: 'en', followerCount: 22000, verified: false, accuracy: 61, totalPicks: 780, lastActive: h(-3), isActive: true } }),
    ]);

    // === AI MODELS ===
    await Promise.all([
      db.aIModel.create({ data: { name: 'Elo Rating Engine', slug: 'elo-engine', icon: '🏆', color: '#00FF88', isActive: true, accuracy: 71.2, roi: 10.5 } }),
      db.aIModel.create({ data: { name: 'Style Analyzer', slug: 'style-analyzer', icon: '🥋', color: '#FF6B35', isActive: true, accuracy: 65.8, roi: 6.2 } }),
      db.aIModel.create({ data: { name: 'Statistical Model', slug: 'statistical', icon: '📊', color: '#FFD700', isActive: true, accuracy: 68.4, roi: 8.1 } }),
      db.aIModel.create({ data: { name: 'LLM Expert', slug: 'llm-expert', icon: '🤖', color: '#FF3366', isActive: true, accuracy: 73.6, roi: 13.2 } }),
      db.aIModel.create({ data: { name: 'Ensemble', slug: 'ensemble', icon: '🧠', color: '#00CCFF', isActive: true, accuracy: 73.4, roi: 12.8 } }),
    ]);

    // === HEAD TO HEAD (for top matchups) ===
    await Promise.all([
      db.headToHead.create({ data: { player1Id: p('Zhang Wei'), player2Id: p('Ivan Petrov'), wins1: 8, wins2: 2, lastMatch: h(-48) } }),
      db.headToHead.create({ data: { player1Id: p('Alexei Smirnov'), player2Id: p('Pavel Novak'), wins1: 6, wins2: 4, lastMatch: h(-72) } }),
      db.headToHead.create({ data: { player1Id: p('Kenji Tanaka'), player2Id: p('Andriy Bondar'), wins1: 5, wins2: 3, lastMatch: h(-96) } }),
      db.headToHead.create({ data: { player1Id: p('Wang Hao'), player2Id: p('Carlos Mendez'), wins1: 7, wins2: 1, lastMatch: h(-24) } }),
    ]);

    return NextResponse.json({
      success: true,
      seeded: {
        players: players.length,
        tournaments: tournaments.length,
        matches: matches.length,
        sources: 8,
        models: 5,
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
