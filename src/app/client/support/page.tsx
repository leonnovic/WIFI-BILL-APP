"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Plus, Send, HelpCircle, Clock, User, Loader2, X, CheckCircle, AlertCircle, ChevronLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { format } from "date-fns"

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

const statusConfig: Record<string, { label: string; className: string; dotColor: string }> = {
  open: { label: "Open", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", dotColor: "bg-emerald-400" },
  in_progress: { label: "In Progress", className: "bg-sky-500/15 text-sky-400 border-sky-500/20", dotColor: "bg-sky-400" },
  resolved: { label: "Resolved", className: "bg-amber-500/15 text-amber-400 border-amber-500/20", dotColor: "bg-amber-400" },
  closed: { label: "Closed", className: "bg-slate-500/15 text-slate-400 border-slate-500/20", dotColor: "bg-slate-400" },
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-slate-500/15 text-slate-400 border-slate-500/20" },
  medium: { label: "Medium", className: "bg-sky-500/15 text-sky-400 border-sky-500/20" },
  high: { label: "High", className: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  urgent: { label: "Urgent", className: "bg-red-500/15 text-red-400 border-red-500/20" },
}

const faqs = [
  { q: "How do I check my data usage?", a: "You can view your data usage on the Dashboard page. It shows how much data you've used and how much is remaining." },
  { q: "How do I upgrade my package?", a: "Go to the Buy Package page and select a new package. Your current package will be replaced when you purchase a new one." },
  { q: "What is OKOA Internet?", a: "OKOA Internet allows you to borrow credit to access the internet when you don't have an active package. A 10% service fee applies." },
  { q: "How do I pay?", a: "We accept M-Pesa payments. When you purchase a package, you'll be prompted to pay via M-Pesa." },
  { q: "My internet is slow, what should I do?", a: "Try restarting your router. If the issue persists, create a support ticket and we'll investigate." },
]

export default function ClientSupportPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const [createDialog, setCreateDialog] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ subject: "", description: "", priority: "medium" })

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/client/tickets")
        if (res.ok) {
          const json = await res.json()
          setTickets(json.data || [])
        } else {
          toast.error("Failed to load tickets")
        }
      } catch {
        toast.error("Network error")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const refreshTickets = async () => {
    try {
      const res = await fetch("/api/client/tickets")
      if (res.ok) {
        const json = await res.json()
        setTickets(json.data || [])
      }
    } catch {
      // silent
    }
  }

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error("Please fill in all required fields")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/client/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success("Ticket created successfully!")
        setCreateDialog(false)
        setForm({ subject: "", description: "", priority: "medium" })
        await refreshTickets()
      } else {
        const json = await res.json()
        toast.error(json.error || "Failed to create ticket")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setCreating(false)
    }
  }

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/client/tickets/${selectedTicket}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText }),
      })
      if (res.ok) {
        toast.success("Reply sent!")
        setReplyText("")
        await refreshTickets()
      } else {
        toast.error("Failed to send reply")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setSubmitting(false)
    }
  }

  const selected = tickets.find(t => t.id === selectedTicket)

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse">
              <CardContent className="p-4"><div className="h-16 bg-[#1e293b] rounded" /></CardContent>
            </Card>
          ))}
        </div>
        <div className="lg:col-span-3">
          <Card className="bg-[#111827] border-[#1e293b] animate-pulse">
            <CardContent className="p-6"><div className="h-48 bg-[#1e293b] rounded" /></CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  // Mobile: show detail or list
  const isMobileDetail = selectedTicket !== null

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Support</h1>
          <p className="text-slate-400 mt-1">Get help with your account</p>
        </div>
        <Button
          onClick={() => setCreateDialog(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />New Ticket
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Ticket list */}
        <div className={`lg:col-span-2 space-y-2 ${isMobileDetail ? "hidden lg:block" : ""}`}>
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Your Tickets</h2>
          {tickets.length > 0 ? (
            tickets.map((ticket, i) => {
              const statusConf = statusConfig[ticket.status] || statusConfig.open
              const priorityConf = priorityConfig[ticket.priority] || priorityConfig.medium
              const isSelected = selectedTicket === ticket.id

              return (
                <motion.div key={ticket.id} variants={staggerItem}>
                  <Card
                    className={`bg-[#111827] cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "border-emerald-500/50 ring-1 ring-emerald-500/20"
                        : "border-[#1e293b] hover:border-emerald-500/20"
                    }`}
                    onClick={() => setSelectedTicket(ticket.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-white line-clamp-1">{ticket.subject}</p>
                        <Badge variant="secondary" className={`text-[10px] border-0 shrink-0 ${priorityConf.className}`}>
                          {priorityConf.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1">{ticket.description}</p>
                      <div className="flex items-center gap-2 mt-2.5">
                        <Badge variant="secondary" className={`text-[10px] border-0 ${statusConf.className}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dotColor} mr-1`} />
                          {statusConf.label}
                        </Badge>
                        <span className="text-[10px] text-slate-600 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {ticket.responses?.length || 0}
                        </span>
                        <span className="text-[10px] text-slate-600 ml-auto">
                          {format(new Date(ticket.createdAt), "MMM d")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No tickets yet</p>
              <p className="text-xs text-slate-600 mt-1">Create a ticket if you need help</p>
            </div>
          )}
        </div>

        {/* Ticket detail or FAQ */}
        <div className={`lg:col-span-3 ${!isMobileDetail ? "hidden lg:block" : ""}`}>
          {selected ? (
            <Card className="bg-[#111827] border-[#1e293b] overflow-hidden">
              <div className={`h-1 ${
                selected.status === "open" ? "bg-emerald-500" :
                selected.status === "in_progress" ? "bg-sky-500" :
                selected.status === "resolved" ? "bg-amber-500" :
                "bg-slate-500"
              }`} />
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  {/* Back button for mobile */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden text-slate-400 hover:text-white -ml-2 -mt-1"
                    onClick={() => setSelectedTicket(null)}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <div className="flex-1">
                    <CardTitle className="text-lg text-white">{selected.subject}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className={`text-[10px] border-0 ${statusConfig[selected.status]?.className}`}>
                        {statusConfig[selected.status]?.label}
                      </Badge>
                      <Badge variant="secondary" className={`text-[10px] border-0 ${priorityConfig[selected.priority]?.className}`}>
                        {priorityConfig[selected.priority]?.label}
                      </Badge>
                      <span className="text-[10px] text-slate-600">
                        Created {format(new Date(selected.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Original description */}
                <div className="bg-[#0b1220] rounded-xl p-3 border border-[#1e293b]">
                  <p className="text-sm text-slate-300">{selected.description}</p>
                </div>

                {/* Conversation thread */}
                <ScrollArea className="max-h-[300px] lg:max-h-[400px]">
                  <div className="space-y-3 pr-3">
                    {selected.responses?.map((r: any) => {
                      const isMe = r.userId !== selected.assignedTo && r.userId !== selected.ispId
                      // Simple heuristic: if the response userName matches the client's name
                      const isClientResponse = r.userName === selected.user?.name || r.userId === selected.userId
                      const isResponseFromMe = isClientResponse

                      return (
                        <div key={r.id} className={`flex ${isResponseFromMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-xl p-3 ${
                            isResponseFromMe
                              ? "bg-emerald-500/15 text-emerald-50"
                              : "bg-[#1e293b] text-slate-300"
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium">{r.userName || "Support"}</span>
                              <span className="text-[10px] opacity-50">{format(new Date(r.createdAt), "MMM d, h:mm a")}</span>
                            </div>
                            <p className="text-sm leading-relaxed">{r.message}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>

                {/* Reply form */}
                {selected.status !== "closed" && (
                  <div className="flex gap-2 pt-2 border-t border-[#1e293b]">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      className="bg-[#0b1220] border-[#1e293b] text-white min-h-[60px] resize-none rounded-xl"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleReply()
                        }
                      }}
                    />
                    <Button
                      onClick={handleReply}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white self-end rounded-xl shrink-0"
                      disabled={!replyText.trim() || submitting}
                      size="icon"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#111827] border-[#1e293b]">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/15">
                    <HelpCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, i) => (
                    <AccordionItem key={i} value={String(i)} className="border-[#1e293b]">
                      <AccordionTrigger className="text-sm text-white hover:text-emerald-400 hover:no-underline text-left">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-slate-500">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Create Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Subject *</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="bg-[#0b1220] border-[#1e293b] text-white rounded-xl"
                placeholder="Brief description of your issue"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111827] border-[#1e293b]">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Description *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-[#0b1220] border-[#1e293b] text-white min-h-[120px] rounded-xl"
                placeholder="Describe your issue in detail..."
              />
            </div>
            <Button
              onClick={handleCreate}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-11"
              disabled={!form.subject.trim() || !form.description.trim() || creating}
            >
              {creating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" />Create Ticket</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
