"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Mail, MessageSquare, Send, Inbox } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface MessageData {
  id: string
  type: string
  recipient: string
  subject: string | null
  content: string
  status: string
  createdAt: string
  sender: { id: string; name: string | null; email: string }
}

const statusColors: Record<string, string> = {
  sent: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  delivered: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  pending: "border-amber-500/30 text-amber-400 bg-amber-500/10",
  failed: "border-red-500/30 text-red-400 bg-red-500/10",
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageData[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [composeOpen, setComposeOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ type: "email", recipient: "", subject: "", content: "" })

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "20")
      if (typeFilter && typeFilter !== "ALL") params.set("type", typeFilter)
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter)
      const res = await fetch(`/api/admin/messages?${params}`)
      if (res.ok) {
        const json = await res.json()
        setMessages(json.data || [])
        setTotal(json.total || 0)
      }
    } catch (error) { console.error("Failed to fetch messages:", error) }
    finally { setLoading(false) }
  }, [page, typeFilter, statusFilter])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  async function handleSend() {
    setSending(true)
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success("Message sent successfully")
        setComposeOpen(false)
        setForm({ type: "email", recipient: "", subject: "", content: "" })
        fetchMessages()
      } else {
        toast.error("Failed to send message")
      }
    } catch { toast.error("Something went wrong") }
    finally { setSending(false) }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Inbox className="w-6 h-6 text-teal-400" /> Messages
          </h1>
          <p className="text-slate-400 text-sm mt-1">SMS and email campaign management</p>
        </div>
        <Button onClick={() => setComposeOpen(true)} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20">
          <Plus className="w-4 h-4 mr-2" /> Compose
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-36 bg-[#0b1220] border-[#1e293b] text-white"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40 bg-[#0b1220] border-[#1e293b] text-white"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
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
                  <TableHead className="text-slate-400 font-medium">Type</TableHead>
                  <TableHead className="text-slate-400 font-medium">Recipient</TableHead>
                  <TableHead className="text-slate-400 font-medium">Subject</TableHead>
                  <TableHead className="text-slate-400 font-medium">Content</TableHead>
                  <TableHead className="text-slate-400 font-medium">Status</TableHead>
                  <TableHead className="text-slate-400 font-medium">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-[#1e293b]">
                      {[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-24 bg-[#1e293b]" /></TableCell>)}
                    </TableRow>
                  ))
                ) : messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Inbox className="w-10 h-10 text-slate-600" />
                        <p className="text-slate-400">No messages found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {messages.map((msg, index) => (
                      <motion.tr key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="border-[#1e293b] hover:bg-[#0b1220]/50 transition-colors">
                        <TableCell>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${msg.type === "email" ? "bg-blue-500/10 border border-blue-500/20" : "bg-emerald-500/10 border border-emerald-500/20"}`}>
                            {msg.type === "email" ? <Mail className="w-4 h-4 text-blue-400" /> : <MessageSquare className="w-4 h-4 text-emerald-400" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm">{msg.recipient}</TableCell>
                        <TableCell className="text-white text-sm font-medium">{msg.subject || "—"}</TableCell>
                        <TableCell className="text-slate-400 text-sm max-w-48 truncate">{msg.content}</TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[msg.status] || statusColors.pending}`}>{msg.status}</span>
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">{new Date(msg.createdAt).toLocaleDateString()}</TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-emerald-400" /> Compose Message</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Type</label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#111827] border-[#1e293b]">
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Recipient</label>
              <Input value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white focus:border-emerald-500/50" placeholder="Email or phone number" />
            </div>
            {form.type === "email" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Subject</label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white focus:border-emerald-500/50" placeholder="Message subject" />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Content</label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white focus:border-emerald-500/50 min-h-[120px]" placeholder="Type your message..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)} className="border-[#1e293b] text-slate-300">Cancel</Button>
            <Button onClick={handleSend} disabled={sending || !form.content || !form.recipient} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Send className="w-4 h-4 mr-2" /> {sending ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
