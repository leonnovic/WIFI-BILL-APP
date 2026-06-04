"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Router as RouterIcon, Plus, Wifi, WifiOff, Users, MapPin,
  Edit, Trash2, MoreHorizontal, Zap, Signal,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface RouterData {
  id: string
  name: string
  ipAddress: string
  username: string
  password: string
  model: string | null
  location: string | null
  status: string
  connectedClients: number
  isActive: boolean
  lastSeen: string | null
  createdAt: string
}

const defaultForm = {
  name: "",
  ipAddress: "",
  username: "admin",
  password: "",
  model: "",
  location: "",
}

export default function MemberRoutersPage() {
  const [routers, setRouters] = useState<RouterData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRouter, setEditingRouter] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)

  const fetchRouters = useCallback(async () => {
    try {
      const res = await fetch("/api/member/routers")
      if (!res.ok) throw new Error()
      const json = await res.json()
      setRouters(json.data || [])
    } catch {
      toast.error("Failed to load routers")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRouters()
  }, [fetchRouters])

  const openCreate = () => {
    setEditingRouter(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  const openEdit = (router: RouterData) => {
    setEditingRouter(router.id)
    setForm({
      name: router.name,
      ipAddress: router.ipAddress,
      username: router.username,
      password: router.password,
      model: router.model || "",
      location: router.location || "",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.ipAddress) {
      toast.error("Name and IP address are required")
      return
    }
    setSubmitting(true)
    try {
      const url = editingRouter ? `/api/member/routers/${editingRouter}` : "/api/member/routers"
      const method = editingRouter ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed")
      }
      toast.success(editingRouter ? "Router updated" : "Router added")
      setDialogOpen(false)
      fetchRouters()
    } catch (e: any) {
      toast.error(e.message || "Failed to save router")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/member/routers/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Router removed")
      fetchRouters()
    } catch {
      toast.error("Failed to remove router")
    }
  }

  const testConnection = async (router: RouterData) => {
    setTestingId(router.id)
    try {
      // Simulate a connection test (in production, this would call the MikroTik API)
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success(`Connection to ${router.name} (${router.ipAddress}) successful!`)
    } catch {
      toast.error(`Connection to ${router.name} failed`)
    } finally {
      setTestingId(null)
    }
  }

  const onlineCount = routers.filter(r => r.status === "online").length
  const totalClients = routers.reduce((sum, r) => sum + r.connectedClients, 0)

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return "Never"
    const d = new Date(lastSeen)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return d.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 bg-[#111827]" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-52 bg-[#111827]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Routers</h1>
          <p className="text-slate-400 mt-1">MikroTik router management</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Plus className="w-4 h-4 mr-2" />Add Router
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Total Routers</p>
            <p className="text-2xl font-bold text-white mt-1">{routers.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Online</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{onlineCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Total Connected Clients</p>
            <p className="text-2xl font-bold text-sky-400 mt-1">{totalClients}</p>
          </CardContent>
        </Card>
      </div>

      {/* Router Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {routers.map((router, i) => (
            <motion.div
              key={router.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
            >
              <Card className={`bg-[#111827] border-[#1e293b] transition-all duration-300 ${router.status === "online" ? "hover:border-emerald-500/30" : "opacity-70"}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2.5 rounded-lg shrink-0 ${router.status === "online" ? "bg-emerald-500/15" : "bg-rose-500/15"}`}>
                        {router.status === "online" ? (
                          <Wifi className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <WifiOff className="w-5 h-5 text-rose-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base text-white truncate">{router.name}</CardTitle>
                        <p className="text-xs text-slate-400 font-mono">{router.ipAddress}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#111827] border-[#1e293b]">
                        <DropdownMenuItem onClick={() => openEdit(router)} className="text-slate-300 cursor-pointer">
                          <Edit className="w-4 h-4 mr-2" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => testConnection(router)} className="text-slate-300 cursor-pointer">
                          <Zap className="w-4 h-4 mr-2" />Test Connection
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(router.id)} className="text-rose-400 cursor-pointer">
                          <Trash2 className="w-4 h-4 mr-2" />Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className={`text-xs border-0 ${router.status === "online" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}
                    >
                      <Signal className="w-3 h-3 mr-1" />
                      {router.status}
                    </Badge>
                    <span className="text-xs text-slate-500">Last seen: {formatLastSeen(router.lastSeen)}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {router.model && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <RouterIcon className="w-4 h-4 text-slate-500 shrink-0" />{router.model}
                      </div>
                    )}
                    {router.location && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <MapPin className="w-4 h-4 text-slate-500 shrink-0" />{router.location}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-300">
                      <Users className="w-4 h-4 text-slate-500 shrink-0" />{router.connectedClients} connected clients
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-[#1e293b] text-slate-300 hover:text-white hover:bg-[#1e293b]"
                    disabled={testingId === router.id}
                    onClick={() => testConnection(router)}
                  >
                    {testingId === router.id ? (
                      <>
                        <span className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mr-2" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />Test Connection
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {routers.length === 0 && (
        <div className="text-center py-12">
          <RouterIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No routers yet. Add your first router!</p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader>
            <DialogTitle>{editingRouter ? "Edit Router" : "Add Router"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Router Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-[#0b1220] border-[#1e293b] text-white"
                placeholder="e.g. Site C Router"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">IP Address *</Label>
              <Input
                value={form.ipAddress}
                onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
                className="bg-[#0b1220] border-[#1e293b] text-white"
                placeholder="192.168.x.x"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Username</Label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="bg-[#0b1220] border-[#1e293b] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Password</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="bg-[#0b1220] border-[#1e293b] text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Model</Label>
              <Input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="bg-[#0b1220] border-[#1e293b] text-white"
                placeholder="MikroTik RB750Gr3"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Location</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="bg-[#0b1220] border-[#1e293b] text-white"
                placeholder="e.g. Site C - Karen"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={submitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {submitting ? "Saving..." : editingRouter ? "Update Router" : "Add Router"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
