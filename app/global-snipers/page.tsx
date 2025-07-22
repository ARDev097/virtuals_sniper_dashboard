"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface GlobalSniper {
  wallet: string
  token: string
  tokenName: string
  realizedPnL: number
  unrealizedPnL: number
  tokensLeft: number
  buyCount: number
  sellCount: number
  firstTxn: string
  lastTxn: string
  avgPrice: number
  totalTax: number
  totalFees: number
}

export default function GlobalSnipersPage() {
  const [snipers, setSnipers] = useState<GlobalSniper[]>([])
  const [filteredSnipers, setFilteredSnipers] = useState<GlobalSniper[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchGlobalSnipers()
  }, [])

  useEffect(() => {
    filterSnipers()
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
          firstTxn: "2024-01-15T10:31:00Z",
          lastTxn: "2024-01-15T11:45:00Z",
          avgPrice: 0.025,
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
          firstTxn: "2024-01-15T10:35:00Z",
          lastTxn: "2024-01-15T12:20:00Z",
          avgPrice: 0.03,
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

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString()
  }

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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Snipers</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top10Snipers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="wallet" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, "Net PnL"]} />
                <Bar dataKey="netPnL" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tokens with Most Sniper Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topTokens}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="token" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ffc658" />
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sr No</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Net PnL</TableHead>
                  <TableHead>Unrealized PnL</TableHead>
                  <TableHead>Remaining Tokens</TableHead>
                  <TableHead>Buy/Sell Txns</TableHead>
                  <TableHead>First Txn</TableHead>
                  <TableHead>Last Txn</TableHead>
                  <TableHead>Avg Price</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Fees</TableHead>
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
                  : filteredSnipers
                      .sort((a, b) => b.realizedPnL + b.unrealizedPnL - (a.realizedPnL + a.unrealizedPnL))
                      .slice(0, 100)
                      .map((sniper, index) => (
                        <TableRow key={`${sniper.wallet}-${sniper.token}`}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-mono text-xs">{formatAddress(sniper.wallet)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <Badge variant="outline" className="text-xs mb-1">
                                {sniper.token}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{sniper.tokenName}</span>
                            </div>
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
                          <TableCell className="text-center">
                            <div className="flex gap-1">
                              <Badge variant="outline" className="text-xs">
                                B: {sniper.buyCount}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                S: {sniper.sellCount}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {sniper.firstTxn ? formatDate(sniper.firstTxn) : "N/A"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {sniper.lastTxn ? formatDate(sniper.lastTxn) : "N/A"}
                          </TableCell>
                          <TableCell className="text-right">${(sniper.avgPrice ?? 0).toFixed(6)}</TableCell>
                          <TableCell className="text-right">${(sniper.totalTax ?? 0).toFixed(4)}</TableCell>
                          <TableCell className="text-right">${(sniper.totalFees ?? 0).toFixed(4)}</TableCell>
                        </TableRow>
                      ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
