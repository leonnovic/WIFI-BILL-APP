"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Building2, UserCircle, DollarSign, Router, Ticket, TrendingUp, Activity, Database } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { toast } from "sonner"

interface DashboardData {
  stats: { totalUsers: number; activeMembers: number; activeClients: number; revenue: number; activeRouters: number; openTickets: number }
  monthlyRevenue: { month: string; revenue: number }[]
  recentTransactions: any[]
  recentUsers: any[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => { fetchDashboard() }, [])

  async function fetchDashboard() {
    try {
      const res = await fetch("/api/admin/dashboard")
      if (res.ok) { const json = await res.json(); setData(json) }
    } catch (error) { console.error("Failed to fetch dashboard:", error) }
    finally { setLoading(false) }
  }

  async function seedDemoData() {
    setSeeding(true)
    try {
      const res = await fetch("/api/admin/seed-demo", { method: "POST" })
      const json = await res.json()
      if (res.ok) { toast.success(json.message || "Demo data seeded!"); fetchDashboard() }
      else { toast.error(json.error || "Failed to seed data") }
    } catch { toast.error("Failed to seed demo data") }
    finally { setSeeding(false) }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-6"><div className="h-20 bg-[#1e293b] rounded" /></CardContent></Card>)}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Database className="w-16 h-16 text-emerald-500" />
        <h2 className="text-xl font-semibold text-white">No Data Yet</h2>
        <p className="text-slate-400 text-center max-w-md">The database is empty. Seed demo data to explore the admin portal.</p>
        <Button onClick={seedDemoData} disabled={seeding} className="bg-emerald-500 hover:bg-emerald-600 text-white">{seeding ? "Seeding..." : "Seed Demo Data"}</Button>
      </div>
    )
  }

  const { stats, monthlyRevenue, recentTransactions, recentUsers } = data
  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { title: "Active ISPs", value: stats.activeMembers, icon: Building2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { title: "Active Clients", value: stats.activeClients, icon: UserCircle, color: "text-purple-400", bg: "bg-purple-400/10" },
    { title: "Revenue (This Month)", value: `KES ${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "text-amber-400", bg: "bg-amber-400/10" },
    { title: "Active Routers", value: stats.activeRouters, icon: Router, color: "text-cyan-400", bg: "bg-cyan-400/10" },
    { title: "Open Tickets", value: stats.openTickets, icon: Ticket, color: "text-red-400", bg: "bg-red-400/10" },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">Dashboard</h1><p className="text-slate-400 text-sm">Overview of your ISP management platform</p></div>
        <Button onClick={seedDemoData} disabled={seeding} variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
          <Database className="w-4 h-4 mr-2" />{seeding ? "Seeding..." : "Re-seed Demo Data"}
        </Button>
      </motion.div>

      <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.08 } } }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <motion.div key={stat.title} variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}>
            <Card className="bg-[#111827] border-[#1e293b] hover:border-[#334155] transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm text-slate-400">{stat.title}</p><p className="text-2xl font-bold text-white mt-1">{stat.value}</p></div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}><stat.icon className={`w-6 h-6 ${stat.color}`} /></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-[#111827] border-[#1e293b]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" />Revenue Overview</CardTitle>
            <CardDescription className="text-slate-400">Monthly revenue for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue}>
                  <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `KES ${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1e293b", borderRadius: "8px", color: "#e2e8f0" }} formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-400" />System Health</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[{ label: "API Server", status: "Operational", color: "bg-emerald-400" }, { label: "M-Pesa Integration", status: "Connected", color: "bg-emerald-400" }, { label: "SMS Gateway", status: "Connected", color: "bg-emerald-400" }, { label: "Email Service", status: "Connected", color: "bg-emerald-400" }, { label: "Database", status: "Healthy", color: "bg-emerald-400" }, { label: "MikroTik API", status: "Partial", color: "bg-amber-400" }].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${item.color}`} /><span className="text-sm text-slate-300">{item.label}</span></div>
                <span className="text-xs text-slate-400">{item.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader><CardTitle className="text-white text-lg">Recent Transactions</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentTransactions.length === 0 ? <p className="text-slate-400 text-sm text-center py-4">No transactions yet</p> : recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0b1220] border border-[#1e293b]">
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{tx.user?.name || tx.user?.email || "Unknown"}</p><p className="text-xs text-slate-400">{tx.type} • {new Date(tx.createdAt).toLocaleDateString()}</p></div>
                  <div className="text-right ml-3">
                    <p className="text-sm font-semibold text-emerald-400">KES {tx.amount.toLocaleString()}</p>
                    <Badge variant="outline" className={["completed"].includes(tx.status) ? "border-emerald-500/30 text-emerald-400 text-[10px]" : ["pending"].includes(tx.status) ? "border-amber-500/30 text-amber-400 text-[10px]" : "border-red-500/30 text-red-400 text-[10px]"}>{tx.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader><CardTitle className="text-white text-lg">Recent Signups</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentUsers.length === 0 ? <p className="text-slate-400 text-sm text-center py-4">No users yet</p> : recentUsers.map((user: any) => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#0b1220] border border-[#1e293b]">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center"><span className="text-sm font-semibold text-emerald-400">{(user.name || user.email).charAt(0).toUpperCase()}</span></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{user.name || "No name"}</p><p className="text-xs text-slate-400 truncate">{user.email}</p></div>
                  <Badge variant="outline" className={user.role === "admin" ? "border-red-500/30 text-red-400" : user.role === "member" ? "border-blue-500/30 text-blue-400" : "border-slate-500/30 text-slate-400"}>{user.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
