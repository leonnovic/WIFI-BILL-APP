"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  DialogDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Pencil, Trash2, Router as RouterIcon, Wifi, WifiOff } from "lucide-react"
import { toast } from "sonner"

interface RouterData {
  id: string
  name: string
  ip: string
  model: string | null
  location: string | null
  status: string
  ownerId: string
  apiPort: string | null
  createdAt: string
  owner: { name: string | null; email: string; businessName: string | null }
}

interface MemberOption {
  id: string
  businessName: string | null
  name: string | null
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
  const [form, setForm] = useState({ name: "", ip: "", model: "", location: "", ownerId: "", apiPort: "8728", status: "ONLINE" })

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
        setRouters(json.routers)
        setTotal(json.total)
      }
    } catch (error) {
      console.error("Failed to fetch routers:", error)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    fetch("/api/admin/members?limit=100")
      .then(r => r.json())
      .then(json => setMembers(json.members || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchRouters()
  }, [fetchRouters])

  function openCreateDialog() {
    setEditRouter(null)
    setForm({ name: "", ip: "", model: "", location: "", ownerId: members[0]?.id || "", apiPort: "8728", status: "ONLINE" })
    setDialogOpen(true)
  }

  function openEditDialog(router: RouterData) {
    setEditRouter(router)
    setForm({
      name: router.name,
      ip: router.ip,
      model: router.model || "",
      location: router.location || "",
      ownerId: router.ownerId,
      apiPort: router.apiPort || "8728",
      status: router.status,
    })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    try {
      if (editRouter) {
        const res = await fetch(`/api/admin/routers/${editRouter.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (res.ok) {
          toast.success("Router updated")
          setDialogOpen(false)
          fetchRouters()
        }
      } else {
        const res = await fetch("/api/admin/routers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (res.ok) {
          toast.success("Router added")
          setDialogOpen(false)
          fetchRouters()
        }
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  async function deleteRouter(id: string) {
    if (!confirm("Delete this router?")) return
    try {
      const res = await fetch(`/api/admin/routers/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Router deleted")
        fetchRouters()
      }
    } catch {
      toast.error("Failed to delete router")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Routers</h1>
          <p className="text-slate-400 text-sm">Manage MikroTik routers and connectivity</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Router
        </Button>
      </div>

      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-4">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-40 bg-[#0b1220] border-[#1e293b] text-white">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#111827] border-[#1e293b]">
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ONLINE">Online</SelectItem>
              <SelectItem value="OFFLINE">Offline</SelectItem>
              <SelectItem value="WARNING">Warning</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#1e293b] hover:bg-transparent">
                  <TableHead className="text-slate-400">Name</TableHead>
                  <TableHead className="text-slate-400">IP Address</TableHead>
                  <TableHead className="text-slate-400">Model</TableHead>
                  <TableHead className="text-slate-400">Location</TableHead>
                  <TableHead className="text-slate-400">Owner</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-[#1e293b]">
                      {[...Array(7)].map((_, j) => (
                        <TableCell key={j} className="animate-pulse"><div className="h-4 bg-[#1e293b] rounded w-24" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : routers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400">No routers found</TableCell>
                  </TableRow>
                ) : (
                  routers.map((router) => (
                    <TableRow key={router.id} className="border-[#1e293b] hover:bg-[#0b1220]/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {router.status === "ONLINE" ? (
                            <Wifi className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <WifiOff className="w-4 h-4 text-red-400" />
                          )}
                          <span className="text-white font-medium">{router.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300 font-mono text-sm">{router.ip}</TableCell>
                      <TableCell className="text-slate-300 text-sm">{router.model || "—"}</TableCell>
                      <TableCell className="text-slate-300 text-sm">{router.location || "—"}</TableCell>
                      <TableCell className="text-slate-300 text-sm">{router.owner?.businessName || router.owner?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            router.status === "ONLINE"
                              ? "border-emerald-500/30 text-emerald-400"
                              : router.status === "WARNING"
                              ? "border-amber-500/30 text-amber-400"
                              : "border-red-500/30 text-red-400"
                          }
                        >
                          {router.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#111827] border-[#1e293b]">
                            <DropdownMenuItem onClick={() => openEditDialog(router)} className="text-slate-300 focus:bg-[#1e293b] focus:text-white">
                              <Pencil className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteRouter(router.id)} className="text-red-400 focus:bg-[#1e293b] focus:text-red-400">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader>
            <DialogTitle>{editRouter ? "Edit Router" : "Add Router"}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editRouter ? "Update router configuration" : "Register a new MikroTik router"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">IP Address</label>
                <Input value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="192.168.1.1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Model</label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="RB750Gr3" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">API Port</label>
                <Input value={form.apiPort} onChange={(e) => setForm({ ...form, apiPort: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Location</label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Owner (ISP)</label>
                <Select value={form.ownerId} onValueChange={(v) => setForm({ ...form, ownerId: v })}>
                  <SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white">
                    <SelectValue placeholder="Select ISP" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#1e293b]">
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.businessName || m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#1e293b]">
                    <SelectItem value="ONLINE">Online</SelectItem>
                    <SelectItem value="OFFLINE">Offline</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
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
    </div>
  )
}
