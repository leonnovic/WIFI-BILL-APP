"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Download, ArrowLeftRight, CreditCard } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  mpesaCode: string | null
  mpesaPhone: string | null
  mpesaReceipt: string | null
  description: string | null
  okoaAmount: number
  serviceFee: number
  createdAt: string
  user: { id: string; name: string | null; email: string } | null
  package: { id: string; name: string } | null
}

const statusColors: Record<string, string> = {
  completed: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  pending: "border-amber-500/30 text-amber-400 bg-amber-500/10",
  failed: "border-red-500/30 text-red-400 bg-red-500/10",
  refunded: "border-blue-500/30 text-blue-400 bg-blue-500/10",
}

const typeColors: Record<string, string> = {
  purchase: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10",
  okoa: "border-amber-500/30 text-amber-400 bg-amber-500/10",
  topup: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  refund: "border-red-500/30 text-red-400 bg-red-500/10",
  repayment: "border-blue-500/30 text-blue-400 bg-blue-500/10",
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "20")
      if (typeFilter && typeFilter !== "ALL") params.set("type", typeFilter)
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter)
      const res = await fetch(`/api/admin/transactions?${params}`)
      if (res.ok) {
        const json = await res.json()
        setTransactions(json.data || [])
        setTotal(json.total || 0)
      }
    } catch (error) { console.error("Failed to fetch transactions:", error) }
    finally { setLoading(false) }
  }, [page, typeFilter, statusFilter])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  function exportCSV() {
    const headers = ["ID", "Type", "Amount", "Status", "User", "M-Pesa Code", "M-Pesa Receipt", "Description", "Date"]
    const rows = transactions.map(tx => [
      tx.id, tx.type, tx.amount, tx.status, tx.user?.name || tx.user?.email || "",
      tx.mpesaCode || "", tx.mpesaReceipt || "", tx.description || "", new Date(tx.createdAt).toISOString(),
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-emerald-400" /> Transactions
          </h1>
          <p className="text-slate-400 text-sm mt-1">All platform transactions and M-Pesa payments</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input placeholder="Search transactions..." className="pl-9 bg-[#0b1220] border-[#1e293b] text-white placeholder:text-slate-500" />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40 bg-[#0b1220] border-[#1e293b] text-white"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="purchase">Purchase</SelectItem>
                <SelectItem value="okoa">OKOA</SelectItem>
                <SelectItem value="topup">Top-up</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="repayment">Repayment</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40 bg-[#0b1220] border-[#1e293b] text-white"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#1e293b] hover:bg-transparent">
                  <TableHead className="text-slate-400 font-medium">Type</TableHead>
                  <TableHead className="text-slate-400 font-medium">User</TableHead>
                  <TableHead className="text-slate-400 font-medium">Amount</TableHead>
                  <TableHead className="text-slate-400 font-medium">M-Pesa Code</TableHead>
                  <TableHead className="text-slate-400 font-medium">Status</TableHead>
                  <TableHead className="text-slate-400 font-medium">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-[#1e293b]">
                      {[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-24 bg-[#1e293b]" /></TableCell>)}
                    </TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <CreditCard className="w-10 h-10 text-slate-600" />
                        <p className="text-slate-400">No transactions found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {transactions.map((tx, index) => (
                      <motion.tr key={tx.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="border-[#1e293b] hover:bg-[#0b1220]/50 transition-colors">
                        <TableCell>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${typeColors[tx.type] || typeColors.purchase}`}>{tx.type}</span>
                        </TableCell>
                        <TableCell>
                          <p className="text-white text-sm font-medium">{tx.user?.name || "—"}</p>
                          <p className="text-slate-500 text-xs">{tx.user?.email}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-emerald-400 font-bold text-sm">KES {tx.amount.toLocaleString()}</span>
                          {tx.okoaAmount > 0 && <p className="text-xs text-amber-400">OKOA: KES {tx.okoaAmount.toLocaleString()}</p>}
                        </TableCell>
                        <TableCell>
                          {tx.mpesaCode ? (
                            <span className="text-slate-300 text-sm font-mono">{tx.mpesaCode}</span>
                          ) : (
                            <span className="text-slate-500 text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[tx.status] || statusColors.pending}`}>{tx.status}</span>
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </div>
          {total > 20 && (
            <div className="flex items-center justify-between p-4 border-t border-[#1e293b]">
              <p className="text-sm text-slate-400">Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="border-[#1e293b] text-slate-300">Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="border-[#1e293b] text-slate-300">Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
