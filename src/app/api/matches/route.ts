import { NextResponse } from 'next/server'

export async function GET() {
  const matches = [
    { id: 'm1', player1: 'Fan Zhendong', player2: 'Tomokazu Harimoto', tournament: 'WTT Grand Smash 2025', startTime: new Date().toISOString(), status: 'live', odds1: 1.55, odds2: 2.40, source: 'BetBoom', score1: 2, score2: 1, predictions: [{ id: 'p1', predictedWinner: 'Fan Zhendong', confidence: 0.82, reasoning: 'Strong forehand consistency and recent tournament wins against top players.', predictor: 'AI Model v3' }] },
    { id: 'm2', player1: 'Truls Moregard', player2: 'Lin Gaoyuan', tournament: 'WTT Contender 2025', startTime: new Date(Date.now() + 3600000).toISOString(), status: 'upcoming', odds1: 2.10, odds2: 1.75, source: 'Fonbet', score1: 0, score2: 0, predictions: [] },
    { id: 'm3', player1: 'Wang Chuqin', player2: 'Dimitrij Ovtcharov', tournament: 'WTT Grand Smash 2025', startTime: new Date(Date.now() + 7200000).toISOString(), status: 'upcoming', odds1: 1.40, odds2: 2.90, source: 'BetBoom', score1: 0, score2: 0, predictions: [{ id: 'p2', predictedWinner: 'Wang Chuqin', confidence: 0.75, reasoning: 'Aggressive backhand style puts pressure on Ovtcharov defensive game.', predictor: 'AI Model v3' }] },
    { id: 'm4', player1: 'Hugo Calderano', player2: 'Liang Jingkun', tournament: 'WTT Star Maker 2025', startTime: new Date().toISOString(), status: 'live', odds1: 1.90, odds2: 1.90, source: 'Fonbet', score1: 1, score2: 1, predictions: [] },
    { id: 'm5', player1: 'Jun Mizutani', player2: 'Patrick Franziska', tournament: 'WTT Contender 2025', startTime: new Date(Date.now() - 3600000).toISOString(), status: 'completed', odds1: 1.65, odds2: 2.25, source: 'BetBoom', score1: 3, score2: 1, predictions: [{ id: 'p3', predictedWinner: 'Jun Mizutani', confidence: 0.68, reasoning: 'Experience advantage in long rallies, consistent service game.', predictor: 'AI Model v3' }] },
    { id: 'm6', player1: 'Ma Long', player2: 'Timothy Wang', tournament: 'WTT Grand Smash 2025', startTime: new Date(Date.now() + 10800000).toISOString(), status: 'upcoming', odds1: 1.15, odds2: 5.50, source: 'Fonbet', score1: 0, score2: 0, predictions: [{ id: 'p4', predictedWinner: 'Ma Long', confidence: 0.95, reasoning: 'World number 1 with dominant win streak, superior technique across all aspects.', predictor: 'AI Model v3' }] },
    { id: 'm7', player1: 'Alexey Liventsov', player2: 'Koki Niwa', tournament: 'WTT Star Maker 2025', startTime: new Date(Date.now() - 7200000).toISOString(), status: 'completed', odds1: 3.20, odds2: 1.35, source: 'BetBoom', score1: 0, score2: 3, predictions: [] },
    { id: 'm8', player1: 'Kristian Karlsson', player2: 'Mattias Falck', tournament: 'WTT Contender 2025', startTime: new Date(Date.now() + 5400000).toISOString(), status: 'upcoming', odds1: 1.80, odds2: 2.00, source: 'Fonbet', score1: 0, score2: 0, predictions: [] },
  ]
  return NextResponse.json(matches)
}
