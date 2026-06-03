"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { MessageSquare, Plus, Send, HelpCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
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
  responses: TicketResponse[]
  createdAt: string
}

const fadeIn = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }

const faqs = [
  { q: "How do I check my data usage?", a: "You can view your data usage on the Dashboard page. It shows how much data you've used and how much is remaining." },
  { q: "How do I upgrade my package?", a: "Go to the Buy Package page and select a new package. Your current package will be replaced when you purchase a new one." },
  { q: "What is OKOA Internet?", a: "OKOA Internet allows you to borrow credit to access the internet when you don't have an active package. A 10% service fee applies." },
  { q: "How do I pay?", a: "We accept M-Pesa payments. When you purchase a package, you'll be prompted to pay via M-Pesa." },
  { q: "My internet is slow, what should I do?", a: "Try restarting your router. If the issue persists, create a support ticket and we'll investigate." },
]

export default function ClientSupportPage() {
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [createDialog, setCreateDialog] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [form, setForm] = useState({ subject: "", description: "", priority: "medium" })
  const [creating, setCreating] = useState(false)
  const [sendingReply, setSendingReply] = useState(false)

  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await fetch("/api/client/tickets")
        if (res.ok) { const json = await res.json(); setTickets(Array.isArray(json) ? json : []) }
      } catch { toast.error("Failed to load tickets") }
      finally { setLoading(false) }
    }
    fetchTickets()
  }, [])

  const selected = tickets.find(t => t.id === selectedTicketId)

  async function handleCreate() {
    if (!form.subject || !form.description) { toast.error("Subject and description are required"); return }
    setCreating(true)
    try {
      const res = await fetch("/api/client/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success("Ticket created")
        setCreateDialog(false)
        setForm({ subject: "", description: "", priority: "medium" })
        // Refresh
        const refreshRes = await fetch("/api/client/tickets")
        if (refreshRes.ok) { const json = await refreshRes.json(); setTickets(Array.isArray(json) ? json : []) }
      } else { toast.error("Failed to create ticket") }
    } catch { toast.error("Failed to create ticket") }
    finally { setCreating(false) }
  }

  async function handleReply() {
    if (!replyText.trim() || !selectedTicketId) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/client/tickets/${selectedTicketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: replyText }),
      })
      if (res.ok) {
        toast.success("Reply sent")
        setReplyText("")
        // Refresh
        const refreshRes = await fetch("/api/client/tickets")
        if (refreshRes.ok) { const json = await refreshRes.json(); setTickets(Array.isArray(json) ? json : []) }
      } else { toast.error("Failed to send reply") }
    } catch { toast.error("Failed to send reply") }
    finally { setSendingReply(false) }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-3">{[...Array(2)].map((_, i) => <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-4"><div className="h-16 bg-[#1e293b] rounded" /></CardContent></Card>)}</div>
          <div className="lg:col-span-3"><Card className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-6"><div className="h-48 bg-[#1e293b] rounded" /></CardContent></Card></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn} className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Support</h1><p className="text-slate-400 mt-1">Get help with your account</p></div>
        <Button onClick={() => setCreateDialog(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white"><Plus className="w-4 h-4 mr-2" />New Ticket</Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-medium text-slate-400 uppercase">Your Tickets</h2>
          {tickets.length === 0 ? (
            <div className="text-center py-8"><MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-2" /><p className="text-slate-400 text-sm">No tickets yet</p></div>
          ) : tickets.map((ticket) => (
            <Card key={ticket.id} className={`bg-[#111827] border-[#1e293b] cursor-pointer transition-colors ${selectedTicketId === ticket.id ? "border-emerald-500/50" : "hover:border-emerald-500/30"}`} onClick={() => setSelectedTicketId(ticket.id)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-white">{ticket.subject}</p>
                  <Badge variant="secondary" className={`text-xs border-0 ml-2 ${ticket.priority === "high" || ticket.priority === "urgent" ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"}`}>{ticket.priority}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className={`text-xs border-0 ${ticket.status === "open" ? "bg-emerald-500/15 text-emerald-400" : ticket.status === "in_progress" ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"}`}>{ticket.status.replace("_", " ")}</Badge>
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
                <CardTitle className="text-lg text-white">{selected.subject}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className={`text-xs border-0 ${selected.status === "open" ? "bg-emerald-500/15 text-emerald-400" : selected.status === "in_progress" ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"}`}>{selected.status.replace("_", " ")}</Badge>
                  <span className="text-xs text-slate-500">{new Date(selected.createdAt).toLocaleDateString()}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-[#0b1220] rounded-lg p-3"><p className="text-sm text-slate-300">{selected.description}</p></div>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {selected.responses.map((r) => {
                    const isMe = r.userName !== "FastNet ISP" && r.userName !== "ISP"
                    return (
                      <div key={r.id} className={`flex ${isMe ? "justify-end" : ""}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${isMe ? "bg-emerald-500/15 text-emerald-100" : "bg-[#1e293b] text-slate-300"}`}>
                          <p className="text-xs font-medium mb-1">{r.userName || "Unknown"}</p>
                          <p className="text-sm">{r.message}</p>
                          <p className="text-xs text-slate-500 mt-1">{new Date(r.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {selected.status !== "closed" && selected.status !== "resolved" && (
                  <div className="flex gap-2">
                    <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply..." className="bg-[#0b1220] border-[#1e293b] text-white min-h-[60px]" />
                    <Button onClick={handleReply} disabled={!replyText.trim() || sendingReply} className="bg-emerald-500 hover:bg-emerald-600 text-white self-end"><Send className="w-4 h-4" /></Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#111827] border-[#1e293b]">
              <CardHeader><CardTitle className="text-lg text-white flex items-center gap-2"><HelpCircle className="w-5 h-5 text-emerald-500" />Frequently Asked Questions</CardTitle></CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, i) => (
                    <AccordionItem key={i} value={String(i)} className="border-[#1e293b]">
                      <AccordionTrigger className="text-sm text-white hover:text-emerald-400 text-left">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-slate-400">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader><DialogTitle>Create Support Ticket</DialogTitle><DialogDescription className="text-slate-400">Describe your issue and we&apos;ll help you</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label className="text-slate-300">Subject *</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="Brief description of your issue" /></div>
            <div className="space-y-2"><Label className="text-slate-300">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#111827] border-[#1e293b]"><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label className="text-slate-300">Description *</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white min-h-[100px]" placeholder="Describe your issue in detail..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)} className="border-[#1e293b] text-slate-300">Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !form.subject || !form.description} className="bg-emerald-500 hover:bg-emerald-600 text-white">{creating ? "Creating..." : "Create Ticket"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
