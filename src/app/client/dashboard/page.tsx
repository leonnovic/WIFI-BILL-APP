"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Package, CreditCard, MessageSquare, Wifi, ArrowUp, ArrowDown, Database, Clock, Zap, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { toast } from "sonner"

interface DashboardData {
  user: {
    id: string
    name: string | null
    email: string
    okoaBalance: number
    okoaLimit: number
    okoaUsed: number
    dataUsed: number
    dataLimit: number
    connectionStatus: string
    packageExpiry: string | null
    activePackageId: string | null
    activePackage: {
      id: string
      name: string
      speed: string
      speedDown: number
      speedUp: number
      dataLimit: string | null
      dataLimitMB: number
      price: number
      duration: number
    } | null
  } | null
  recentTransactions: {
    id: string
    type: string
    amount: number
    status: string
    description: string | null
    createdAt: string
  }[]
}

const fadeIn = { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 } }

const usageData = [
  { day: "Mon", usage: 450 }, { day: "Tue", usage: 620 }, { day: "Wed", usage: 380 },
  { day: "Thu", usage: 510 }, { day: "Fri", usage: 750 }, { day: "Sat", usage: 890 }, { day: "Sun", usage: 670 },
]

export default function ClientDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/client/dashboard")
        if (res.ok) { const json = await res.json(); setData(json) }
        else { toast.error("Failed to load dashboard") }
      } catch { toast.error("Failed to load dashboard") }
      finally { setLoading(false) }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-[#1e293b] rounded animate-pulse" />)}</div>
        <Card className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-6"><div className="h-40 bg-[#1e293b] rounded" /></CardContent></Card>
      </div>
    )
  }

  const user = data?.user
  const activePackage = user?.activePackage
  const daysLeft = user?.packageExpiry ? Math.max(0, Math.ceil((new Date(user.packageExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0
  const dataPercent = user && user.dataLimit > 0 ? (user.dataUsed / user.dataLimit) * 100 : 0
  const dataUsedGB = user ? (user.dataUsed / 1024).toFixed(1) : "0"
  const dataLimitGB = user ? (user.dataLimit / 1024).toFixed(1) : "0"

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back, {user?.name || "User"}</p>
      </motion.div>

      {/* Quick actions */}
      <motion.div {...fadeIn} transition={{ delay: 0.05 }} className="grid grid-cols-3 gap-3">
        <Link href="/client/packages"><Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-auto py-3 flex-col gap-1"><Package className="w-5 h-5" /><span className="text-xs">Buy Package</span></Button></Link>
        <Link href="/client/okoa"><Button className="w-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 h-auto py-3 flex-col gap-1"><CreditCard className="w-5 h-5" /><span className="text-xs">OKOA Internet</span></Button></Link>
        <Link href="/client/support"><Button className="w-full bg-[#1e293b] hover:bg-[#2d3a4d] text-white h-auto py-3 flex-col gap-1"><MessageSquare className="w-5 h-5" /><span className="text-xs">Support</span></Button></Link>
      </motion.div>

      {/* Active Package */}
      <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader className="pb-2"><CardTitle className="text-base text-white flex items-center gap-2"><Wifi className="w-4 h-4 text-emerald-500" />Active Package</CardTitle></CardHeader>
          <CardContent>
            {activePackage ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xl font-bold text-emerald-400">{activePackage.name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{daysLeft} days remaining</p>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-0">Active</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center p-2 bg-[#0b1220] rounded-lg"><ArrowDown className="w-4 h-4 text-emerald-500 mx-auto mb-1" /><p className="text-xs text-slate-400">Download</p><p className="text-sm font-bold text-white">{activePackage.speedDown} Mbps</p></div>
                  <div className="text-center p-2 bg-[#0b1220] rounded-lg"><ArrowUp className="w-4 h-4 text-blue-500 mx-auto mb-1" /><p className="text-xs text-slate-400">Upload</p><p className="text-sm font-bold text-white">{activePackage.speedUp} Mbps</p></div>
                  <div className="text-center p-2 bg-[#0b1220] rounded-lg"><Database className="w-4 h-4 text-amber-500 mx-auto mb-1" /><p className="text-xs text-slate-400">Data</p><p className="text-sm font-bold text-white">{activePackage.dataLimitMB === 0 ? "∞" : `${dataUsedGB}/${dataLimitGB} GB`}</p></div>
                </div>
                {user && user.dataLimit > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs"><span className="text-slate-400">Data Used</span><span className="text-white">{Math.round(dataPercent)}%</span></div>
                    <Progress value={dataPercent} className="h-2 bg-[#1e293b]" />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-400 text-sm">No active package</p>
                <Link href="/client/packages"><Button className="mt-3 bg-emerald-500 hover:bg-emerald-600 text-white" size="sm"><Package className="w-4 h-4 mr-2" />Buy a Package</Button></Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* OKOA Balance */}
      {user && user.okoaBalance > 0 && (
        <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
          <Card className="bg-[#111827] border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/15"><CreditCard className="w-5 h-5 text-amber-400" /></div>
                  <div><p className="text-sm text-slate-400">OKOA Balance</p><p className="text-lg font-bold text-amber-400">KES {user.okoaBalance.toLocaleString()}</p></div>
                </div>
                <Link href="/client/okoa"><Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300">View Details</Button></Link>
              </div>
              <p className="text-xs text-slate-500 mt-2">This amount will be deducted from your next package purchase.</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Data Usage Chart */}
      <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader className="pb-2"><CardTitle className="text-base text-white flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-500" />Weekly Data Usage</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}MB`} />
                  <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1e293b", borderRadius: "8px", color: "#e2e8f0" }} formatter={(value: number) => [`${value} MB`, "Usage"]} />
                  <Bar dataKey="usage" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div {...fadeIn} transition={{ delay: 0.25 }}>
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader className="pb-2"><CardTitle className="text-base text-white">Recent Transactions</CardTitle></CardHeader>
          <CardContent>
            {data?.recentTransactions && data.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {data.recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === "purchase" ? "bg-emerald-500/15" : tx.type === "okoa" ? "bg-amber-500/15" : "bg-blue-500/15"}`}>
                        {tx.type === "purchase" ? <Package className="w-4 h-4 text-emerald-400" /> : tx.type === "okoa" ? <CreditCard className="w-4 h-4 text-amber-400" /> : <Wifi className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div><p className="text-sm text-white">{tx.description || tx.type}</p><p className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</p></div>
                    </div>
                    <p className={`text-sm font-medium ${tx.type === "topup" || tx.type === "repayment" ? "text-emerald-400" : "text-white"}`}>KES {tx.amount.toLocaleString()}</p>
                  </div>
                ))}
                <Link href="/client/transactions"><Button variant="ghost" size="sm" className="w-full mt-2 text-emerald-400 hover:text-emerald-300">View All Transactions</Button></Link>
              </div>
            ) : (
              <p className="text-slate-400 text-sm text-center py-4">No transactions yet</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
