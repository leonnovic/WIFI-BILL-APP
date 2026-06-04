"use client"

import { useEffect, useState } from "react"
import {
  Users, Package, DollarSign, Router, Ticket, CreditCard,
  TrendingUp, ArrowUpRight, ArrowDownRight, Activity, RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface DashboardData {
  clients: number
  activePackages: number
  monthlyRevenue: number
  activeRouters: number
  totalRouters: number
  openTickets: number
  okoaCreditGiven: number
  totalPackages: number
  revenueTrend: { month: string; revenue: number }[]
  activityFeed: { id: string; text: string; time: string; type: string }[]
  recentTransactions: {
    id: string
    amount: number
    type: string
    status: string
    createdAt: string
    user: { name: string | null; email: string }
    package: { name: string } | null
  }[]
  businessName: string
}

const statsConfig = [
  { title: "Total Clients", key: "clients", icon: Users, color: "emerald" },
  { title: "Active Packages", key: "totalPackages", icon: Package, color: "sky" },
  { title: "Monthly Revenue", key: "monthlyRevenue", icon: DollarSign, color: "amber", prefix: "KES " },
  { title: "Active Routers", key: "activeRouters", icon: Router, color: "violet", suffix: (d: DashboardData) => `/${d.totalRouters}` },
  { title: "Open Tickets", key: "openTickets", icon: Ticket, color: "rose" },
  { title: "OKOA Credit Given", key: "okoaCreditGiven", icon: CreditCard, color: "teal", prefix: "KES " },
]

const colorMap: Record<string, { bg: string; text: string }> = {
  emerald: { bg: "bg-emerald-500/15", text: "text-emerald-500" },
  sky: { bg: "bg-sky-500/15", text: "text-sky-500" },
  amber: { bg: "bg-amber-500/15", text: "text-amber-500" },
  violet: { bg: "bg-violet-500/15", text: "text-violet-500" },
  rose: { bg: "bg-rose-500/15", text: "text-rose-500" },
  teal: { bg: "bg-teal-500/15", text: "text-teal-500" },
}

const typeBadge: Record<string, string> = {
  purchase: "bg-emerald-500/15 text-emerald-400",
  okoa: "bg-amber-500/15 text-amber-400",
  repayment: "bg-sky-500/15 text-sky-400",
  topup: "bg-violet-500/15 text-violet-400",
  refund: "bg-rose-500/15 text-rose-400",
}

const statusBadge: Record<string, string> = {
  completed: "bg-emerald-500/15 text-emerald-400",
  pending: "bg-amber-500/15 text-amber-400",
  failed: "bg-rose-500/15 text-rose-400",
}

const activityDot: Record<string, string> = {
  purchase: "bg-emerald-500",
  okoa: "bg-amber-500",
  ticket: "bg-sky-500",
  alert: "bg-rose-500",
  repayment: "bg-teal-500",
}

function formatKES(amount: number) {
  return `KES ${amount.toLocaleString()}`
}

export default function MemberDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    try {
      const res = await fetch("/api/member/dashboard")
      if (!res.ok) throw new Error()
      const json = await res.json()
      setData(json.data)
    } catch {
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-60" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-[#111827] animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 rounded-xl bg-[#111827] animate-pulse" />
          <div className="h-80 rounded-xl bg-[#111827] animate-pulse" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Failed to load dashboard data</p>
        <Button onClick={() => fetchData()} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <RefreshCw className="w-4 h-4 mr-2" />Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome back, {data.businessName}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="border-[#1e293b] text-slate-400 hover:text-white hover:bg-[#1e293b]"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsConfig.map((s, i) => {
          const colors = colorMap[s.color]
          const rawValue = (data as any)[s.key] ?? 0
          const displayValue = typeof rawValue === "number"
            ? `${s.prefix || ""}${rawValue.toLocaleString()}${s.suffix ? s.suffix(data) : ""}`
            : rawValue

          return (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <Card className="bg-[#111827] border-[#1e293b] hover:border-emerald-500/30 transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400">{s.title}</p>
                      <p className="text-2xl font-bold text-white mt-1">{displayValue}</p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${colors.bg}`}>
                      <s.icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Revenue Chart + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Card className="bg-[#111827] border-[#1e293b]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                {data.revenueTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.revenueTrend}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `K${v / 1000}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111827",
                          border: "1px solid #1e293b",
                          borderRadius: "8px",
                          color: "#e2e8f0",
                        }}
                        formatter={(value: number) => [formatKES(value), "Revenue"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    No revenue data yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Card className="bg-[#111827] border-[#1e293b] h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.activityFeed.length > 0 ? (
                <div className="space-y-4 max-h-72 overflow-y-auto custom-scrollbar">
                  {data.activityFeed.map((a) => (
                    <div key={a.id} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${activityDot[a.type] || "bg-gray-500"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300">{a.text}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                  No recent activity
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e293b]">
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Client</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Type</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Amount</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTransactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-[#1e293b]/50 hover:bg-[#1e293b]/30 transition-colors">
                        <td className="py-3 px-4 text-sm text-white">{tx.user?.name || tx.user?.email || "Unknown"}</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className={`text-xs border-0 ${typeBadge[tx.type] || "bg-gray-500/15 text-gray-400"}`}>
                            {tx.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-white">{formatKES(tx.amount)}</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className={`text-xs border-0 ${statusBadge[tx.status] || "bg-gray-500/15 text-gray-400"}`}>
                            {tx.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No transactions yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
