"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Package as PackageIcon, Plus, Edit, Trash2, MoreHorizontal,
  ArrowDown, ArrowUp, Database, Clock, Users, Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface PackageData {
  id: string
  name: string
  description: string | null
  speedDown: number
  speedUp: number
  speed: string
  dataLimitMB: number
  dataLimit: string | null
  price: number
  duration: number
  durationStr: string
  type: string
  isActive: boolean
  createdAt: string
  _count?: { subscribers: number; transactions: number }
}

const defaultForm = {
  name: "",
  description: "",
  speedDown: "10",
  speedUp: "5",
  dataLimitMB: "0",
  dataLimit: "Unlimited",
  price: "1000",
  duration: "30",
  durationStr: "30 days",
  type: "standard",
}

export default function MemberPackagesPage() {
  const [packages, setPackages] = useState<PackageData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPkg, setEditingPkg] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch("/api/member/packages")
      if (!res.ok) throw new Error()
      const json = await res.json()
      setPackages(json.data || [])
    } catch {
      toast.error("Failed to load packages")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  const openCreate = () => {
    setEditingPkg(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  const openEdit = (pkg: PackageData) => {
    setEditingPkg(pkg.id)
    setForm({
      name: pkg.name,
      description: pkg.description || "",
      speedDown: String(pkg.speedDown),
      speedUp: String(pkg.speedUp),
      dataLimitMB: String(pkg.dataLimitMB),
      dataLimit: pkg.dataLimit || "Unlimited",
      price: String(pkg.price),
      duration: String(pkg.duration),
      durationStr: pkg.durationStr,
      type: pkg.type,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error("Name and price are required")
      return
    }
    setSubmitting(true)
    try {
      const url = editingPkg ? `/api/member/packages/${editingPkg}` : "/api/member/packages"
      const method = editingPkg ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed")
      }
      toast.success(editingPkg ? "Package updated" : "Package created")
      setDialogOpen(false)
      fetchPackages()
    } catch (e: any) {
      toast.error(e.message || "Failed to save package")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/member/packages/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed")
      }
      toast.success("Package deleted")
      fetchPackages()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const togglePackage = async (pkg: PackageData) => {
    try {
      const res = await fetch(`/api/member/packages/${pkg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !pkg.isActive }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Package ${pkg.isActive ? "disabled" : "enabled"}`)
      fetchPackages()
    } catch {
      toast.error("Failed to update package")
    }
  }

  const durationLabel = (d: number) =>
    d === 1 ? "day" : d === 7 ? "week" : d === 30 ? "month" : `${d} days`

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 bg-[#111827]" />
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
          <h1 className="text-2xl font-bold text-white">Packages</h1>
          <p className="text-slate-400 mt-1">{packages.length} packages configured</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Package
        </Button>
      </div>

      {/* Package Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
            >
              <Card className={`bg-[#111827] border-[#1e293b] transition-all duration-300 ${pkg.isActive ? "hover:border-emerald-500/30" : "opacity-60"}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg text-white">{pkg.name}</CardTitle>
                      <Badge variant="secondary" className={`text-[10px] border-0 ${
                        pkg.type === "premium" ? "bg-amber-500/15 text-amber-400" :
                        pkg.type === "okoa" ? "bg-violet-500/15 text-violet-400" :
                        "bg-emerald-500/15 text-emerald-400"
                      }`}>
                        {pkg.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={pkg.isActive} onCheckedChange={() => togglePackage(pkg)} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#111827] border-[#1e293b]">
                          <DropdownMenuItem onClick={() => openEdit(pkg)} className="text-slate-300 cursor-pointer">
                            <Edit className="w-4 h-4 mr-2" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(pkg.id)} className="text-rose-400 cursor-pointer">
                            <Trash2 className="w-4 h-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {pkg.description && <p className="text-sm text-slate-400">{pkg.description}</p>}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold text-emerald-400">
                    KES {pkg.price.toLocaleString()}
                    <span className="text-sm font-normal text-slate-400">/{durationLabel(pkg.duration)}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <ArrowDown className="w-4 h-4 text-emerald-500" />{pkg.speedDown} Mbps Download
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <ArrowUp className="w-4 h-4 text-sky-500" />{pkg.speedUp} Mbps Upload
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Database className="w-4 h-4 text-amber-500" />
                      {pkg.dataLimitMB === 0 ? "Unlimited" : `${(pkg.dataLimitMB / 1000).toFixed(0)} GB`} Data
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Clock className="w-4 h-4 text-violet-500" />{pkg.duration} {pkg.duration === 1 ? "Day" : "Days"}
                    </div>
                    {pkg._count && (
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Users className="w-4 h-4 text-teal-500" />{pkg._count.subscribers} subscriber{pkg._count.subscribers !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs border-0 ${pkg.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"}`}
                  >
                    {pkg.isActive ? "Active" : "Disabled"}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {packages.length === 0 && (
        <div className="text-center py-12">
          <PackageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No packages yet. Create your first package!</p>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader>
            <DialogTitle>{editingPkg ? "Edit Package" : "Create Package"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Package Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-[#0b1220] border-[#1e293b] text-white"
                placeholder="e.g. Premium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-[#0b1220] border-[#1e293b] text-white"
                placeholder="Brief description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Download (Mbps)</Label>
                <Input
                  type="number"
                  value={form.speedDown}
                  onChange={(e) => setForm({ ...form, speedDown: e.target.value })}
                  className="bg-[#0b1220] border-[#1e293b] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Upload (Mbps)</Label>
                <Input
                  type="number"
                  value={form.speedUp}
                  onChange={(e) => setForm({ ...form, speedUp: e.target.value })}
                  className="bg-[#0b1220] border-[#1e293b] text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Data Limit (MB, 0=Unlimited)</Label>
                <Input
                  type="number"
                  value={form.dataLimitMB}
                  onChange={(e) => setForm({ ...form, dataLimitMB: e.target.value })}
                  className="bg-[#0b1220] border-[#1e293b] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Duration (Days)</Label>
                <Input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="bg-[#0b1220] border-[#1e293b] text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Price (KES) *</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="bg-[#0b1220] border-[#1e293b] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Type</Label>
                <Input
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="bg-[#0b1220] border-[#1e293b] text-white"
                  placeholder="standard / premium / okoa"
                />
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={submitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {submitting ? "Saving..." : editingPkg ? "Update Package" : "Create Package"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
