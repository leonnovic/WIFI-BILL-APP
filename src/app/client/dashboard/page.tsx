"use client"

import { useState, useEffect } from "react"
import { Package, CreditCard, MessageSquare, Wifi, ArrowUp, ArrowDown, Database, Clock, Zap, Signal, AlertCircle, TrendingUp, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { format } from "date-fns"

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
}

export default function ClientDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/client/dashboard")
        if (res.ok) {
          const json = await res.json()
          setData(json.data)
        } else {
          toast.error("Failed to load dashboard data")
        }
      } catch {
        toast.error("Network error. Please check your connection.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse">
            <CardContent className="p-4"><div className="h-16 bg-[#1e293b] rounded" /></CardContent>
          </Card>
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse">
          <CardContent className="p-6"><div className="h-32 bg-[#1e293b] rounded" /></CardContent>
        </Card>
      ))}
    </div>
  )

  if (!data) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">Unable to load dashboard</p>
        <Button variant="ghost" className="mt-2 text-emerald-400" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    </div>
  )

  const hasActivePackage = !!data.activePackage && !data.isPackageExpired
  const pkg = data.activePackage
  const dataUsedGB = (data.dataUsed / 1024).toFixed(1)
  const dataLimitGB = data.dataLimit > 0 ? (data.dataLimit / 1024).toFixed(0) : "∞"
  const okoaBalance = data.okoaBalance || 0

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome */}
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl font-bold text-white">
          {getGreeting()}, {data.name?.split(" ")[0] || "User"} 👋
        </h1>
        <p className="text-slate-400 mt-1">Here&apos;s your internet status overview</p>
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={staggerItem} className="grid grid-cols-3 gap-3">
        <Link href="/client/packages">
          <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-auto py-3 flex-col gap-1.5 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all">
            <Package className="w-5 h-5" />
            <span className="text-xs font-medium">Buy Package</span>
          </Button>
        </Link>
        <Link href="/client/okoa">
          <Button className="w-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 h-auto py-3 flex-col gap-1.5 rounded-xl transition-all">
            <CreditCard className="w-5 h-5" />
            <span className="text-xs font-medium">OKOA Internet</span>
          </Button>
        </Link>
        <Link href="/client/support">
          <Button className="w-full bg-[#1e293b] hover:bg-[#2d3a4d] text-slate-300 border border-[#2d3a4d] h-auto py-3 flex-col gap-1.5 rounded-xl transition-all">
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs font-medium">Support</span>
          </Button>
        </Link>
      </motion.div>

      {/* Active Package */}
      <motion.div variants={staggerItem}>
        <Card className="bg-[#111827] border-[#1e293b] overflow-hidden">
          {hasActivePackage ? (
            <>
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-base text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/15">
                      <Wifi className="w-4 h-4 text-emerald-500" />
                    </div>
                    Active Package
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                    {data.connectionStatus === "connected" ? "Connected" : "Disconnected"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xl font-bold text-emerald-400">{pkg.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {data.daysRemaining} days remaining
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Speed</p>
                    <p className="text-sm font-semibold text-white">{pkg.speed || `${pkg.speedDown}Mbps`}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2.5 bg-[#0b1220] rounded-xl border border-[#1e293b]/50">
                    <ArrowDown className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Download</p>
                    <p className="text-sm font-bold text-white">{pkg.speedDown} Mbps</p>
                  </div>
                  <div className="text-center p-2.5 bg-[#0b1220] rounded-xl border border-[#1e293b]/50">
                    <ArrowUp className="w-4 h-4 text-sky-500 mx-auto mb-1" />
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Upload</p>
                    <p className="text-sm font-bold text-white">{pkg.speedUp} Mbps</p>
                  </div>
                  <div className="text-center p-2.5 bg-[#0b1220] rounded-xl border border-[#1e293b]/50">
                    <Database className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Data</p>
                    <p className="text-sm font-bold text-white">{dataUsedGB}/{dataLimitGB} GB</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Data Used</span>
                    <span className="text-white font-medium">{Math.round(data.dataUsagePercent)}%</span>
                  </div>
                  <div className="relative">
                    <Progress value={data.dataUsagePercent} className="h-2.5 bg-[#1e293b]" />
                    {data.dataUsagePercent > 80 && (
                      <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        You&apos;ve used most of your data
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <div className="h-1 bg-gradient-to-r from-slate-600 to-slate-500" />
              <CardContent className="py-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#1e293b] flex items-center justify-center mx-auto mb-4">
                  <Wifi className="w-7 h-7 text-slate-500" />
                </div>
                <p className="text-white font-medium">No Active Package</p>
                <p className="text-sm text-slate-500 mt-1">Purchase a package to get connected</p>
                <Link href="/client/packages">
                  <Button className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
                    <Package className="w-4 h-4 mr-2" />Browse Packages
                  </Button>
                </Link>
              </CardContent>
            </>
          )}
        </Card>
      </motion.div>

      {/* OKOA Balance Card */}
      {okoaBalance > 0 && (
        <motion.div variants={staggerItem}>
          <Card className="bg-[#111827] border-amber-500/20 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-400" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/15">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">OKOA Balance</p>
                    <p className="text-xl font-bold text-amber-400">KES {okoaBalance.toLocaleString()}</p>
                  </div>
                </div>
                <Link href="/client/okoa">
                  <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 gap-1">
                    View Details <ExternalLink className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-slate-600 mt-2">This amount will be deducted from your next package purchase.</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Weekly Data Usage chart */}
      <motion.div variants={staggerItem}>
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/15">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              Weekly Data Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weeklyUsage || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}MB`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111827",
                      border: "1px solid #1e293b",
                      borderRadius: "10px",
                      color: "#e2e8f0",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`${value} MB`, "Usage"]}
                    cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
                  />
                  <Bar dataKey="usage" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div variants={staggerItem}>
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/15">
                  <Zap className="w-4 h-4 text-emerald-500" />
                </div>
                Recent Transactions
              </span>
              <Link href="/client/transactions">
                <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs gap-1">
                  View All <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentTransactions?.length > 0 ? (
              <div className="space-y-1">
                {data.recentTransactions.map((tx: any, i: number) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        tx.type === "purchase" ? "bg-emerald-500/15" :
                        tx.type === "okoa" ? "bg-amber-500/15" :
                        tx.type === "repayment" ? "bg-sky-500/15" :
                        "bg-purple-500/15"
                      }`}>
                        {tx.type === "purchase" ? <Package className="w-4 h-4 text-emerald-400" /> :
                         tx.type === "okoa" ? <CreditCard className="w-4 h-4 text-amber-400" /> :
                         tx.type === "repayment" ? <ArrowUp className="w-4 h-4 text-sky-400" /> :
                         <Signal className="w-4 h-4 text-purple-400" />}
                      </div>
                      <div>
                        <p className="text-sm text-white">{tx.description || tx.type}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(tx.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <p className={`text-sm font-semibold ${
                      tx.type === "topup" || tx.type === "repayment" ? "text-emerald-400" : "text-white"
                    }`}>
                      {tx.type === "topup" || tx.type === "repayment" ? "+" : "-"}KES {tx.amount.toLocaleString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Zap className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No transactions yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
