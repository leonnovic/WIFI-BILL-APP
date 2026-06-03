"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, UserPlus, MoreHorizontal, Pencil, Trash2, Ban } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string; name: string | null; email: string; role: string; status: string; phone: string | null; businessName: string | null; createdAt: string; _count: { clients: number }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "CLIENT", phone: "", businessName: "", status: "ACTIVE" })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page)); params.set("limit", "20")
      if (search) params.set("search", search)
      if (roleFilter && roleFilter !== "ALL") params.set("role", roleFilter)
      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) { const json = await res.json(); setUsers(json.users); setTotal(json.total) }
    } catch (error) { console.error("Failed to fetch users:", error) }
    finally { setLoading(false) }
  }, [page, search, roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  function openCreateDialog() { setEditUser(null); setForm({ name: "", email: "", password: "", role: "CLIENT", phone: "", businessName: "", status: "ACTIVE" }); setDialogOpen(true) }
  function openEditDialog(user: User) { setEditUser(user); setForm({ name: user.name || "", email: user.email, password: "", role: user.role, phone: user.phone || "", businessName: user.businessName || "", status: user.status }); setDialogOpen(true) }

  async function handleSubmit() {
    try {
      if (editUser) {
        const res = await fetch(`/api/admin/users/${editUser.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        if (res.ok) { toast.success("User updated"); setDialogOpen(false); fetchUsers() } else { const json = await res.json(); toast.error(json.error || "Failed to update") }
      } else {
        const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        if (res.ok) { toast.success("User created"); setDialogOpen(false); fetchUsers() } else { const json = await res.json(); toast.error(json.error || "Failed to create") }
      }
    } catch { toast.error("Something went wrong") }
  }

  async function deleteUser(id: string) { if (!confirm("Delete this user?")) return; try { const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" }); if (res.ok) { toast.success("User deleted"); fetchUsers() } } catch { toast.error("Failed to delete") } }
  async function toggleStatus(user: User) { const ns = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"; try { const res = await fetch(`/api/admin/users/${user.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: ns }) }); if (res.ok) { toast.success(`User ${ns === "ACTIVE" ? "activated" : "deactivated"}`); fetchUsers() } } catch { toast.error("Failed to update status") } }

  const totalPages = Math.ceil(total / 20)
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">Users</h1><p className="text-slate-400 text-sm">Manage all platform users</p></div>
        <Button onClick={openCreateDialog} className="bg-emerald-500 hover:bg-emerald-600 text-white"><UserPlus className="w-4 h-4 mr-2" />Add User</Button>
      </div>
      <Card className="bg-[#111827] border-[#1e293b]"><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9 bg-[#0b1220] border-[#1e293b] text-white placeholder:text-slate-500" /></div>
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}><SelectTrigger className="w-full sm:w-40 bg-[#0b1220] border-[#1e293b] text-white"><SelectValue placeholder="All Roles" /></SelectTrigger><SelectContent className="bg-[#111827] border-[#1e293b]"><SelectItem value="ALL">All Roles</SelectItem><SelectItem value="ADMIN">Admin</SelectItem><SelectItem value="MEMBER">ISP Member</SelectItem><SelectItem value="CLIENT">Client</SelectItem></SelectContent></Select>
        </div>
      </CardContent></Card>
      <Card className="bg-[#111827] border-[#1e293b]"><CardContent className="p-0">
        <div className="overflow-x-auto"><Table><TableHeader><TableRow className="border-[#1e293b] hover:bg-transparent"><TableHead className="text-slate-400">Name</TableHead><TableHead className="text-slate-400">Email</TableHead><TableHead className="text-slate-400">Role</TableHead><TableHead className="text-slate-400">Status</TableHead><TableHead className="text-slate-400">Created</TableHead><TableHead className="text-slate-400 text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {loading ? [...Array(5)].map((_, i) => <TableRow key={i} className="border-[#1e293b]">{[...Array(6)].map((_, j) => <TableCell key={j} className="animate-pulse"><div className="h-4 bg-[#1e293b] rounded w-24" /></TableCell>)}</TableRow>)
          : users.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No users found</TableCell></TableRow>
          : users.map((user) => (
            <TableRow key={user.id} className="border-[#1e293b] hover:bg-[#0b1220]/50">
              <TableCell className="font-medium text-white">{user.name || "—"}</TableCell>
              <TableCell className="text-slate-300">{user.email}</TableCell>
              <TableCell><Badge variant="outline" className={user.role === "ADMIN" ? "border-red-500/30 text-red-400" : user.role === "MEMBER" ? "border-blue-500/30 text-blue-400" : "border-slate-500/30 text-slate-400"}>{user.role}</Badge></TableCell>
              <TableCell><Badge variant="outline" className={user.status === "ACTIVE" ? "border-emerald-500/30 text-emerald-400" : user.status === "PENDING" ? "border-amber-500/30 text-amber-400" : "border-red-500/30 text-red-400"}>{user.status}</Badge></TableCell>
              <TableCell className="text-slate-400 text-sm">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
              <TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger><DropdownMenuContent className="bg-[#111827] border-[#1e293b]"><DropdownMenuItem onClick={() => openEditDialog(user)} className="text-slate-300 focus:bg-[#1e293b] focus:text-white"><Pencil className="w-4 h-4 mr-2" />Edit</DropdownMenuItem><DropdownMenuItem onClick={() => toggleStatus(user)} className="text-slate-300 focus:bg-[#1e293b] focus:text-white"><Ban className="w-4 h-4 mr-2" />{user.status === "ACTIVE" ? "Deactivate" : "Activate"}</DropdownMenuItem><DropdownMenuItem onClick={() => deleteUser(user.id)} className="text-red-400 focus:bg-[#1e293b] focus:text-red-400"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
            </TableRow>
          ))}
        </TableBody></Table></div>
        {totalPages > 1 && <div className="flex items-center justify-between p-4 border-t border-[#1e293b]"><p className="text-sm text-slate-400">Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="border-[#1e293b] text-slate-300">Previous</Button><Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="border-[#1e293b] text-slate-300">Next</Button></div></div>}
      </CardContent></Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="bg-[#111827] border-[#1e293b] text-white max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editUser ? "Edit User" : "Add User"}</DialogTitle><DialogDescription className="text-slate-400">{editUser ? "Update user details" : "Create a new user account"}</DialogDescription></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="Full name" /></div>
          <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Email</label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="email@example.com" type="email" /></div>
          {!editUser && <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Password</label><Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="Password" type="password" /></div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Role</label><Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}><SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-[#111827] border-[#1e293b]"><SelectItem value="ADMIN">Admin</SelectItem><SelectItem value="MEMBER">ISP Member</SelectItem><SelectItem value="CLIENT">Client</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Status</label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-[#111827] border-[#1e293b]"><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem><SelectItem value="SUSPENDED">Suspended</SelectItem><SelectItem value="PENDING">Pending</SelectItem></SelectContent></Select></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Phone</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="+2547XXXXXXXX" /></div>
          {form.role === "MEMBER" && <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Business Name</label><Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)} className="border-[#1e293b] text-slate-300">Cancel</Button><Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600 text-white">{editUser ? "Update" : "Create"}</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  )
}
