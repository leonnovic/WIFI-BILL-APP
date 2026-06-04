"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users, Building2, UserCircle, DollarSign, Router, Ticket,
  TrendingUp, Activity, Database, ArrowUpRight, Zap, Server,
  CreditCard, Clock, Wifi,
} from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

interface DashboardData {
  stats: {
    totalUsers: number
    activeMembers: number
    activeClients: number
    revenue: number
    activeRouters: number
    openTickets: number
  }
  monthlyRevenue: { month: string; revenue: number }[]
  recentTransactions: any[]
  recentUsers: any[]
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => { fetchDashboard() }, [])

  async function fetchDashboard() {
    try {
      const res = await fetch("/api/admin/dashboard")
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  async function seedDemoData() {
    setSeeding(true)
    try {
      const res = await fetch("/api/admin/seed-demo", { method: "POST" })
      const json = await res.json()
      if (res.ok) {
        toast.success(json.data?.message || "Demo data seeded successfully!")
        fetchDashboard()
      } else {
        toast.error(json.error || "Failed to seed data")
      }
    } catch {
      toast.error("Failed to seed demo data")
    } finally {
      setSeeding(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 bg-[#1e293b]" />
            <Skeleton className="h-4 w-64 bg-[#1e293b] mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-[#111827] border-[#1e293b]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 bg-[#1e293b]" />
                    <Skeleton className="h-8 w-16 bg-[#1e293b]" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-xl bg-[#1e293b]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 bg-[#111827] border-[#1e293b]">
            <CardContent className="p-6"><Skeleton className="h-[300px] bg-[#1e293b]" /></CardContent>
          </Card>
          <Card className="bg-[#111827] border-[#1e293b]">
            <CardContent className="p-6"><Skeleton className="h-[300px] bg-[#1e293b]" /></CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center border border-emerald-500/20"
        >
          <Database className="w-10 h-10 text-emerald-400" />
        </motion.div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">No Data Yet</h2>
          <p className="text-slate-400 max-w-md">
            The database is empty. Seed demo data to explore the admin portal with realistic sample data.
          </p>
        </div>
        <Button
          onClick={seedDemoData}
          disabled={seeding}
          size="lg"
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
        >
          <Database className="w-5 h-5 mr-2" />
          {seeding ? "Seeding Demo Data..." : "Seed Demo Data"}
        </Button>
      </div>
    )
  }

  const { stats, monthlyRevenue, recentTransactions, recentUsers } = data

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", trend: "+12%" },
    { title: "Active ISPs", value: stats.activeMembers, icon: Building2, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", trend: "+3" },
    { title: "Active Clients", value: stats.activeClients, icon: UserCircle, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20", trend: "+8%" },
    { title: "Revenue (Month)", value: `KES ${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", trend: "+15%" },
    { title: "Active Routers", value: stats.activeRouters, icon: Router, color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20", trend: "100%" },
    { title: "Open Tickets", value: stats.openTickets, icon: Ticket, color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20", trend: "-2" },
  ]

  const systemHealth = [
    { label: "API Server", status: "Operational", color: "bg-emerald-400", icon: Server },
    { label: "M-Pesa Integration", status: "Connected", color: "bg-emerald-400", icon: CreditCard },
    { label: "SMS Gateway", status: "Connected", color: "bg-emerald-400", icon: Zap },
    { label: "Email Service", status: "Connected", color: "bg-emerald-400", icon: Activity },
    { label: "Database", status: "Healthy", color: "bg-emerald-400", icon: Database },
    { label: "MikroTik API", status: "Partial", color: "bg-amber-400", icon: Wifi },
  ]

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Overview of your ISP management platform</p>
        </div>
        <Button
          onClick={seedDemoData}
          disabled={seeding}
          variant="outline"
          size="sm"
          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
        >
          <Database className="w-4 h-4 mr-2" />
          {seeding ? "Seeding..." : "Re-seed Demo Data"}
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
          >
            <Card className="bg-[#111827] border-[#1e293b] hover:border-[#334155] transition-all duration-300 hover:shadow-lg hover:shadow-black/20 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-400 font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <div className="flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-medium">{stat.trend}</span>
                      <span className="text-xs text-slate-500">vs last month</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg} border ${stat.border} group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-[#111827] border-[#1e293b]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Revenue Overview
            </CardTitle>
            <CardDescription className="text-slate-400">Monthly revenue for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `KES ${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111827",
                      border: "1px solid #1e293b",
                      borderRadius: "12px",
                      color: "#e2e8f0",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                    }}
                    formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemHealth.map((item) => (
              <div key={item.label} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#0b1220] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.color} shadow-sm ${item.color === 'bg-emerald-400' ? 'shadow-emerald-400/50' : 'shadow-amber-400/50'}`} />
                  <div className="flex items-center gap-2">
                    <item.icon className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-sm text-slate-300">{item.label}</span>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] ${item.color === 'bg-emerald-400' ? 'border-emerald-500/20 text-emerald-400' : 'border-amber-500/20 text-amber-400'}`}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentTransactions.length === 0 ? (
                <div className="text-slate-400 text-sm text-center py-8">No transactions yet</div>
              ) : recentTransactions.map((tx: any, index: number) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0b1220] border border-[#1e293b] hover:border-[#334155] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tx.user?.name || tx.user?.email || "Unknown"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="border-slate-600 text-slate-400 text-[10px] py-0">{tx.type}</Badge>
                      <span className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-sm font-bold text-emerald-400">KES {tx.amount.toLocaleString()}</p>
                    <Badge variant="outline" className={
                      tx.status === "completed" ? "border-emerald-500/30 text-emerald-400 text-[10px] py-0" :
                      tx.status === "pending" ? "border-amber-500/30 text-amber-400 text-[10px] py-0" :
                      "border-red-500/30 text-red-400 text-[10px] py-0"
                    }>
                      {tx.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              Recent Signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentUsers.length === 0 ? (
                <div className="text-slate-400 text-sm text-center py-8">No users yet</div>
              ) : recentUsers.map((user: any, index: number) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#0b1220] border border-[#1e293b] hover:border-[#334155] transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center border border-emerald-500/20">
                    <span className="text-sm font-bold text-emerald-400">{(user.name || user.email).charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name || "No name"}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <Badge variant="outline" className={
                    user.role === "admin" ? "border-rose-500/30 text-rose-400 text-[10px]" :
                    user.role === "member" ? "border-amber-500/30 text-amber-400 text-[10px]" :
                    "border-slate-500/30 text-slate-400 text-[10px]"
                  }>
                    {user.role}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
