"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Users, Search, Plus, Wifi, WifiOff, CreditCard, Mail, Phone,
  Eye, Edit, Trash2, X, UserPlus,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface ClientData {
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
  activePackage: { id: string; name: string; price: number; speed: string } | null
}

export default function MemberClientsPage() {
  const [clients, setClients] = useState<ClientData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null)
  const [form, setForm] = useState({ name: "", email: "", phone: "", okoaLimit: "500", password: "" })
  const [submitting, setSubmitting] = useState(false)

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/member/clients")
      if (!res.ok) throw new Error()
      const json = await res.json()
      setClients(json.data || [])
    } catch {
      toast.error("Failed to load clients")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const filteredClients = clients.filter(
    c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  )

  const handleAddClient = async () => {
    if (!form.email) {
      toast.error("Email is required")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/member/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          okoaLimit: parseFloat(form.okoaLimit),
          password: form.password || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed")
      }
      toast.success("Client added successfully")
      setAddDialogOpen(false)
      setForm({ name: "", email: "", phone: "", okoaLimit: "500", password: "" })
      fetchClients()
    } catch (e: any) {
      toast.error(e.message || "Failed to add client")
    } finally {
      setSubmitting(false)
    }
  }

  const viewClientDetails = async (client: ClientData) => {
    try {
      const res = await fetch(`/api/member/clients/${client.id}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setSelectedClient(json.data)
      setDetailDialogOpen(true)
    } catch {
      toast.error("Failed to load client details")
    }
  }

  const activeCount = clients.filter(c => c.status === "active").length
  const connectedCount = clients.filter(c => c.connectionStatus === "connected").length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full bg-[#111827]" />
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
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-slate-400 mt-1">{clients.length} total clients &middot; {activeCount} active &middot; {connectedCount} connected</p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="pl-10 bg-[#111827] border-[#1e293b] text-white"
        />
      </div>

      {/* Client List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredClients.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
            >
              <Card className="bg-[#111827] border-[#1e293b] hover:border-emerald-500/30 transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-sm">
                        {client.name?.split(" ").map(n => n[0]).join("") || "?"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{client.name || "Unnamed"}</p>
                        {client.connectionStatus === "connected" ? (
                          <Wifi className="w-3 h-3 text-emerald-500 shrink-0" />
                        ) : (
                          <WifiOff className="w-3 h-3 text-slate-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-400 flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 shrink-0" />{client.email}
                        </span>
                        {client.phone && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 shrink-0" />{client.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {client.activePackage && (
                        <Badge variant="secondary" className="text-xs border-0 bg-emerald-500/15 text-emerald-400">
                          {client.activePackage.name}
                        </Badge>
                      )}
                      <Badge
                        variant="secondary"
                        className={`text-xs border-0 ${
                          client.status === "active"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : client.status === "suspended"
                            ? "bg-rose-500/15 text-rose-400"
                            : "bg-slate-500/15 text-slate-400"
                        }`}
                      >
                        {client.status}
                      </Badge>
                      {client.okoaBalance > 0 && (
                        <Badge variant="secondary" className="text-xs bg-amber-500/15 text-amber-400 border-0 flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />KES {client.okoaBalance.toLocaleString()}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-white"
                        onClick={() => viewClientDetails(client)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">
              {search ? "No clients match your search" : "No clients yet. Add your first client!"}
            </p>
          </div>
        )}
      </div>

      {/* Add Client Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-[#0b1220] border-[#1e293b] text-white"
                placeholder="Enter client name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-[#0b1220] border-[#1e293b] text-white"
                placeholder="client@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-[#0b1220] border-[#1e293b] text-white"
                  placeholder="+2547XXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Password</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="bg-[#0b1220] border-[#1e293b] text-white"
                  placeholder="Default: client123"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">OKOA Credit Limit (KES)</Label>
              <Input
                type="number"
                value={form.okoaLimit}
                onChange={(e) => setForm({ ...form, okoaLimit: e.target.value })}
                className="bg-[#0b1220] border-[#1e293b] text-white"
              />
            </div>
            <Button
              onClick={handleAddClient}
              disabled={submitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {submitting ? "Adding..." : "Add Client"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs">
                  {selectedClient?.name?.split(" ").map(n => n[0]).join("") || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p>{selectedClient?.name || "Unnamed"}</p>
                <p className="text-xs text-slate-400 font-normal">{selectedClient?.email}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0b1220] rounded-lg p-3">
                  <p className="text-xs text-slate-400">Status</p>
                  <Badge variant="secondary" className={`text-xs border-0 mt-1 ${selectedClient.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
                    {selectedClient.status}
                  </Badge>
                </div>
                <div className="bg-[#0b1220] rounded-lg p-3">
                  <p className="text-xs text-slate-400">Connection</p>
                  <Badge variant="secondary" className={`text-xs border-0 mt-1 ${selectedClient.connectionStatus === "connected" ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"}`}>
                    {selectedClient.connectionStatus}
                  </Badge>
                </div>
                <div className="bg-[#0b1220] rounded-lg p-3">
                  <p className="text-xs text-slate-400">Active Package</p>
                  <p className="text-sm text-white mt-1">{selectedClient.activePackage?.name || "None"}</p>
                </div>
                <div className="bg-[#0b1220] rounded-lg p-3">
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="text-sm text-white mt-1">{selectedClient.phone || "N/A"}</p>
                </div>
              </div>

              {/* Data Usage */}
              <div className="bg-[#0b1220] rounded-lg p-3">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Data Usage</span>
                  <span className="text-white">
                    {selectedClient.dataLimit > 0
                      ? `${(selectedClient.dataUsed / 1024).toFixed(1)}GB / ${(selectedClient.dataLimit / 1024).toFixed(1)}GB`
                      : "Unlimited"}
                  </span>
                </div>
                {selectedClient.dataLimit > 0 && (
                  <Progress
                    value={(selectedClient.dataUsed / selectedClient.dataLimit) * 100}
                    className="h-2 bg-[#1e293b]"
                  />
                )}
              </div>

              {/* OKOA */}
              <div className="bg-[#0b1220] rounded-lg p-3">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">OKOA Balance</span>
                  <span className="text-amber-400">KES {selectedClient.okoaBalance.toLocaleString()} / KES {selectedClient.okoaLimit.toLocaleString()}</span>
                </div>
                <Progress
                  value={(selectedClient.okoaBalance / selectedClient.okoaLimit) * 100}
                  className="h-2 bg-[#1e293b]"
                />
                <p className="text-xs text-slate-500 mt-1">Total used: KES {selectedClient.okoaUsed.toLocaleString()}</p>
              </div>

              <div className="text-xs text-slate-500">
                Joined: {new Date(selectedClient.createdAt).toLocaleDateString()}
                {selectedClient.packageExpiry && (
                  <> &middot; Package expires: {new Date(selectedClient.packageExpiry).toLocaleDateString()}</>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
