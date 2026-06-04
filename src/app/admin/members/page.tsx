"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, MoreHorizontal, CheckCircle, XCircle, Eye, Building2, Users, Wifi, Package } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface Member {
  id: string
  name: string | null
  email: string
  businessName: string | null
  kraPin: string | null
  status: string
  phone: string | null
  businessAddress: string | null
  createdAt: string
  _count: { clients: number; routers: number; ispPackages: number }
}

const statusColors: Record<string, string> = {
  active: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  pending: "border-amber-500/30 text-amber-400 bg-amber-500/10",
  inactive: "border-slate-500/30 text-slate-400 bg-slate-500/10",
  suspended: "border-red-500/30 text-red-400 bg-red-500/10",
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "20")
      if (search) params.set("search", search)
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter)
      const res = await fetch(`/api/admin/members?${params}`)
      if (res.ok) {
        const json = await res.json()
        setMembers(json.data || [])
        setTotal(json.total || 0)
      }
    } catch (error) { console.error("Failed to fetch members:", error) }
    finally { setLoading(false) }
  }, [page, search, statusFilter])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  async function updateMemberStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success(`Member ${status === "active" ? "approved" : "updated"}`)
        fetchMembers()
      }
    } catch { toast.error("Failed to update member status") }
  }

  const pendingCount = members.filter(m => m.status === "pending").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-400" /> ISP Members
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage ISP business accounts and approvals</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 w-fit">
            {pendingCount} Pending Approval{pendingCount !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input placeholder="Search by name, email, or business..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9 bg-[#0b1220] border-[#1e293b] text-white placeholder:text-slate-500" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40 bg-[#0b1220] border-[#1e293b] text-white"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
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
                  <TableHead className="text-slate-400 font-medium">Business</TableHead>
                  <TableHead className="text-slate-400 font-medium">Contact</TableHead>
                  <TableHead className="text-slate-400 font-medium">Clients</TableHead>
                  <TableHead className="text-slate-400 font-medium">Routers</TableHead>
                  <TableHead className="text-slate-400 font-medium">Status</TableHead>
                  <TableHead className="text-slate-400 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-[#1e293b]">
                      {[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-24 bg-[#1e293b]" /></TableCell>)}
                    </TableRow>
                  ))
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Building2 className="w-10 h-10 text-slate-600" />
                        <p className="text-slate-400">No ISP members found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {members.map((member, index) => (
                      <motion.tr key={member.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="border-[#1e293b] hover:bg-[#0b1220]/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center border border-amber-500/20">
                              <Building2 className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">{member.businessName || "—"}</p>
                              <p className="text-xs text-slate-500 font-mono">{member.kraPin || "No KRA PIN"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-slate-300 text-sm">{member.name}</p>
                          <p className="text-slate-500 text-xs">{member.email}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold text-sm">{member._count.clients}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-cyan-400 font-semibold text-sm">{member._count.routers}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[member.status] || statusColors.inactive}`}>
                            {member.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {member.status === "pending" ? (
                            <div className="flex gap-1 justify-end">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" onClick={() => updateMemberStatus(member.id, "active")}>
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => updateMemberStatus(member.id, "suspended")}>
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white"><MoreHorizontal className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-[#111827] border-[#1e293b]" align="end">
                                <DropdownMenuItem onClick={() => setSelectedMember(member)} className="text-slate-300 focus:bg-[#1e293b] focus:text-white"><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
                                {member.status === "active" && (
                                  <DropdownMenuItem onClick={() => updateMemberStatus(member.id, "suspended")} className="text-red-400 focus:bg-[#1e293b] focus:text-red-400"><XCircle className="w-4 h-4 mr-2" /> Suspend</DropdownMenuItem>
                                )}
                                {member.status === "suspended" && (
                                  <DropdownMenuItem onClick={() => updateMemberStatus(member.id, "active")} className="text-emerald-400 focus:bg-[#1e293b] focus:text-emerald-400"><CheckCircle className="w-4 h-4 mr-2" /> Reactivate</DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              {selectedMember?.businessName || "Member Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-[#0b1220] border border-[#1e293b]">
                  <p className="text-xs text-slate-500 mb-1">Contact Name</p>
                  <p className="text-sm text-white font-medium">{selectedMember.name}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#0b1220] border border-[#1e293b]">
                  <p className="text-xs text-slate-500 mb-1">Email</p>
                  <p className="text-sm text-white">{selectedMember.email}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#0b1220] border border-[#1e293b]">
                  <p className="text-xs text-slate-500 mb-1">Phone</p>
                  <p className="text-sm text-white">{selectedMember.phone || "—"}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#0b1220] border border-[#1e293b]">
                  <p className="text-xs text-slate-500 mb-1">KRA PIN</p>
                  <p className="text-sm text-white font-mono">{selectedMember.kraPin || "—"}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#0b1220] border border-[#1e293b]">
                  <p className="text-xs text-slate-500 mb-1">Clients</p>
                  <p className="text-sm text-emerald-400 font-semibold">{selectedMember._count.clients}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#0b1220] border border-[#1e293b]">
                  <p className="text-xs text-slate-500 mb-1">Routers</p>
                  <p className="text-sm text-cyan-400 font-semibold">{selectedMember._count.routers}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#0b1220] border border-[#1e293b]">
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[selectedMember.status] || statusColors.inactive}`}>{selectedMember.status}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0b1220] border border-[#1e293b]">
                  <p className="text-xs text-slate-500 mb-1">Joined</p>
                  <p className="text-sm text-white">{new Date(selectedMember.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
