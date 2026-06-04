"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Ticket as TicketIcon, Search, MessageSquare, User, Send, Clock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { format } from "date-fns"

interface TicketResponse {
  id: string
  userId: string
  userName: string | null
  message: string
  createdAt: string
}

interface TicketData {
  id: string
  subject: string
  description: string
  status: string
  priority: string
  category: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; name: string | null; email: string }
  assignee: { id: string; name: string | null } | null
  responses: TicketResponse[]
}

const priorityBadge: Record<string, string> = {
  urgent: "bg-rose-500/15 text-rose-400",
  high: "bg-amber-500/15 text-amber-400",
  medium: "bg-sky-500/15 text-sky-400",
  low: "bg-slate-500/15 text-slate-400",
}

const statusBadge: Record<string, string> = {
  open: "bg-emerald-500/15 text-emerald-400",
  in_progress: "bg-amber-500/15 text-amber-400",
  resolved: "bg-sky-500/15 text-sky-400",
  closed: "bg-slate-500/15 text-slate-400",
}

export default function MemberTicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [replyText, setReplyText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState("")

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/member/tickets")
      if (!res.ok) throw new Error()
      const json = await res.json()
      setTickets(json.data || [])
    } catch {
      toast.error("Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const filtered = tickets.filter(t => {
    const matchStatus = statusFilter === "all" || t.status === statusFilter
    const matchSearch =
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      (t.user?.name || "").toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicketId) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/member/tickets/${selectedTicketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: replyText }),
      })
      if (!res.ok) throw new Error()
      toast.success("Reply sent")
      setReplyText("")
      fetchTickets()
    } catch {
      toast.error("Failed to send reply")
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatus = async (ticketId: string, status: string) => {
    try {
      const res = await fetch(`/api/member/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Ticket status updated to ${status.replace("_", " ")}`)
      fetchTickets()
    } catch {
      toast.error("Failed to update ticket status")
    }
  }

  const openCount = tickets.filter(t => t.status === "open" || t.status === "in_progress").length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 bg-[#111827]" />
            ))}
          </div>
          <Skeleton className="lg:col-span-3 h-96 bg-[#111827]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tickets</h1>
          <p className="text-slate-400 mt-1">{openCount} open ticket{openCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets..."
              className="pl-10 bg-[#111827] border-[#1e293b] text-white w-48"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-[#111827] border-[#1e293b] text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#111827] border-[#1e293b]">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-2 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar">
          {filtered.map((ticket, i) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
            >
              <Card
                className={`bg-[#111827] border-[#1e293b] cursor-pointer transition-all duration-200 ${
                  selectedTicketId === ticket.id ? "border-emerald-500/50 ring-1 ring-emerald-500/20" : "hover:border-emerald-500/30"
                }`}
                onClick={() => setSelectedTicketId(ticket.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{ticket.subject}</p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <User className="w-3 h-3" />{ticket.user?.name || ticket.user?.email || "Unknown"}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs border-0 ml-2 shrink-0 ${priorityBadge[ticket.priority] || "bg-slate-500/15 text-slate-400"}`}
                    >
                      {ticket.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant="secondary"
                      className={`text-xs border-0 ${statusBadge[ticket.status] || "bg-slate-500/15 text-slate-400"}`}
                    >
                      {ticket.status.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />{ticket.responses.length}
                    </span>
                    <span className="text-xs text-slate-500 ml-auto">
                      {format(new Date(ticket.createdAt), "MMM d")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <TicketIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">
                {search || statusFilter !== "all" ? "No tickets match your filters" : "No tickets yet"}
              </p>
            </div>
          )}
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-3">
          {selectedTicket ? (
            <Card className="bg-[#111827] border-[#1e293b]">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="text-lg text-white">{selectedTicket.subject}</CardTitle>
                    <p className="text-sm text-slate-400 mt-1">
                      by {selectedTicket.user?.name || selectedTicket.user?.email || "Unknown"}
                      {selectedTicket.category && <> &middot; {selectedTicket.category}</>}
                    </p>
                  </div>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(v) => updateStatus(selectedTicket.id, v)}
                  >
                    <SelectTrigger className="w-36 bg-[#0b1220] border-[#1e293b] text-white text-xs shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111827] border-[#1e293b]">
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Original message */}
                <div className="bg-[#0b1220] rounded-lg p-4">
                  <p className="text-sm text-slate-300">{selectedTicket.description}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {format(new Date(selectedTicket.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>

                {/* Responses */}
                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                  {selectedTicket.responses.map((r) => {
                    const isISP = r.userId !== selectedTicket.user.id
                    return (
                      <div key={r.id} className={`flex ${isISP ? "justify-end" : ""}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          isISP ? "bg-emerald-500/15 text-emerald-100" : "bg-[#1e293b] text-slate-300"
                        }`}>
                          <p className="text-xs font-medium mb-1">{r.userName || "User"}</p>
                          <p className="text-sm">{r.message}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {format(new Date(r.createdAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Reply */}
                <div className="flex gap-2">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="bg-[#0b1220] border-[#1e293b] text-white min-h-[80px]"
                  />
                  <Button
                    onClick={handleReply}
                    disabled={!replyText.trim() || submitting}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white self-end shrink-0"
                  >
                    {submitting ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#111827] border-[#1e293b]">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <MessageSquare className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-slate-400">Select a ticket to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
