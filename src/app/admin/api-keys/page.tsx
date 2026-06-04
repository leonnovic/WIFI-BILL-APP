"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, MoreHorizontal, Copy, Trash2, Key as KeyIcon, Shield, Clock } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface ApiKeyData {
  id: string
  name: string
  key: string
  permissions: string
  lastUsed: string | null
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  user: { id: string; name: string | null; email: string }
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [newKeyResult, setNewKeyResult] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", permissions: "read" })

  useEffect(() => { fetchApiKeys() }, [])

  async function fetchApiKeys() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/api-keys")
      if (res.ok) {
        const json = await res.json()
        setApiKeys(json.data || [])
      }
    } catch (error) { console.error("Failed to fetch API keys:", error) }
    finally { setLoading(false) }
  }

  async function handleCreate() {
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const json = await res.json()
        setNewKeyResult(json.rawKey)
        setCreateOpen(false)
        setForm({ name: "", permissions: "read" })
        toast.success("API key created")
        fetchApiKeys()
      } else { toast.error("Failed to create API key") }
    } catch { toast.error("Something went wrong") }
  }

  async function revokeKey(id: string) {
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: false }) })
      if (res.ok) { toast.success("API key revoked"); fetchApiKeys() }
    } catch { toast.error("Failed to revoke key") }
  }

  async function deleteKey(id: string) {
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("API key deleted"); fetchApiKeys() }
    } catch { toast.error("Failed to delete key") }
    setDeleteId(null)
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key)
    toast.success("Copied to clipboard")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <KeyIcon className="w-6 h-6 text-yellow-400" /> API Keys
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage API keys and permissions</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20">
          <Plus className="w-4 h-4 mr-2" /> Create Key
        </Button>
      </div>

      {/* New key display */}
      <AnimatePresence>
        {newKeyResult && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="bg-emerald-500/10 border-emerald-500/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <KeyIcon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-400">New API Key Created</p>
                    <p className="text-xs text-slate-400 mb-2">Copy this key now — it won&apos;t be shown again.</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-[#0b1220] px-3 py-1.5 rounded-lg border border-[#1e293b] text-white font-mono flex-1 overflow-x-auto">{newKeyResult}</code>
                      <Button size="icon" variant="ghost" onClick={() => copyKey(newKeyResult)} className="text-emerald-400 hover:text-emerald-300 shrink-0"><Copy className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setNewKeyResult(null)} className="text-slate-400 hover:text-white shrink-0">✕</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Key List */}
      <div className="grid gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="bg-[#111827] border-[#1e293b]"><CardContent className="p-6"><Skeleton className="h-20 bg-[#1e293b]" /></CardContent></Card>
          ))
        ) : apiKeys.length === 0 ? (
          <Card className="bg-[#111827] border-[#1e293b]">
            <CardContent className="p-12 text-center">
              <KeyIcon className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400">No API keys created yet</p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {apiKeys.map((apiKey, index) => (
              <motion.div key={apiKey.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className={`bg-[#111827] border-[#1e293b] hover:border-[#334155] transition-all duration-300 ${!apiKey.isActive ? "opacity-60" : ""}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                          <KeyIcon className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{apiKey.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs text-slate-400 font-mono bg-[#0b1220] px-2 py-0.5 rounded">{apiKey.key}</code>
                            <Badge variant="outline" className="border-slate-600 text-slate-400 text-[10px]">{apiKey.permissions}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${apiKey.isActive ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-red-500/30 text-red-400 bg-red-500/10"}`}>
                            {apiKey.isActive ? "Active" : "Revoked"}
                          </span>
                          <div className="flex items-center gap-1 mt-1 justify-end">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <p className="text-xs text-slate-500">{apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString() : "Never used"}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#111827] border-[#1e293b]" align="end">
                            <DropdownMenuItem onClick={() => copyKey(apiKey.key)} className="text-slate-300 focus:bg-[#1e293b] focus:text-white"><Copy className="w-4 h-4 mr-2" /> Copy Key</DropdownMenuItem>
                            {apiKey.isActive && (
                              <DropdownMenuItem onClick={() => revokeKey(apiKey.id)} className="text-amber-400 focus:bg-[#1e293b] focus:text-amber-400"><Shield className="w-4 h-4 mr-2" /> Revoke</DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setDeleteId(apiKey.id)} className="text-red-400 focus:bg-[#1e293b] focus:text-red-400"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyIcon className="w-5 h-5 text-yellow-400" /> Create API Key</DialogTitle>
            <DialogDescription className="text-slate-400">Generate a new API key for platform access</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white focus:border-emerald-500/50" placeholder="e.g. Production Key" /></div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Permissions</label>
              <Select value={form.permissions} onValueChange={(v) => setForm({ ...form, permissions: v })}>
                <SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#111827] border-[#1e293b]">
                  <SelectItem value="read">Read Only</SelectItem>
                  <SelectItem value="read,write">Read & Write</SelectItem>
                  <SelectItem value="read,write,admin">Full Access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="border-[#1e293b] text-slate-300">Cancel</Button>
            <Button onClick={handleCreate} className="bg-emerald-500 hover:bg-emerald-600 text-white" disabled={!form.name}>Create Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">This will permanently delete this API key. Any integrations using it will stop working.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1e293b] text-slate-300 bg-transparent hover:bg-[#1e293b]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteKey(deleteId)} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
