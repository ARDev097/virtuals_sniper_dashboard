"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Copy, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GlobalSniper {
  wallet: string
  token: string
  tokenName: string
  realizedPnL: number
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

export default function GlobalSnipersPage() {
  const [snipers, setSnipers] = useState<GlobalSniper[]>([])
  const [filteredSnipers, setFilteredSnipers] = useState<GlobalSniper[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const { toast } = useToast()

  useEffect(() => {
    fetchGlobalSnipers()
  }, [])

  useEffect(() => {
    filterSnipers()
    setCurrentPage(1) // Reset to first page when search changes
  }, [snipers, searchTerm])

  const fetchGlobalSnipers = async () => {
    try {
      const response = await fetch("/api/global-snipers")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setSnipers(data)
    } catch (error) {
      console.error("Error fetching global snipers:", error)
      // Set demo data
      setSnipers([
        {
          wallet: "0x1111111111111111111111111111111111111111",
          token: "VGT",
          tokenName: "Virtual Genesis Token",
          realizedPnL: 2500.75,
          unrealizedPnL: 1200.5,
          tokensLeft: 100000,
          buyCount: 3,
          sellCount: 1,
          firstBuyTime: "2024-01-15T10:31:00Z",
          lastSellTime: "2024-01-15T11:45:00Z",
          avgBuyPrice: 0.025,
          avgSellPrice: 0.035,
          totalTax: 15.5,
          totalFees: 8.25,
        },
        {
          wallet: "0x2222222222222222222222222222222222222222",
          token: "GAI",
          tokenName: "Genesis AI Token",
          realizedPnL: -150.25,
          unrealizedPnL: 0,
          tokensLeft: 0,
          buyCount: 2,
          sellCount: 2,
          firstBuyTime: "2024-01-15T10:35:00Z",
          lastSellTime: "2024-01-15T12:20:00Z",
          avgBuyPrice: 0.03,
          avgSellPrice: 0.028,
          totalTax: 20.0,
          totalFees: 12.75,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const filterSnipers = () => {
    const filtered = snipers.filter(
      (sniper) =>
        sniper.wallet.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sniper.token.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sniper.tokenName.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredSnipers(filtered)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatShortAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-3)}`
  }

  const formatDate = (timestamp: string | null) => {
    if (!timestamp) return "N/A"
    try {
      return new Date(timestamp).toLocaleString()
    } catch (error) {
      return "N/A"
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "Address copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  // Pagination logic
  const ITEMS_PER_PAGE = 25
  const totalPages = Math.ceil(filteredSnipers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentSnipers = filteredSnipers.slice(startIndex, endIndex)

  // Calculate KPIs
  const totalUniqueSnipers = new Set(snipers.map((s) => s.wallet)).size
  const totalRealizedPnL = snipers.reduce((sum, s) => sum + s.realizedPnL, 0)
  const totalUnrealizedPnL = snipers.reduce((sum, s) => sum + s.unrealizedPnL, 0)

  // Top 10 snipers for chart
  const top10Snipers = snipers
    .sort((a, b) => b.realizedPnL + b.unrealizedPnL - (a.realizedPnL + a.unrealizedPnL))
    .slice(0, 10)
    .map((sniper) => ({
      wallet: formatAddress(sniper.wallet),
      fullWallet: sniper.wallet,
      token: sniper.token,
      tokenName: sniper.tokenName,
      netPnL: sniper.realizedPnL + sniper.unrealizedPnL,
    }))

  // Tokens with most sniper activity
  const tokenActivity = snipers.reduce(
    (acc, sniper) => {
      acc[sniper.token] = (acc[sniper.token] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const topTokens = Object.entries(tokenActivity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([token, count]) => ({
      token,
      count,
    }))

  // Profit distribution
  const profitRanges = [
    { range: "$0-$100", min: 0, max: 100 },
    { range: "$100-$500", min: 100, max: 500 },
    { range: "$500-$1K", min: 500, max: 1000 },
    { range: "$1K-$5K", min: 1000, max: 5000 },
    { range: "$5K+", min: 5000, max: Number.POSITIVE_INFINITY },
  ]

  const profitDistribution = profitRanges.map((range) => ({
    range: range.range,
    count: snipers.filter((s) => {
      const netPnL = s.realizedPnL + s.unrealizedPnL
      return netPnL >= range.min && netPnL < range.max
    }).length,
  }))

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <h2 className="text-3xl font-bold tracking-tight">Global Snipers</h2>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Unique Snipers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUniqueSnipers}</div>
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

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Snipers</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={top10Snipers} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="wallet" 
                  label={{ value: "Wallet Address", position: "bottom", offset: 0, style: { textAnchor: "middle" } }}
                  tickFormatter={formatShortAddress}
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <YAxis 
                  label={{ value: "Net PnL ($)", angle: -90, position: "left", offset: 0, style: { textAnchor: "middle" } }}
                />
                <Tooltip 
                  formatter={(value, name, props) => {
                    const data = props.payload;
                    return [
                      `$${Number(value).toFixed(2)}`,
                      "Net PnL"
                    ];
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return (
                        <div>
                          <div><strong>Wallet:</strong> {data.fullWallet}</div>
                          <div><strong>Token:</strong> {data.token} ({data.tokenName})</div>
                        </div>
                      );
                    }
                    return label;
                  }}
                />
                <Bar dataKey="netPnL" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tokens with Most Sniper Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topTokens} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="token" 
                  label={{ value: "Token Symbol", position: "bottom", offset: 0, style: { textAnchor: "middle" } }}
                />
                <YAxis 
                  label={{ value: "Number of Snipers", angle: -90, position: "left", offset: 0, style: { textAnchor: "middle" } }}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Profit Distribution Chart */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Profit Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={profitDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="range" 
                  label={{ value: "Profit Range", position: "bottom", offset: 0, style: { textAnchor: "middle" } }}
                />
                <YAxis 
                  label={{ value: "Number of Snipers", angle: -90, position: "left", offset: 0, style: { textAnchor: "middle" } }}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Search Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search Snipers</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by wallet address, token, or token name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      {/* Global Snipers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Global Snipers</CardTitle>
          <CardDescription>
            Showing {filteredSnipers.length} of {snipers.length} snipers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md border">
              <div className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Net PnL</TableHead>
                      <TableHead>Unrealized PnL</TableHead>
                      <TableHead>Remaining Tokens</TableHead>
                      <TableHead>Buy Txns</TableHead>
                      <TableHead>Sell Txns</TableHead>
                      <TableHead>First Txn</TableHead>
                      <TableHead>Last Txn</TableHead>
                      <TableHead>Avg Buy Price</TableHead>
                      <TableHead>Avg Sell Price</TableHead>
                      <TableHead>Tax</TableHead>
                      <TableHead>Fees</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading
                      ? [...Array(25)].map((_, i) => (
                          <TableRow key={i}>
                            {[...Array(12)].map((_, j) => (
                              <TableCell key={j}>
                                <div className="h-4 bg-muted rounded animate-pulse"></div>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      : currentSnipers
                          .sort((a, b) => b.realizedPnL + b.unrealizedPnL - (a.realizedPnL + a.unrealizedPnL))
                          .map((sniper, index) => (
                            <TableRow key={`${sniper.wallet}-${sniper.token}`}>
                              <TableCell className="font-mono text-xs">
                                <div className="flex items-center gap-2">
                                  <span>{formatAddress(sniper.wallet)}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => copyToClipboard(sniper.wallet)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs font-medium">
                                {sniper.token}
                              </TableCell>
                              <TableCell
                                className={`text-right font-medium ${
                                  sniper.realizedPnL >= 0 ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                ${sniper.realizedPnL.toFixed(2)}
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
                              <TableCell className="text-xs">
                                {formatDate(sniper.firstBuyTime)}
                              </TableCell>
                              <TableCell className="text-xs">
                                {formatDate(sniper.lastSellTime)}
                              </TableCell>
                              <TableCell className="text-right">${(sniper.avgBuyPrice ?? 0).toFixed(6)}</TableCell>
                              <TableCell className="text-right">${(sniper.avgSellPrice ?? 0).toFixed(6)}</TableCell>
                              <TableCell className="text-right">{(sniper.totalTax ?? 0).toFixed(4)}</TableCell>
                              <TableCell className="text-right">{(sniper.totalFees ?? 0).toFixed(4)}</TableCell>
                            </TableRow>
                          ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredSnipers.length)} of {filteredSnipers.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="text-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
