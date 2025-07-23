"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

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

interface SniperInsightsTabProps {
  symbol: string
}

export function SniperInsightsTab({ symbol }: SniperInsightsTabProps) {
  const [snipers, setSnipers] = useState<Sniper[]>([])
  const [loading, setLoading] = useState(true)

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

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString()
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

  return (
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
            <BarChart data={top5Snipers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="wallet"
                label={{
                  value: 'Wallet',
                  position: 'insideBottom',
                  dy: 10,
                  textAnchor: 'middle',
                  style: { fontWeight: 500 }
                }}
              />
              <YAxis
                label={{
                  value: 'Net PnL (In USD)',
                  angle: -90,
                  position: 'insideLeft',
                  dx: -10,
                  textAnchor: 'middle',
                  style: { fontWeight: 500 }
                }}
              />
              <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, "Net PnL"]} />
              <Bar dataKey="netPnL">
                {top5Snipers.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.netPnL >= 0 ? '#22c55e' : '#ef4444'} />
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Net PnL</TableHead>
                  <TableHead>Unrealized PnL</TableHead>
                  <TableHead>Tokens Left</TableHead>
                  <TableHead>Buy Count</TableHead>
                  <TableHead>Sell Count</TableHead>
                  <TableHead>Avg Buy Price</TableHead>
                  <TableHead>Avg Sell Price</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Fees</TableHead>
                  <TableHead>First Buy</TableHead>
                  <TableHead>Last Sell</TableHead>
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
                  : snipers
                      .slice()
                      .sort((a, b) => b.netPnL + b.unrealizedPnL - (a.netPnL + a.unrealizedPnL))
                      .slice(0, 50)
                      .map((sniper, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs">{formatAddress(sniper.wallet)}</TableCell>
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
                          <TableCell className="text-right">${sniper.totalTax.toFixed(4)}</TableCell>
                          <TableCell className="text-right">${sniper.totalFees.toFixed(4)}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  )
}

