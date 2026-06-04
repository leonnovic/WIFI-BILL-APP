"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, UserCircle, Wifi, WifiOff, Building2, Package as PackageIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Client {
  id: string
  name: string | null
  email: string
  phone: string | null
  status: string
  okoaBalance: number
  okoaLimit: number
  okoaUsed: number
  memberId: string | null
  activePackageId: string | null
  connectionStatus: string
  packageExpiry: string | null
  createdAt: string
  activePackage: { id: string; name: string; price: number } | null
  member: { id: string; businessName: string | null; name: string | null } | null
}

interface MemberOption {
  id: string
  businessName: string | null
  name: string | null
}

const statusColors: Record<string, string> = {
  active: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  inactive: "border-slate-500/30 text-slate-400 bg-slate-500/10",
  suspended: "border-red-500/30 text-red-400 bg-red-500/10",
}

const connectionColors: Record<string, string> = {
  connected: "text-emerald-400",
  disconnected: "text-slate-500",
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [members, setMembers] = useState<MemberOption[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [memberFilter, setMemberFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "20")
      if (search) params.set("search", search)
      if (memberFilter && memberFilter !== "ALL") params.set("memberId", memberFilter)
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter)
      const res = await fetch(`/api/admin/clients?${params}`)
      if (res.ok) {
        const json = await res.json()
        setClients(json.data || [])
        setTotal(json.total || 0)
      }
    } catch (error) { console.error("Failed to fetch clients:", error) }
    finally { setLoading(false) }
  }, [page, search, memberFilter, statusFilter])

  useEffect(() => {
    fetch("/api/admin/members?limit=100")
      .then(r => r.json())
      .then(json => setMembers(json.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-purple-400" /> Clients
        </h1>
        <p className="text-slate-400 text-sm mt-1">Manage all client accounts across ISPs</p>
      </div>

      {/* Filters */}
      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input placeholder="Search by name, email, or phone..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9 bg-[#0b1220] border-[#1e293b] text-white placeholder:text-slate-500" />
            </div>
            <Select value={memberFilter} onValueChange={(v) => { setMemberFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-48 bg-[#0b1220] border-[#1e293b] text-white"><SelectValue placeholder="All ISPs" /></SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                <SelectItem value="ALL">All ISPs</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.businessName || m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-36 bg-[#0b1220] border-[#1e293b] text-white"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
                  <TableHead className="text-slate-400 font-medium">Client</TableHead>
                  <TableHead className="text-slate-400 font-medium">ISP</TableHead>
                  <TableHead className="text-slate-400 font-medium">Package</TableHead>
                  <TableHead className="text-slate-400 font-medium">OKOA Balance</TableHead>
                  <TableHead className="text-slate-400 font-medium">Connection</TableHead>
                  <TableHead className="text-slate-400 font-medium">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-[#1e293b]">
                      {[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-24 bg-[#1e293b]" /></TableCell>)}
                    </TableRow>
                  ))
                ) : clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <UserCircle className="w-10 h-10 text-slate-600" />
                        <p className="text-slate-400">No clients found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {clients.map((client, index) => (
                      <motion.tr key={client.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="border-[#1e293b] hover:bg-[#0b1220]/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center border border-purple-500/20">
                              <span className="text-sm font-bold text-purple-400">{(client.name || client.email).charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">{client.name || "—"}</p>
                              <p className="text-xs text-slate-500">{client.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-slate-300 text-sm">{client.member?.businessName || client.member?.name || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.activePackage ? (
                            <div className="flex items-center gap-1.5">
                              <PackageIcon className="w-3.5 h-3.5 text-cyan-400" />
                              <div>
                                <p className="text-slate-300 text-sm">{client.activePackage.name}</p>
                                <p className="text-emerald-400 text-xs font-medium">KES {client.activePackage.price.toLocaleString()}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-sm">No package</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-amber-400 font-semibold text-sm">KES {client.okoaBalance.toLocaleString()}</span>
                          <p className="text-xs text-slate-500">/ {client.okoaLimit.toLocaleString()} limit</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {client.connectionStatus === "connected" ? (
                              <Wifi className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <WifiOff className="w-4 h-4 text-slate-500" />
                            )}
                            <span className={`text-sm ${connectionColors[client.connectionStatus] || "text-slate-400"}`}>
                              {client.connectionStatus}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[client.status] || statusColors.inactive}`}>
                            {client.status}
                          </span>
                        </TableCell>
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
