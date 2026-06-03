"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Users, Package, DollarSign, Router, Ticket, CreditCard, TrendingUp, ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { toast } from "sonner"

interface DashboardData {
  clients: number
  activeClients: number
  activePackages: number
  monthlyRevenue: number
  monthlyRevenueChart: { month: string; revenue: number }[]
  activeRouters: number
  totalRouters: number
  openTickets: number
  okoaCreditGiven: number
  recentTransactions: {
    id: string
    type: string
    amount: number
    status: string
    createdAt: string
    user: { name: string | null; email: string } | null
    package: { name: string } | null
  }[]
}

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.08 } } }

export default function MemberDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/member/dashboard")
        if (res.ok) {
          const json = await res.json()
          setData(json)
        } else {
          toast.error("Failed to load dashboard")
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error)
        toast.error("Failed to load dashboard")
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse">
              <CardContent className="p-5"><div className="h-24 bg-[#1e293b] rounded" /></CardContent>
            </Card>
          ))}
        </div>
        <div className="h-80 rounded-xl bg-[#111827] animate-pulse" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <TrendingUp className="w-16 h-16 text-emerald-500" />
        <h2 className="text-xl font-semibold text-white">Unable to Load Dashboard</h2>
        <p className="text-slate-400">Please try refreshing the page.</p>
      </div>
    )
  }

  const stats = [
    { title: "Total Clients", value: data.clients, sub: `${data.activeClients} active`, icon: Users, color: "emerald" },
    { title: "Active Packages", value: data.activePackages, sub: "subscribed", icon: Package, color: "blue" },
    { title: "Monthly Revenue", value: `KES ${data.monthlyRevenue.toLocaleString()}`, sub: "this month", icon: DollarSign, color: "amber" },
    { title: "Active Routers", value: `${data.activeRouters}/${data.totalRouters}`, sub: "online", icon: Router, color: "purple" },
    { title: "Open Tickets", value: data.openTickets, sub: "need attention", icon: Ticket, color: "red" },
    { title: "OKOA Credit", value: `KES ${data.okoaCreditGiven.toLocaleString()}`, sub: "outstanding", icon: CreditCard, color: "teal" },
  ]

  const colorMap: Record<string, { bg: string; text: string }> = {
    emerald: { bg: "bg-emerald-500/15", text: "text-emerald-500" },
    blue: { bg: "bg-blue-500/15", text: "text-blue-500" },
    amber: { bg: "bg-amber-500/15", text: "text-amber-500" },
    purple: { bg: "bg-purple-500/15", text: "text-purple-500" },
    red: { bg: "bg-red-500/15", text: "text-red-500" },
    teal: { bg: "bg-teal-500/15", text: "text-teal-500" },
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back to your ISP dashboard</p>
      </motion.div>

      <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <motion.div key={s.title} variants={fadeIn}>
            <Card className="bg-[#111827] border-[#1e293b] hover:border-emerald-500/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{s.title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${colorMap[s.color]?.bg}`}>
                    <s.icon className={`w-5 h-5 ${colorMap[s.color]?.text}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyRevenueChart}>
                  <defs>
                    <linearGradient id="memberRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `K${v / 1000}`} />
                  <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1e293b", borderRadius: "8px", color: "#e2e8f0" }} formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#memberRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentTransactions.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No transactions yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0b1220] border border-[#1e293b]">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{tx.user?.name || tx.user?.email || "Unknown"}</p>
                      <p className="text-xs text-slate-400">{tx.type} • {tx.package?.name || "N/A"} • {new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-sm font-semibold text-emerald-400">KES {tx.amount.toLocaleString()}</p>
                      <Badge variant="outline" className={
                        tx.status === "completed" ? "border-emerald-500/30 text-emerald-400 text-[10px]" :
                        tx.status === "pending" ? "border-amber-500/30 text-amber-400 text-[10px]" :
                        "border-red-500/30 text-red-400 text-[10px]"
                      }>
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
