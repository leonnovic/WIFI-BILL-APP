"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Copy, Trash2, Key as KeyIcon } from "lucide-react"
import { toast } from "sonner"

interface ApiKeyData {
  id: string
  name: string
  key: string
  permissions: string
  lastUsedAt: string | null
  isActive: boolean
  createdAt: string
  user: { name: string | null; email: string }
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [newKeyResult, setNewKeyResult] = useState<{ rawKey: string } | null>(null)
  const [form, setForm] = useState({ name: "", permissions: "read" })

  useEffect(() => {
    fetchApiKeys()
  }, [])

  async function fetchApiKeys() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/api-keys")
      if (res.ok) {
        const json = await res.json()
        setApiKeys(json.apiKeys)
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId: "admin" }),
      })
      if (res.ok) {
        const json = await res.json()
        setNewKeyResult({ rawKey: json.rawKey })
        setCreateOpen(false)
        setForm({ name: "", permissions: "read" })
        fetchApiKeys()
      } else {
        toast.error("Failed to create API key")
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  async function revokeKey(id: string) {
    if (!confirm("Revoke this API key?")) return
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      })
      if (res.ok) {
        toast.success("API key revoked")
        fetchApiKeys()
      }
    } catch {
      toast.error("Failed to revoke key")
    }
  }

  async function deleteKey(id: string) {
    if (!confirm("Delete this API key permanently?")) return
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("API key deleted")
        fetchApiKeys()
      }
    } catch {
      toast.error("Failed to delete key")
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key)
    toast.success("API key copied to clipboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">API Keys</h1>
          <p className="text-slate-400 text-sm">Manage API keys and permissions</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Key
        </Button>
      </div>

      {/* New key display */}
      {newKeyResult && (
        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <KeyIcon className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-400">New API Key Created</p>
                <p className="text-xs text-slate-400 mb-2">Copy this key now — it won&apos;t be shown again.</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-[#0b1220] px-3 py-1.5 rounded border border-[#1e293b] text-white font-mono flex-1 overflow-x-auto">
                    {newKeyResult.rawKey}
                  </code>
                  <Button size="icon" variant="ghost" onClick={() => copyKey(newKeyResult.rawKey)} className="text-emerald-400 hover:text-emerald-300">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setNewKeyResult(null)} className="text-slate-400 hover:text-white">✕</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse">
              <CardContent className="p-6"><div className="h-20 bg-[#1e293b] rounded" /></CardContent>
            </Card>
          ))
        ) : apiKeys.length === 0 ? (
          <Card className="bg-[#111827] border-[#1e293b]">
            <CardContent className="p-12 text-center text-slate-400">No API keys created yet</CardContent>
          </Card>
        ) : (
          apiKeys.map((apiKey) => (
            <Card key={apiKey.id} className={`bg-[#111827] border-[#1e293b] ${!apiKey.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <KeyIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{apiKey.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs text-slate-400 font-mono">{apiKey.key}</code>
                        <Badge variant="outline" className="border-slate-500/30 text-slate-400 text-[10px]">
                          {apiKey.permissions}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Badge variant="outline" className={apiKey.isActive ? "border-emerald-500/30 text-emerald-400" : "border-red-500/30 text-red-400"}>
                        {apiKey.isActive ? "Active" : "Revoked"}
                      </Badge>
                      <p className="text-xs text-slate-400 mt-1">
                        {apiKey.lastUsedAt ? `Last used ${new Date(apiKey.lastUsedAt).toLocaleDateString()}` : "Never used"}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#111827] border-[#1e293b]">
                        <DropdownMenuItem onClick={() => copyKey(apiKey.key)} className="text-slate-300 focus:bg-[#1e293b] focus:text-white">
                          <Copy className="w-4 h-4 mr-2" /> Copy Key
                        </DropdownMenuItem>
                        {apiKey.isActive && (
                          <DropdownMenuItem onClick={() => revokeKey(apiKey.id)} className="text-amber-400 focus:bg-[#1e293b] focus:text-amber-400">
                            Revoke
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => deleteKey(apiKey.id)} className="text-red-400 focus:bg-[#1e293b] focus:text-red-400">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription className="text-slate-400">Generate a new API key for platform access</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="e.g. Production Key" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Permissions</label>
              <Select value={form.permissions} onValueChange={(v) => setForm({ ...form, permissions: v })}>
                <SelectTrigger className="bg-[#0b1220] border-[#1e293b] text-white">
                  <SelectValue />
                </SelectTrigger>
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
    </div>
  )
}
