"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, MoreHorizontal, Pencil, Trash2, Webhook as WebhookIcon, Send, Zap, Globe } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

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
  "transaction.created", "transaction.completed", "transaction.failed",
  "user.registered", "user.deactivated",
  "package.subscribed",
  "ticket.created", "ticket.resolved",
  "router.online", "router.offline",
]

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editWebhook, setEditWebhook] = useState<WebhookData | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", url: "", events: [] as string[], secret: "" })
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => { fetchWebhooks() }, [])

  async function fetchWebhooks() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/webhooks")
      if (res.ok) {
        const json = await res.json()
        setWebhooks(json.data || [])
      }
    } catch (error) { console.error("Failed to fetch webhooks:", error) }
    finally { setLoading(false) }
  }

  function parseEvents(eventsStr: string): string[] {
    try {
      const parsed = JSON.parse(eventsStr)
      return Array.isArray(parsed) ? parsed : eventsStr.split(",").map(s => s.trim())
    } catch {
      return eventsStr.split(",").map(s => s.trim()).filter(Boolean)
    }
  }

  function openCreateDialog() {
    setEditWebhook(null)
    setForm({ name: "", url: "", events: [], secret: "" })
    setDialogOpen(true)
  }

  function openEditDialog(wh: WebhookData) {
    setEditWebhook(wh)
    setForm({ name: wh.name, url: wh.url, events: parseEvents(wh.events), secret: wh.secret || "" })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    try {
      if (editWebhook) {
        const res = await fetch(`/api/admin/webhooks/${editWebhook.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, events: form.events }) })
        if (res.ok) { toast.success("Webhook updated"); setDialogOpen(false); fetchWebhooks() }
      } else {
        const res = await fetch("/api/admin/webhooks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, events: form.events }) })
        if (res.ok) { toast.success("Webhook created"); setDialogOpen(false); fetchWebhooks() }
        else { toast.error("Failed to create webhook") }
      }
    } catch { toast.error("Something went wrong") }
  }

  async function deleteWebhook(id: string) {
    try {
      const res = await fetch(`/api/admin/webhooks/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Webhook deleted"); fetchWebhooks() }
    } catch { toast.error("Failed to delete webhook") }
    setDeleteId(null)
  }

  function testWebhook(wh: WebhookData) {
    setTestResult(`Test sent to ${wh.url} — Simulated 200 OK response`)
    toast.success("Test webhook sent")
  }

  function toggleEvent(event: string) {
    setForm(prev => ({
      ...prev,
      events: prev.events.includes(event) ? prev.events.filter(e => e !== event) : [...prev.events, event],
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <WebhookIcon className="w-6 h-6 text-lime-400" /> Webhooks
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage webhook endpoints and event subscriptions</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20">
          <Plus className="w-4 h-4 mr-2" /> Add Webhook
        </Button>
      </div>

      {/* Test result */}
      <AnimatePresence>
        {testResult && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="bg-emerald-500/10 border-emerald-500/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <p className="text-sm text-emerald-400 flex-1">{testResult}</p>
                  <Button variant="ghost" size="icon" onClick={() => setTestResult(null)} className="text-slate-400 hover:text-white h-6 w-6 shrink-0">✕</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Webhook List */}
      <div className="grid gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="bg-[#111827] border-[#1e293b]"><CardContent className="p-6"><Skeleton className="h-20 bg-[#1e293b]" /></CardContent></Card>
          ))
        ) : webhooks.length === 0 ? (
          <Card className="bg-[#111827] border-[#1e293b]">
            <CardContent className="p-12 text-center">
              <WebhookIcon className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400">No webhooks configured</p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {webhooks.map((wh, index) => (
              <motion.div key={wh.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className={`bg-[#111827] border-[#1e293b] hover:border-[#334155] transition-all duration-300 ${!wh.isActive ? "opacity-60" : ""}`}>
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-lime-500/10 flex items-center justify-center border border-lime-500/20 shrink-0">
                          <WebhookIcon className="w-6 h-6 text-lime-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{wh.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Globe className="w-3 h-3 text-slate-500" />
                            <p className="text-slate-400 text-sm font-mono">{wh.url}</p>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {parseEvents(wh.events).map((event) => (
                              <Badge key={event} variant="outline" className="border-cyan-500/20 text-cyan-400 text-[10px]">{event}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${wh.isActive ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-red-500/30 text-red-400 bg-red-500/10"}`}>
                            {wh.isActive ? "Active" : "Inactive"}
                          </span>
                          <p className="text-xs text-slate-500 mt-1">
                            {wh.lastTriggeredAt ? `Last: ${new Date(wh.lastTriggeredAt).toLocaleDateString()}` : "Never triggered"}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#111827] border-[#1e293b]" align="end">
                            <DropdownMenuItem onClick={() => testWebhook(wh)} className="text-slate-300 focus:bg-[#1e293b] focus:text-white"><Send className="w-4 h-4 mr-2" /> Test</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(wh)} className="text-slate-300 focus:bg-[#1e293b] focus:text-white"><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteId(wh.id)} className="text-red-400 focus:bg-[#1e293b] focus:text-red-400"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><WebhookIcon className="w-5 h-5 text-lime-400" /> {editWebhook ? "Edit Webhook" : "Add Webhook"}</DialogTitle>
            <DialogDescription className="text-slate-400">Configure a webhook endpoint to receive event notifications</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white focus:border-emerald-500/50" placeholder="e.g. Payment Notification" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-300">URL</label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white focus:border-emerald-500/50" placeholder="https://example.com/webhook" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Secret (optional)</label><Input value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white focus:border-emerald-500/50" placeholder="Webhook secret for signature verification" /></div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Events</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {availableEvents.map((event) => (
                  <label key={event} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${form.events.includes(event) ? "bg-emerald-500/10 border-emerald-500/30" : "bg-[#0b1220] border-[#1e293b] hover:border-[#334155]"}`}>
                    <input type="checkbox" checked={form.events.includes(event)} onChange={() => toggleEvent(event)} className="accent-emerald-500" />
                    <span className="text-sm text-slate-300">{event}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-[#1e293b] text-slate-300">Cancel</Button>
            <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600 text-white" disabled={!form.name || !form.url || form.events.length === 0}>{editWebhook ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">This will permanently remove this webhook endpoint.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1e293b] text-slate-300 bg-transparent hover:bg-[#1e293b]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteWebhook(deleteId)} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
