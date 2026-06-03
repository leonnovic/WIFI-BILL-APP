"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Receipt, Search, Download, Filter } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  mpesaCode: string | null
  description: string | null
  createdAt: string
  user: { name: string | null; email: string } | null
  package: { name: string } | null
}

const fadeIn = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }

export default function MemberTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter !== "all") params.set("type", typeFilter)
      if (statusFilter !== "all") params.set("status", statusFilter)
      const res = await fetch(`/api/member/transactions?${params}`)
      if (res.ok) {
        const json = await res.json()
        setTransactions(Array.isArray(json) ? json : [])
      }
    } catch {
      toast.error("Failed to load transactions")
    } finally {
      setLoading(false)
    }
  }, [typeFilter, statusFilter])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const filtered = transactions.filter(t =>
    (t.user?.name || t.user?.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.description || "").toLowerCase().includes(search.toLowerCase())
  )

  const completedRevenue = transactions.filter(t => t.status === "completed").reduce((s, t) => s + t.amount, 0)
  const purchaseRevenue = transactions.filter(t => t.type === "purchase" && t.status === "completed").reduce((s, t) => s + t.amount, 0)
  const okoaGiven = transactions.filter(t => t.type === "okoa" && t.status === "completed").reduce((s, t) => s + t.amount, 0)
  const repayments = transactions.filter(t => t.type === "repayment" && t.status === "completed").reduce((s, t) => s + t.amount, 0)

  function exportCSV() {
    const headers = "Date,Client,Type,Amount,Status,M-Pesa Code,Description\n"
    const rows = filtered.map(t => `${new Date(t.createdAt).toLocaleDateString()},${t.user?.name || ""},${t.type},${t.amount},${t.status},${t.mpesaCode || ""},${t.description || ""}`).join("\n")
    const blob = new Blob([headers + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "transactions.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-4"><div className="h-16 bg-[#1e293b] rounded" /></CardContent></Card>)}
        </div>
        <Card className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-6"><div className="h-64 bg-[#1e293b] rounded" /></CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">Transactions</h1><p className="text-slate-400 mt-1">{transactions.length} total transactions</p></div>
        <Button onClick={exportCSV} className="bg-emerald-500 hover:bg-emerald-600 text-white"><Download className="w-4 h-4 mr-2" />Export CSV</Button>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#111827] border-[#1e293b]"><CardContent className="p-4"><p className="text-xs text-slate-400">Total Revenue</p><p className="text-xl font-bold text-emerald-400 mt-1">KES {completedRevenue.toLocaleString()}</p></CardContent></Card>
        <Card className="bg-[#111827] border-[#1e293b]"><CardContent className="p-4"><p className="text-xs text-slate-400">Purchases</p><p className="text-xl font-bold text-white mt-1">KES {purchaseRevenue.toLocaleString()}</p></CardContent></Card>
        <Card className="bg-[#111827] border-[#1e293b]"><CardContent className="p-4"><p className="text-xs text-slate-400">OKOA Given</p><p className="text-xl font-bold text-amber-400 mt-1">KES {okoaGiven.toLocaleString()}</p></CardContent></Card>
        <Card className="bg-[#111827] border-[#1e293b]"><CardContent className="p-4"><p className="text-xs text-slate-400">Repayments</p><p className="text-xl font-bold text-blue-400 mt-1">KES {repayments.toLocaleString()}</p></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions..." className="pl-10 bg-[#111827] border-[#1e293b] text-white" /></div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 bg-[#111827] border-[#1e293b] text-white"><Filter className="w-4 h-4 mr-2 text-slate-400" /><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent className="bg-[#111827] border-[#1e293b]"><SelectItem value="all">All Types</SelectItem><SelectItem value="purchase">Purchase</SelectItem><SelectItem value="okoa">OKOA</SelectItem><SelectItem value="topup">Top-up</SelectItem><SelectItem value="repayment">Repayment</SelectItem></SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-[#111827] border-[#1e293b] text-white"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="bg-[#111827] border-[#1e293b]"><SelectItem value="all">All Status</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="failed">Failed</SelectItem></SelectContent>
        </Select>
      </div>

      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-[#1e293b]">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Client</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Type</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">M-Pesa</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Description</th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400"><Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />No transactions found</td></tr>
                ) : filtered.map((tx) => (
                  <tr key={tx.id} className="border-b border-[#1e293b]/50 hover:bg-[#1e293b]/30">
                    <td className="py-3 px-4 text-sm text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-sm text-white">{tx.user?.name || tx.user?.email || "—"}</td>
                    <td className="py-3 px-4"><Badge variant="secondary" className={`text-xs border-0 ${tx.type === "purchase" ? "bg-emerald-500/15 text-emerald-400" : tx.type === "okoa" ? "bg-amber-500/15 text-amber-400" : tx.type === "repayment" ? "bg-blue-500/15 text-blue-400" : "bg-purple-500/15 text-purple-400"}`}>{tx.type}</Badge></td>
                    <td className="py-3 px-4 text-sm text-white">KES {tx.amount.toLocaleString()}</td>
                    <td className="py-3 px-4"><Badge variant="secondary" className={`text-xs border-0 ${tx.status === "completed" ? "bg-emerald-500/15 text-emerald-400" : tx.status === "pending" ? "bg-amber-500/15 text-amber-400" : "bg-red-500/15 text-red-400"}`}>{tx.status}</Badge></td>
                    <td className="py-3 px-4 text-sm text-slate-400 font-mono">{tx.mpesaCode || "—"}</td>
                    <td className="py-3 px-4 text-sm text-slate-400 max-w-48 truncate">{tx.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
