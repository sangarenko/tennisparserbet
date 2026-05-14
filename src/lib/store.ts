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
  score1?: number
  score2?: number
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
  status: string
  result?: string
  profit: number
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

export interface AppState {
  matches: Match[]
  bets: Bet[]
  stats: Stats | null
  players: Player[]
  predictors: Predictor[]
  collectionLogs: CollectionLog[]
  chatMessages: ChatMessage[]
  bankroll: { total: number; currency: string }
  loading: boolean
  setMatches: (matches: Match[]) => void
  setBets: (bets: Bet[]) => void
  setStats: (stats: Stats) => void
  setPlayers: (players: Player[]) => void
  setPredictors: (predictors: Predictor[]) => void
  setCollectionLogs: (logs: CollectionLog[]) => void
  addChatMessage: (message: ChatMessage) => void
  setBankroll: (bankroll: { total: number; currency: string }) => void
  setLoading: (loading: boolean) => void
  updateMatch: (id: string, data: Partial<Match>) => void
  fetchMatches: () => Promise<void>
  fetchBets: () => Promise<void>
  fetchStats: () => Promise<void>
  fetchPlayers: () => Promise<void>
  fetchPredictors: () => Promise<void>
  fetchCollectionLogs: () => Promise<void>
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
  bankroll: { total: 1000, currency: 'USD' },
  loading: false,

  setMatches: (matches) => set({ matches }),
  setBets: (bets) => set({ bets }),
  setStats: (stats) => set({ stats }),
  setPlayers: (players) => set({ players }),
  setPredictors: (predictors) => set({ predictors }),
  setCollectionLogs: (logs) => set({ collectionLogs }),
  addChatMessage: (message) => set((s) => ({ chatMessages: [...s.chatMessages, message] })),
  setBankroll: (bankroll) => set({ bankroll }),
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
}))
