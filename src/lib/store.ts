import { create } from 'zustand'

export interface Match {
  id: string
  player1: string
  player2: string
  tournament?: string
  startTime: string
  status: string
  odds1?: number
  odds2?: number
  source?: string
  sport?: string
  league?: string
  score1?: number
  score2?: number
  winner?: string
  predictions?: Prediction[]
}

export interface Prediction {
  id: string
  predictedWinner: string
  confidence: number
  reasoning: string
  predictor?: string
  timestamp?: string
}

export interface Bet {
  id: string
  matchId: string
  predictedWinner: string
  odds?: number
  stake: number
  potentialWin?: number
  result?: string
  isWin?: boolean
  payout?: number
  status: string
  profit: number
  createdAt?: string
  match?: { player1: string; player2: string }
}

export interface Stats {
  totalMatches: number
  correctPredictions: number
  avgConfidence: number
  winRate: number
  totalBets: number
  totalProfit: number
}

export interface Player {
  id: string
  name: string
  country?: string
  rank: number
  wins: number
  losses: number
  winRate?: number
  avgOdds?: number
  rating: number
}

export interface Predictor {
  id: string
  name: string
  platform?: string
  tier: string
  accuracy: number
  totalPredictions: number
  verified: boolean
  bio?: string
  specialization?: string
  avatarEmoji?: string
  followers?: number
  currentStreak?: number
  bestStreak?: number
  tags?: string
  channel?: string
}

export interface CollectionLog {
  id: string
  source: string
  matchesCollected: number
  status: string
  createdAt: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface BankrollEntry {
  id: string
  type: string
  amount: number
  balance: number
  description: string
  createdAt: string
}

export interface BankrollState {
  id?: string
  currentAmount: number
  initialAmount: number
  strategy: string
  riskLevel: string
  flatAmount: number
  percentage: number
  kellyFraction: number
  stopLoss: number
  takeProfit: number
  peakAmount: number
  maxDrawdown: number
  totalDeposits: number
  totalWithdrawals: number
  totalBets: number
  wonBets: number
  lostBets: number
  totalProfit: number
  winRate: number
  entries?: BankrollEntry[]
}

export interface AiBankrollState {
  id?: string
  currentAmount: number
  initialAmount: number
  peakAmount: number
  maxDrawdown: number
  totalBets: number
  wonBets: number
  lostBets: number
  pendingBets: number
  totalProfit: number
  winRate: number
  flatAmount: number
}

export interface AppState {
  matches: Match[]
  bets: Bet[]
  stats: Stats | null
  players: Player[]
  predictors: Predictor[]
  collectionLogs: CollectionLog[]
  chatMessages: ChatMessage[]
  bankroll: BankrollState
  aiBankroll: AiBankrollState
  loading: boolean
  setMatches: (matches: Match[]) => void
  setBets: (bets: Bet[]) => void
  setStats: (stats: Stats) => void
  setPlayers: (players: Player[]) => void
  setPredictors: (predictors: Predictor[]) => void
  setCollectionLogs: (logs: CollectionLog[]) => void
  addChatMessage: (message: ChatMessage) => void
  setBankroll: (bankroll: BankrollState) => void
  setAiBankroll: (bankroll: AiBankrollState) => void
  setLoading: (loading: boolean) => void
  updateMatch: (id: string, data: Partial<Match>) => void
  fetchMatches: () => Promise<void>
  fetchBets: () => Promise<void>
  fetchStats: () => Promise<void>
  fetchPlayers: () => Promise<void>
  fetchPredictors: () => Promise<void>
  fetchCollectionLogs: () => Promise<void>
  fetchBankroll: () => Promise<void>
  fetchAiBankroll: () => Promise<void>
}

const defaultBankroll: BankrollState = {
  currentAmount: 5000,
  initialAmount: 5000,
  strategy: 'flat',
  riskLevel: 'medium',
  flatAmount: 100,
  percentage: 3,
  kellyFraction: 0.25,
  stopLoss: 0,
  takeProfit: 0,
  peakAmount: 5000,
  maxDrawdown: 0,
  totalDeposits: 0,
  totalWithdrawals: 0,
  totalBets: 0,
  wonBets: 0,
  lostBets: 0,
  totalProfit: 0,
  winRate: 0,
}

export const useAppStore = create<AppState>((set, get) => ({
  matches: [],
  bets: [],
  stats: null,
  players: [],
  predictors: [],
  collectionLogs: [],
  chatMessages: [
    { role: 'assistant', content: 'Welcome to TT Predict Pro AI Assistant! I can help you analyze table tennis matches, provide betting insights, and explain prediction strategies. How can I help you today?' }
  ],
  bankroll: defaultBankroll,
  aiBankroll: {
    currentAmount: 5000,
    initialAmount: 5000,
    peakAmount: 5000,
    maxDrawdown: 0,
    totalBets: 0,
    wonBets: 0,
    lostBets: 0,
    pendingBets: 0,
    totalProfit: 0,
    winRate: 0,
    flatAmount: 50,
  },
  loading: false,

  setMatches: (matches) => set({ matches }),
  setBets: (bets) => set({ bets }),
  setStats: (stats) => set({ stats }),
  setPlayers: (players) => set({ players }),
  setPredictors: (predictors) => set({ predictors }),
  setCollectionLogs: (logs) => set({ collectionLogs }),
  addChatMessage: (message) => set((s) => ({ chatMessages: [...s.chatMessages, message] })),
  setBankroll: (bankroll) => set({ bankroll }),
  setAiBankroll: (bankroll) => set({ aiBankroll: bankroll }),
  setLoading: (loading) => set({ loading }),
  updateMatch: (id, data) =>
    set((s) => ({
      matches: s.matches.map((m) => (m.id === id ? { ...m, ...data } : m)),
    })),

  fetchMatches: async () => {
    try {
      const res = await fetch('/api/matches')
      if (res.ok) {
        const data = await res.json()
        set({ matches: data })
      }
    } catch (e) {
      console.error('Failed to fetch matches:', e)
    }
  },

  fetchBets: async () => {
    try {
      const res = await fetch('/api/bets')
      if (res.ok) {
        const data = await res.json()
        set({ bets: data })
      }
    } catch (e) {
      console.error('Failed to fetch bets:', e)
    }
  },

  fetchStats: async () => {
    try {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json()
        set({ stats: data })
      }
    } catch (e) {
      console.error('Failed to fetch stats:', e)
    }
  },

  fetchPlayers: async () => {
    try {
      const res = await fetch('/api/players')
      if (res.ok) {
        const data = await res.json()
        set({ players: data })
      }
    } catch (e) {
      console.error('Failed to fetch players:', e)
    }
  },

  fetchPredictors: async () => {
    try {
      const res = await fetch('/api/predictors')
      if (res.ok) {
        const data = await res.json()
        set({ predictors: data })
      }
    } catch (e) {
      console.error('Failed to fetch predictors:', e)
    }
  },

  fetchCollectionLogs: async () => {
    try {
      const res = await fetch('/api/collection-logs')
      if (res.ok) {
        const data = await res.json()
        set({ collectionLogs: data })
      }
    } catch (e) {
      console.error('Failed to fetch collection logs:', e)
    }
  },

  fetchBankroll: async () => {
    try {
      const res = await fetch('/api/bankroll')
      if (res.ok) {
        const data = await res.json()
        set({ bankroll: data })
      }
    } catch (e) {
      console.error('Failed to fetch bankroll:', e)
    }
  },

  fetchAiBankroll: async () => {
    try {
      const res = await fetch('/api/ai-bankroll')
      if (res.ok) {
        const data = await res.json()
        set({ aiBankroll: data })
      }
    } catch (e) {
      console.error('Failed to fetch AI bankroll:', e)
    }
  },
}))
