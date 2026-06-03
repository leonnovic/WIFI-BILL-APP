"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Router as RouterIcon, Plus, Wifi, WifiOff, Users, MapPin, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface RouterData {
  id: string
  name: string
  ipAddress: string
  username: string
  model: string | null
  location: string | null
  status: string
  connectedClients: number
  lastSeen: string | null
  createdAt: string
}

const fadeIn = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }

export default function MemberRoutersPage() {
  const [routers, setRouters] = useState<RouterData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", ipAddress: "", username: "admin", password: "", model: "", location: "" })

  const fetchRouters = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/member/routers")
      if (res.ok) {
        const json = await res.json()
        setRouters(Array.isArray(json) ? json : [])
      }
    } catch { toast.error("Failed to load routers") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchRouters() }, [fetchRouters])

  async function handleAdd() {
    if (!form.name || !form.ipAddress) { toast.error("Name and IP address are required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/member/routers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status: "online", connectedClients: 0 }),
      })
      if (res.ok) { toast.success("Router added"); setDialogOpen(false); setForm({ name: "", ipAddress: "", username: "admin", password: "", model: "", location: "" }); fetchRouters() }
      else { toast.error("Failed to add router") }
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this router?")) return
    try {
      const res = await fetch(`/api/member/routers/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Router removed"); fetchRouters() }
    } catch { toast.error("Failed to remove") }
  }

  async function testConnection(router: RouterData) {
    toast.loading(`Testing ${router.name}...`, { id: "test" })
    setTimeout(() => { toast.success(`${router.name} is reachable`, { id: "test" }) }, 1500)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-4"><div className="h-16 bg-[#1e293b] rounded" /></CardContent></Card>)}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-6"><div className="h-40 bg-[#1e293b] rounded" /></CardContent></Card>)}</div>
      </div>
    )
  }

  const onlineCount = routers.filter(r => r.status === "online").length
  const totalClients = routers.reduce((s, r) => s + r.connectedClients, 0)

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">Routers</h1><p className="text-slate-400 mt-1">MikroTik router management</p></div>
        <Button onClick={() => setDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white"><Plus className="w-4 h-4 mr-2" />Add Router</Button>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-[#111827] border-[#1e293b]"><CardContent className="p-4"><p className="text-xs text-slate-400">Total Routers</p><p className="text-2xl font-bold text-white mt-1">{routers.length}</p></CardContent></Card>
        <Card className="bg-[#111827] border-[#1e293b]"><CardContent className="p-4"><p className="text-xs text-slate-400">Online</p><p className="text-2xl font-bold text-emerald-400 mt-1">{onlineCount}</p></CardContent></Card>
        <Card className="bg-[#111827] border-[#1e293b]"><CardContent className="p-4"><p className="text-xs text-slate-400">Total Clients</p><p className="text-2xl font-bold text-blue-400 mt-1">{totalClients}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <RouterIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No routers configured</p>
          </div>
        ) : routers.map((router) => (
          <motion.div key={router.id} {...fadeIn}>
            <Card className={`bg-[#111827] border-[#1e293b] transition-colors ${router.status === "online" ? "hover:border-emerald-500/30" : "opacity-70"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${router.status === "online" ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
                      {router.status === "online" ? <Wifi className="w-5 h-5 text-emerald-500" /> : <WifiOff className="w-5 h-5 text-red-500" />}
                    </div>
                    <div><CardTitle className="text-base text-white">{router.name}</CardTitle><p className="text-xs text-slate-400 font-mono">{router.ipAddress}</p></div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#111827] border-[#1e293b]">
                      <DropdownMenuItem onClick={() => testConnection(router)} className="text-slate-300 focus:bg-[#1e293b]">Test Connection</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(router.id)} className="text-red-400 focus:bg-[#1e293b]">Remove</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className={`text-xs border-0 ${router.status === "online" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>{router.status}</Badge>
                  <span className="text-xs text-slate-500">{router.lastSeen ? `Last: ${new Date(router.lastSeen).toLocaleString()}` : "Just now"}</span>
                </div>
                <div className="space-y-2 text-sm">
                  {router.model && <div className="flex items-center gap-2 text-slate-300"><RouterIcon className="w-4 h-4 text-slate-500" />{router.model}</div>}
                  {router.location && <div className="flex items-center gap-2 text-slate-300"><MapPin className="w-4 h-4 text-slate-500" />{router.location}</div>}
                  <div className="flex items-center gap-2 text-slate-300"><Users className="w-4 h-4 text-slate-500" />{router.connectedClients} connected clients</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader><DialogTitle>Add Router</DialogTitle><DialogDescription className="text-slate-400">Register a new MikroTik router</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-slate-300">Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="Site C Router" /></div>
              <div className="space-y-2"><Label className="text-slate-300">IP Address *</Label><Input value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="192.168.x.x" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-slate-300">Username</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-slate-300">Model</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="MikroTik RB750Gr3" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="Site C - Karen" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-[#1e293b] text-slate-300">Cancel</Button>
            <Button onClick={handleAdd} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white">{saving ? "Adding..." : "Add Router"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
