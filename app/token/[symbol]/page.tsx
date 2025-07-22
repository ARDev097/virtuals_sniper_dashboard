"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { TransactionsTab } from "@/components/transactions-tab"
import { SniperInsightsTab } from "@/components/sniper-insights-tab"
import { OtherTab } from "@/components/other-tab"

interface TokenData {
  token: string
  name: string
  symbol: string
  dao: string
  tba: string
  veToken: string
  lp: string
  virtualId: string
  blockNumber: number
  timestamp: string
  txHash: string
  stats: {
    totalSwaps: number
    uniqueTraders: number
    buyVolume: number
    sellVolume: number
  }
}

export default function TokenDetailsPage() {
  const params = useParams()
  const symbol = params.symbol as string
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (symbol) {
      fetchTokenData()
    }
  }, [symbol])

  const fetchTokenData = async () => {
    try {
      const response = await fetch(`/api/token/${symbol}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setTokenData(data)
    } catch (error) {
      console.error("Error fetching token data:", error)
      // Set demo data
      setTokenData({
        token: "0x1234567890abcdef1234567890abcdef12345678",
        name: "Virtual Genesis Token",
        symbol: symbol,
        dao: "0xabcdef1234567890abcdef1234567890abcdef12",
        tba: "0x1111111111111111111111111111111111111111",
        veToken: "0x2222222222222222222222222222222222222222",
        lp: "0x9876543210fedcba9876543210fedcba98765432",
        virtualId: "1",
        blockNumber: 18500000,
        timestamp: "2024-01-15T10:30:00Z",
        txHash: "0xfedcba0987654321fedcba0987654321fedcba09",
        stats: {
          totalSwaps: 150,
          uniqueTraders: 45,
          buyVolume: 2500000,
          sellVolume: 1800000,
        },
      })
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`
  }

  const formatDate = (timestamp: string | number) => {
    const ts = typeof timestamp === "string" ? Number(timestamp) : timestamp;
    if (!ts || isNaN(ts)) return "N/A";
    const ms = ts < 1e12 ? ts * 1000 : ts;
    return new Date(ms).toUTCString();
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!tokenData) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center py-12">
          <div className="text-muted-foreground">Token not found.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{tokenData.name}</h2>
            <p className="text-muted-foreground">
              <Badge variant="secondary" className="mr-2">
                {tokenData.symbol}
              </Badge>
              Launched {formatDate(tokenData.timestamp)}
            </p>
          </div>
        </div>
      </div>

      {/* Token Metadata */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono">{formatAddress(tokenData.token)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DAO Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono">{tokenData.dao ? formatAddress(tokenData.dao) : "N/A"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LP Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono">{tokenData.lp ? formatAddress(tokenData.lp) : "N/A"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Swaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokenData.stats.totalSwaps.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="snipers">Sniper Insights</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionsTab symbol={symbol} />
        </TabsContent>

        <TabsContent value="snipers" className="space-y-4">
          <SniperInsightsTab symbol={symbol} />
        </TabsContent>

        <TabsContent value="other" className="space-y-4">
          <OtherTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
