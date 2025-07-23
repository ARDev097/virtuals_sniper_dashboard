import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '../../mongodb'
import { mockTokens, mockSwaps } from '../../mock-data'

export async function GET(req: NextRequest, { params }: { params: { symbol: string } }) {
  try {
    const symbol = params.symbol
    let persona: any = null
    try {
      const db = await connectToDatabase('virtualgenesis')
      persona = await db.collection('personas').findOne({ symbol })
    } catch (e) {}
    if (!persona) persona = mockTokens.find((t) => t.symbol === symbol)
    if (!persona) return NextResponse.json({ error: 'Token not found' }, { status: 404 })

    let swaps: any[] = []
    const swapCollection = `${persona.symbol}_swap`.toLocaleLowerCase()
    try {
      const swapDb = await connectToDatabase('virtual')
      swaps = await swapDb.collection(swapCollection).find({}).toArray()
    } catch (e) {}
    if (swaps.length === 0) swaps = mockSwaps

    const stats = {
      totalSwaps: swaps.length,
      uniqueTraders: new Set(swaps.map((s) => s.maker || s.from)).size,
      buyVolume: swaps.filter((s) => s.swapType === 'buy').reduce((sum, s) => sum + (s.tokenAmountOut || 0), 0),
      sellVolume: swaps.filter((s) => s.swapType === 'sell').reduce((sum, s) => sum + (s.tokenAmountIn || 0), 0),
    }

    return NextResponse.json({ ...persona, stats })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 