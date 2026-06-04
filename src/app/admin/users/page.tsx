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
import { Search, UserPlus, MoreHorizontal, Pencil, Trash2, Ban, ShieldCheck, Users as UsersIcon } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface User {
  id: string
  name: string | null
  email: string
  role: string
  status: string
  phone: string | null
  businessName: string | null
  createdAt: string
  avatar: string | null
  isActive: boolean
  _count: { clients: number; transactions: number; routers: number }
}

const roleColors: Record<string, string> = {
  admin: "border-rose-500/30 text-rose-400 bg-rose-500/10",
  member: "border-amber-500/30 text-amber-400 bg-amber-500/10",
  client: "border-slate-500/30 text-slate-400 bg-slate-500/10",
}

const statusColors: Record<string, string> = {
  active: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  inactive: "border-slate-500/30 text-slate-400 bg-slate-500/10",
  suspended: "border-red-500/30 text-red-400 bg-red-500/10",
  pending: "border-amber-500/30 text-amber-400 bg-amber-500/10",
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "client", phone: "", businessName: "", status: "active",
  })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "20")
      if (search) params.set("search", search)
      if (roleFilter && roleFilter !== "ALL") params.set("role", roleFilter)
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter)
      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const json = await res.json()
        setUsers(json.data || [])
        setTotal(json.total || 0)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter, statusFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  function openCreateDialog() {
    setEditUser(null)
    setForm({ name: "", email: "", password: "", role: "client", phone: "", businessName: "", status: "active" })
    setDialogOpen(true)
  }

  function openEditDialog(user: User) {
    setEditUser(user)
    setForm({ name: user.name || "", email: user.email, password: "", role: user.role, phone: user.phone || "", businessName: user.businessName || "", status: user.status })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    try {
      if (editUser) {
        const res = await fetch(`/api/admin/users/${editUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (res.ok) { toast.success("User updated successfully"); setDialogOpen(false); fetchUsers() }
        else { const json = await res.json(); toast.error(json.error || "Failed to update") }
      } else {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (res.ok) { toast.success("User created successfully"); setDialogOpen(false); fetchUsers() }
        else { const json = await res.json(); toast.error(json.error || "Failed to create") }
      }
    } catch { toast.error("Something went wrong") }
  }

  async function deleteUser(id: string) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("User deleted"); fetchUsers() }
      else { const json = await res.json(); toast.error(json.error || "Failed to delete") }
    } catch { toast.error("Failed to delete user") }
    setDeleteId(null)
  }

  async function toggleStatus(user: User) {
    const ns = user.status === "active" ? "suspended" : "active"
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: ns }),
      })
      if (res.ok) { toast.success(`User ${ns === "active" ? "activated" : "suspended"}`); fetchUsers() }
    } catch { toast.error("Failed to update status") }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-emerald-400" /> Users
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage all platform users and permissions</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20">
          <UserPlus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9 bg-[#0b1220] border-[#1e293b] text-white placeholder:text-slate-500 focus:border-emerald-500/50"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40 bg-[#0b1220] border-[#1e293b] text-white">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">ISP Member</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40 bg-[#0b1220] border-[#1e293b] text-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1e293b]">
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#1e293b] hover:bg-transparent">
                  <TableHead className="text-slate-400 font-medium">User</TableHead>
                  <TableHead className="text-slate-400 font-medium">Role</TableHead>
                  <TableHead className="text-slate-400 font-medium">Status</TableHead>
                  <TableHead className="text-slate-400 font-medium">Created</TableHead>
                  <TableHead className="text-slate-400 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-[#1e293b]">
                      {[...Array(5)].map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-24 bg-[#1e293b]" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <UsersIcon className="w-10 h-10 text-slate-600" />
                        <p className="text-slate-400">No users found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {users.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-[#1e293b] hover:bg-[#0b1220]/50 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center border border-emerald-500/20">
                              <span className="text-sm font-bold text-emerald-400">{(user.name || user.email).charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">{user.name || "—"}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${roleColors[user.role] || roleColors.client}`}>
                            {user.role === "admin" && <ShieldCheck className="w-3 h-3" />}
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[user.status] || statusColors.inactive}`}>
                            {user.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#111827] border-[#1e293b]" align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(user)} className="text-slate-300 focus:bg-[#1e293b] focus:text-white">
                                <Pencil className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatus(user)} className="text-slate-300 focus:bg-[#1e293b] focus:text-white">
                                <Ban className="w-4 h-4 mr-2" /> {user.status === "active" ? "Suspend" : "Activate"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeleteId(user.id)} className="text-red-400 focus:bg-[#1e293b] focus:text-red-400">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-[#1e293b]">
              <p className="text-sm text-slate-400">
                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="border-[#1e293b] text-slate-300">Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="border-[#1e293b] text-slate-300">Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editUser ? "Edit User" : "Create User"}</DialogTitle>
            <DialogDescription className="text-slate-400">{editUser ? "Update user account details" : "Create a new user account"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white focus:border-emerald-500/50" placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email</label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white focus:border-emerald-500/50" placeholder="email@example.com" type="email" />
            </div>
            {!editUser && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white focus:border-emerald-500/50" placeholder="Password" type="password" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Role</label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#1e293b]">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">ISP Member</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[#1e293b]">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Phone</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white focus:border-emerald-500/50" placeholder="+2547XXXXXXXX" />
            </div>
            {form.role === "member" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Business Name</label>
                <Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white focus:border-emerald-500/50" placeholder="Company name" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-[#1e293b] text-slate-300">Cancel</Button>
            <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600 text-white">{editUser ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone. This will permanently delete the user account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1e293b] text-slate-300 bg-transparent hover:bg-[#1e293b]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteUser(deleteId)} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
