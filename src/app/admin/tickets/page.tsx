"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MoreHorizontal, UserPlus, MessageSquare, CheckCircle, Ticket as TicketIcon, Clock, User } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface TicketData {
  id: string
  subject: string
  description: string
  status: string
  priority: string
  category: string | null
  userId: string
  assignedTo: string | null
  createdAt: string
  user: { id: string; name: string | null; email: string }
  assignee: { id: string; name: string | null; email: string } | null
}

interface MemberOption {
  id: string
  name: string | null
  businessName: string | null
}

const priorityColors: Record<string, string> = {
  low: "border-slate-500/30 text-slate-400 bg-slate-500/10",
  medium: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  high: "border-amber-500/30 text-amber-400 bg-amber-500/10",
  urgent: "border-red-500/30 text-red-400 bg-red-500/10",
}

const statusColors: Record<string, string> = {
  open: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  in_progress: "border-amber-500/30 text-amber-400 bg-amber-500/10",
  resolved: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  closed: "border-slate-500/30 text-slate-400 bg-slate-500/10",
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [priorityFilter, setPriorityFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null)
  const [members, setMembers] = useState<MemberOption[]>([])
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignTicketId, setAssignTicketId] = useState("")
  const [assignTo, setAssignTo] = useState("")

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "20")
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter)
      if (priorityFilter && priorityFilter !== "ALL") params.set("priority", priorityFilter)
      const res = await fetch(`/api/admin/tickets?${params}`)
      if (res.ok) {
        const json = await res.json()
        setTickets(json.data || [])
        setTotal(json.total || 0)
      }
    } catch (error) { console.error("Failed to fetch tickets:", error) }
    finally { setLoading(false) }
  }, [page, statusFilter, priorityFilter])

  useEffect(() => {
    fetch("/api/admin/members?limit=100")
      .then(r => r.json())
      .then(json => setMembers(json.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  async function updateTicketStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
      if (res.ok) { toast.success(`Ticket marked as ${status}`); fetchTickets() }
    } catch { toast.error("Failed to update ticket") }
  }

  async function assignTicket() {
    try {
      const res = await fetch(`/api/admin/tickets/${assignTicketId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignedTo: assignTo }) })
      if (res.ok) { toast.success("Ticket assigned"); setAssignDialogOpen(false); fetchTickets() }
    } catch { toast.error("Failed to assign ticket") }
  }

  const openTickets = tickets.filter(t => t.status === "open").length
  const inProgressTickets = tickets.filter(t => t.status === "in_progress").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TicketIcon className="w-6 h-6 text-pink-400" /> Tickets
          </h1>
          <p className="text-slate-400 text-sm mt-1">Support ticket management</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">{openTickets} Open</Badge>
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10">{inProgressTickets} In Progress</Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40 bg-[#0b1220] border-[#1e293b] text-white"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40 bg-[#0b1220] border-[#1e293b] text-white"><SelectValue placeholder="All Priority" /></SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                <SelectItem value="ALL">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
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
                  <TableHead className="text-slate-400 font-medium">Subject</TableHead>
                  <TableHead className="text-slate-400 font-medium">Creator</TableHead>
                  <TableHead className="text-slate-400 font-medium">Priority</TableHead>
                  <TableHead className="text-slate-400 font-medium">Assignee</TableHead>
                  <TableHead className="text-slate-400 font-medium">Status</TableHead>
                  <TableHead className="text-slate-400 font-medium">Date</TableHead>
                  <TableHead className="text-slate-400 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-[#1e293b]">
                      {[...Array(7)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-24 bg-[#1e293b]" /></TableCell>)}
                    </TableRow>
                  ))
                ) : tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <TicketIcon className="w-10 h-10 text-slate-600" />
                        <p className="text-slate-400">No tickets found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {tickets.map((ticket, index) => (
                      <motion.tr key={ticket.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="border-[#1e293b] hover:bg-[#0b1220]/50 transition-colors">
                        <TableCell>
                          <button onClick={() => setSelectedTicket(ticket)} className="text-white font-medium text-sm hover:text-emerald-400 transition-colors text-left">{ticket.subject}</button>
                          {ticket.category && <p className="text-slate-500 text-xs mt-0.5">{ticket.category}</p>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-slate-300 text-sm">{ticket.user?.name || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${priorityColors[ticket.priority] || priorityColors.medium}`}>{ticket.priority}</span>
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm">
                          {ticket.assignee?.name || <span className="text-slate-500">Unassigned</span>}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[ticket.status] || statusColors.open}`}>{ticket.status}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-slate-400 text-sm">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white"><MoreHorizontal className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#111827] border-[#1e293b]" align="end">
                              <DropdownMenuItem onClick={() => { setAssignTicketId(ticket.id); setAssignDialogOpen(true) }} className="text-slate-300 focus:bg-[#1e293b] focus:text-white"><UserPlus className="w-4 h-4 mr-2" /> Assign</DropdownMenuItem>
                              {ticket.status === "open" && (
                                <DropdownMenuItem onClick={() => updateTicketStatus(ticket.id, "in_progress")} className="text-slate-300 focus:bg-[#1e293b] focus:text-white"><MessageSquare className="w-4 h-4 mr-2" /> Start Progress</DropdownMenuItem>
                              )}
                              {(ticket.status === "open" || ticket.status === "in_progress") && (
                                <DropdownMenuItem onClick={() => updateTicketStatus(ticket.id, "resolved")} className="text-emerald-400 focus:bg-[#1e293b] focus:text-emerald-400"><CheckCircle className="w-4 h-4 mr-2" /> Resolve</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><TicketIcon className="w-5 h-5 text-pink-400" />{selectedTicket?.subject}</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#0b1220] border border-[#1e293b]">
                  <p className="text-xs text-slate-500 mb-1">Priority</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${priorityColors[selectedTicket.priority] || priorityColors.medium}`}>{selectedTicket.priority}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0b1220] border border-[#1e293b]">
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[selectedTicket.status] || statusColors.open}`}>{selectedTicket.status}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0b1220] border border-[#1e293b]">
                  <p className="text-xs text-slate-500 mb-1">Creator</p>
                  <p className="text-sm text-white">{selectedTicket.user?.name}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#0b1220] border border-[#1e293b]">
                  <p className="text-xs text-slate-500 mb-1">Assignee</p>
                  <p className="text-sm text-white">{selectedTicket.assignee?.name || "Unassigned"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">Description</p>
                <div className="p-3 rounded-xl bg-[#0b1220] border border-[#1e293b] text-sm text-slate-300">{selectedTicket.description}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader><DialogTitle>Assign Ticket</DialogTitle></DialogHeader>
          <div className="py-4">
            <Select value={assignTo} onValueChange={setAssignTo}>
              <SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white"><SelectValue placeholder="Select team member" /></SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                {members.map((m) => (<SelectItem key={m.id} value={m.id}>{m.businessName || m.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)} className="border-[#1e293b] text-slate-300">Cancel</Button>
            <Button onClick={assignTicket} className="bg-emerald-500 hover:bg-emerald-600 text-white" disabled={!assignTo}>Assign</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
