"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Package as PackageIcon, Plus, ArrowDown, ArrowUp, Database, Clock, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface Pkg {
  id: string
  name: string
  description: string | null
  speed: string
  speedDown: number
  speedUp: number
  dataLimit: string | null
  dataLimitMB: number
  price: number
  duration: number
  durationStr: string
  type: string
  isActive: boolean
  createdAt: string
}

const fadeIn = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }

export default function MemberPackagesPage() {
  const [packages, setPackages] = useState<Pkg[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editPkg, setEditPkg] = useState<Pkg | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "", description: "", speedDown: "10", speedUp: "5", dataLimitMB: "10000",
    price: "1000", duration: "30", type: "standard", speed: "10Mbps",
    dataLimit: "10GB", durationStr: "30 days",
  })

  const fetchPackages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/member/packages")
      if (res.ok) {
        const json = await res.json()
        setPackages(Array.isArray(json) ? json : [])
      }
    } catch {
      toast.error("Failed to load packages")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPackages() }, [fetchPackages])

  function openCreate() {
    setEditPkg(null)
    setForm({ name: "", description: "", speedDown: "10", speedUp: "5", dataLimitMB: "10000", price: "1000", duration: "30", type: "standard", speed: "10Mbps", dataLimit: "10GB", durationStr: "30 days" })
    setDialogOpen(true)
  }

  function openEdit(pkg: Pkg) {
    setEditPkg(pkg)
    setForm({
      name: pkg.name, description: pkg.description || "", speedDown: String(pkg.speedDown), speedUp: String(pkg.speedUp),
      dataLimitMB: String(pkg.dataLimitMB), price: String(pkg.price), duration: String(pkg.duration), type: pkg.type,
      speed: pkg.speed, dataLimit: pkg.dataLimit || "Unlimited", durationStr: pkg.durationStr,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.price) { toast.error("Name and price are required"); return }
    setSaving(true)
    try {
      const speedVal = `${form.speedDown}Mbps`
      const dataVal = parseFloat(form.dataLimitMB) === 0 ? "Unlimited" : `${(parseFloat(form.dataLimitMB) / 1024).toFixed(0)}GB`
      const durVal = parseInt(form.duration) === 1 ? "24 hours" : parseInt(form.duration) === 7 ? "7 days" : `${form.duration} days`

      const payload = {
        name: form.name,
        description: form.description,
        speedDown: parseFloat(form.speedDown),
        speedUp: parseFloat(form.speedUp),
        speed: speedVal,
        dataLimitMB: parseFloat(form.dataLimitMB),
        dataLimit: dataVal,
        price: parseFloat(form.price),
        duration: parseInt(form.duration),
        durationStr: durVal,
        type: form.type,
      }

      const url = editPkg ? `/api/member/packages/${editPkg.id}` : "/api/member/packages"
      const method = editPkg ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (res.ok) {
        toast.success(editPkg ? "Package updated" : "Package created")
        setDialogOpen(false)
        fetchPackages()
      } else {
        toast.error("Failed to save package")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this package?")) return
    try {
      const res = await fetch(`/api/member/packages/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Package deleted"); fetchPackages() }
    } catch { toast.error("Failed to delete") }
  }

  async function togglePackage(pkg: Pkg) {
    try {
      const res = await fetch(`/api/member/packages/${pkg.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !pkg.isActive }),
      })
      if (res.ok) { toast.success(`Package ${!pkg.isActive ? "enabled" : "disabled"}`); fetchPackages() }
    } catch { toast.error("Failed to toggle") }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-6"><div className="h-40 bg-[#1e293b] rounded" /></CardContent></Card>)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">Packages</h1><p className="text-slate-400 mt-1">{packages.length} packages configured</p></div>
        <Button onClick={openCreate} className="bg-emerald-500 hover:bg-emerald-600 text-white"><Plus className="w-4 h-4 mr-2" />Create Package</Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <PackageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No packages yet. Create your first package!</p>
          </div>
        ) : (
          packages.map((pkg) => (
            <motion.div key={pkg.id} {...fadeIn}>
              <Card className={`bg-[#111827] border-[#1e293b] transition-colors ${pkg.isActive ? "hover:border-emerald-500/30" : "opacity-60"}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-white">{pkg.name}</CardTitle>
                      <Badge variant="outline" className={
                        pkg.type === "standard" ? "border-cyan-500/30 text-cyan-400 text-[10px] mt-1" :
                        pkg.type === "premium" ? "border-purple-500/30 text-purple-400 text-[10px] mt-1" :
                        "border-amber-500/30 text-amber-400 text-[10px] mt-1"
                      }>{pkg.type}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={pkg.isActive} onCheckedChange={() => togglePackage(pkg)} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#111827] border-[#1e293b]">
                          <DropdownMenuItem onClick={() => openEdit(pkg)} className="text-slate-300 focus:bg-[#1e293b]"><Pencil className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(pkg.id)} className="text-red-400 focus:bg-[#1e293b]"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {pkg.description && <p className="text-sm text-slate-400 mt-1">{pkg.description}</p>}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold text-emerald-400">KES {pkg.price.toLocaleString()}<span className="text-sm font-normal text-slate-400">/{pkg.duration === 1 ? "day" : pkg.duration === 7 ? "week" : "month"}</span></div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-300"><ArrowDown className="w-4 h-4 text-emerald-500" />{pkg.speedDown} Mbps Download</div>
                    <div className="flex items-center gap-2 text-sm text-slate-300"><ArrowUp className="w-4 h-4 text-blue-500" />{pkg.speedUp} Mbps Upload</div>
                    <div className="flex items-center gap-2 text-sm text-slate-300"><Database className="w-4 h-4 text-amber-500" />{pkg.dataLimitMB === 0 ? "Unlimited" : `${(pkg.dataLimitMB / 1024).toFixed(0)} GB`} Data</div>
                    <div className="flex items-center gap-2 text-sm text-slate-300"><Clock className="w-4 h-4 text-purple-500" />{pkg.duration} {pkg.duration === 1 ? "Day" : "Days"}</div>
                  </div>
                  <Badge variant="secondary" className={`text-xs border-0 ${pkg.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"}`}>{pkg.isActive ? "Active" : "Disabled"}</Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader><DialogTitle>{editPkg ? "Edit Package" : "Create Package"}</DialogTitle><DialogDescription className="text-slate-400">{editPkg ? "Update package details" : "Create a new internet package"}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label className="text-slate-300">Package Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="e.g. Premium" /></div>
            <div className="space-y-2"><Label className="text-slate-300">Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="Brief description" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-slate-300">Download (Mbps)</Label><Input type="number" value={form.speedDown} onChange={(e) => setForm({ ...form, speedDown: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Upload (Mbps)</Label><Input type="number" value={form.speedUp} onChange={(e) => setForm({ ...form, speedUp: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-slate-300">Data Limit (MB, 0=Unlimited)</Label><Input type="number" value={form.dataLimitMB} onChange={(e) => setForm({ ...form, dataLimitMB: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Duration (Days)</Label><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-slate-300">Price (KES) *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Type</Label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full h-10 rounded-md bg-[#0b1220] border border-[#1e293b] text-white px-3 text-sm">
                  <option value="standard">Standard</option><option value="premium">Premium</option><option value="okoa">OKOA</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-[#1e293b] text-slate-300">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white">{saving ? "Saving..." : editPkg ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
