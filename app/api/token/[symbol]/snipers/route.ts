import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '../../../mongodb'
import { mockTokens, mockSwaps } from '../../../mock-data'

// Helper: Group by wallet and token
function groupBy<T>(arr: T[], keyFn: (item: T) => string) {
  return arr.reduce((acc, item) => {
    const key = keyFn(item)
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

function toDate(val: any) {
  if (!val) return null
  return new Date(val)
}

function getField(tx: any, field: string) {
  return typeof tx[field] === 'number' ? tx[field] : parseFloat(tx[field] || '0')
}

function processSnipers(swaps: any[], token: string, tokenLaunchBlock: number) {
  // --- Step 1: Detect snipers (early buyers with high gas, chunked buys, etc.) ---
  const buySwaps = swaps.filter((s) => s.swapType === 'buy')
  const sellSwaps = swaps.filter((s) => s.swapType === 'sell')
  const snipersSet = new Set<string>()

  // Early buyers (within 100 blocks of launch)
  for (const swap of buySwaps) {
    if (swap.blockNumber && tokenLaunchBlock && swap.blockNumber <= tokenLaunchBlock + 100) {
      snipersSet.add(swap.maker || swap.from)
    }
  }

  // Chunked buys (buys within 10min window, >100k tokens, high gas)
  const buyGroups = groupBy(buySwaps, (s) => s.maker || s.from)
  for (const [maker, group] of Object.entries(buyGroups)) {
    let chunk = []
    let chunkStart: Date | null = null
    let chunkSum = 0
    for (const tx of group.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))) {
      if (!chunk.length) {
        chunk = [tx]
        chunkStart = tx.timestampReadable ? new Date(tx.timestampReadable) : new Date(tx.timestamp * 1000)
        chunkSum = getField(tx, `${token}_OUT_BeforeTax`)
      } else {
        const t = tx.timestampReadable ? new Date(tx.timestampReadable) : new Date(tx.timestamp * 1000)
        if (chunkStart && (t.getTime() - chunkStart.getTime()) <= 10 * 60 * 1000) {
          chunk.push(tx)
          chunkSum += getField(tx, `${token}_OUT_BeforeTax`)
        } else {
          if (chunkSum > 100000 && (tx.transactionFee || 0) > 0.000002) {
            snipersSet.add(maker)
          }
          chunk = [tx]
          chunkStart = t
          chunkSum = getField(tx, `${token}_OUT_BeforeTax`)
        }
      }
    }
    if (chunkSum > 100000 && chunk.some((tx) => (tx.transactionFee || 0) > 0.000002)) {
      snipersSet.add(maker)
    }
  }

  // Quick sellers (sell within 20min of buy)
  const sellGroups = groupBy(sellSwaps, (s) => s.maker || s.from)
  for (const maker of snipersSet) {
    const buys = buyGroups[maker] || []
    const sells = sellGroups[maker] || []
    for (const buy of buys) {
      const buyTime = buy.timestampReadable ? new Date(buy.timestampReadable) : new Date(buy.timestamp * 1000)
      for (const sell of sells) {
        const sellTime = sell.timestampReadable ? new Date(sell.timestampReadable) : new Date(sell.timestamp * 1000)
        const diff = (sellTime.getTime() - buyTime.getTime()) / 1000
        if (diff > 0 && diff <= 20 * 60) {
          snipersSet.add(maker)
        }
      }
    }
  }

  // --- Step 2: Calculate PnL and stats for each sniper ---
  const sniperResults = []
  for (const maker of snipersSet) {
    const userSwaps = swaps.filter((s) => (s.maker || s.from) === maker)
    userSwaps.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    let buyCount = 0, sellCount = 0
    let firstBuyTime = null, lastSellTime = null
    let avgBuyPrice = 0, avgSellPrice = 0
    let totalTax = 0, totalFees = 0
    let totalBuy = 0, totalSell = 0
    let buyPriceSum = 0, sellPriceSum = 0
    let buyTokens = 0, sellTokens = 0
    let realizedPnL = 0, unrealizedPnL = 0, tokensLeft = 0
    let buyQueue: { amount: number, cost: number, price: number }[] = []
    const outBeforeTax = `${token}_OUT_BeforeTax`
    const outAfterTax = `${token}_OUT_AfterTax`
    const inBeforeTax = `${token}_IN_BeforeTax`
    const inAfterTax = `${token}_IN_AfterTax`
    for (const tx of userSwaps) {
      totalTax += getField(tx, 'Tax_1pct')
      totalFees += getField(tx, 'transactionFee')
      if (tx.swapType === 'buy') {
        buyCount++
        const amt = getField(tx, outAfterTax)
        const cost = getField(tx, outBeforeTax)
        const price = getField(tx, 'genesis_usdc_price')
        buyQueue.push({ amount: amt, cost, price })
        buyTokens += amt
        buyPriceSum += price
        if (!firstBuyTime) firstBuyTime = tx.timestampReadable || tx.timestamp
      } else if (tx.swapType === 'sell') {
        sellCount++
        const amt = getField(tx, inAfterTax)
        const fromWallet = getField(tx, inBeforeTax)
        const price = getField(tx, 'genesis_usdc_price')
        sellTokens += amt
        sellPriceSum += price
        if (!lastSellTime || (tx.timestampReadable || tx.timestamp) > lastSellTime) lastSellTime = tx.timestampReadable || tx.timestamp
        // Realized PnL calculation (FIFO)
        let toMatch = fromWallet
        const proceeds = amt * price
        while (toMatch > 0 && buyQueue.length) {
          const buy = buyQueue[0]
          const matchAmt = Math.min(toMatch, buy.amount)
          const matchCost = buy.cost * (matchAmt / buy.amount)
          realizedPnL += proceeds * (matchAmt / fromWallet) - matchCost * buy.price
          toMatch -= matchAmt
          if (matchAmt === buy.amount) {
            buyQueue.shift()
          } else {
            buy.amount -= matchAmt
            buy.cost -= matchCost
          }
        }
      }
    }
    tokensLeft = buyQueue.reduce((sum, b) => sum + b.amount, 0)
    // Unrealized PnL: tokens left * latest price
    const latestPrice = userSwaps.length > 0 ? getField(userSwaps[userSwaps.length - 1], 'genesis_usdc_price') : 0
    unrealizedPnL = tokensLeft * latestPrice
    avgBuyPrice = buyCount > 0 ? buyPriceSum / buyCount : 0
    avgSellPrice = sellCount > 0 ? sellPriceSum / sellCount : 0
    sniperResults.push({
      wallet: maker,
      netPnL: Number(realizedPnL.toFixed(4)),
      unrealizedPnL: Number(unrealizedPnL.toFixed(4)),
      tokensLeft: Number(tokensLeft.toFixed(4)),
      buyCount,
      sellCount,
      firstBuyTime: firstBuyTime ? new Date(firstBuyTime).toISOString() : null,
      lastSellTime: lastSellTime ? new Date(lastSellTime).toISOString() : null,
      avgBuyPrice: Number(avgBuyPrice.toFixed(4)),
      avgSellPrice: Number(avgSellPrice.toFixed(4)),
      totalTax: Number(totalTax.toFixed(4)),
      totalFees: Number(totalFees.toFixed(4)),
    })
  }
  return sniperResults
}

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
      const swapDb = await connectToDatabase('genesis_tokens_swap_info')
      swaps = await swapDb.collection(swapCollection).find({}).toArray()
    } catch (e) {}
    if (swaps.length === 0) swaps = mockSwaps
    const snipers = processSnipers(swaps, symbol.toUpperCase(), persona.blockNumber)
    return NextResponse.json(snipers)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 