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
import { Search, UserCircle } from "lucide-react"

interface Client {
  id: string
  name: string | null
  email: string
  phone: string | null
  status: string
  okoaBalance: number
  memberId: string | null
  packageId: string | null
  createdAt: string
  package: { id: string; name: string; price: number } | null
  member: { id: string; businessName: string | null; name: string | null } | null
}

interface MemberOption {
  id: string
  businessName: string | null
  name: string | null
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
        setClients(json.clients)
        setTotal(json.total)
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error)
    } finally {
      setLoading(false)
    }
  }, [page, search, memberFilter, statusFilter])

  useEffect(() => {
    fetch("/api/admin/members?limit=100")
      .then(r => r.json())
      .then(json => setMembers(json.members || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Clients</h1>
        <p className="text-slate-400 text-sm">Manage all client accounts across ISPs</p>
      </div>

      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9 bg-[#0b1220] border-[#1e293b] text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={memberFilter} onValueChange={(v) => { setMemberFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-48 bg-[#0b1220] border-[#1e293b] text-white">
                <SelectValue placeholder="All ISPs" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                <SelectItem value="ALL">All ISPs</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.businessName || m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-36 bg-[#0b1220] border-[#1e293b] text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
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
                  <TableHead className="text-slate-400">Client</TableHead>
                  <TableHead className="text-slate-400">Phone</TableHead>
                  <TableHead className="text-slate-400">ISP</TableHead>
                  <TableHead className="text-slate-400">Package</TableHead>
                  <TableHead className="text-slate-400">OKOA Balance</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
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
                ) : clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400">No clients found</TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id} className="border-[#1e293b] hover:bg-[#0b1220]/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <UserCircle className="w-4 h-4 text-purple-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{client.name || "—"}</p>
                            <p className="text-slate-400 text-xs">{client.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">{client.phone || "—"}</TableCell>
                      <TableCell className="text-slate-300 text-sm">{client.member?.businessName || client.member?.name || "—"}</TableCell>
                      <TableCell>
                        {client.package ? (
                          <div>
                            <p className="text-slate-300 text-sm">{client.package.name}</p>
                            <p className="text-emerald-400 text-xs">KES {client.package.price.toLocaleString()}</p>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">No package</span>
                        )}
                      </TableCell>
                      <TableCell className="text-amber-400 font-medium">KES {client.okoaBalance.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            client.status === "ACTIVE"
                              ? "border-emerald-500/30 text-emerald-400"
                              : "border-red-500/30 text-red-400"
                          }
                        >
                          {client.status}
                        </Badge>
                      </TableCell>
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
