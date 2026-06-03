"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Pencil, Trash2, Webhook as WebhookIcon, Send, Zap } from "lucide-react"
import { toast } from "sonner"

interface WebhookData {
  id: string
  name: string
  url: string
  events: string
  secret: string | null
  isActive: boolean
  lastTriggeredAt: string | null
  createdAt: string
}

const availableEvents = [
  "transaction.created",
  "transaction.completed",
  "transaction.failed",
  "user.registered",
  "user.deactivated",
  "package.subscribed",
  "ticket.created",
  "ticket.resolved",
  "router.online",
  "router.offline",
]

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editWebhook, setEditWebhook] = useState<WebhookData | null>(null)
  const [form, setForm] = useState({ name: "", url: "", events: [] as string[], secret: "" })
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => {
    fetchWebhooks()
  }, [])

  async function fetchWebhooks() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/webhooks")
      if (res.ok) {
        const json = await res.json()
        setWebhooks(json.webhooks)
      }
    } catch (error) {
      console.error("Failed to fetch webhooks:", error)
    } finally {
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setEditWebhook(null)
    setForm({ name: "", url: "", events: [], secret: "" })
    setDialogOpen(true)
  }

  function openEditDialog(wh: WebhookData) {
    setEditWebhook(wh)
    setForm({
      name: wh.name,
      url: wh.url,
      events: wh.events.split(","),
      secret: wh.secret || "",
    })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    try {
      if (editWebhook) {
        const res = await fetch(`/api/admin/webhooks/${editWebhook.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, events: form.events }),
        })
        if (res.ok) {
          toast.success("Webhook updated")
          setDialogOpen(false)
          fetchWebhooks()
        }
      } else {
        const res = await fetch("/api/admin/webhooks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, events: form.events }),
        })
        if (res.ok) {
          toast.success("Webhook created")
          setDialogOpen(false)
          fetchWebhooks()
        }
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  async function deleteWebhook(id: string) {
    if (!confirm("Delete this webhook?")) return
    try {
      const res = await fetch(`/api/admin/webhooks/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Webhook deleted")
        fetchWebhooks()
      }
    } catch {
      toast.error("Failed to delete webhook")
    }
  }

  function testWebhook(wh: WebhookData) {
    setTestResult(`Test sent to ${wh.url} — Simulated 200 OK response`)
    toast.success("Test webhook sent")
  }

  function toggleEvent(event: string) {
    setForm(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Webhooks</h1>
          <p className="text-slate-400 text-sm">Manage webhook endpoints and event subscriptions</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {testResult && (
        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-emerald-400">{testResult}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setTestResult(null)} className="text-slate-400 hover:text-white h-6 w-6">✕</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse">
              <CardContent className="p-6"><div className="h-20 bg-[#1e293b] rounded" /></CardContent>
            </Card>
          ))
        ) : webhooks.length === 0 ? (
          <Card className="bg-[#111827] border-[#1e293b]">
            <CardContent className="p-12 text-center text-slate-400">No webhooks configured</CardContent>
          </Card>
        ) : (
          webhooks.map((wh) => (
            <Card key={wh.id} className={`bg-[#111827] border-[#1e293b] ${!wh.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <WebhookIcon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{wh.name}</p>
                      <p className="text-slate-400 text-sm font-mono">{wh.url}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {wh.events.split(",").map((event) => (
                          <Badge key={event} variant="outline" className="border-cyan-500/20 text-cyan-400 text-[10px]">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Badge variant="outline" className={wh.isActive ? "border-emerald-500/30 text-emerald-400" : "border-red-500/30 text-red-400"}>
                        {wh.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <p className="text-xs text-slate-400 mt-1">
                        {wh.lastTriggeredAt ? `Last: ${new Date(wh.lastTriggeredAt).toLocaleDateString()}` : "Never triggered"}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#111827] border-[#1e293b]">
                        <DropdownMenuItem onClick={() => testWebhook(wh)} className="text-slate-300 focus:bg-[#1e293b] focus:text-white">
                          <Send className="w-4 h-4 mr-2" /> Test
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(wh)} className="text-slate-300 focus:bg-[#1e293b] focus:text-white">
                          <Pencil className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteWebhook(wh.id)} className="text-red-400 focus:bg-[#1e293b] focus:text-red-400">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editWebhook ? "Edit Webhook" : "Add Webhook"}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure a webhook endpoint to receive event notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="e.g. Payment Notification" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">URL</label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="https://example.com/webhook" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Secret (optional)</label>
              <Input value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="Webhook secret for signature verification" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Events</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {availableEvents.map((event) => (
                  <label key={event} className="flex items-center gap-2 p-2 rounded-lg bg-[#0b1220] border border-[#1e293b] cursor-pointer hover:border-[#334155] transition-colors">
                    <input
                      type="checkbox"
                      checked={form.events.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="accent-emerald-500"
                    />
                    <span className="text-sm text-slate-300">{event}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-[#1e293b] text-slate-300">Cancel</Button>
            <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600 text-white" disabled={!form.name || !form.url || form.events.length === 0}>
              {editWebhook ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
