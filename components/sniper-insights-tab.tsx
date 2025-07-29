"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { ChevronUp, ChevronDown, Info } from "lucide-react"
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Sniper {
  wallet: string
  netPnL: number
  unrealizedPnL: number
  tokensLeft: number
  buyCount: number
  sellCount: number
  firstBuyTime: string | null
  lastSellTime: string | null
  avgBuyPrice: number
  avgSellPrice: number
  totalTax: number
  totalFees: number
}

type SortField = 'netPnL' | 'unrealizedPnL' | 'tokensLeft' | 'avgBuyPrice' | 'avgSellPrice' | 'totalTax' | 'totalFees'
type SortDirection = 'asc' | 'desc'

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

// ---- Sortable Table Header ----
function SortableHeader({ 
  children, 
  field, 
  currentSort, 
  currentDirection, 
  onSort 
}: { 
  children: React.ReactNode
  field: SortField
  currentSort: SortField | null
  currentDirection: SortDirection
  onSort: (field: SortField) => void
}) {
  const isActive = currentSort === field
  
  return (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {isActive && currentDirection === 'asc' ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <div className="h-4 w-4" />
        )}
      </div>
    </TableHead>
  )
}

// ---- Sortable Table Header with Info ----
function SortableHeaderWithInfo({ 
  children, 
  field, 
  currentSort, 
  currentDirection, 
  onSort,
  tooltipText
}: { 
  children: React.ReactNode
  field: SortField
  currentSort: SortField | null
  currentDirection: SortDirection
  onSort: (field: SortField) => void
  tooltipText: string
}) {
  const isActive = currentSort === field
  
  return (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <UITooltip>
          <TooltipTrigger asChild>
            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </UITooltip>
        {isActive && currentDirection === 'asc' ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <div className="h-4 w-4" />
        )}
      </div>
    </TableHead>
  )
}

// ---- Table Header with Info ----
function HeaderWithInfo({ 
  children, 
  tooltipText 
}: { 
  children: React.ReactNode
  tooltipText: string
}) {
  return (
    <TableHead>
      <div className="flex items-center gap-1">
        {children}
        <UITooltip>
          <TooltipTrigger asChild>
            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </UITooltip>
      </div>
    </TableHead>
  )
}

interface SniperInsightsTabProps {
  symbol: string
}

export function SniperInsightsTab({ symbol }: SniperInsightsTabProps) {
  const [snipers, setSnipers] = useState<Sniper[]>([])
  const [loading, setLoading] = useState(true)
  
  // Pagination
  const [page, setPage] = useState(1)
  const rowsPerPage = 25

  // Sorting
  const [sortField, setSortField] = useState<SortField>('netPnL')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    fetchSnipers()
  }, [symbol])

  const fetchSnipers = async () => {
    try {
      const response = await fetch(`/api/token/${symbol}/snipers`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setSnipers(data)
    } catch (error) {
      console.error("Error fetching snipers:", error)
      // Set demo data
      setSnipers([
        {
          wallet: "0x1111111111111111111111111111111111111111",
          netPnL: 2500.75,
          unrealizedPnL: 1200.5,
          tokensLeft: 100000,
          buyCount: 3,
          sellCount: 1,
          firstBuyTime: "2024-01-15T10:31:00Z",
          lastSellTime: "2024-01-15T11:45:00Z",
          avgBuyPrice: 0.025,
          avgSellPrice: 0.03,
          totalTax: 15.5,
          totalFees: 8.25,
        },
        {
          wallet: "0x2222222222222222222222222222222222222222",
          netPnL: -150.25,
          unrealizedPnL: 0,
          tokensLeft: 0,
          buyCount: 2,
          sellCount: 2,
          firstBuyTime: "2024-01-15T10:35:00Z",
          lastSellTime: "2024-01-15T12:20:00Z",
          avgBuyPrice: 0.02,
          avgSellPrice: 0.03,
          totalTax: 20.0,
          totalFees: 12.75,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // If clicking the same field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // If clicking a new field, set it as the sort field and default to desc
      setSortField(field)
      setSortDirection('desc')
    }
    // Reset to first page when sorting
    setPage(1)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString() // Shows both date and time in user's locale
  }

  // Calculate KPIs
  const totalSnipers = snipers.length
  const successfulSnipers = snipers.filter((s) => s.netPnL > 0).length
  const successRate = totalSnipers > 0 ? (successfulSnipers / totalSnipers) * 100 : 0
  const totalRealizedPnL = snipers.reduce((sum, s) => sum + s.netPnL, 0)
  const totalUnrealizedPnL = snipers.reduce((sum, s) => sum + s.unrealizedPnL, 0)
  // Token held %: sum of tokensLeft / total supply (assume 1B for now)
  const totalTokensHeld = snipers.reduce((sum, s) => sum + s.tokensLeft, 0)
  const totalSupply = 1_000_000_000
  const tokenHeldPercentage = totalSupply > 0 ? (totalTokensHeld / totalSupply) * 100 : 0

  // Top 5 snipers for chart
  const top5Snipers = snipers
    .slice()
    .sort((a, b) => b.netPnL + b.unrealizedPnL - (a.netPnL + a.unrealizedPnL))
    .slice(0, 5)
    .map((sniper) => ({
      wallet: formatAddress(sniper.wallet),
      netPnL: sniper.netPnL + sniper.unrealizedPnL,
    }))

  // Sort and paginate data
  const sortedData = snipers.slice().sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const pageCount = Math.ceil(sortedData.length / rowsPerPage)
  const pageData = sortedData.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Snipers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSnipers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Held %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokenHeldPercentage.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Realized PnL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalRealizedPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${totalRealizedPnL.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unrealized PnL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalUnrealizedPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${totalUnrealizedPnL.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Snipers Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Snipers by Net PnL</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={top5Snipers}
              margin={{ top: 24, right: 32, left: 32, bottom: 64 }}
              barCategoryGap="15%"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="wallet"
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
                  value: 'Net PnL (USD)',
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
                formatter={(value) => [`$${Number(value).toFixed(2)}`, "Net PnL"]}
                labelFormatter={(label) => `${label}`}
              />
              <Bar dataKey="netPnL" fill="#009688" radius={[4, 4, 0, 0]}>
                {top5Snipers.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.netPnL >= 0 ? '#009688' : '#B71C1C'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sniper Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sniper Summary</CardTitle>
          {/* <CardDescription>Top 50 traders by Net PnL</CardDescription> */}
        </CardHeader>
                <CardContent>
          <div className="overflow-x-auto">
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Wallet</TableHead>
                    <SortableHeader 
                      field="netPnL" 
                      currentSort={sortField} 
                      currentDirection={sortDirection} 
                      onSort={handleSort}
                    >
                      Net PnL
                    </SortableHeader>
                    <SortableHeader 
                      field="unrealizedPnL" 
                      currentSort={sortField} 
                      currentDirection={sortDirection} 
                      onSort={handleSort}
                    >
                      Unrealized PnL
                    </SortableHeader>
                    <SortableHeader 
                      field="tokensLeft" 
                      currentSort={sortField} 
                      currentDirection={sortDirection} 
                      onSort={handleSort}
                    >
                      Tokens Left
                    </SortableHeader>
                    <TableHead>Buy Count</TableHead>
                    <TableHead>Sell Count</TableHead>
                    <SortableHeaderWithInfo 
                      field="avgBuyPrice" 
                      currentSort={sortField} 
                      currentDirection={sortDirection} 
                      onSort={handleSort}
                      tooltipText={`The average USD price at which the user bought ${symbol}.`}
                    >
                      Avg Buy Price
                    </SortableHeaderWithInfo>
                    <SortableHeaderWithInfo 
                      field="avgSellPrice" 
                      currentSort={sortField} 
                      currentDirection={sortDirection} 
                      onSort={handleSort}
                      tooltipText={`The average USD price at which the user sold ${symbol}.`}
                    >
                      Avg Sell Price
                    </SortableHeaderWithInfo>
                    <SortableHeaderWithInfo 
                      field="totalTax" 
                      currentSort={sortField} 
                      currentDirection={sortDirection} 
                      onSort={handleSort}
                      tooltipText={`Total ${symbol} paid as tax across all transactions by the sniper.`}
                    >
                      Tax
                    </SortableHeaderWithInfo>
                    <SortableHeaderWithInfo 
                      field="totalFees" 
                      currentSort={sortField} 
                      currentDirection={sortDirection} 
                      onSort={handleSort}
                      tooltipText="Total ETH spent as fees on all transactions by the sniper."
                    >
                      Fees
                    </SortableHeaderWithInfo>
                    <HeaderWithInfo tooltipText="Timestamp of the sniper's first purchase of the token.">
                      First Buy
                    </HeaderWithInfo>
                    <HeaderWithInfo tooltipText="Timestamp of the sniper's most recent sale of the token.">
                      Last Sell
                    </HeaderWithInfo>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? [...Array(10)].map((_, i) => (
                        <TableRow key={i}>
                          {[...Array(12)].map((_, j) => (
                            <TableCell key={j}>
                              <div className="h-4 bg-muted rounded animate-pulse"></div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : pageData.map((sniper, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs">
                            <CopyableCell value={sniper.wallet} display={formatAddress(sniper.wallet)} />
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              sniper.netPnL >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            ${sniper.netPnL.toFixed(2)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              sniper.unrealizedPnL >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            ${sniper.unrealizedPnL.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">{sniper.tokensLeft.toLocaleString()}</TableCell>
                          <TableCell className="text-center">{sniper.buyCount}</TableCell>
                          <TableCell className="text-center">{sniper.sellCount}</TableCell>
                          <TableCell className="text-right">${sniper.avgBuyPrice.toFixed(6)}</TableCell>
                          <TableCell className="text-right">${sniper.avgSellPrice.toFixed(6)}</TableCell>
                          <TableCell className="text-right">{sniper.totalTax.toFixed(4)}</TableCell>
                          <TableCell className="text-right">{sniper.totalFees.toFixed(4)}</TableCell>
                          <TableCell className="text-xs">
                            {sniper.firstBuyTime ? formatDate(sniper.firstBuyTime) : "N/A"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {sniper.lastSellTime ? formatDate(sniper.lastSellTime) : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
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
    </TooltipProvider>
  )
}

