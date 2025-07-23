"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts"

interface TransactionsTabProps {
  symbol: string
}

type RawSwap = Record<string, any>
type NormalizedSwap = {
  blockNumber: number,
  txHash: string,
  txLink: string,
  maker: string,
  swapType: string,
  label: string,
  timestamp: number,
  timeParsed: Date,
  tokenAmount: number,
  virtualAmount: number,
  txTypeRaw: string,
  genesisUsdcPrice: number,
  genesisVirtualPrice: number,
  transactionFee: number,
  tax: number,
  txVolume: number,
  tokenBeforeTax: number,
  tokenAfterTax: number,
  [key: string]: any
}

function formatAddress(address: string | undefined): string {
  if (!address) return "N/A"
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// ---- Copy-to-clipboard cell ----
function CopyableCell({ value, display }: { value: string, display: string }) {
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  const onCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }
  return (
    <span className="inline-flex items-center gap-1">
      <span>{display}</span>
      <button
        ref={ref}
        className="text-xs text-blue-500 hover:underline"
        title={copied ? "Copied!" : "Copy"}
        onClick={onCopy}
        tabIndex={-1}
        type="button"
        style={{
          border: "none",
          background: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >{copied ? "✓" : <span aria-label="Copy" role="img">📋</span>}</button>
    </span>
  )
}

// ---- Price toggle column ----
function PriceToggleHeader({ showUsd, onToggle, tokenName }: { showUsd: boolean, onToggle: () => void, tokenName: string }) {
  return (
    <span
      className="cursor-pointer relative group select-none"
      title={`${tokenName} USD price / Virtual Price. Click to toggle.`}
      onClick={onToggle}
      tabIndex={0}
      style={{ outline: "none" }}
      role="button"
    >
      Price
      <span className="ml-1 text-xs text-gray-400">({showUsd ? "USD" : "Virtual"})</span>
      <span className="absolute left-1/2 opacity-0 group-hover:opacity-100 bg-black text-white text-xs rounded px-2 py-1 z-10" style={{ top: "-2em", whiteSpace: "nowrap", transform: "translateX(-50%)" }}>
        {/* {tokenName} USD price / Virtual Price */}
      </span>
    </span>
  )
}
function PriceCell({ row, showUsd }: { row: NormalizedSwap, showUsd: boolean }) {
  const price = showUsd ? row.genesisUsdcPrice : row.genesisVirtualPrice
  return (
    <span>
      {Number(price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 8 })}
    </span>
  )
}

function normalizeSwap(swap: RawSwap, symbol: string): NormalizedSwap {
  const upperSymbol = symbol.toUpperCase()
  const buy = swap.swapType === "buy"
  const sell = swap.swapType === "sell"

  // --- Before/After Tax extraction ---
  let tokenBeforeTax = 0, tokenAfterTax = 0
  if (buy) {
    tokenBeforeTax = swap[`${upperSymbol}_OUT_BeforeTax`] ?? 0
    tokenAfterTax = swap[`${upperSymbol}_OUT_AfterTax`] ?? 0
  } else if (sell) {
    tokenBeforeTax = swap[`${upperSymbol}_IN_BeforeTax`] ?? 0
    tokenAfterTax = swap[`${upperSymbol}_IN_AfterTax`] ?? 0
  }

  let tokenAmount = 0
  if (buy)
    tokenAmount =
      swap[`${upperSymbol}_OUT`] ??
      swap[`${symbol}_OUT`] ??
      swap.tokenAmountOut ??
      swap["AISPACE_OUT"] ??
      swap["Virtual_IN"] ?? 0
  else if (sell)
    tokenAmount =
      swap[`${upperSymbol}_IN`] ??
      swap[`${symbol}_IN`] ??
      swap.tokenAmountIn ??
      swap["AISPACE_IN"] ??
      swap["Virtual_OUT"] ?? 0

  if (buy) tokenAmount = swap[`${upperSymbol}_OUT_AfterTax`] ?? tokenAmount
  else if (sell) tokenAmount = swap[`${upperSymbol}_IN_AfterTax`] ?? tokenAmount

  let virtualAmount = buy
    ? swap["Virtual_IN"] ?? 0
    : swap["Virtual_OUT"] ?? 0

  let txVolume = 0
  if (buy)
    txVolume =
      (swap[`${upperSymbol}_OUT_BeforeTax`] ?? swap["AISPACE_OUT_BeforeTax"] ?? swap["tokenAmountOut"] ?? 0) *
      (swap.genesis_usdc_price ?? 0)
  else if (sell)
    txVolume =
      (swap[`${upperSymbol}_IN_BeforeTax`] ?? swap["AISPACE_IN_BeforeTax"] ?? swap["tokenAmountIn"] ?? 0) *
      (swap.genesis_usdc_price ?? 0)

  let timeParsed: Date
  if (swap.timestampReadable) {
    timeParsed = new Date(swap.timestampReadable)
  } else if (typeof swap.timestamp === "number") {
    timeParsed = new Date(swap.timestamp * 1000)
  } else {
    timeParsed = new Date(swap.timestamp)
  }

  let maker = swap.maker ?? swap.receiver ?? ""
  maker = typeof maker === "string" ? maker.replace(/<.*?>/g, "") : maker

  const label = swap.label ?? swap.swapType ?? "swap"
  const genesisUsdcPrice = swap.genesis_usdc_price ?? 0
  const genesisVirtualPrice = swap.genesis_virtual_price ?? 0
  const tax = typeof swap.Tax_1pct === "number" ? swap.Tax_1pct : 0

  return {
    ...swap,
    blockNumber: swap.blockNumber,
    txHash: swap.txHash,
    txLink: swap.txLink ?? "",
    maker,
    swapType: swap.swapType ?? "",
    label,
    timestamp: swap.timestamp,
    timeParsed,
    tokenAmount: Number(tokenAmount),
    virtualAmount: Number(virtualAmount),
    txVolume: Number(txVolume),
    txTypeRaw: swap.swapType ?? "",
    genesisUsdcPrice: Number(genesisUsdcPrice),
    genesisVirtualPrice: Number(genesisVirtualPrice),
    transactionFee: Number(swap.transactionFee ?? 0),
    tax,
    tokenBeforeTax: Number(tokenBeforeTax),
    tokenAfterTax: Number(tokenAfterTax),
  }
}

export function TransactionsTab({ symbol }: TransactionsTabProps) {
  const [rawSwaps, setRawSwaps] = useState<RawSwap[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>("all")
  const [swapTypeFilter, setSwapTypeFilter] = useState<string>("All")
  const [searchTerm, setSearchTerm] = useState("")
  // Sorting
  const [sortCol, setSortCol] = useState<string>("timeParsed")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  // Pagination
  const [page, setPage] = useState(1)
  const rowsPerPage = 100

  const [showUsdPrice, setShowUsdPrice] = useState(true)
  const tokenUpper = symbol.toUpperCase()

  useEffect(() => {
    setLoading(true)
    fetchSwaps()
    // eslint-disable-next-line
  }, [symbol])

  async function fetchSwaps() {
    try {
      const response = await fetch(`/api/token/${symbol}/swaps`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setRawSwaps(data ?? [])
    } catch (error) {
      console.error("Error fetching swaps:", error)
      setRawSwaps([])
    } finally {
      setLoading(false)
    }
  }

  const swaps: NormalizedSwap[] = useMemo(
    () => rawSwaps.map((swap) => normalizeSwap(swap, symbol)),
    [rawSwaps, symbol]
  )

  // Columns: in strict order, with correct rendering logic
  const tableColumns = useMemo(() => [
    {
      key: "blockNumber",
      label: "Block",
      isSortable: true,
      render: (row: NormalizedSwap) => row.blockNumber ?? "",
    },
    {
      key: "txHash",
      label: "TX Hash",
      isSortable: false,
      render: (row: NormalizedSwap) => <CopyableCell value={row.txHash} display={formatAddress(row.txHash)} />,
    },
    {
      key: "maker",
      label: "Maker",
      isSortable: false,
      render: (row: NormalizedSwap) => <CopyableCell value={row.maker} display={formatAddress(row.maker)} />,
    },
    {
      key: "txTypeRaw",
      label: "Transaction Type",
      isSortable: true,
      render: (row: NormalizedSwap) =>
        <Badge variant={row.txTypeRaw === "buy" ? "buy" : "destructive"}>
          {row.txTypeRaw}
        </Badge>
    },
    {
      key: "label",
      label: "Swap Type",
      isSortable: true,
      render: (row: NormalizedSwap) => row.label,
    },
    {
      key: "timeParsed",
      label: "Time",
      isSortable: true,
      render: (row: NormalizedSwap) => row.timeParsed?.toLocaleString() ?? "",
    },
    // {
    //   key: "tokenAmount",
    //   label: tokenUpper,
    //   // tooltip: `Amount of ${tokenUpper} in this swap`,
    //   isSortable: true,
    //   render: (row: NormalizedSwap) =>
    //     Number(row.tokenAmount ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 }),
    // },
    
    {
      key: "tokenBeforeTax",
      label: `${tokenUpper} Before Tax`,
      isSortable: true,
      render: (row: NormalizedSwap) => {
        // If Tax_1pct is 0, show OUT/IN value from DB
        if (row.tax === 0) {
          if (row.txTypeRaw === "buy") {
            return Number(row[`${tokenUpper}_OUT`] ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })
          } else if (row.txTypeRaw === "sell") {
            return Number(row[`${tokenUpper}_IN`] ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })
          }
        }
        return Number(row.tokenBeforeTax ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })
      },
    },
    {
      key: "tokenAfterTax",
      label: `${tokenUpper} After Tax`,
      isSortable: true,
      render: (row: NormalizedSwap) => {
        // If Tax_1pct is 0, show OUT/IN value from DB
        if (row.tax === 0) {
          if (row.txTypeRaw === "buy") {
            return Number(row[`${tokenUpper}_OUT`] ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })
          } else if (row.txTypeRaw === "sell") {
            return Number(row[`${tokenUpper}_IN`] ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })
          }
        }
        return Number(row.tokenAfterTax ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })
      },
    },
    {
      key: "virtualAmount",
      label: "Virtual",
      // tooltip: 'If sell: Virtual_OUT, if buy: Virtual_IN',
      isSortable: true,
      render: (row: NormalizedSwap) =>
        Number(row.virtualAmount ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 }),
    },
    {
      key: "genesisPrice",
      label: <PriceToggleHeader showUsd={showUsdPrice} onToggle={() => setShowUsdPrice(v => !v)} tokenName={tokenUpper} />,
      // tooltip: `${tokenUpper} USD price / Virtual Price`,
      isSortable: true,
      render: (row: NormalizedSwap) =>
        <PriceCell row={row} showUsd={showUsdPrice} />,
    },
    {
      key: "tax",
      label: (
        <span title="Tax Paid in Native Token">
          Tax
        </span>
      ),
      tooltip: "Tax Paid in Native Token",
      isSortable: true,
      render: (row: NormalizedSwap) =>
        Number(row.tax ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 }),
    },
    {
      key: "transactionFee",
      label: (
        <span title="Transaction Fees paid in ETH">
          Tx Fees
        </span>
      ),
      tooltip: "Transaction Fees paid in ETH",
      isSortable: true,
      render: (row: NormalizedSwap) =>
        Number(row.transactionFee ?? 0).toLocaleString(undefined, { maximumFractionDigits: 8 }),
    },
    {
      key: "txVolume",
      label: (
        <span title="Transaction value in USD">
          TX Volume ($)
        </span>
      ),
      // tooltip: "Transaction value in USD before tax",
      isSortable: true,
      render: (row: NormalizedSwap) =>
        Number(row.txVolume ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 }),
    },
  ], [showUsdPrice, tokenUpper])

  // Filtered swaps
  const filteredSwaps = useMemo(() => {
    let f = swaps

    if (transactionTypeFilter !== "all")
      f = f.filter(s => s.txTypeRaw === transactionTypeFilter)

    if (swapTypeFilter !== "All")
      f = f.filter(s => s.label === swapTypeFilter)

    if (searchTerm.trim().length > 0) {
      const q = searchTerm.trim().toLowerCase()
      f = f.filter(
        (s) =>
          String(s.blockNumber).includes(q) ||
          (s.maker || "").toLowerCase().includes(q) ||
          (s.txHash || "").toLowerCase().includes(q)
      )
    }

    // Sorting (only on requested columns)
    if (sortCol) {
      f = [...f].sort((a, b) => {
        let valA = a[sortCol]
        let valB = b[sortCol]
        if (valA == null || valB == null) return 0
        // Time: sort by timeParsed.getTime() if field is Date
        if (sortCol === "timeParsed") {
          valA = valA instanceof Date ? valA.getTime() : valA
          valB = valB instanceof Date ? valB.getTime() : valB
        }
        if (valA === valB) return 0
        if (sortDir === "asc") return valA > valB ? 1 : -1
        return valA < valB ? 1 : -1
      })
    }
    return f
  }, [
    swaps,
    transactionTypeFilter,
    swapTypeFilter,
    searchTerm,
    sortCol,
    sortDir,
  ])

  // ---- PAGINATION ----
  useEffect(() => { setPage(1) }, [transactionTypeFilter, swapTypeFilter, searchTerm, sortCol, sortDir])

  const pageCount = Math.ceil(filteredSwaps.length / rowsPerPage)
  const pageData = useMemo(
    () => filteredSwaps.slice((page - 1) * rowsPerPage, page * rowsPerPage),
    [filteredSwaps, page, rowsPerPage]
  )

  // Available swap types
  const availableSwapTypes = useMemo(() => {
    const sTypes = Array.from(new Set(swaps.map((s) => s.label).filter(Boolean))).sort()
    return ["All", ...sTypes]
  }, [swaps])

  // --- KPI calculations (updated for before-tax and label exclusion)
  const { uniqueMakers, buyVolumeUsd, sellVolumeUsd } = useMemo(() => {
    const _makers = swaps.map((s) => s.maker).filter(Boolean)
    const uniqueMakers = new Set(_makers).size
    const buySwaps = swaps.filter((s) =>
      s.txTypeRaw === "buy" &&
      s.label !== "auto-swap" &&
      s.label !== "auto-swap-outside-transfer"
    )
    const sellSwaps = swaps.filter((s) =>
      s.txTypeRaw === "sell" &&
      s.label !== "auto-swap" &&
      s.label !== "auto-swap-outside-transfer"
    )
    const buyVolumeUsd = buySwaps.reduce(
      (sum, s) => sum + (s.tokenBeforeTax ?? 0) * (s.genesisUsdcPrice ?? 0),
      0
    )
    const sellVolumeUsd = sellSwaps.reduce(
      (sum, s) => sum + (s.tokenBeforeTax ?? 0) * (s.genesisUsdcPrice ?? 0),
      0
    )
    return { uniqueMakers, buyVolumeUsd, sellVolumeUsd }
  }, [swaps])

  function getTopVolumeAddrs(type: "buy" | "sell") {
    const map: Record<string, number> = {}
    swaps
      .filter((s) => s.txTypeRaw === type)
      .forEach((s) => {
        const addr = s.maker
        if (!addr) return
        map[addr] = (map[addr] ?? 0) + s.tokenAmount * s.genesisUsdcPrice
      })
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([maker, amount]) => ({
        maker,
        makerShort: formatAddress(maker),
        amount,
      }))
  }
  const topBuyers = useMemo(() => getTopVolumeAddrs("buy"), [swaps])
  const topSellers = useMemo(() => getTopVolumeAddrs("sell"), [swaps])

  const volumeData = useMemo(() => {
    const map: Record<string, { date: string; buyVolume: number; sellVolume: number }> = {}
    swaps.forEach((s) => {
      const d = s.timeParsed.toISOString().slice(0, 10)
      if (!map[d]) map[d] = { date: d, buyVolume: 0, sellVolume: 0 }
      if (s.txTypeRaw === "buy") map[d].buyVolume += s.tokenAmount
      else if (s.txTypeRaw === "sell") map[d].sellVolume += s.tokenAmount
    })
    return Object.values(map)
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(-30)
  }, [swaps])

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Unique Traders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              {uniqueMakers}
              <span role="img" aria-label="person" className="ml-2 text-lg">👤</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Buy Volume ($)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center text-green-600">
              {buyVolumeUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              <span role="img" aria-label="money up" className="ml-2 text-lg">📈</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sell Volume ($)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center text-red-600">
              {sellVolumeUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              <span role="img" aria-label="money down" className="ml-2 text-lg">📉</span>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Buyers ($)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
  <BarChart
    data={topBuyers}
    margin={{ top: 24, right: 32, left: 32, bottom: 64 }}
    barCategoryGap="15%"
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis
      dataKey="makerShort"
      angle={-30}
      textAnchor="end"
      interval={0}
      label={{
        value: 'Wallet',
        position: 'insideBottom',
        dy: 40,
        offset: -10,
        fontWeight: 500,
        style: { textAnchor: 'middle', fontWeight: 500 }
      }}
      style={{ fontSize: '12px' }}
    />
    <YAxis
      label={{
        value: 'Volume (USD)',
        angle: -90,
        position: 'insideLeft',
         offset: 5,
        fontWeight: 500,
        dy: -10,
        style: { textAnchor: 'middle', fontWeight: 500 }
      }}
      tickFormatter={(v) => v.toLocaleString()}
      style={{ fontSize: '12px' }}
    />
    <Tooltip
      formatter={(v: number) =>
        `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
      }
      labelFormatter={(label) => `${label}`}
    />
    <Bar dataKey="amount" fill="#009688" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Sellers ($)</CardTitle>
          </CardHeader>
          <CardContent>
             <ResponsiveContainer width="100%" height={400}>
  <BarChart
    data={topSellers}
    margin={{ top: 24, right: 32, left: 32, bottom: 64 }}
    barCategoryGap="15%"
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis
      dataKey="makerShort"
      angle={-30}
      textAnchor="end"
      interval={0}
      label={{
        value: 'Wallet',
        position: 'insideBottom',
        dy: 40,
        offset: -10,
        fontWeight: 500,
        style: { textAnchor: 'middle', fontWeight: 500 }
      }}
      style={{ fontSize: '12px' }}
    />
    <YAxis
      label={{
        value: 'Volume (USD)',
        angle: -90,
        position: 'insideLeft',
         offset: 5,
        fontWeight: 500,
        dy: -10,
        style: { textAnchor: 'middle', fontWeight: 500 }
      }}
      tickFormatter={(v) => v.toLocaleString()}
      style={{ fontSize: '12px' }}
    />
    <Tooltip
      formatter={(v: number) =>
        `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
      }
      labelFormatter={(label) => `${label}`}
    />
    <Bar dataKey="amount" fill="#009688" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Volume over time */}
      <Card>
  <CardHeader>
    <CardTitle>Swap Volume Over Time</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={volumeData}
        margin={{ top: 32, right: 48, left: 56, bottom: 56 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          label={{
            value: "Date",
            position: "insideBottom",
            dy: 30,
            style: { textAnchor: "middle", fontWeight: 500 }
          }}
          minTickGap={16}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          label={{
            value: "Swap Volume",
            angle: -90,
            position: "insideLeft",
            dx: -36,
            style: { textAnchor: "middle", fontWeight: 500 }
          }}
          domain={['auto', 'auto']}
          allowDataOverflow={true}
          tickFormatter={v => v.toLocaleString(undefined, {maximumFractionDigits: 0})}
        />
        <Tooltip
          formatter={(value: number, name: string) =>
            value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        />
        <Line
          type="monotone"
          dataKey="buyVolume"
          name="Buy Volume"
          stroke="#009688"
          strokeWidth={2.5}
          dot={{ r: 2 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="sellVolume"
          name="Sell Volume"
          stroke="#B71C1C"
          strokeWidth={2.5}
          dot={{ r: 2 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>


      {/* Transaction Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Transaction Type, Swap Type, Search only */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Transaction Type */}
            <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
            {/* Swap Type */}
            <Select value={swapTypeFilter} onValueChange={setSwapTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Swap Type" />
              </SelectTrigger>
              <SelectContent>
                {availableSwapTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Search */}
            <Input
              placeholder="Block | Maker | TX Hash"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            Showing {filteredSwaps.length} of {swaps.length} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {tableColumns.map((col, idx) => (
                    <TableHead
                      key={idx}
                      className={col.isSortable ? "cursor-pointer select-none" : ""}
                      title={typeof col.tooltip === "string" ? col.tooltip : undefined}
                      onClick={
                        col.isSortable
                          ? () => {
                            if (sortCol === col.key) {
                              setSortDir(sortDir === "asc" ? "desc" : "asc")
                            } else {
                              setSortCol(col.key)
                              setSortDir("asc")
                            }
                          }
                          : undefined
                      }
                      style={col.isSortable ? { userSelect: "none" } : undefined}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {col.isSortable && (
                          <span>
                            {sortCol === col.key
                              ? sortDir === "asc"
                                ? "▲"
                                : "▼"
                              : ""}
                          </span>
                        )}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {tableColumns.map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted rounded animate-pulse"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                  : pageData.map((row, idx) => (
                    <TableRow key={idx}>
                      {tableColumns.map((col, colIdx) => (
                        <TableCell key={colIdx}>
                          {col.render
                            ? col.render(row)
                            : row[col.key] ?? ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          {/* Pagination Controls */}
          {pageCount > 1 && (
            <div className="flex gap-2 mt-4 justify-end items-center">
              <button
                disabled={page === 1}
                onClick={() => setPage(1)}
                className="px-2 py-1 rounded bg-muted hover:bg-accent disabled:opacity-50"
              >First</button>
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-1 rounded bg-muted hover:bg-accent disabled:opacity-50"
              >Previous</button>
              <span>
                Page {page} of {pageCount}
              </span>
              <button
                disabled={page === pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className="px-2 py-1 rounded bg-muted hover:bg-accent disabled:opacity-50"
              >Next</button>
              <button
                disabled={page === pageCount}
                onClick={() => setPage(pageCount)}
                className="px-2 py-1 rounded bg-muted hover:bg-accent disabled:opacity-50"
              >Last</button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
