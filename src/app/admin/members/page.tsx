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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, CheckCircle, XCircle, Eye, Building2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface Member {
  id: string
  name: string | null
  email: string
  businessName: string | null
  kraPin: string | null
  status: string
  phone: string | null
  createdAt: string
  _count: { clients: number; routers: number }
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
        setMembers(json.members)
        setTotal(json.total)
      }
    } catch (error) {
      console.error("Failed to fetch members:", error)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  async function updateMemberStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success(`Member ${status === "ACTIVE" ? "approved" : "rejected"}`)
        fetchMembers()
      }
    } catch {
      toast.error("Failed to update member status")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">ISP Members</h1>
          <p className="text-slate-400 text-sm">Manage ISP business accounts and approvals</p>
        </div>
        <Badge variant="outline" className="border-amber-500/30 text-amber-400 w-fit">
          {members.filter(m => m.status === "PENDING").length} Pending Approvals
        </Badge>
      </div>

      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, or business..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9 bg-[#0b1220] border-[#1e293b] text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40 bg-[#0b1220] border-[#1e293b] text-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
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
                  <TableHead className="text-slate-400">Business</TableHead>
                  <TableHead className="text-slate-400">Contact</TableHead>
                  <TableHead className="text-slate-400">KRA PIN</TableHead>
                  <TableHead className="text-slate-400">Clients</TableHead>
                  <TableHead className="text-slate-400">Routers</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-[#1e293b]">
                      {[...Array(7)].map((_, j) => (
                        <TableCell key={j} className="animate-pulse"><div className="h-4 bg-[#1e293b] rounded w-24" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400">No ISP members found</TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.id} className="border-[#1e293b] hover:bg-[#0b1220]/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{member.businessName || "—"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-slate-300 text-sm">{member.name}</p>
                        <p className="text-slate-400 text-xs">{member.email}</p>
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm font-mono">{member.kraPin || "—"}</TableCell>
                      <TableCell className="text-emerald-400 font-medium">{member._count.clients}</TableCell>
                      <TableCell className="text-cyan-400 font-medium">{member._count.routers}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            member.status === "ACTIVE"
                              ? "border-emerald-500/30 text-emerald-400"
                              : member.status === "PENDING"
                              ? "border-amber-500/30 text-amber-400"
                              : "border-red-500/30 text-red-400"
                          }
                        >
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {member.status === "PENDING" ? (
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              onClick={() => updateMemberStatus(member.id, "ACTIVE")}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() => updateMemberStatus(member.id, "REJECTED")}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#111827] border-[#1e293b]">
                              <DropdownMenuItem onClick={() => setSelectedMember(member)} className="text-slate-300 focus:bg-[#1e293b] focus:text-white">
                                <Eye className="w-4 h-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              {member.status === "ACTIVE" && (
                                <DropdownMenuItem onClick={() => updateMemberStatus(member.id, "SUSPENDED")} className="text-red-400 focus:bg-[#1e293b] focus:text-red-400">
                                  <XCircle className="w-4 h-4 mr-2" /> Suspend
                                </DropdownMenuItem>
                              )}
                              {member.status === "SUSPENDED" && (
                                <DropdownMenuItem onClick={() => updateMemberStatus(member.id, "ACTIVE")} className="text-emerald-400 focus:bg-[#1e293b] focus:text-emerald-400">
                                  <CheckCircle className="w-4 h-4 mr-2" /> Reactivate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
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

      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              {selectedMember?.businessName || "Member Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-400">Contact Name</p><p className="text-sm text-white">{selectedMember.name}</p></div>
                <div><p className="text-xs text-slate-400">Email</p><p className="text-sm text-white">{selectedMember.email}</p></div>
                <div><p className="text-xs text-slate-400">Phone</p><p className="text-sm text-white">{selectedMember.phone || "—"}</p></div>
                <div><p className="text-xs text-slate-400">KRA PIN</p><p className="text-sm text-white font-mono">{selectedMember.kraPin || "—"}</p></div>
                <div><p className="text-xs text-slate-400">Clients</p><p className="text-sm text-emerald-400">{selectedMember._count.clients}</p></div>
                <div><p className="text-xs text-slate-400">Routers</p><p className="text-sm text-cyan-400">{selectedMember._count.routers}</p></div>
                <div><p className="text-xs text-slate-400">Status</p><Badge variant="outline" className="border-emerald-500/30 text-emerald-400">{selectedMember.status}</Badge></div>
                <div><p className="text-xs text-slate-400">Joined</p><p className="text-sm text-white">{new Date(selectedMember.createdAt).toLocaleDateString()}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
