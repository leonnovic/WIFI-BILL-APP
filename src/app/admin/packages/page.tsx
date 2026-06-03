"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Pencil, Trash2, Package as PackageIcon } from "lucide-react"
import { toast } from "sonner"

interface Pkg {
  id: string
  name: string
  description: string | null
  speed: string
  dataLimit: string | null
  price: number
  duration: string
  type: string
  isActive: boolean
  _count: { users: number }
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Pkg[]>([])
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editPkg, setEditPkg] = useState<Pkg | null>(null)
  const [form, setForm] = useState({
    name: "", description: "", speed: "", dataLimit: "", price: "", duration: "30 days", type: "RESIDENTIAL", isActive: true,
  })

  const fetchPackages = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter && typeFilter !== "ALL") params.set("type", typeFilter)
      const res = await fetch(`/api/admin/packages?${params}`)
      if (res.ok) {
        const json = await res.json()
        setPackages(json.packages)
      }
    } catch (error) {
      console.error("Failed to fetch packages:", error)
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  function openCreateDialog() {
    setEditPkg(null)
    setForm({ name: "", description: "", speed: "", dataLimit: "", price: "", duration: "30 days", type: "RESIDENTIAL", isActive: true })
    setDialogOpen(true)
  }

  function openEditDialog(pkg: Pkg) {
    setEditPkg(pkg)
    setForm({
      name: pkg.name,
      description: pkg.description || "",
      speed: pkg.speed,
      dataLimit: pkg.dataLimit || "",
      price: String(pkg.price),
      duration: pkg.duration,
      type: pkg.type,
      isActive: pkg.isActive,
    })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    try {
      if (editPkg) {
        const res = await fetch(`/api/admin/packages/${editPkg.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (res.ok) {
          toast.success("Package updated")
          setDialogOpen(false)
          fetchPackages()
        } else {
          toast.error("Failed to update package")
        }
      } else {
        const res = await fetch("/api/admin/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (res.ok) {
          toast.success("Package created")
          setDialogOpen(false)
          fetchPackages()
        } else {
          toast.error("Failed to create package")
        }
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  async function deletePackage(id: string) {
    if (!confirm("Are you sure you want to delete this package?")) return
    try {
      const res = await fetch(`/api/admin/packages/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Package deleted")
        fetchPackages()
      }
    } catch {
      toast.error("Failed to delete package")
    }
  }

  async function togglePackage(pkg: Pkg) {
    try {
      const res = await fetch(`/api/admin/packages/${pkg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !pkg.isActive }),
      })
      if (res.ok) {
        toast.success(`Package ${!pkg.isActive ? "enabled" : "disabled"}`)
        fetchPackages()
      }
    } catch {
      toast.error("Failed to toggle package")
    }
  }

  const typeColors: Record<string, string> = {
    RESIDENTIAL: "border-blue-500/30 text-blue-400",
    BUSINESS: "border-purple-500/30 text-purple-400",
    OKOA: "border-amber-500/30 text-amber-400",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Packages</h1>
          <p className="text-slate-400 text-sm">Manage internet packages and pricing</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Package
        </Button>
      </div>

      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-[#0b1220] border-[#1e293b] text-white">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-[#111827] border-[#1e293b]">
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="RESIDENTIAL">Residential</SelectItem>
              <SelectItem value="BUSINESS">Business</SelectItem>
              <SelectItem value="OKOA">OKOA</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse">
              <CardContent className="p-6"><div className="h-40 bg-[#1e293b] rounded" /></CardContent>
            </Card>
          ))
        ) : packages.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">No packages found</div>
        ) : (
          packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`bg-[#111827] border-[#1e293b] hover:border-[#334155] transition-colors ${!pkg.isActive ? "opacity-60" : ""}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <PackageIcon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-base">{pkg.name}</CardTitle>
                      <Badge variant="outline" className={typeColors[pkg.type] || "border-slate-500/30 text-slate-400 text-[10px] mt-1"}>
                        {pkg.type}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#111827] border-[#1e293b]">
                      <DropdownMenuItem onClick={() => openEditDialog(pkg)} className="text-slate-300 focus:bg-[#1e293b] focus:text-white">
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => togglePackage(pkg)} className="text-slate-300 focus:bg-[#1e293b] focus:text-white">
                        {pkg.isActive ? "Disable" : "Enable"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deletePackage(pkg.id)} className="text-red-400 focus:bg-[#1e293b] focus:text-red-400">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Speed</span>
                    <span className="text-white font-medium">{pkg.speed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Data</span>
                    <span className="text-white">{pkg.dataLimit || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Duration</span>
                    <span className="text-white">{pkg.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subscribers</span>
                    <span className="text-emerald-400 font-medium">{pkg._count.users}</span>
                  </div>
                  <div className="pt-2 border-t border-[#1e293b]">
                    <p className="text-2xl font-bold text-emerald-400">KES {pkg.price.toLocaleString()}</p>
                  </div>
                  {!pkg.isActive && (
                    <Badge variant="outline" className="border-red-500/30 text-red-400 w-full justify-center">Disabled</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader>
            <DialogTitle>{editPkg ? "Edit Package" : "Add Package"}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editPkg ? "Update package details" : "Create a new internet package"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Description</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Speed</label>
                <Input value={form.speed} onChange={(e) => setForm({ ...form, speed: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="10Mbps" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Data Limit</label>
                <Input value={form.dataLimit} onChange={(e) => setForm({ ...form, dataLimit: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="Unlimited" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Price (KES)</label>
                <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" type="number" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Duration</label>
                <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="30 days" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Type</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#1e293b]">
                    <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                    <SelectItem value="BUSINESS">Business</SelectItem>
                    <SelectItem value="OKOA">OKOA</SelectItem>
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
    </div>
  )
}
