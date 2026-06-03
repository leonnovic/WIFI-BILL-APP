"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { MessageSquare, Plus, Send, Mail, Phone, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"

interface MessageData {
  id: string
  subject: string
  content: string
  type: string
  status: string
  recipient: string | null
  createdAt: string
}

const fadeIn = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }

export default function MemberMessagesPage() {
  const [messages, setMessages] = useState<MessageData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ subject: "", content: "", type: "sms", recipient: "all" })

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/member/messages")
      if (res.ok) { const json = await res.json(); setMessages(Array.isArray(json) ? json : []) }
    } catch { toast.error("Failed to load messages") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  async function handleSend() {
    if (!form.subject || !form.content) { toast.error("Subject and content are required"); return }
    setSending(true)
    try {
      const res = await fetch("/api/member/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) { toast.success("Message sent"); setDialogOpen(false); setForm({ subject: "", content: "", type: "sms", recipient: "all" }); fetchMessages() }
      else { toast.error("Failed to send message") }
    } catch { toast.error("Failed to send message") }
    finally { setSending(false) }
  }

  const templates = [
    { name: "Maintenance Notice", content: "Dear customer, we will be performing maintenance on our network on {date}. You may experience brief interruptions." },
    { name: "Payment Reminder", content: "Dear {name}, your internet package will expire on {date}. Please renew to avoid interruption." },
    { name: "Welcome Message", content: "Welcome to our ISP, {name}! Your account is now active. Contact us for any assistance." },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">{[...Array(3)].map((_, i) => <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-4"><div className="h-20 bg-[#1e293b] rounded" /></CardContent></Card>)}</div>
          <div className="space-y-3">{[...Array(3)].map((_, i) => <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-4"><div className="h-16 bg-[#1e293b] rounded" /></CardContent></Card>)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">Messages</h1><p className="text-slate-400 mt-1">SMS & Email campaigns</p></div>
        <Button onClick={() => setDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white"><Plus className="w-4 h-4 mr-2" />Compose Message</Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-lg font-semibold text-white">Sent Messages</h2>
          {messages.length === 0 ? (
            <div className="text-center py-12"><MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" /><p className="text-slate-400">No messages sent yet</p></div>
          ) : messages.map((msg) => (
            <Card key={msg.id} className="bg-[#111827] border-[#1e293b] hover:border-emerald-500/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-2 mb-1">
                  {msg.type === "sms" ? <Phone className="w-4 h-4 text-emerald-500 mt-0.5" /> : <Mail className="w-4 h-4 text-blue-500 mt-0.5" />}
                  <p className="text-sm font-medium text-white">{msg.subject}</p>
                </div>
                <p className="text-sm text-slate-400 line-clamp-2 ml-6">{msg.content}</p>
                <div className="flex items-center gap-3 mt-2 ml-6">
                  <Badge variant="secondary" className={`text-xs border-0 ${msg.type === "sms" ? "bg-emerald-500/15 text-emerald-400" : "bg-blue-500/15 text-blue-400"}`}>{msg.type.toUpperCase()}</Badge>
                  <Badge variant="secondary" className={`text-xs border-0 ${msg.status === "sent" ? "bg-emerald-500/15 text-emerald-400" : msg.status === "delivered" ? "bg-blue-500/15 text-blue-400" : "bg-amber-500/15 text-amber-400"}`}>{msg.status}</Badge>
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Users className="w-3 h-3" />{msg.recipient === "all" ? "All clients" : msg.recipient}</span>
                  <span className="text-xs text-slate-500">{new Date(msg.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Templates</h2>
          {templates.map((t) => (
            <Card key={t.name} className="bg-[#111827] border-[#1e293b] cursor-pointer hover:border-emerald-500/30 transition-colors" onClick={() => { setForm({ ...form, subject: t.name, content: t.content }); setDialogOpen(true) }}>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-white">{t.name}</p>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white max-w-lg">
          <DialogHeader><DialogTitle>Compose Message</DialogTitle><DialogDescription className="text-slate-400">Send a message to your clients</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label className="text-slate-300">Subject *</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="Message subject" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-slate-300">Type</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-[#111827] border-[#1e293b]"><SelectItem value="sms">SMS</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="in_app">In-App</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-slate-300">Recipients</Label><Select value={form.recipient} onValueChange={(v) => setForm({ ...form, recipient: v })}><SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-[#111827] border-[#1e293b]"><SelectItem value="all">All Clients</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label className="text-slate-300">Message *</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white min-h-[120px]" placeholder="Type your message..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-[#1e293b] text-slate-300">Cancel</Button>
            <Button onClick={handleSend} disabled={sending || !form.subject || !form.content} className="bg-emerald-500 hover:bg-emerald-600 text-white"><Send className="w-4 h-4 mr-2" />{sending ? "Sending..." : "Send"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
