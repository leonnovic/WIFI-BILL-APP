"use client"

import { useState, useEffect } from "react"
import { Receipt, Search, Package, CreditCard, ArrowUp, Signal, ArrowDown, AlertCircle, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { format } from "date-fns"

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

const typeConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  purchase: { icon: Package, color: "text-emerald-400", bgColor: "bg-emerald-500/15" },
  okoa: { icon: CreditCard, color: "text-amber-400", bgColor: "bg-amber-500/15" },
  repayment: { icon: ArrowUp, color: "text-sky-400", bgColor: "bg-sky-500/15" },
  topup: { icon: Signal, color: "text-purple-400", bgColor: "bg-purple-500/15" },
  refund: { icon: ArrowDown, color: "text-emerald-400", bgColor: "bg-emerald-500/15" },
}

export default function ClientTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchTransactions = async (pageNum: number, append = false) => {
    try {
      if (append) setLoadingMore(true)
      const typeParam = activeTab !== "all" ? `&type=${activeTab}` : ""
      const res = await fetch(`/api/client/transactions?page=${pageNum}&limit=15${typeParam}`)
      if (res.ok) {
        const json = await res.json()
        if (append) {
          setTransactions(prev => [...prev, ...(json.data || [])])
        } else {
          setTransactions(json.data || [])
        }
        setTotalPages(json.totalPages || 1)
        setPage(pageNum)
      } else {
        toast.error("Failed to load transactions")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchTransactions(1)
  }, [activeTab])

  const filtered = transactions.filter(t =>
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.mpesaCode?.toLowerCase().includes(search.toLowerCase()) ||
    t.mpesaReceipt?.toLowerCase().includes(search.toLowerCase())
  )

  const statusConfig: Record<string, { label: string; className: string }> = {
    completed: { label: "Completed", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
    pending: { label: "Pending", className: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
    failed: { label: "Failed", className: "bg-red-500/15 text-red-400 border-red-500/20" },
    refunded: { label: "Refunded", className: "bg-sky-500/15 text-sky-400 border-sky-500/20" },
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
      <div className="h-10 bg-[#1e293b] rounded animate-pulse" />
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse">
          <CardContent className="p-4"><div className="h-14 bg-[#1e293b] rounded" /></CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <p className="text-slate-400 mt-1">Your transaction history</p>
      </motion.div>

      {/* Search */}
      <motion.div variants={staggerItem}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by description or M-Pesa code..."
            className="pl-10 bg-[#111827] border-[#1e293b] text-white h-11 rounded-xl"
          />
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={staggerItem}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#111827] border border-[#1e293b] w-full h-auto p-1 rounded-xl">
            <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 rounded-lg text-xs">All</TabsTrigger>
            <TabsTrigger value="purchase" className="flex-1 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 rounded-lg text-xs">Purchases</TabsTrigger>
            <TabsTrigger value="okoa" className="flex-1 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 rounded-lg text-xs">OKOA</TabsTrigger>
            <TabsTrigger value="topup" className="flex-1 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 rounded-lg text-xs">Top-ups</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Transaction list */}
      <motion.div variants={staggerContainer} className="space-y-2">
        {filtered.length > 0 ? (
          filtered.map((tx, i) => {
            const config = typeConfig[tx.type] || typeConfig.purchase
            const statusConf = statusConfig[tx.status] || statusConfig.pending
            const Icon = config.icon
            const isPositive = tx.type === "topup" || tx.type === "refund" || tx.type === "repayment"

            return (
              <motion.div key={tx.id} variants={staggerItem}>
                <Card className="bg-[#111827] border-[#1e293b] hover:border-[#2d3a4d] transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bgColor}`}>
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-none">
                            {tx.description || tx.type}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge variant="secondary" className={`text-[10px] border-0 ${config.bgColor} ${config.color}`}>
                              {tx.type}
                            </Badge>
                            <span className="text-xs text-slate-600">
                              {format(new Date(tx.createdAt), "MMM d, yyyy")}
                            </span>
                            {tx.mpesaReceipt && (
                              <span className="text-[10px] text-slate-600 font-mono">
                                {tx.mpesaReceipt}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className={`text-sm font-semibold ${isPositive ? "text-emerald-400" : "text-white"}`}>
                          {isPositive ? "+" : "-"}KES {tx.amount.toLocaleString()}
                        </p>
                        <Badge variant="secondary" className={`text-[10px] border-0 ${statusConf.className}`}>
                          {statusConf.label}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        ) : (
          <motion.div variants={staggerItem} className="text-center py-16">
            <Receipt className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400">No transactions found</p>
            <p className="text-sm text-slate-600 mt-1">
              {search ? "Try a different search term" : "Transactions will appear here when you make purchases"}
            </p>
          </motion.div>
        )}

        {/* Load more */}
        {page < totalPages && (
          <motion.div variants={staggerItem} className="flex justify-center pt-2">
            <Button
              variant="ghost"
              className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
              onClick={() => fetchTransactions(page + 1, true)}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</>
              ) : (
                <>Load More</>
              )}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
