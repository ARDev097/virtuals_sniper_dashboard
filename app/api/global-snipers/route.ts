import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '../mongodb'
import { mockTokens, mockSwaps } from '../mock-data'
import { processSnipers } from '../../../lib/sniper-utils'

export async function GET() {
  try {
    let personas: any[] = []
    try {
      const db = await connectToDatabase('virtualgenesis')
      personas = await db.collection('personas').find({}).toArray()
    } catch (e) {}
    if (personas.length === 0) personas = mockTokens

    let allSnipers: any[] = []
    for (const persona of personas) {
      let swaps: any[] = []
      const swapCollection = `${persona.symbol}_swap`.toLocaleLowerCase()
      let tokenLaunchBlock = persona.blockNumber
      try {
        const swapDb = await connectToDatabase('virtual')
        swaps = await swapDb.collection(swapCollection).find({}).toArray()
        // Try to get launch block from swap_progress
        const swapProgressDoc = await swapDb.collection('swap_progress').findOne({
          token_symbol: persona.symbol.toUpperCase()
        })
        if (swapProgressDoc?.genesis_block) {
          tokenLaunchBlock = swapProgressDoc.genesis_block
        }
      } catch (e) {}
      if (swaps.length === 0) swaps = mockSwaps
      const snipers = processSnipers(swaps, persona.symbol.toUpperCase(), tokenLaunchBlock)
      snipers.forEach((sniper: any) => {
        sniper.token = persona.symbol
        sniper.tokenName = persona.name
        sniper.realizedPnL = sniper.netPnL // for frontend compatibility
      })
      allSnipers = allSnipers.concat(snipers)
    }
    return NextResponse.json(allSnipers)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 