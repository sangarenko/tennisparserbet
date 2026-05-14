import { NextResponse } from 'next/server'

export async function GET() {
  const players = [
    { id: 'pl1', name: 'Fan Zhendong', country: 'China', rank: 1, wins: 89, losses: 12, rating: 9850 },
    { id: 'pl2', name: 'Wang Chuqin', country: 'China', rank: 2, wins: 85, losses: 15, rating: 9720 },
    { id: 'pl3', name: 'Ma Long', country: 'China', rank: 3, wins: 92, losses: 10, rating: 9680 },
    { id: 'pl4', name: 'Tomokazu Harimoto', country: 'Japan', rank: 4, wins: 78, losses: 20, rating: 9450 },
    { id: 'pl5', name: 'Truls Moregard', country: 'Sweden', rank: 5, wins: 72, losses: 22, rating: 9310 },
    { id: 'pl6', name: 'Hugo Calderano', country: 'Brazil', rank: 6, wins: 70, losses: 25, rating: 9180 },
    { id: 'pl7', name: 'Lin Gaoyuan', country: 'China', rank: 7, wins: 68, losses: 18, rating: 9090 },
    { id: 'pl8', name: 'Dimitrij Ovtcharov', country: 'Germany', rank: 8, wins: 75, losses: 28, rating: 8970 },
    { id: 'pl9', name: 'Liang Jingkun', country: 'China', rank: 9, wins: 65, losses: 20, rating: 8850 },
    { id: 'pl10', name: 'Jun Mizutani', country: 'Japan', rank: 10, wins: 60, losses: 24, rating: 8720 },
  ]
  return NextResponse.json(players)
}
