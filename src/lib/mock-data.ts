// Mock data for TTMind AI - Table Tennis Betting Analytics Platform

export interface Player {
  id: string;
  name: string;
  country: string;
  flag: string;
  rating: number;
  wins: number;
  losses: number;
}

export interface Match {
  id: string;
  player1: Player;
  player2: Player;
  tournament: string;
  tournamentIcon: string;
  startTime: string; // ISO string
  status: 'upcoming' | 'live' | 'completed';
  odds1: number;
  odds2: number;
  prediction: 'player1' | 'player2';
  confidence: number; // 0-100
  aiAnalysis: string;
  isValueBet: boolean;
  // Live match fields
  score1?: number;
  score2?: number;
  currentSet?: number;
  sets1?: number;
  sets2?: number;
  server?: 1 | 2;
  isBetOfTheDay?: boolean;
}

export interface Bet {
  id: string;
  matchId: string;
  player: string;
  odds: number;
  stake: number;
  status: 'pending' | 'won' | 'lost' | 'voided';
  match: string;
  date: string;
  potentialWin: number;
  actualWin?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AnalyticsData {
  totalMatches: number;
  accuracy: number;
  roi: number;
  bestStreak: number;
  currentStreak: number;
  accuracyHistory: { date: string; accuracy: number }[];
  tournamentBreakdown: { name: string; matches: number; wins: number; color: string }[];
  valueBetDistribution: { range: string; count: number }[];
  topPlayers: {
    rank: number;
    name: string;
    country: string;
    flag: string;
    matches: number;
    winRate: number;
    avgOdds: number;
  }[];
}

const players: Player[] = [
  { id: 'p1', name: 'Zhang Wei', country: 'Китай', flag: '🇨🇳', rating: 2847, wins: 342, losses: 78 },
  { id: 'p2', name: 'Li Chen', country: 'Китай', flag: '🇨🇳', rating: 2791, wins: 298, losses: 92 },
  { id: 'p3', name: 'Wang Hao', country: 'Китай', flag: '🇨🇳', rating: 2756, wins: 267, losses: 103 },
  { id: 'p4', name: 'Liu Yang', country: 'Китай', flag: '🇨🇳', rating: 2712, wins: 245, losses: 118 },
  { id: 'p5', name: 'Ivan Petrov', country: 'Россия', flag: '🇷🇺', rating: 2589, wins: 201, losses: 87 },
  { id: 'p6', name: 'Alexei Smirnov', country: 'Россия', flag: '🇷🇺', rating: 2534, wins: 178, losses: 94 },
  { id: 'p7', name: 'Dmitri Koval', country: 'Россия', flag: '🇷🇺', rating: 2487, wins: 156, losses: 102 },
  { id: 'p8', name: 'Pavel Novak', country: 'Чехия', flag: '🇨🇿', rating: 2512, wins: 189, losses: 91 },
  { id: 'p9', name: 'Tomas Cerny', country: 'Чехия', flag: '🇨🇿', rating: 2467, wins: 167, losses: 98 },
  { id: 'p10', name: 'Andriy Bondar', country: 'Украина', flag: '🇺🇦', rating: 2489, wins: 174, losses: 89 },
  { id: 'p11', name: 'Oleksandr Kovalchuk', country: 'Украина', flag: '🇺🇦', rating: 2445, wins: 158, losses: 107 },
  { id: 'p12', name: 'Arman Kazakov', country: 'Казахстан', flag: '🇰🇿', rating: 2423, wins: 145, losses: 98 },
  { id: 'p13', name: 'Daniyar Nurgaliyev', country: 'Казахстан', flag: '🇰🇿', rating: 2389, wins: 132, losses: 112 },
  { id: 'p14', name: 'Carlos Mendez', country: 'Испания', flag: '🇪🇸', rating: 2478, wins: 171, losses: 93 },
  { id: 'p15', name: 'Javier Ruiz', country: 'Испания', flag: '🇪🇸', rating: 2434, wins: 152, losses: 101 },
  { id: 'p16', name: 'Kenji Tanaka', country: 'Япония', flag: '🇯🇵', rating: 2623, wins: 223, losses: 84 },
  { id: 'p17', name: 'Yuki Yamamoto', country: 'Япония', flag: '🇯🇵', rating: 2578, wins: 198, losses: 92 },
];

function getFutureTime(hoursFromNow: number): string {
  const d = new Date();
  d.setHours(d.getHours() + hoursFromNow);
  return d.toISOString();
}

export const matches: Match[] = [
  {
    id: 'm1',
    player1: players[0], player2: players[4],
    tournament: 'Liga Pro', tournamentIcon: '🏆',
    startTime: getFutureTime(1),
    status: 'live',
    odds1: 1.35, odds2: 3.20,
    prediction: 'player1', confidence: 78,
    aiAnalysis: 'Zhang Wei имеет подавляющее преимущество в подачах и обороне. Статистика личных встреч: 8-2 в пользу китайского игрока. Petrov слаб на дальних подачах.',
    isValueBet: false,
    score1: 2, score2: 1,
    currentSet: 4, sets1: 2, sets2: 1,
    server: 1,
    isBetOfTheDay: true,
  },
  {
    id: 'm2',
    player1: players[7], player2: players[5],
    tournament: 'Liga Pro', tournamentIcon: '🏆',
    startTime: getFutureTime(0.5),
    status: 'live',
    odds1: 2.10, odds2: 1.75,
    prediction: 'player2', confidence: 65,
    aiAnalysis: 'Smirnov показывает стабильный результат на этом покрытии. Novak имеет проблемы с обратным спином. Рекомендуем ставку на игрока 2.',
    isValueBet: false,
    score1: 1, score2: 2,
    currentSet: 4, sets1: 1, sets2: 2,
    server: 2,
  },
  {
    id: 'm3',
    player1: players[14], player2: players[2],
    tournament: 'TT Cup', tournamentIcon: '🥇',
    startTime: getFutureTime(2),
    status: 'upcoming',
    odds1: 4.50, odds2: 1.18,
    prediction: 'player2', confidence: 82,
    aiAnalysis: 'Wang Hao — топ-10 мировой рейтинг. Mendez не имеет шансов на дальних розыгрышах. AI модели дают 82% вероятности победы Wang Hao.',
    isValueBet: true,
  },
  {
    id: 'm4',
    player1: players[15], player2: players[9],
    tournament: 'Setka Cup', tournamentIcon: '🏅',
    startTime: getFutureTime(3),
    status: 'upcoming',
    odds1: 1.90, odds2: 1.95,
    prediction: 'player1', confidence: 58,
    aiAnalysis: 'Равный матч. Tanaka имеет небольшое преимущество в скорости. Bondar силён на обороне. Рекомендуем малую ставку.',
    isValueBet: false,
  },
  {
    id: 'm5',
    player1: players[11], player2: players[12],
    tournament: 'Win Cup', tournamentIcon: '⭐',
    startTime: getFutureTime(4),
    status: 'upcoming',
    odds1: 2.40, odds2: 1.55,
    prediction: 'player1', confidence: 61,
    aiAnalysis: 'Kazakov стабилен на домашнем покрытии. Nurgaliyev проиграл 3 из последних 5 матчей. Valor bet при коэффициенте 2.40.',
    isValueBet: true,
  },
  {
    id: 'm6',
    player1: players[1], player2: players[15],
    tournament: 'Liga Pro', tournamentIcon: '🏆',
    startTime: getFutureTime(5),
    status: 'upcoming',
    odds1: 1.55, odds2: 2.45,
    prediction: 'player1', confidence: 72,
    aiAnalysis: 'Li Chen демонстрирует отличную форму. Tanaka играет агрессивно, но часто ошибается при давлении.',
    isValueBet: false,
  },
  {
    id: 'm7',
    player1: players[8], player2: players[13],
    tournament: 'TT Cup', tournamentIcon: '🥇',
    startTime: getFutureTime(6),
    status: 'upcoming',
    odds1: 3.80, odds2: 1.25,
    prediction: 'player2', confidence: 85,
    aiAnalysis: 'Nurgaliyev значительно ниже рейтингом. Модель AI уверена в победе Kazakova. Стабильность подачи — ключевой фактор.',
    isValueBet: false,
  },
  {
    id: 'm8',
    player1: players[6], player2: players[10],
    tournament: 'Ukrainian TT League', tournamentIcon: '🇺🇦',
    startTime: getFutureTime(1.5),
    status: 'live',
    odds1: 2.80, odds2: 1.42,
    prediction: 'player2', confidence: 68,
    aiAnalysis: 'Kovalchuk имеет преимущество домашнего турнира. Koval в плохой форме — проиграл 4 из 6 последних.',
    isValueBet: false,
    score1: 0, score2: 2,
    currentSet: 3, sets1: 0, sets2: 2,
    server: 2,
  },
  {
    id: 'm9',
    player1: players[3], player2: players[16],
    tournament: 'Setka Cup', tournamentIcon: '🏅',
    startTime: getFutureTime(7),
    status: 'upcoming',
    odds1: 1.65, odds2: 2.25,
    prediction: 'player1', confidence: 70,
    aiAnalysis: 'Liu Yang контролирует темп матча. Yamamoto нестабилен в третьем сете. AI прогнозирует победу в 4 сетах.',
    isValueBet: false,
  },
  {
    id: 'm10',
    player1: players[5], player2: players[14],
    tournament: 'Win Cup', tournamentIcon: '⭐',
    startTime: getFutureTime(8),
    status: 'upcoming',
    odds1: 1.45, odds2: 2.75,
    prediction: 'player1', confidence: 73,
    aiAnalysis: 'Smirnov доминирует в личных встречах (6-1). Mendez слаб на обратной стороне. Valor bet при 1.45.',
    isValueBet: true,
  },
  {
    id: 'm11',
    player1: players[9], player2: players[6],
    tournament: 'Liga Pro', tournamentIcon: '🏆',
    startTime: getFutureTime(9),
    status: 'upcoming',
    odds1: 1.80, odds2: 2.05,
    prediction: 'player1', confidence: 63,
    aiAnalysis: 'Bondar в отличной форме — 7 побед подряд. Koval нестабилен. Небольшое преимущество украинского игрока.',
    isValueBet: true,
  },
  {
    id: 'm12',
    player1: players[12], player2: players[4],
    tournament: 'TT Cup', tournamentIcon: '🥇',
    startTime: getFutureTime(10),
    status: 'upcoming',
    odds1: 5.20, odds2: 1.14,
    prediction: 'player2', confidence: 88,
    aiAnalysis: 'Petrov — опытный игрок с высоким рейтингом. Nurgaliyev ещё не побеждал соперников такого уровня. Максимальная уверенность AI.',
    isValueBet: false,
  },
  {
    id: 'm13',
    player1: players[10], player2: players[7],
    tournament: 'Ukrainian TT League', tournamentIcon: '🇺🇦',
    startTime: getFutureTime(3.5),
    status: 'upcoming',
    odds1: 7.50, odds2: 1.08,
    prediction: 'player2', confidence: 91,
    aiAnalysis: 'Kovalchuk — новичок против опытного Novak. Разрыв в рейтинге — 67 пунктов. AI рекомендует с осторожностью.',
    isValueBet: false,
  },
  {
    id: 'm14',
    player1: players[13], player2: players[11],
    tournament: 'Win Cup', tournamentIcon: '⭐',
    startTime: getFutureTime(11),
    status: 'upcoming',
    odds1: 1.70, odds2: 2.15,
    prediction: 'player1', confidence: 66,
    aiAnalysis: 'Kazakov на подъёме — выиграл последние 3 турнира. Nurgaliyev показывает средние результаты.',
    isValueBet: false,
  },
];

export const betHistory: Bet[] = [];

// NO DEMO DATA — real stats come from API only
export const analyticsData: AnalyticsData = {
  totalMatches: 0,
  accuracy: 0,
  roi: 0,
  bestStreak: 0,
  currentStreak: 0,
  accuracyHistory: [],
  tournamentBreakdown: [],
  valueBetDistribution: [],
  topPlayers: [],
};

export const tournaments = ['Все', 'Liga Pro', 'TT Cup', 'Setka Cup', 'Win Cup', 'Ukrainian TT League'];

export const quickActions = [
  { id: 'q1', label: 'Анализ матча', icon: '🔍' },
  { id: 'q2', label: 'Найти value bet', icon: '💎' },
  { id: 'q3', label: 'Статистика игрока', icon: '📈' },
  { id: 'q4', label: 'Совет по ставке', icon: '💡' },
];

export const aiResponses: Record<string, string> = {
  'Анализ матча': '📊 Анализ ближайшего матча **Zhang Wei vs Ivan Petrov**:\n\n• Zhang Wei — рейтинг 2847 (Топ-5 мир)\n• Petrov — рейтинг 2589\n• Личные встречи: 8-2 в пользу Zhang Wei\n• AI прогноз: победа Zhang Wei с вероятностью **78%**\n• Рекомендация: ставка на Zhang Wei @ 1.35\n\n⚡ Ключевые факторы:\n– Подача Zhang Wei — 94% точность\n– Petrov проигрывает 3 из 5 матчей против топ-китайцев\n– Форма: Zhang Wei — 9 побед подряд',
  'Найти value bet': '💎 Найдены value bets на сегодня:\n\n🔥 **Mendez vs Wang Hao** — Wang Hao @ 1.18\n   AI confidence: 82% | Истинная вероятность: 85%\n   Value: +3.8%\n\n🔥 **Kazakov vs Nurgaliyev** — Kazakov @ 2.40\n   AI confidence: 61% | Истинная вероятность: 52%\n   Value: +24.8%\n\n🔥 **Smirnov vs Mendez** — Smirnov @ 1.45\n   AI confidence: 73% | Истинная вероятность: 76%\n   Value: +5.5%\n\n💡 Совет: Фокус на Kazakov @ 2.40 — максимальный value!',
  'Статистика игрока': '📈 Статистика **Zhang Wei** 🇨🇳:\n\n• Рейтинг: 2847 (Топ-5 мир)\n• Матчи: 420 (342W / 78L)\n• Win Rate: **81.4%**\n• Средний коэффициент: 1.32\n• Текущая серия: **9 побед подряд**\n\n🏆 Турниры:\n– Liga Pro: 89% win rate\n– TT Cup: 78% win rate\n– Setka Cup: 82% win rate\n\n📈 Тренд: Восходящий — последние 30 дней +5.2%\n📊 ROI при ставках: +18.3%',
  'Совет по ставке': '💡 Совет по ставкам на сегодня:\n\n1️⃣ **Основная ставка**: Zhang Wei @ 1.35\n   Уверенность: 78% | Сумма: 5% банкролла\n\n2️⃣ **Value bet**: Kazakov @ 2.40\n   Уверенность: 61% | Сумма: 2% банкролла\n\n3️⃣ **Комбо**: Smirnov + Bondar @ 3.40\n   Совмещённая вероятность: 42%\n\n⚠️ Риск-менеджмент:\n– Максимальная ставка: 5% банкролла\n– Не более 3 ставок в день\n– Всегда используйте Kelly Criterion',
};
