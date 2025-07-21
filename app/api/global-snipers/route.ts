import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '../mongodb'
import { mockTokens, mockSwaps } from '../mock-data'

function detectSnipers(swaps: any[], tokenLaunchBlock: number) {
  const snipers: Record<string, any> = {}
  swaps.forEach((swap) => {
    const wallet = swap.maker || swap.from
    if (!wallet) return
    if (!snipers[wallet]) {
      snipers[wallet] = {
        wallet,
        transactions: [],
        totalBought: 0,
        totalSold: 0,
        realizedPnL: 0,
        unrealizedPnL: 0,
        tokensLeft: 0,
        avgPrice: 0,
        totalTax: 0,
        totalFees: 0,
        buyCount: 0,
        sellCount: 0,
        firstTxn: null,
        lastTxn: null,
      }
    }
    const sniper = snipers[wallet]
    sniper.transactions.push(swap)
    if (!sniper.firstTxn || swap.timestamp < sniper.firstTxn) {
      sniper.firstTxn = swap.timestamp
    }
    if (!sniper.lastTxn || swap.timestamp > sniper.lastTxn) {
      sniper.lastTxn = swap.timestamp
    }
    if (swap.swapType === 'buy') {
      sniper.buyCount++
      sniper.totalBought += swap.tokenAmountOut || 0
      sniper.tokensLeft += swap.tokenAmountOut || 0
    } else if (swap.swapType === 'sell') {
      sniper.sellCount++
      sniper.totalSold += swap.tokenAmountIn || 0
      sniper.tokensLeft -= swap.tokenAmountIn || 0
      const sellValue = (swap.tokenAmountIn || 0) * (swap.genesis_usdc_price || 0)
      sniper.realizedPnL += sellValue
    }
    sniper.totalTax += swap.Tax_1pct || 0
    sniper.totalFees += swap.transactionFee || 0
  })
  Object.values(snipers).forEach((sniper: any) => {
    if (sniper.buyCount > 0) {
      sniper.avgPrice = sniper.totalBought > 0 ? sniper.realizedPnL / sniper.totalBought : 0
    }
    if (sniper.tokensLeft > 0) {
      const lastPrice = sniper.transactions[sniper.transactions.length - 1]?.genesis_usdc_price || 0
      sniper.unrealizedPnL = sniper.tokensLeft * lastPrice
    }
  })
  return Object.values(snipers).filter((sniper: any) => sniper.buyCount > 0 || sniper.sellCount > 0)
}

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
      try {
        const swapDb = await connectToDatabase('genesis_tokens_swap_info')
        swaps = await swapDb.collection(swapCollection).find({}).toArray()
      } catch (e) {}
      if (swaps.length === 0) swaps = mockSwaps
      const snipers = detectSnipers(swaps, persona.blockNumber)
      snipers.forEach((sniper: any) => {
        sniper.token = persona.symbol
        sniper.tokenName = persona.name
      })
      allSnipers = allSnipers.concat(snipers)
    }
    return NextResponse.json(allSnipers)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 