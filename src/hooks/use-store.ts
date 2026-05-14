import { create } from 'zustand'

export interface Match {
  id: string
  externalId: string
  source: string
  league: string
  player1: string
  player2: string
  startTime: string
  status: string
  score1: number
  score2: number
  winner: string | null
  odds?: { odds1: number; odds2: number; source: string }[]
  predictions?: Prediction[]
  createdAt: string
}

export interface Prediction {
  id: string
  matchId: string
  predictedWinner: string
  confidence: number
  aiModel: string
  analysis: string
  isCorrect: boolean | null
  createdAt: string
}

export interface Bet {
  id: string
  matchId: string
  predictedWinner: string
  odds: number
  stake: number
  potentialWin: number
  result: string | null
  payout: number
  isWin: boolean | null
  createdAt: string
  settledAt: string | null
  match?: Match
}

export interface Player {
  id: string
  name: string
  country: string | null
  rank: number | null
  wins: number
  losses: number
  winRate: number
  avgOdds: number
}

export interface Predictor {
  id: string
  name: string
  channel: string
  platform: string
  bio: string
  specialization: string
  avatarEmoji: string
  followers: number
  totalTips: number
  correctTips: number
  winRate: number
  avgConfidence: number
  avgOdds: number
  currentStreak: number
  bestStreak: number
  monthlyData: string
  tags: string
  lastActive: string | null
  verified: boolean
  qualityScore: number
  isActive: boolean
}

export interface Stats {
  totalBets: number
  wins: number
  losses: number
  pending: number
  winRate: number
  roi: number
  totalStaked: number
  totalPayout: number
  profit: number
  currentStreak: number
  bestStreak: number
  avgConfidence: number
  avgOdds: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface CollectionLog {
  id: string
  source: string
  status: string
  matchesFound: number
  matchesNew: number
  matchesUpdated: number
  duration: number
  createdAt: string
}

interface AppState {
  // Active tab
  activeTab: string
  setActiveTab: (tab: string) => void

  // Data
  matches: Match[]
  setMatches: (matches: Match[]) => void
  bets: Bet[]
  setBets: (bets: Bet[]) => void
  stats: Stats | null
  setStats: (stats: Stats | null) => void
  players: Player[]
  setPlayers: (players: Player[]) => void
  predictors: Predictor[]
  setPredictors: (predictors: Predictor[]) => void
  collectionLogs: CollectionLog[]
  setCollectionLogs: (logs: CollectionLog[]) => void

  // Chat
  chatMessages: ChatMessage[]
  addChatMessage: (msg: ChatMessage) => void
  clearChat: () => void

  // Bankroll
  bankroll: number
  setBankroll: (amount: number) => void

  // Filters
  matchFilter: 'all' | 'upcoming' | 'live' | 'finished'
  setMatchFilter: (filter: 'all' | 'upcoming' | 'live' | 'finished') => void
  sourceFilter: 'all' | 'betboom' | 'fonbet'
  setSourceFilter: (filter: 'all' | 'betboom' | 'fonbet') => void

  // Loading states
  isLoading: Record<string, boolean>
  setLoading: (key: string, value: boolean) => void

  // AI prediction for selected match
  selectedMatchId: string | null
  setSelectedMatchId: (id: string | null) => void
  currentPrediction: Prediction | null
  setCurrentPrediction: (p: Prediction | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'predictions',
  setActiveTab: (tab) => set({ activeTab: tab }),

  matches: [],
  setMatches: (matches) => set({ matches }),
  bets: [],
  setBets: (bets) => set({ bets }),
  stats: null,
  setStats: (stats) => set({ stats }),
  players: [],
  setPlayers: (players) => set({ players }),
  predictors: [],
  setPredictors: (predictors) => set({ predictors }),
  collectionLogs: [],
  setCollectionLogs: (logs) => set({ collectionLogs: logs }),

  chatMessages: [],
  addChatMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  clearChat: () => set({ chatMessages: [] }),

  bankroll: 0,
  setBankroll: (amount) => set({ bankroll: amount }),

  matchFilter: 'all',
  setMatchFilter: (filter) => set({ matchFilter: filter }),
  sourceFilter: 'all',
  setSourceFilter: (filter) => set({ sourceFilter: filter }),

  isLoading: {},
  setLoading: (key, value) => set((state) => ({ isLoading: { ...state.isLoading, [key]: value } })),

  selectedMatchId: null,
  setSelectedMatchId: (id) => set({ selectedMatchId: id }),
  currentPrediction: null,
  setCurrentPrediction: (p) => set({ currentPrediction: p }),
}))
