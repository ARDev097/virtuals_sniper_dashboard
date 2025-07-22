"use client"

import { useState, useEffect } from "react"
import { Search, Calendar, ArrowUpDown, ExternalLink, Copy } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"

interface Token {
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
  [key: string]: string | number
}

export default function HomePage() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "timestamp">("timestamp")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  

  useEffect(() => {
    fetchTokens()
  }, [])

  useEffect(() => {
    filterAndSortTokens()
  }, [tokens, searchTerm, sortBy])

  const fetchTokens = async () => {
    try {
      const response = await fetch("/api/tokens")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setTokens(data)
      setError(null)
    } catch (error) {
      console.error("Error fetching tokens:", error)
      setError("Backend server not running. Showing demo data.")
      setTokens([])
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortTokens = () => {
    const filtered = tokens.filter(
      (token) =>
        token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.token.toLowerCase().includes(searchTerm.toLowerCase())
    )

    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      } else {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      }
    })

    setFilteredTokens(filtered)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (timestamp: string | number) => {
    const ts = typeof timestamp === "string" ? Number(timestamp) : timestamp;
    if (!ts || isNaN(ts)) return "N/A";
    const ms = ts < 1e12 ? ts * 1000 : ts;
    return new Date(ms).toUTCString();
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({ description: `${label} copied to clipboard!` })
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <h2 className="text-3xl font-bold tracking-tight">Token Dashboard</h2>
        </div>
      </div>

      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-yellow-800">{error}</div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tokens, symbols, or addresses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground font-medium">Sort By:</span>
          <Button
            variant={sortBy === "timestamp" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("timestamp")}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Launch Date
          </Button>
          <Button
            variant={sortBy === "name" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("name")}
            className="flex items-center gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            Token Name
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokens.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Launch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{tokens.length > 0 ? formatDate(tokens[0]?.timestamp) : "N/A"}</div>
          </CardContent>
        </Card>
      </div>

      {!loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTokens.map((token) => (
            <Card key={token.token} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{token.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant="secondary">{token.symbol}</Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Launch Time:</span>
                    <span className="font-medium">{formatDate(token.timestamp)}</span>
                  </div>
                  {["token", "dao", "lp"].map((field) => (
                    token[field] && (
                      <div key={field} className="flex justify-between items-center">
                        <span className="text-muted-foreground">{field.toUpperCase()}:</span>
                        <span className="flex items-center gap-1 font-mono text-xs">
                          {formatAddress(String(token[field]))}
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Copy className="w-4 h-4 cursor-pointer" onClick={() => handleCopy(String(token[field]), `${field.toUpperCase()} address`)} />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                      </div>
                    )
                  ))}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Block Number:</span>
                    <span className="font-medium">{token.blockNumber}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/token/${token.symbol}`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      See TXNs
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredTokens.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">No tokens found matching your criteria.</div>
        </div>
      )}
    </div>
  )
}
