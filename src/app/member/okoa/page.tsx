"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { CreditCard, AlertTriangle, CheckCircle, Clock, TrendingUp, Shield, Users, DollarSign, Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"

interface OkoaClient {
  id: string
  name: string | null
  okoaBalance: number
  okoaLimit: number
  okoaUsed: number
  status: string
}

interface OkoaData {
  clients: OkoaClient[]
  totalCredit: number
  totalLimit: number
  totalUsed: number
}

const fadeIn = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }

export default function MemberOkoaPage() {
  const [data, setData] = useState<OkoaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [limitDialog, setLimitDialog] = useState<string | null>(null)
  const [newLimit, setNewLimit] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/member/okoa")
      if (res.ok) { const json = await res.json(); setData(json) }
      else { toast.error("Failed to load OKOA data") }
    } catch { toast.error("Failed to load OKOA data") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function updateLimit(clientId: string) {
    if (!newLimit) return
    setSaving(true)
    try {
      const res = await fetch(`/api/member/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ okoaLimit: parseFloat(newLimit) }),
      })
      if (res.ok) { toast.success("OKOA limit updated"); setLimitDialog(null); fetchData() }
      else { toast.error("Failed to update limit") }
    } catch { toast.error("Failed to update limit") }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-4"><div className="h-16 bg-[#1e293b] rounded" /></CardContent></Card>)}</div>
        <Card className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-6"><div className="h-40 bg-[#1e293b] rounded" /></CardContent></Card>
      </div>
    )
  }

  if (!data) return <div className="text-center py-12 text-slate-400">Failed to load OKOA data</div>

  const highRiskCount = data.clients.filter(c => (c.okoaBalance / c.okoaLimit) > 0.8).length

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold text-white">OKOA Internet</h1>
        <p className="text-slate-400 mt-1">Manage credit-based internet access</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#111827] border-[#1e293b]"><CardContent className="p-4"><div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-amber-500" /><p className="text-xs text-slate-400">Active Credit</p></div><p className="text-2xl font-bold text-amber-400 mt-2">KES {data.totalCredit.toLocaleString()}</p></CardContent></Card>
        <Card className="bg-[#111827] border-[#1e293b]"><CardContent className="p-4"><div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-500" /><p className="text-xs text-slate-400">Total Limits</p></div><p className="text-2xl font-bold text-emerald-400 mt-2">KES {data.totalLimit.toLocaleString()}</p></CardContent></Card>
        <Card className="bg-[#111827] border-[#1e293b]"><CardContent className="p-4"><div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /><p className="text-xs text-slate-400">Total Used</p></div><p className="text-2xl font-bold text-blue-400 mt-2">KES {data.totalUsed.toLocaleString()}</p></CardContent></Card>
        <Card className="bg-[#111827] border-[#1e293b]"><CardContent className="p-4"><div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /><p className="text-xs text-slate-400">High Risk</p></div><p className="text-2xl font-bold text-red-400 mt-2">{highRiskCount}</p></CardContent></Card>
      </div>

      <Card className="bg-[#111827] border-[#1e293b]">
        <CardHeader><CardTitle className="text-lg text-white flex items-center gap-2"><Shield className="w-5 h-5 text-emerald-500" />How OKOA Works</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { num: "1", title: "Request Credit", desc: "Client requests when they need internet" },
              { num: "2", title: "Instant Access", desc: "Get access up to their limit" },
              { num: "3", title: "Auto Repay", desc: "Debt repaid when they top up" },
              { num: "4", title: "Service Fee", desc: "10% fee applies to credit" },
            ].map((step) => (
              <div key={step.num} className="text-center p-4 bg-[#0b1220] rounded-lg">
                <div className="w-8 h-8 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-emerald-400 font-bold text-sm">{step.num}</span></div>
                <p className="text-sm text-white font-medium">{step.title}</p>
                <p className="text-xs text-slate-400 mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#111827] border-[#1e293b]">
        <CardHeader><CardTitle className="text-lg text-white flex items-center gap-2"><Users className="w-5 h-5 text-emerald-500" />Clients with OKOA Credit</CardTitle></CardHeader>
        <CardContent>
          {data.clients.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No clients with OKOA credit</p>
          ) : (
            <div className="space-y-4">
              {data.clients.map((client) => {
                const ratio = client.okoaLimit > 0 ? (client.okoaBalance / client.okoaLimit) * 100 : 0
                const riskLevel = ratio > 80 ? "high" : ratio > 50 ? "medium" : "low"
                return (
                  <div key={client.id} className="bg-[#0b1220] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <span className="text-emerald-400 text-xs font-bold">{client.name?.split(" ").map(n => n[0]).join("") || "?"}</span>
                        </div>
                        <div><p className="text-sm font-medium text-white">{client.name || "Unknown"}</p><p className="text-xs text-slate-400">Balance: KES {client.okoaBalance}</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs border-0 ${riskLevel === "high" ? "bg-red-500/15 text-red-400" : riskLevel === "medium" ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"}`}>{riskLevel} risk</Badge>
                        <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300" onClick={() => { setLimitDialog(client.id); setNewLimit(String(client.okoaLimit)) }}>
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs"><span className="text-slate-400">Credit Used</span><span className="text-white">KES {client.okoaBalance} / KES {client.okoaLimit}</span></div>
                      <Progress value={ratio} className="h-2 bg-[#1e293b]" />
                      <div className="flex justify-between text-xs text-slate-500"><span>Total used: KES {client.okoaUsed}</span><span>{Math.round(ratio)}% of limit</span></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!limitDialog} onOpenChange={() => setLimitDialog(null)}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader><DialogTitle>Set OKOA Limit</DialogTitle><DialogDescription className="text-slate-400">Update the credit limit for this client</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label className="text-slate-300">New Credit Limit (KES)</Label><Input type="number" value={newLimit} onChange={(e) => setNewLimit(e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLimitDialog(null)} className="border-[#1e293b] text-slate-300">Cancel</Button>
            <Button onClick={() => limitDialog && updateLimit(limitDialog)} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white">{saving ? "Saving..." : "Update Limit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
