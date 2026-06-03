"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Mail, MessageSquare, Send } from "lucide-react"
import { toast } from "sonner"

interface MessageData {
  id: string
  type: string
  recipient: string
  subject: string | null
  content: string
  status: string
  createdAt: string
  user: { name: string | null; email: string }
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageData[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [composeOpen, setComposeOpen] = useState(false)
  const [form, setForm] = useState({ type: "EMAIL", recipient: "", subject: "", content: "" })

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
        setMessages(json.messages)
        setTotal(json.total)
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, statusFilter])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  async function handleSend() {
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId: "admin" }),
      })
      if (res.ok) {
        toast.success("Message sent")
        setComposeOpen(false)
        setForm({ type: "EMAIL", recipient: "", subject: "", content: "" })
        fetchMessages()
      } else {
        toast.error("Failed to send message")
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  const statusColors: Record<string, string> = {
    SENT: "border-emerald-500/30 text-emerald-400",
    DELIVERED: "border-blue-500/30 text-blue-400",
    PENDING: "border-amber-500/30 text-amber-400",
    FAILED: "border-red-500/30 text-red-400",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-slate-400 text-sm">SMS and email campaign management</p>
        </div>
        <Button onClick={() => setComposeOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Compose
        </Button>
      </div>

      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-36 bg-[#0b1220] border-[#1e293b] text-white">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40 bg-[#0b1220] border-[#1e293b] text-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
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
                  <TableHead className="text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-400">Recipient</TableHead>
                  <TableHead className="text-slate-400">Subject</TableHead>
                  <TableHead className="text-slate-400">Content</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Date</TableHead>
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
                ) : messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400">No messages found</TableCell>
                  </TableRow>
                ) : (
                  messages.map((msg) => (
                    <TableRow key={msg.id} className="border-[#1e293b] hover:bg-[#0b1220]/50">
                      <TableCell>
                        {msg.type === "EMAIL" ? (
                          <Mail className="w-4 h-4 text-blue-400" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-emerald-400" />
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">{msg.recipient}</TableCell>
                      <TableCell className="text-white text-sm">{msg.subject || "—"}</TableCell>
                      <TableCell className="text-slate-400 text-sm max-w-48 truncate">{msg.content}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[msg.status]}>{msg.status}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">{new Date(msg.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Type</label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111827] border-[#1e293b]">
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Recipient</label>
              <Input value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="Email or phone number" />
            </div>
            {form.type === "EMAIL" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Subject</label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Content</label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white min-h-[120px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)} className="border-[#1e293b] text-slate-300">Cancel</Button>
            <Button onClick={handleSend} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Send className="w-4 h-4 mr-2" /> Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
