"use client"

import { useState, useEffect, useCallback } from "react"
import {
  CreditCard, AlertTriangle, CheckCircle, Clock, TrendingUp,
  Shield, Users, DollarSign, HandCoins, X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface OkoaClient {
  id: string
  name: string | null
  email: string
  okoaBalance: number
  okoaLimit: number
  okoaUsed: number
  status: string
  phone: string | null
}

interface OkoaTransaction {
  id: string
  amount: number
  type: string
  status: string
  okoaAmount: number
  serviceFee: number
  description: string | null
  createdAt: string
  user: { name: string | null; email: string }
}

interface OkoaData {
  clients: OkoaClient[]
  totalCredit: number
  totalLimit: number
  totalUsed: number
  recentTransactions: OkoaTransaction[]
}

function formatKES(amount: number) {
  return `KES ${amount.toLocaleString()}`
}

const riskLevel = (balance: number, limit: number): { level: string; color: string } => {
  const ratio = limit > 0 ? balance / limit : 0
  if (ratio >= 0.9) return { level: "high", color: "text-rose-400 bg-rose-500/15" }
  if (ratio >= 0.5) return { level: "medium", color: "text-amber-400 bg-amber-500/15" }
  return { level: "low", color: "text-emerald-400 bg-emerald-500/15" }
}

export default function MemberOkoaPage() {
  const [data, setData] = useState<OkoaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [limitDialog, setLimitDialog] = useState<string | null>(null)
  const [repayDialog, setRepayDialog] = useState<string | null>(null)
  const [newLimit, setNewLimit] = useState("")
  const [repayAmount, setRepayAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/member/okoa")
      if (!res.ok) throw new Error()
      const json = await res.json()
      setData(json.data)
    } catch {
      toast.error("Failed to load OKOA data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateLimit = async (clientId: string) => {
    if (!newLimit || parseFloat(newLimit) < 0) {
      toast.error("Invalid limit amount")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/member/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ okoaLimit: parseFloat(newLimit) }),
      })
      if (!res.ok) throw new Error()
      toast.success("OKOA limit updated")
      setLimitDialog(null)
      fetchData()
    } catch {
      toast.error("Failed to update limit")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRepay = async (clientId: string) => {
    if (!repayAmount || parseFloat(repayAmount) <= 0) {
      toast.error("Invalid repayment amount")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/member/okoa/repay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, amount: parseFloat(repayAmount) }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed")
      }
      toast.success("Repayment processed")
      setRepayDialog(null)
      fetchData()
    } catch (e: any) {
      toast.error(e.message || "Failed to process repayment")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40 mb-2" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 bg-[#111827]" />
          ))}
        </div>
        <Skeleton className="h-64 bg-[#111827]" />
        <Skeleton className="h-64 bg-[#111827]" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Failed to load OKOA data</p>
        <Button onClick={() => fetchData()} className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white">Retry</Button>
      </div>
    )
  }

  const highRiskCount = data.clients.filter(c => riskLevel(c.okoaBalance, c.okoaLimit).level === "high").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">OKOA Internet</h1>
        <p className="text-slate-400 mt-1">Manage credit-based internet access</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: CreditCard, label: "Outstanding Credit", value: formatKES(data.totalCredit), color: "text-amber-400", iconColor: "text-amber-500" },
          { icon: DollarSign, label: "Total Limits", value: formatKES(data.totalLimit), color: "text-emerald-400", iconColor: "text-emerald-500" },
          { icon: TrendingUp, label: "Total Used (All Time)", value: formatKES(data.totalUsed), color: "text-sky-400", iconColor: "text-sky-500" },
          { icon: AlertTriangle, label: "High Risk", value: String(highRiskCount), color: "text-rose-400", iconColor: "text-rose-500" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <Card className="bg-[#111827] border-[#1e293b]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <s.icon className={`w-4 h-4 ${s.iconColor}`} />
                  <p className="text-xs text-slate-400">{s.label}</p>
                </div>
                <p className={`text-2xl font-bold mt-2 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* How OKOA Works */}
      <Card className="bg-[#111827] border-[#1e293b]">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />How OKOA Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Request Credit", desc: "Client requests when they need internet" },
              { step: "2", title: "Instant Access", desc: "Get access up to their limit" },
              { step: "3", title: "Auto Repay", desc: "Debt repaid when they top up" },
              { step: "4", title: "Service Fee", desc: "10% fee applies to credit" },
            ].map((item) => (
              <div key={item.step} className="text-center p-4 bg-[#0b1220] rounded-lg">
                <div className="w-8 h-8 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-emerald-400 font-bold text-sm">{item.step}</span>
                </div>
                <p className="text-sm text-white font-medium">{item.title}</p>
                <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Client list */}
      <Card className="bg-[#111827] border-[#1e293b]">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            Clients with OKOA Credit
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.clients.length > 0 ? (
            <div className="space-y-4">
              {data.clients.map((client, i) => {
                const risk = riskLevel(client.okoaBalance, client.okoaLimit)
                const usagePercent = client.okoaLimit > 0 ? (client.okoaBalance / client.okoaLimit) * 100 : 0

                return (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    className="bg-[#0b1220] rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <span className="text-emerald-400 text-xs font-bold">
                            {client.name?.split(" ").map(n => n[0]).join("") || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{client.name || client.email}</p>
                          <p className="text-xs text-slate-400">OKOA Balance: KES {client.okoaBalance.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs border-0 ${risk.color}`}>{risk.level} risk</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-sky-400 hover:text-sky-300"
                          onClick={() => {
                            setRepayDialog(client.id)
                            setRepayAmount("")
                          }}
                        >
                          <HandCoins className="w-3 h-3 mr-1" />Repay
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-400 hover:text-emerald-300"
                          onClick={() => {
                            setLimitDialog(client.id)
                            setNewLimit(String(client.okoaLimit))
                          }}
                        >
                          Set Limit
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Credit Used</span>
                        <span className="text-white">KES {client.okoaBalance.toLocaleString()} / KES {client.okoaLimit.toLocaleString()}</span>
                      </div>
                      <Progress value={usagePercent} className="h-2 bg-[#1e293b]" />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Total ever used: KES {client.okoaUsed.toLocaleString()}</span>
                        <span>{Math.round(usagePercent)}% of limit</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No clients with OKOA credit yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent OKOA Activity */}
      <Card className="bg-[#111827] border-[#1e293b]">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-500" />Recent OKOA Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentTransactions.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {data.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === "okoa" ? "bg-amber-500/15" : "bg-emerald-500/15"
                    }`}>
                      {tx.type === "okoa"
                        ? <CreditCard className="w-4 h-4 text-amber-400" />
                        : <CheckCircle className="w-4 h-4 text-emerald-400" />
                      }
                    </div>
                    <div>
                      <p className="text-sm text-white">{tx.user?.name || tx.user?.email || "Unknown"}</p>
                      <p className="text-xs text-slate-400">{tx.type === "okoa" ? "OKOA Credit" : "Repayment"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${tx.type === "okoa" ? "text-amber-400" : "text-emerald-400"}`}>
                      {tx.type === "okoa" ? "+" : "-"}{formatKES(tx.amount)}
                    </p>
                    <p className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-6">No OKOA activity yet</p>
          )}
        </CardContent>
      </Card>

      {/* Set Limit Dialog */}
      <Dialog open={!!limitDialog} onOpenChange={() => setLimitDialog(null)}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader>
            <DialogTitle>Set OKOA Limit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">New Credit Limit (KES)</Label>
              <Input
                type="number"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                className="bg-[#0b1220] border-[#1e293b] text-white"
              />
            </div>
            <Button
              onClick={() => limitDialog && updateLimit(limitDialog)}
              disabled={submitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {submitting ? "Updating..." : "Update Limit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Repay Dialog */}
      <Dialog open={!!repayDialog} onOpenChange={() => setRepayDialog(null)}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader>
            <DialogTitle>Process OKOA Repayment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Repayment Amount (KES)</Label>
              <Input
                type="number"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                className="bg-[#0b1220] border-[#1e293b] text-white"
                placeholder="Enter amount"
              />
            </div>
            <Button
              onClick={() => repayDialog && handleRepay(repayDialog)}
              disabled={submitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {submitting ? "Processing..." : "Process Repayment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
