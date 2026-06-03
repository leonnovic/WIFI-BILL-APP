"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Ticket as TicketIcon, MessageSquare, Send } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

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
  userId: string
  createdAt: string
  user: { id: string; name: string | null; email: string } | null
  assignee: { id: string; name: string | null; email: string } | null
  responses: TicketResponse[]
}

const fadeIn = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }

export default function MemberTicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/member/tickets")
      if (res.ok) {
        const json = await res.json()
        setTickets(Array.isArray(json) ? json : [])
      }
    } catch { toast.error("Failed to load tickets") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const filtered = tickets.filter(t => statusFilter === "all" || t.status === statusFilter)
  const selected = tickets.find(t => t.id === selectedTicketId)
  const openCount = tickets.filter(t => t.status === "open" || t.status === "in_progress").length

  async function handleReply() {
    if (!replyText.trim() || !selectedTicketId) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/member/tickets/${selectedTicketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: replyText, status: "in_progress" }),
      })
      if (res.ok) {
        toast.success("Reply sent")
        setReplyText("")
        fetchTickets()
      } else { toast.error("Failed to send reply") }
    } catch { toast.error("Failed to send reply") }
    finally { setSendingReply(false) }
  }

  async function updateStatus(ticketId: string, status: string) {
    try {
      const res = await fetch(`/api/member/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) { toast.success(`Ticket marked as ${status}`); fetchTickets() }
    } catch { toast.error("Failed to update ticket") }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-3">{[...Array(3)].map((_, i) => <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-4"><div className="h-20 bg-[#1e293b] rounded" /></CardContent></Card>)}</div>
          <div className="lg:col-span-3"><Card className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-6"><div className="h-64 bg-[#1e293b] rounded" /></CardContent></Card></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">Tickets</h1><p className="text-slate-400 mt-1">{openCount} open tickets</p></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-[#111827] border-[#1e293b] text-white"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="bg-[#111827] border-[#1e293b]"><SelectItem value="all">All</SelectItem><SelectItem value="open">Open</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="resolved">Resolved</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent>
        </Select>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12"><TicketIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" /><p className="text-slate-400">No tickets found</p></div>
          ) : filtered.map((ticket) => (
            <Card key={ticket.id} className={`bg-[#111827] border-[#1e293b] cursor-pointer transition-colors ${selectedTicketId === ticket.id ? "border-emerald-500/50" : "hover:border-emerald-500/30"}`} onClick={() => setSelectedTicketId(ticket.id)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{ticket.subject}</p>
                    <p className="text-xs text-slate-400 mt-1">{ticket.user?.name || ticket.user?.email || "Unknown"}</p>
                  </div>
                  <Badge variant="secondary" className={`text-xs border-0 ml-2 ${ticket.priority === "urgent" ? "bg-red-500/15 text-red-400" : ticket.priority === "high" ? "bg-amber-500/15 text-amber-400" : ticket.priority === "medium" ? "bg-blue-500/15 text-blue-400" : "bg-slate-500/15 text-slate-400"}`}>{ticket.priority}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className={`text-xs border-0 ${ticket.status === "open" ? "bg-emerald-500/15 text-emerald-400" : ticket.status === "in_progress" ? "bg-amber-500/15 text-amber-400" : ticket.status === "resolved" ? "bg-blue-500/15 text-blue-400" : "bg-slate-500/15 text-slate-400"}`}>{ticket.status.replace("_", " ")}</Badge>
                  <span className="text-xs text-slate-500 flex items-center gap-1"><MessageSquare className="w-3 h-3" />{ticket.responses.length}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <Card className="bg-[#111827] border-[#1e293b]">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-white">{selected.subject}</CardTitle>
                    <p className="text-sm text-slate-400 mt-1">by {selected.user?.name || selected.user?.email || "Unknown"}</p>
                  </div>
                  <Select value={selected.status} onValueChange={(v) => updateStatus(selected.id, v)}>
                    <SelectTrigger className="w-36 bg-[#0b1220] border-[#1e293b] text-white text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#111827] border-[#1e293b]"><SelectItem value="open">Open</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="resolved">Resolved</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-[#0b1220] rounded-lg p-4"><p className="text-sm text-slate-300">{selected.description}</p></div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selected.responses.map((r) => {
                    const isIsp = r.userId !== selected.userId
                    return (
                      <div key={r.id} className={`flex gap-3 ${isIsp ? "justify-end" : ""}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${isIsp ? "bg-emerald-500/15 text-emerald-100" : "bg-[#1e293b] text-slate-300"}`}>
                          <p className="text-xs font-medium mb-1">{r.userName || "Unknown"}</p>
                          <p className="text-sm">{r.message}</p>
                          <p className="text-xs text-slate-500 mt-1">{new Date(r.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-2">
                  <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply..." className="bg-[#0b1220] border-[#1e293b] text-white min-h-[80px]" />
                  <Button onClick={handleReply} disabled={!replyText.trim() || sendingReply} className="bg-emerald-500 hover:bg-emerald-600 text-white self-end">
                    <Send className="w-4 h-4" />
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
