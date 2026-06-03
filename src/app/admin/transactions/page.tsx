"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Download, ArrowLeftRight } from "lucide-react"

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  mpesaRef: string | null
  mpesaPhone: string | null
  mpesaReceipt: string | null
  description: string | null
  createdAt: string
  user: { name: string | null; email: string } | null
  package: { name: string } | null
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [search, setSearch] = useState("")
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
        setTransactions(json.transactions)
        setTotal(json.total)
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, statusFilter])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  function exportCSV() {
    const headers = ["ID", "Type", "Amount", "Status", "User", "M-Pesa Ref", "M-Pesa Receipt", "Description", "Date"]
    const rows = transactions.map(tx => [
      tx.id,
      tx.type,
      tx.amount,
      tx.status,
      tx.user?.name || tx.user?.email || "",
      tx.mpesaRef || "",
      tx.mpesaReceipt || "",
      tx.description || "",
      new Date(tx.createdAt).toISOString(),
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statusColors: Record<string, string> = {
    COMPLETED: "border-emerald-500/30 text-emerald-400",
    PENDING: "border-amber-500/30 text-amber-400",
    FAILED: "border-red-500/30 text-red-400",
    REFUNDED: "border-blue-500/30 text-blue-400",
  }

  const typeColors: Record<string, string> = {
    PURCHASE: "border-cyan-500/30 text-cyan-400",
    OKOA: "border-amber-500/30 text-amber-400",
    TOPUP: "border-emerald-500/30 text-emerald-400",
    REFUND: "border-red-500/30 text-red-400",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-slate-400 text-sm">All platform transactions and M-Pesa payments</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-[#0b1220] border-[#1e293b] text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40 bg-[#0b1220] border-[#1e293b] text-white">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="PURCHASE">Purchase</SelectItem>
                <SelectItem value="OKOA">OKOA</SelectItem>
                <SelectItem value="TOPUP">Top-up</SelectItem>
                <SelectItem value="REFUND">Refund</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40 bg-[#0b1220] border-[#1e293b] text-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#1e293b] hover:bg-transparent">
                  <TableHead className="text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-400">User</TableHead>
                  <TableHead className="text-slate-400">Amount</TableHead>
                  <TableHead className="text-slate-400">M-Pesa Ref</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-[#1e293b]">
                      {[...Array(6)].map((_, j) => (
                        <TableCell key={j} className="animate-pulse"><div className="h-4 bg-[#1e293b] rounded w-24" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400">No transactions found</TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id} className="border-[#1e293b] hover:bg-[#0b1220]/50">
                      <TableCell>
                        <Badge variant="outline" className={typeColors[tx.type] || "border-slate-500/30 text-slate-400"}>
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white text-sm">{tx.user?.name || "—"}</p>
                          <p className="text-slate-400 text-xs">{tx.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-emerald-400 font-semibold">KES {tx.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-slate-300 text-sm font-mono">{tx.mpesaRef || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[tx.status] || "border-slate-500/30 text-slate-400"}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {total > 20 && (
            <div className="flex items-center justify-between p-4 border-t border-[#1e293b]">
              <p className="text-sm text-slate-400">Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}</p>
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
