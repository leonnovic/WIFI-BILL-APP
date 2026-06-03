"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Users, Search, Plus, Wifi, WifiOff, CreditCard, Mail, Phone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

interface Client {
  id: string
  name: string | null
  email: string
  phone: string | null
  status: string
  okoaBalance: number
  okoaLimit: number
  okoaUsed: number
  connectionStatus: string
  activePackageId: string | null
  dataUsed: number
  dataLimit: number
  packageExpiry: string | null
  createdAt: string
}

const fadeIn = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }

export default function MemberClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", email: "", phone: "", okoaLimit: "200", password: "" })
  const [creating, setCreating] = useState(false)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/member/clients")
      if (res.ok) {
        const json = await res.json()
        setClients(Array.isArray(json) ? json : [])
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error)
      toast.error("Failed to load clients")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddClient = async () => {
    if (!form.name || !form.email) {
      toast.error("Name and email are required")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/member/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, okoaLimit: parseFloat(form.okoaLimit) || 200, password: form.password || undefined }),
      })
      if (res.ok) {
        toast.success("Client added successfully")
        setDialogOpen(false)
        setForm({ name: "", email: "", phone: "", okoaLimit: "200", password: "" })
        fetchClients()
      } else {
        const json = await res.json()
        toast.error(json.error || "Failed to add client")
      }
    } catch {
      toast.error("Failed to add client")
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateStatus = async (clientId: string, status: string) => {
    try {
      const res = await fetch(`/api/member/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success(`Client ${status === "active" ? "activated" : "suspended"}`)
        fetchClients()
      } else {
        toast.error("Failed to update client")
      }
    } catch {
      toast.error("Failed to update client")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
        <div className="h-10 bg-[#1e293b] rounded animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse">
            <CardContent className="p-4"><div className="h-16 bg-[#1e293b] rounded" /></CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-slate-400 mt-1">{clients.length} total clients</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Plus className="w-4 h-4 mr-2" />Add Client
        </Button>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients..."
          className="pl-10 bg-[#111827] border-[#1e293b] text-white placeholder:text-slate-500"
        />
      </div>

      <motion.div variants={{ animate: { transition: { staggerChildren: 0.05 } } }} initial="initial" animate="animate" className="space-y-3">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No clients found</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <motion.div key={client.id} variants={fadeIn}>
              <Card
                className="bg-[#111827] border-[#1e293b] hover:border-emerald-500/30 transition-colors cursor-pointer"
                onClick={() => setSelectedClient(selectedClient === client.id ? null : client.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-sm">
                        {client.name?.split(" ").map(n => n[0]).join("") || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{client.name || "—"}</p>
                        {client.connectionStatus === "connected" ? (
                          <Wifi className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <WifiOff className="w-3 h-3 text-slate-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />{client.email}
                        </span>
                        {client.phone && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />{client.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className={`text-xs border-0 ${client.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                        {client.status}
                      </Badge>
                      {client.okoaBalance > 0 && (
                        <Badge variant="secondary" className="text-xs bg-amber-500/15 text-amber-400 border-0 flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />KES {client.okoaBalance}
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#111827] border-[#1e293b]">
                          <DropdownMenuItem className="text-slate-300 focus:bg-[#1e293b] focus:text-white">View Details</DropdownMenuItem>
                          {client.status === "active" ? (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(client.id, "suspended")} className="text-red-400 focus:bg-[#1e293b]">Suspend</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(client.id, "active")} className="text-emerald-400 focus:bg-[#1e293b]">Activate</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {selectedClient === client.id && (
                    <div className="mt-4 pt-4 border-t border-[#1e293b] grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-400">Active Package</p>
                        <p className="text-sm text-white mt-0.5">{client.activePackageId ? "Yes" : "None"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Data Usage</p>
                        <p className="text-sm text-white mt-0.5">
                          {client.dataLimit > 0 ? `${(client.dataUsed / 1024).toFixed(1)}GB / ${(client.dataLimit / 1024).toFixed(1)}GB` : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">OKOA Balance</p>
                        <p className="text-sm text-amber-400 mt-0.5">KES {client.okoaBalance}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">OKOA Limit</p>
                        <p className="text-sm text-white mt-0.5">KES {client.okoaLimit}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription className="text-slate-400">Create a new client account under your ISP</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Full Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="Enter client name" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="client@example.com" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="+2547XXXXXXXX" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Password</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="client123" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">OKOA Limit (KES)</Label>
                <Input type="number" value={form.okoaLimit} onChange={(e) => setForm({ ...form, okoaLimit: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-[#1e293b] text-slate-300">Cancel</Button>
            <Button onClick={handleAddClient} disabled={creating} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              {creating ? "Adding..." : "Add Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
