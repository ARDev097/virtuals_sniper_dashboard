// Shared sniper detection and PnL logic for both global and per-token APIs

export function groupBy<T>(arr: T[], keyFn: (item: T) => string) {
  return arr.reduce((acc, item) => {
    const key = keyFn(item)?.toLowerCase?.() ?? ''
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

export function toTimestamp(tx: any) {
  return tx.timestampReadable
    ? new Date(tx.timestampReadable).getTime()
    : tx.timestamp
    ? tx.timestamp * 1000
    : 0
}

export function toDate(val: any) {
  if (!val) return null
  if (typeof val === 'number') return new Date(val * 1000)
  return new Date(val)
}

export function getField(tx: any, field: string, defaultValue = 0) {
  const value = tx[field]
  if (value === null || value === undefined || value === '') return defaultValue
  return typeof value === 'number' ? value : (parseFloat(value) || defaultValue)
}

export function normalizeAddress(addr?: string) {
  return addr?.toLowerCase() ?? ''
}

export function getLatestPrice(swaps: any[], token: string) {
  // Sort all swaps by timestampReadable (or timestamp) descending and take the first one's genesis_usdc_price
  if (!swaps || swaps.length === 0) return 0
  const sorted = swaps.slice().sort((a, b) => {
    const ta = a.timestampReadable ? new Date(a.timestampReadable).getTime() : (a.timestamp ? a.timestamp * 1000 : 0)
    const tb = b.timestampReadable ? new Date(b.timestampReadable).getTime() : (b.timestamp ? b.timestamp * 1000 : 0)
    return tb - ta
  })
  const latestSwap = sorted[0]
  return getField(latestSwap, 'genesis_usdc_price')
}

export function createChunkedLargeBuys(swaps: any[], token: string) {
  // Step 1: Filter buys and group by wallet
  const buySwaps = swaps.filter((s) => s.swapType === 'buy')
  const buyGroups = groupBy(buySwaps, (s) => normalizeAddress(s.maker || s.from))
  const chunkedBuys: any[] = []
  const timeThresholdMs = 10 * 60 * 1000 // 10 minutes
  for (const [wallet, group] of Object.entries(buyGroups)) {
    const sorted = group.slice().sort((a, b) => toTimestamp(a) - toTimestamp(b))
    let chunk: any[] = []
    let chunkStartTime = 0
    let chunkSum = 0
    for (const tx of sorted) {
      const t = toTimestamp(tx)
      if (!chunk.length) {
        chunk = [tx]
        chunkStartTime = t
        chunkSum = getField(tx, `${token}_OUT_BeforeTax`)
      } else if (t - chunkStartTime <= timeThresholdMs) {
        chunk.push(tx)
        chunkSum += getField(tx, `${token}_OUT_BeforeTax`)
      } else {
        // Process completed chunk
        if (chunkSum > 100000) {
          chunkedBuys.push(...chunk) // Flatten transactions like Streamlit
        }
        // Start new chunk
        chunk = [tx]
        chunkStartTime = t
        chunkSum = getField(tx, `${token}_OUT_BeforeTax`)
      }
    }
    // Process final chunk
    if (chunkSum > 100000) {
      chunkedBuys.push(...chunk)
    }
  }
  // Remove duplicates like Streamlit's drop_duplicates()
  const uniqueBuys = chunkedBuys.filter((buy, index, arr) => 
    arr.findIndex(b => b.txHash === buy.txHash) === index
  )
  return uniqueBuys
}

export function processSnipers(
  swaps: any[],
  token: string,
  tokenLaunchBlock: number
) {
  // Step 1: Create chunked large buys (>100k tokens in 10min windows)
  const chunkedLargeBuys = createChunkedLargeBuys(swaps, token)
  // Step 2: Filter for high gas transactions
  const GAS_THRESHOLD = 0.000002
  const highGasBuys = chunkedLargeBuys.filter(tx => 
    getField(tx, 'transactionFee') > GAS_THRESHOLD
  )
  // Step 3: Filter for early buys (within 100 blocks of launch)
  const earlyBuys = highGasBuys.filter(tx => 
    Number(tx.blockNumber || 0) <= tokenLaunchBlock + 100
  )
  // Step 4: Find wallets with quick sells (within 20 minutes)
  const QUICK_SELL_THRESHOLD_SEC = 20 * 60
  const sellSwaps = swaps.filter((s) => s.swapType === 'sell')
  const sellGroups = groupBy(sellSwaps, (s) => normalizeAddress(s.maker || s.from))
  const snipersSet = new Set<string>()
  // Group early buys by wallet
  const earlyBuysByWallet = groupBy(earlyBuys, (s) => normalizeAddress(s.maker || s.from))
  for (const [wallet, buyTxs] of Object.entries(earlyBuysByWallet)) {
    const sells = (sellGroups[wallet] || []).map((s) => ({
      timestamp: toTimestamp(s),
      tx: s
    }))
    if (sells.length === 0) continue
    // Check if any buy has a sell within 20 minutes
    for (const buy of buyTxs) {
      const buyTime = toTimestamp(buy)
      const hasQuickSell = sells.some(({ timestamp: sellTime }) => 
        sellTime > buyTime && sellTime - buyTime <= QUICK_SELL_THRESHOLD_SEC * 1000
      )
      if (hasQuickSell) {
        snipersSet.add(wallet)
        break // Once marked as sniper, no need to check other buys for this wallet
      }
    }
  }
  // Step 5: Calculate FIFO PnL for identified snipers
  const sniperResults = []
  const latestPrice = getLatestPrice(swaps, token)
  for (const wallet of snipersSet) {
    const userSwaps = swaps.filter(
      (s) => normalizeAddress(s.maker || s.from) === wallet
    )
    userSwaps.sort((a, b) => toTimestamp(a) - toTimestamp(b))
    let realizedPnL = 0
    let buyQueue: { amount: number; amount_paid_for: number; price: number }[] = []
    let buyCount = 0, sellCount = 0, buyTokens = 0, sellTokens = 0
    let buyPriceSum = 0, sellPriceSum = 0, totalTax = 0, totalFees = 0
    let firstBuyTime = null, lastSellTime = null
    const outBeforeTax = `${token}_OUT_BeforeTax`
    const outAfterTax = `${token}_OUT_AfterTax`
    const inBeforeTax = `${token}_IN_BeforeTax`
    const inAfterTax = `${token}_IN_AfterTax`
    for (const tx of userSwaps) {
      totalTax += getField(tx, 'Tax_1pct')
      totalFees += getField(tx, 'transactionFee')
      const price = getField(tx, 'genesis_usdc_price')
      if (tx.swapType === 'buy') {
        buyCount++
        const amount_bought_before_tax = getField(tx, outBeforeTax)
        const amount_received = getField(tx, outAfterTax)
        if (amount_bought_before_tax > 0) {
          buyQueue.push({
            amount: amount_received, // tokens received after tax
            amount_paid_for: amount_bought_before_tax, // tokens bought before tax
            price: price
          })
          buyTokens += amount_received
          buyPriceSum += price
          if (!firstBuyTime) firstBuyTime = toDate(tx.timestampReadable || tx.timestamp)
        }
      } else if (tx.swapType === 'sell') {
        sellCount++
        const amount_sold_net = getField(tx, inAfterTax)
        const amount_from_wallet = getField(tx, inBeforeTax)
        if (amount_sold_net > 0) {
          sellTokens += amount_sold_net
          sellPriceSum += price
          lastSellTime = toDate(tx.timestampReadable || tx.timestamp)
          // Streamlit-style FIFO realized PnL calculation
          let remaining_to_match = amount_from_wallet
          while (remaining_to_match > 0 && buyQueue.length) {
            const buy = buyQueue[0]
            const matched_amount = Math.min(remaining_to_match, buy.amount)
            const ratio = matched_amount / buy.amount
            const matched_paid = buy.amount_paid_for * ratio

            const proceeds_ratio = matched_amount / amount_from_wallet
            const actual_proceeds = amount_sold_net * price * proceeds_ratio
            const cost_paid = matched_paid * buy.price

            realizedPnL += actual_proceeds - cost_paid

            remaining_to_match -= matched_amount
            const remaining_buy = buy.amount - matched_amount
            if (remaining_buy > 0) {
              const remaining_paid = buy.amount_paid_for * (remaining_buy / buy.amount)
              buyQueue[0] = {
                amount: remaining_buy,
                amount_paid_for: remaining_paid,
                price: buy.price
              }
            } else {
              buyQueue.shift()
            }
          }
        }
      }
    }
    const tokensLeft = buyQueue.reduce((sum, b) => sum + b.amount, 0)
    // Match Streamlit's unrealized PnL calculation (total value, not gain/loss)
    const unrealizedPnL = tokensLeft * latestPrice
    sniperResults.push({
      wallet,
      netPnL: Number((realizedPnL ?? 0).toFixed(4)),
      unrealizedPnL: Number((unrealizedPnL ?? 0).toFixed(4)),
      tokensLeft: Number((tokensLeft ?? 0).toFixed(4)),
      buyCount,
      sellCount,
      firstBuyTime: firstBuyTime ? new Date(firstBuyTime).toISOString() : null,
      lastSellTime: lastSellTime ? new Date(lastSellTime).toISOString() : null,
      avgBuyPrice: buyCount ? Number((buyPriceSum / buyCount).toFixed(4)) : 0,
      avgSellPrice: sellCount ? Number((sellPriceSum / sellCount).toFixed(4)) : 0,
      totalTax: Number(totalTax.toFixed(4)),
      totalFees: Number(totalFees.toFixed(4)),
    })
  }
  return sniperResults
} 