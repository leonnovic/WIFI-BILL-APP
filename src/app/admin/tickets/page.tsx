"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { MoreHorizontal, UserPlus, MessageSquare, CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface TicketData {
  id: string
  subject: string
  description: string
  status: string
  priority: string
  category: string | null
  creatorId: string
  assigneeId: string | null
  createdAt: string
  creator: { name: string | null; email: string }
  assignee: { name: string | null; email: string } | null
}

interface MemberOption {
  id: string
  name: string | null
  businessName: string | null
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
        setTickets(json.tickets)
        setTotal(json.total)
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, priorityFilter])

  useEffect(() => {
    fetch("/api/admin/members?limit=100")
      .then(r => r.json())
      .then(json => setMembers(json.members || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  async function updateTicketStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success(`Ticket marked as ${status}`)
        fetchTickets()
      }
    } catch {
      toast.error("Failed to update ticket")
    }
  }

  async function assignTicket() {
    try {
      const res = await fetch(`/api/admin/tickets/${assignTicketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: assignTo }),
      })
      if (res.ok) {
        toast.success("Ticket assigned")
        setAssignDialogOpen(false)
        fetchTickets()
      }
    } catch {
      toast.error("Failed to assign ticket")
    }
  }

  const priorityColors: Record<string, string> = {
    LOW: "border-slate-500/30 text-slate-400",
    MEDIUM: "border-blue-500/30 text-blue-400",
    HIGH: "border-amber-500/30 text-amber-400",
    CRITICAL: "border-red-500/30 text-red-400",
  }

  const statusColors: Record<string, string> = {
    OPEN: "border-blue-500/30 text-blue-400",
    IN_PROGRESS: "border-amber-500/30 text-amber-400",
    RESOLVED: "border-emerald-500/30 text-emerald-400",
    CLOSED: "border-slate-500/30 text-slate-400",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tickets</h1>
        <p className="text-slate-400 text-sm">Support ticket management</p>
      </div>

      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40 bg-[#0b1220] border-[#1e293b] text-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40 bg-[#0b1220] border-[#1e293b] text-white">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                <SelectItem value="ALL">All Priority</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
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
                  <TableHead className="text-slate-400">Subject</TableHead>
                  <TableHead className="text-slate-400">Creator</TableHead>
                  <TableHead className="text-slate-400">Priority</TableHead>
                  <TableHead className="text-slate-400">Assignee</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Date</TableHead>
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
                ) : tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400">No tickets found</TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="border-[#1e293b] hover:bg-[#0b1220]/50">
                      <TableCell>
                        <button onClick={() => setSelectedTicket(ticket)} className="text-white font-medium text-sm hover:text-emerald-400 transition-colors text-left">
                          {ticket.subject}
                        </button>
                        {ticket.category && <p className="text-slate-400 text-xs">{ticket.category}</p>}
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">{ticket.creator?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">{ticket.assignee?.name || <span className="text-slate-500">Unassigned</span>}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[ticket.status]}>{ticket.status}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#111827] border-[#1e293b]">
                            <DropdownMenuItem onClick={() => { setAssignTicketId(ticket.id); setAssignDialogOpen(true) }} className="text-slate-300 focus:bg-[#1e293b] focus:text-white">
                              <UserPlus className="w-4 h-4 mr-2" /> Assign
                            </DropdownMenuItem>
                            {ticket.status === "OPEN" && (
                              <DropdownMenuItem onClick={() => updateTicketStatus(ticket.id, "IN_PROGRESS")} className="text-slate-300 focus:bg-[#1e293b] focus:text-white">
                                <MessageSquare className="w-4 h-4 mr-2" /> Start Progress
                              </DropdownMenuItem>
                            )}
                            {(ticket.status === "OPEN" || ticket.status === "IN_PROGRESS") && (
                              <DropdownMenuItem onClick={() => updateTicketStatus(ticket.id, "RESOLVED")} className="text-emerald-400 focus:bg-[#1e293b] focus:text-emerald-400">
                                <CheckCircle className="w-4 h-4 mr-2" /> Resolve
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-400">Priority</p><Badge variant="outline" className={priorityColors[selectedTicket.priority]}>{selectedTicket.priority}</Badge></div>
                <div><p className="text-xs text-slate-400">Status</p><Badge variant="outline" className={statusColors[selectedTicket.status]}>{selectedTicket.status}</Badge></div>
                <div><p className="text-xs text-slate-400">Creator</p><p className="text-sm text-white">{selectedTicket.creator?.name}</p></div>
                <div><p className="text-xs text-slate-400">Assignee</p><p className="text-sm text-white">{selectedTicket.assignee?.name || "Unassigned"}</p></div>
                <div><p className="text-xs text-slate-400">Category</p><p className="text-sm text-white">{selectedTicket.category || "—"}</p></div>
                <div><p className="text-xs text-slate-400">Created</p><p className="text-sm text-white">{new Date(selectedTicket.createdAt).toLocaleDateString()}</p></div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">Description</p>
                <div className="p-3 rounded-lg bg-[#0b1220] border border-[#1e293b] text-sm text-slate-300">
                  {selectedTicket.description}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader>
            <DialogTitle>Assign Ticket</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select value={assignTo} onValueChange={setAssignTo}>
              <SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.businessName || m.name}</SelectItem>
                ))}
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
