"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, MoreHorizontal, Pencil, Trash2, Router as RouterIcon, Wifi, WifiOff, MapPin, Users } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface RouterData {
  id: string
  name: string
  ipAddress: string
  username: string
  model: string | null
  location: string | null
  status: string
  connectedClients: number
  isActive: boolean
  ownerId: string
  lastSeen: string | null
  createdAt: string
  user: { id: string; name: string | null; email: string; businessName: string | null }
}

interface MemberOption {
  id: string
  businessName: string | null
  name: string | null
}

const statusColors: Record<string, string> = {
  online: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  offline: "border-red-500/30 text-red-400 bg-red-500/10",
  warning: "border-amber-500/30 text-amber-400 bg-amber-500/10",
}

export default function RoutersPage() {
  const [routers, setRouters] = useState<RouterData[]>([])
  const [members, setMembers] = useState<MemberOption[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRouter, setEditRouter] = useState<RouterData | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", ipAddress: "", model: "", location: "", ownerId: "", status: "online" })

  const fetchRouters = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "20")
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter)
      const res = await fetch(`/api/admin/routers?${params}`)
      if (res.ok) {
        const json = await res.json()
        setRouters(json.data || [])
        setTotal(json.total || 0)
      }
    } catch (error) { console.error("Failed to fetch routers:", error) }
    finally { setLoading(false) }
  }, [page, statusFilter])

  useEffect(() => {
    fetch("/api/admin/members?limit=100")
      .then(r => r.json())
      .then(json => setMembers(json.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => { fetchRouters() }, [fetchRouters])

  function openCreateDialog() {
    setEditRouter(null)
    setForm({ name: "", ipAddress: "", model: "", location: "", ownerId: members[0]?.id || "", status: "online" })
    setDialogOpen(true)
  }

  function openEditDialog(router: RouterData) {
    setEditRouter(router)
    setForm({ name: router.name, ipAddress: router.ipAddress, model: router.model || "", location: router.location || "", ownerId: router.ownerId, status: router.status })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    try {
      if (editRouter) {
        const res = await fetch(`/api/admin/routers/${editRouter.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        if (res.ok) { toast.success("Router updated"); setDialogOpen(false); fetchRouters() }
      } else {
        const res = await fetch("/api/admin/routers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        if (res.ok) { toast.success("Router added"); setDialogOpen(false); fetchRouters() }
        else { const json = await res.json(); toast.error(json.error || "Failed to add router") }
      }
    } catch { toast.error("Something went wrong") }
  }

  async function deleteRouter(id: string) {
    try {
      const res = await fetch(`/api/admin/routers/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Router deleted"); fetchRouters() }
    } catch { toast.error("Failed to delete router") }
    setDeleteId(null)
  }

  const onlineCount = routers.filter(r => r.status === "online").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <RouterIcon className="w-6 h-6 text-orange-400" /> Routers
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage MikroTik routers and connectivity</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
            {onlineCount}/{routers.length} Online
          </Badge>
          <Button onClick={openCreateDialog} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20">
            <Plus className="w-4 h-4 mr-2" /> Add Router
          </Button>
        </div>
      </div>

      {/* Filter */}
      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-4">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-40 bg-[#0b1220] border-[#1e293b] text-white"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent className="bg-[#111827] border-[#1e293b]">
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Router Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="bg-[#111827] border-[#1e293b]"><CardContent className="p-6"><Skeleton className="h-40 bg-[#1e293b]" /></CardContent></Card>
          ))
        ) : routers.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 gap-2">
            <RouterIcon className="w-10 h-10 text-slate-600" />
            <p className="text-slate-400">No routers found</p>
          </div>
        ) : (
          <AnimatePresence>
            {routers.map((router, index) => (
              <motion.div key={router.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className="bg-[#111827] border-[#1e293b] hover:border-[#334155] transition-all duration-300 hover:shadow-lg hover:shadow-black/20 group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${statusColors[router.status] || statusColors.offline}`}>
                          {router.status === "online" ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{router.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{router.ipAddress}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#111827] border-[#1e293b]" align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(router)} className="text-slate-300 focus:bg-[#1e293b] focus:text-white"><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteId(router.id)} className="text-red-400 focus:bg-[#1e293b] focus:text-red-400"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Model</span>
                        <span className="text-white">{router.model || "—"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</span>
                        <span className="text-white">{router.location || "—"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Clients</span>
                        <span className="text-cyan-400 font-semibold">{router.connectedClients}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Owner</span>
                        <span className="text-slate-300">{router.user?.businessName || router.user?.name || "—"}</span>
                      </div>
                      <div className="pt-2 border-t border-[#1e293b] flex justify-between items-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[router.status] || statusColors.offline}`}>{router.status}</span>
                        {router.lastSeen && (
                          <span className="text-xs text-slate-500">Last seen {new Date(router.lastSeen).toLocaleDateString()}</span>
                        )}
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
            <DialogTitle>{editRouter ? "Edit Router" : "Add Router"}</DialogTitle>
            <DialogDescription className="text-slate-400">{editRouter ? "Update router configuration" : "Register a new MikroTik router"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-slate-300">IP Address</label><Input value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="192.168.1.1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Model</label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="RB750Gr3" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Location</label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Owner (ISP)</label>
                <Select value={form.ownerId} onValueChange={(v) => setForm({ ...form, ownerId: v })}>
                  <SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white"><SelectValue placeholder="Select ISP" /></SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#1e293b]">
                    {members.map((m) => (<SelectItem key={m.id} value={m.id}>{m.businessName || m.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#1e293b]">
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-[#1e293b] text-slate-300">Cancel</Button>
            <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600 text-white">{editRouter ? "Update" : "Add Router"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Router</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">This will permanently remove this router from the system.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1e293b] text-slate-300 bg-transparent hover:bg-[#1e293b]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteRouter(deleteId)} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
