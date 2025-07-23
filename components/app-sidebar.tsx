"use client"

import { Home, Target, TrendingUp } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Global Snipers",
    url: "/global-snipers",
    icon: Target,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [tokens, setTokens] = useState<{ name: string; symbol: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTokens() {
      try {
        const res = await fetch("/api/tokens")
        if (!res.ok) throw new Error("Failed to fetch tokens")
        const data = await res.json()
        setTokens(data.map((t: any) => ({ name: t.name, symbol: t.symbol })))
        setError(null)
      } catch (e) {
        setError("Could not load tokens")
        setTokens([])
      } finally {
        setLoading(false)
      }
    }
    fetchTokens()
  }, [])

  // Helper to format token name
  function formatTokenName(name: string) {
    let formatted = name.replace(/ by Virtuals$/i, "") // Remove 'by Virtuals' at end, case-insensitive
    formatted = formatted.replace(/_/g, " ") // Replace underscores with spaces
    return formatted.trim()
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-sidebar-primary-foreground">
            <TrendingUp className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Genesis Dapp</span>
            <span className="truncate text-xs text-sidebar-foreground/70">Crypto Analytics</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Tokens Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Tokens</SidebarGroupLabel>
          <SidebarGroupContent>
            {loading && <div className="px-4 py-2 text-xs text-muted-foreground">Loading tokens...</div>}
            {error && <div className="px-4 py-2 text-xs text-red-500">{error}</div>}
            {!loading && !error && (
              <SidebarMenu>
                {tokens.map((token) => (
                  <SidebarMenuItem key={token.symbol}>
                    <SidebarMenuButton asChild isActive={pathname === `/token/${token.symbol}`}>
                      <Link href={`/token/${token.symbol}`}>
                        <span>{formatTokenName(token.name)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
