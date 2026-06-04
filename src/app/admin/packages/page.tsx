"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, MoreHorizontal, Pencil, Trash2, Package as PackageIcon, Zap, Clock, Users } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface Pkg {
  id: string
  name: string
  description: string | null
  speed: string
  dataLimit: string | null
  price: number
  duration: number
  durationStr: string
  type: string
  isActive: boolean
  ispId: string | null
  isp: { id: string; name: string | null; businessName: string | null } | null
  _count: { subscribers: number; transactions: number }
}

const typeColors: Record<string, string> = {
  standard: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10",
  premium: "border-purple-500/30 text-purple-400 bg-purple-500/10",
  okoa: "border-amber-500/30 text-amber-400 bg-amber-500/10",
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Pkg[]>([])
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editPkg, setEditPkg] = useState<Pkg | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "", description: "", speed: "", speedDown: "", speedUp: "", dataLimit: "", dataLimitMB: "", price: "", duration: "30", durationStr: "30 days", type: "standard", isActive: true,
  })

  const fetchPackages = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter && typeFilter !== "ALL") params.set("type", typeFilter)
      const res = await fetch(`/api/admin/packages?${params}`)
      if (res.ok) {
        const json = await res.json()
        setPackages(json.data || [])
      }
    } catch (error) { console.error("Failed to fetch packages:", error) }
    finally { setLoading(false) }
  }, [typeFilter])

  useEffect(() => { fetchPackages() }, [fetchPackages])

  function openCreateDialog() {
    setEditPkg(null)
    setForm({ name: "", description: "", speed: "", speedDown: "", speedUp: "", dataLimit: "", dataLimitMB: "", price: "", duration: "30", durationStr: "30 days", type: "standard", isActive: true })
    setDialogOpen(true)
  }

  function openEditDialog(pkg: Pkg) {
    setEditPkg(pkg)
    setForm({
      name: pkg.name, description: pkg.description || "", speed: pkg.speed, speedDown: "", speedUp: "",
      dataLimit: pkg.dataLimit || "", dataLimitMB: "", price: String(pkg.price),
      duration: String(pkg.duration), durationStr: pkg.durationStr, type: pkg.type, isActive: pkg.isActive,
    })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    try {
      if (editPkg) {
        const res = await fetch(`/api/admin/packages/${editPkg.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        if (res.ok) { toast.success("Package updated"); setDialogOpen(false); fetchPackages() }
        else { toast.error("Failed to update package") }
      } else {
        const res = await fetch("/api/admin/packages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        if (res.ok) { toast.success("Package created"); setDialogOpen(false); fetchPackages() }
        else { toast.error("Failed to create package") }
      }
    } catch { toast.error("Something went wrong") }
  }

  async function deletePackage(id: string) {
    try {
      const res = await fetch(`/api/admin/packages/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Package deleted"); fetchPackages() }
      else { const json = await res.json(); toast.error(json.error || "Failed to delete") }
    } catch { toast.error("Failed to delete package") }
    setDeleteId(null)
  }

  async function togglePackage(pkg: Pkg) {
    try {
      const res = await fetch(`/api/admin/packages/${pkg.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !pkg.isActive }) })
      if (res.ok) { toast.success(`Package ${!pkg.isActive ? "enabled" : "disabled"}`); fetchPackages() }
    } catch { toast.error("Failed to toggle package") }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <PackageIcon className="w-6 h-6 text-cyan-400" /> Packages
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage internet packages and pricing</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20">
          <Plus className="w-4 h-4 mr-2" /> Add Package
        </Button>
      </div>

      {/* Filter */}
      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-[#0b1220] border-[#1e293b] text-white"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent className="bg-[#111827] border-[#1e293b]">
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="okoa">OKOA</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Package Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="bg-[#111827] border-[#1e293b]">
              <CardContent className="p-6"><Skeleton className="h-40 bg-[#1e293b]" /></CardContent>
            </Card>
          ))
        ) : packages.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 gap-2">
            <PackageIcon className="w-10 h-10 text-slate-600" />
            <p className="text-slate-400">No packages found</p>
          </div>
        ) : (
          <AnimatePresence>
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`bg-[#111827] border-[#1e293b] hover:border-[#334155] transition-all duration-300 hover:shadow-lg hover:shadow-black/20 group ${!pkg.isActive ? "opacity-60" : ""}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${typeColors[pkg.type] || typeColors.standard}`}>
                          <PackageIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-white text-base">{pkg.name}</CardTitle>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border mt-1 ${typeColors[pkg.type] || typeColors.standard}`}>
                            {pkg.type}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#111827] border-[#1e293b]" align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(pkg)} className="text-slate-300 focus:bg-[#1e293b] focus:text-white"><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => togglePackage(pkg)} className="text-slate-300 focus:bg-[#1e293b] focus:text-white">{pkg.isActive ? "Disable" : "Enable"}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteId(pkg.id)} className="text-red-400 focus:bg-[#1e293b] focus:text-red-400"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Speed</span>
                        <span className="text-white font-medium">{pkg.speed}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Data</span>
                        <span className="text-white">{pkg.dataLimit || "—"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Duration</span>
                        <span className="text-white">{pkg.durationStr}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Subscribers</span>
                        <span className="text-emerald-400 font-semibold">{pkg._count.subscribers}</span>
                      </div>
                      {pkg.isp && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">ISP</span>
                          <span className="text-slate-300">{pkg.isp.businessName || pkg.isp.name}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-[#1e293b]">
                        <p className="text-2xl font-bold text-emerald-400">KES {pkg.price.toLocaleString()}</p>
                      </div>
                      {!pkg.isActive && (
                        <Badge variant="outline" className="border-red-500/30 text-red-400 w-full justify-center">Disabled</Badge>
                      )}
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
            <DialogTitle>{editPkg ? "Edit Package" : "Create Package"}</DialogTitle>
            <DialogDescription className="text-slate-400">{editPkg ? "Update package details" : "Create a new internet package"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Description</label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Speed</label><Input value={form.speed} onChange={(e) => setForm({ ...form, speed: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="10Mbps" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Data Limit</label><Input value={form.dataLimit} onChange={(e) => setForm({ ...form, dataLimit: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="Unlimited" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Price (KES)</label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" type="number" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Duration (days)</label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Type</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#1e293b]">
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="okoa">OKOA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex items-center gap-3 pt-6">
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                <label className="text-sm text-slate-300">Active</label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-[#1e293b] text-slate-300">Cancel</Button>
            <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600 text-white">{editPkg ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Package</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">This will permanently delete this package. Users subscribed to it will need to be reassigned.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1e293b] text-slate-300 bg-transparent hover:bg-[#1e293b]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deletePackage(deleteId)} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
