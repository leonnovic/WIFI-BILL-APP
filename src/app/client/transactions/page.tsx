"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Receipt, Search, Download } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  description: string | null
  mpesaCode: string | null
  mpesaReceipt: string | null
  createdAt: string
}

const fadeIn = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }

export default function ClientTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch("/api/client/transactions")
        if (res.ok) { const json = await res.json(); setTransactions(Array.isArray(json) ? json : []) }
      } catch { toast.error("Failed to load transactions") }
      finally { setLoading(false) }
    }
    fetchTransactions()
  }, [])

  const filtered = transactions.filter(t => {
    const matchSearch = (t.description || "").toLowerCase().includes(search.toLowerCase()) || t.type.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === "all" || t.type === typeFilter
    return matchSearch && matchType
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
        <div className="h-10 bg-[#1e293b] rounded animate-pulse" />
        {[...Array(3)].map((_, i) => <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-4"><div className="h-16 bg-[#1e293b] rounded" /></CardContent></Card>)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <p className="text-slate-400 mt-1">Your transaction history</p>
      </motion.div>

      <div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-10 bg-[#111827] border-[#1e293b] text-white" /></div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32 bg-[#111827] border-[#1e293b] text-white"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent className="bg-[#111827] border-[#1e293b]"><SelectItem value="all">All</SelectItem><SelectItem value="purchase">Purchase</SelectItem><SelectItem value="okoa">OKOA</SelectItem><SelectItem value="topup">Top-up</SelectItem><SelectItem value="repayment">Repayment</SelectItem></SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12"><Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" /><p className="text-slate-400">No transactions found</p></div>
        ) : filtered.map((tx) => (
          <motion.div key={tx.id} {...fadeIn}>
            <Card className="bg-[#111827] border-[#1e293b]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "purchase" ? "bg-emerald-500/15" : tx.type === "okoa" ? "bg-amber-500/15" : tx.type === "repayment" ? "bg-blue-500/15" : "bg-purple-500/15"}`}>
                      <Receipt className={`w-5 h-5 ${tx.type === "purchase" ? "text-emerald-400" : tx.type === "okoa" ? "text-amber-400" : tx.type === "repayment" ? "text-blue-400" : "text-purple-400"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{tx.description || tx.type}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className={`text-xs border-0 ${tx.type === "purchase" ? "bg-emerald-500/15 text-emerald-400" : tx.type === "okoa" ? "bg-amber-500/15 text-amber-400" : tx.type === "repayment" ? "bg-blue-500/15 text-blue-400" : "bg-purple-500/15 text-purple-400"}`}>{tx.type}</Badge>
                        <span className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</span>
                        {tx.mpesaReceipt && <span className="text-xs text-slate-500 font-mono">Ref: {tx.mpesaReceipt}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${tx.type === "topup" || tx.type === "repayment" ? "text-emerald-400" : "text-white"}`}>
                      {tx.type === "topup" || tx.type === "repayment" ? "+" : "-"}KES {tx.amount.toLocaleString()}
                    </p>
                    <Badge variant="secondary" className={`text-xs border-0 ${tx.status === "completed" ? "bg-emerald-500/15 text-emerald-400" : tx.status === "pending" ? "bg-amber-500/15 text-amber-400" : "bg-red-500/15 text-red-400"}`}>{tx.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
