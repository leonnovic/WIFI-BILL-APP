"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Receipt, Search, Download, Filter, RefreshCw,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface TransactionData {
  id: string
  amount: number
  type: string
  status: string
  mpesaCode: string | null
  mpesaReceipt: string | null
  okoaAmount: number
  serviceFee: number
  description: string | null
  createdAt: string
  user: { id: string; name: string | null; email: string }
  package: { id: string; name: string } | null
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
  refunded: "bg-sky-500/15 text-sky-400",
}

function formatKES(amount: number) {
  return `KES ${amount.toLocaleString()}`
}

export default function MemberTransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (typeFilter !== "all") params.set("type", typeFilter)
      if (statusFilter !== "all") params.set("status", statusFilter)
      params.set("limit", "50")

      const res = await fetch(`/api/member/transactions?${params}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setTransactions(json.data || [])
    } catch {
      toast.error("Failed to load transactions")
    } finally {
      setLoading(false)
    }
  }, [typeFilter, statusFilter])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const filtered = transactions.filter(t => {
    const matchSearch =
      (t.user?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.user?.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.mpesaCode || "").toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  const totalRevenue = transactions.filter(t => t.status === "completed").reduce((sum, t) => sum + t.amount, 0)
  const purchaseTotal = transactions.filter(t => t.type === "purchase" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0)
  const okoaTotal = transactions.filter(t => t.type === "okoa" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0)
  const repaymentTotal = transactions.filter(t => t.type === "repayment" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0)

  const exportCSV = () => {
    const headers = "Date,Client,Type,Amount,Status,M-Pesa Ref,Description\n"
    const rows = filtered.map(t =>
      `${new Date(t.createdAt).toLocaleDateString()},${t.user?.name || t.user?.email || ""},${t.type},${t.amount},${t.status},${t.mpesaCode || t.mpesaReceipt || ""},${t.description || ""}`
    ).join("\n")
    const blob = new Blob([headers + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "transactions.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported")
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 bg-[#111827]" />
          ))}
        </div>
        <Skeleton className="h-96 bg-[#111827]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-slate-400 mt-1">{transactions.length} total transactions</p>
        </div>
        <Button
          onClick={exportCSV}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
          disabled={filtered.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client, description, or M-Pesa code..."
            className="pl-10 bg-[#111827] border-[#1e293b] text-white"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 bg-[#111827] border-[#1e293b] text-white">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-[#111827] border-[#1e293b]">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="purchase">Purchase</SelectItem>
            <SelectItem value="okoa">OKOA</SelectItem>
            <SelectItem value="topup">Top-up</SelectItem>
            <SelectItem value="repayment">Repayment</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-[#111827] border-[#1e293b] text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#111827] border-[#1e293b]">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatKES(totalRevenue), color: "text-emerald-400" },
          { label: "Purchases", value: formatKES(purchaseTotal), color: "text-white" },
          { label: "OKOA Given", value: formatKES(okoaTotal), color: "text-amber-400" },
          { label: "Repayments", value: formatKES(repaymentTotal), color: "text-sky-400" },
        ].map((card) => (
          <Card key={card.label} className="bg-[#111827] border-[#1e293b]">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">{card.label}</p>
              <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transactions Table */}
      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-0">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e293b]">
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Client</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Type</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">M-Pesa Ref</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx, i) => (
                    <motion.tr
                      key={tx.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-[#1e293b]/50 hover:bg-[#1e293b]/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-slate-400 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-white">
                        {tx.user?.name || tx.user?.email || "Unknown"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className={`text-xs border-0 ${typeBadge[tx.type] || "bg-slate-500/15 text-slate-400"}`}>
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-white font-medium">{formatKES(tx.amount)}</td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className={`text-xs border-0 ${statusBadge[tx.status] || "bg-slate-500/15 text-slate-400"}`}>
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-400 font-mono">
                        {tx.mpesaCode || tx.mpesaReceipt || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-400 max-w-[200px] truncate">
                        {tx.description || "—"}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">
                {search || typeFilter !== "all" || statusFilter !== "all"
                  ? "No transactions match your filters"
                  : "No transactions yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
