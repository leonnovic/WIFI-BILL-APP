"use client"

import { useState, useEffect, useCallback } from "react"
import {
  MessageSquare, Plus, Send, Mail, Phone, Users, Smartphone,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"

interface ClientOption {
  id: string
  name: string | null
  email: string
}

interface MessageData {
  id: string
  subject: string
  content: string
  type: string
  status: string
  recipient: string | null
  recipientId: string | null
  sentAt: string | null
  createdAt: string
}

const templates = [
  { id: "1", name: "Maintenance Notice", content: "Dear customer, we will be performing maintenance on our network on {date}. You may experience brief interruptions." },
  { id: "2", name: "Payment Reminder", content: "Dear {name}, your internet package will expire on {date}. Please renew to avoid interruption." },
  { id: "3", name: "Welcome Message", content: "Welcome to our ISP, {name}! Your account is now active. Contact us for any assistance." },
]

const typeIcon: Record<string, { icon: any; color: string }> = {
  sms: { icon: Smartphone, color: "text-emerald-500" },
  email: { icon: Mail, color: "text-sky-500" },
  in_app: { icon: MessageSquare, color: "text-violet-500" },
}

export default function MemberMessagesPage() {
  const [messages, setMessages] = useState<MessageData[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    subject: "",
    content: "",
    type: "sms",
    recipient: "all",
    recipientId: "",
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/member/messages")
      if (!res.ok) throw new Error()
      const json = await res.json()
      setMessages(json.data || [])
    } catch {
      toast.error("Failed to load messages")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/member/clients")
      if (!res.ok) throw new Error()
      const json = await res.json()
      setClients((json.data || []).map((c: any) => ({ id: c.id, name: c.name, email: c.email })))
    } catch {
      // Non-critical, don't show error
    }
  }, [])

  useEffect(() => {
    fetchMessages()
    fetchClients()
  }, [fetchMessages, fetchClients])

  const handleSend = async () => {
    if (!form.subject || !form.content) {
      toast.error("Subject and content are required")
      return
    }
    setSubmitting(true)
    try {
      const body: any = {
        subject: form.subject,
        content: form.content,
        type: form.type,
        recipient: form.recipient,
      }
      if (form.recipient !== "all" && form.recipientId) {
        body.recipientId = form.recipientId
      }

      const res = await fetch("/api/member/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed")
      }
      toast.success("Message sent successfully")
      setDialogOpen(false)
      setForm({ subject: "", content: "", type: "sms", recipient: "all", recipientId: "" })
      fetchMessages()
    } catch (e: any) {
      toast.error(e.message || "Failed to send message")
    } finally {
      setSubmitting(false)
    }
  }

  const applyTemplate = (template: typeof templates[0]) => {
    setForm({ ...form, subject: template.name, content: template.content })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 bg-[#111827]" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 bg-[#111827]" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-slate-400 mt-1">SMS, Email & In-App campaigns</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Plus className="w-4 h-4 mr-2" />Compose Message
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sent messages */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-lg font-semibold text-white">Sent Messages</h2>
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => {
              const typeInfo = typeIcon[msg.type] || typeIcon.sms
              const TypeIcon = typeInfo.icon

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                >
                  <Card className="bg-[#111827] border-[#1e293b] hover:border-emerald-500/30 transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${msg.type === "sms" ? "bg-emerald-500/15" : msg.type === "email" ? "bg-sky-500/15" : "bg-violet-500/15"}`}>
                          <TypeIcon className={`w-4 h-4 ${typeInfo.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-white truncate">{msg.subject}</p>
                          </div>
                          <p className="text-sm text-slate-400 line-clamp-2">{msg.content}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <Badge variant="secondary" className={`text-xs border-0 ${
                              msg.type === "sms" ? "bg-emerald-500/15 text-emerald-400" :
                              msg.type === "email" ? "bg-sky-500/15 text-sky-400" :
                              "bg-violet-500/15 text-violet-400"
                            }`}>
                              {msg.type.toUpperCase()}
                            </Badge>
                            <Badge variant="secondary" className={`text-xs border-0 ${
                              msg.status === "sent" ? "bg-emerald-500/15 text-emerald-400" :
                              msg.status === "delivered" ? "bg-sky-500/15 text-sky-400" :
                              msg.status === "failed" ? "bg-rose-500/15 text-rose-400" :
                              "bg-amber-500/15 text-amber-400"
                            }`}>
                              {msg.status}
                            </Badge>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {msg.recipient === "all" ? "All clients" : msg.recipient || "Individual"}
                            </span>
                            <span className="text-xs text-slate-500">
                              {msg.sentAt ? format(new Date(msg.sentAt), "MMM d, h:mm a") : format(new Date(msg.createdAt), "MMM d, h:mm a")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No messages sent yet</p>
            </div>
          )}
        </div>

        {/* Templates */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Templates</h2>
          {templates.map((t) => (
            <Card
              key={t.id}
              className="bg-[#111827] border-[#1e293b] cursor-pointer hover:border-emerald-500/30 transition-all duration-300"
              onClick={() => applyTemplate(t)}
            >
              <CardContent className="p-4">
                <p className="text-sm font-medium text-white">{t.name}</p>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Compose Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Subject *</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="bg-[#0b1220] border-[#1e293b] text-white"
                placeholder="Message subject"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#1e293b]">
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="in_app">In-App</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Recipients</Label>
                <Select value={form.recipient} onValueChange={(v) => setForm({ ...form, recipient: v })}>
                  <SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#1e293b]">
                    <SelectItem value="all">All Clients</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.recipient === "individual" && (
              <div className="space-y-2">
                <Label className="text-slate-300">Select Client</Label>
                <Select value={form.recipientId} onValueChange={(v) => setForm({ ...form, recipientId: v })}>
                  <SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white">
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#1e293b]">
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name || c.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-slate-300">Message *</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="bg-[#0b1220] border-[#1e293b] text-white min-h-[120px]"
                placeholder="Type your message... Use {name} or {date} for placeholders."
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={submitting || !form.subject || !form.content}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {submitting ? "Sending..." : <><Send className="w-4 h-4 mr-2" />Send Message</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
