"use client"

import { useState, useEffect } from "react"
import { User, Lock, Phone, Mail, Wifi, Save, Shield, Calendar, Signal, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { format } from "date-fns"

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
}

export default function ClientProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [form, setForm] = useState({ name: "", phone: "" })
  const [passwords, setPasswords] = useState({ current: "", newPassword: "", confirm: "" })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/client/profile")
        if (res.ok) {
          const json = await res.json()
          setProfile(json.data)
          setForm({
            name: json.data?.name || "",
            phone: json.data?.phone || "",
          })
        } else {
          toast.error("Failed to load profile")
        }
      } catch {
        toast.error("Network error")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/client/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success("Profile updated successfully!")
        setProfile((prev: any) => ({ ...prev, ...form }))
      } else {
        const json = await res.json()
        toast.error(json.error || "Failed to update profile")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    const errors: Record<string, string> = {}
    if (!passwords.current) errors.current = "Current password is required"
    if (!passwords.newPassword) errors.newPassword = "New password is required"
    if (passwords.newPassword && passwords.newPassword.length < 6) errors.newPassword = "Must be at least 6 characters"
    if (passwords.newPassword !== passwords.confirm) errors.confirm = "Passwords don't match"

    setPasswordErrors(errors)
    if (Object.keys(errors).length > 0) return

    setChangingPassword(true)
    try {
      const res = await fetch("/api/client/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.newPassword,
        }),
      })
      if (res.ok) {
        toast.success("Password changed successfully!")
        setPasswords({ current: "", newPassword: "", confirm: "" })
        setPasswordErrors({})
      } else {
        const json = await res.json()
        toast.error(json.error || "Failed to change password")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
      <div className="flex items-center gap-4 p-6">
        <div className="w-16 h-16 bg-[#1e293b] rounded-full animate-pulse" />
        <div className="space-y-2">
          <div className="h-5 w-32 bg-[#1e293b] rounded animate-pulse" />
          <div className="h-3 w-48 bg-[#1e293b] rounded animate-pulse" />
        </div>
      </div>
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse">
          <CardContent className="p-6"><div className="h-32 bg-[#1e293b] rounded" /></CardContent>
        </Card>
      ))}
    </div>
  )

  if (!profile) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">Unable to load profile</p>
        <Button variant="ghost" className="mt-2 text-emerald-400" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    </div>
  )

  const initials = profile.name
    ? profile.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U"

  const connectionStatusConfig: Record<string, { label: string; className: string; dotClass: string }> = {
    connected: { label: "Connected", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", dotClass: "bg-emerald-400" },
    disconnected: { label: "Disconnected", className: "bg-red-500/15 text-red-400 border-red-500/20", dotClass: "bg-red-400" },
    suspended: { label: "Suspended", className: "bg-amber-500/15 text-amber-400 border-amber-500/20", dotClass: "bg-amber-400" },
  }

  const cs = connectionStatusConfig[profile.connectionStatus] || connectionStatusConfig.disconnected

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-slate-400 mt-1">Manage your account settings</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div variants={staggerItem}>
        <Card className="bg-[#111827] border-[#1e293b] overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-sky-500/10" />
          <CardContent className="p-6 pt-0 -mt-8">
            <div className="flex items-end gap-4">
              <Avatar className="w-16 h-16 border-4 border-[#111827] bg-emerald-500/20">
                <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 pb-1">
                <h2 className="text-lg font-bold text-white">{profile.name || "User"}</h2>
                <p className="text-sm text-slate-500">{profile.email}</p>
              </div>
              <Badge className={`${cs.className} border`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cs.dotClass} mr-1.5 ${profile.connectionStatus === "connected" ? "animate-pulse" : ""}`} />
                {cs.label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account Info */}
      <motion.div variants={staggerItem}>
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15">
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Role</p>
                  <p className="text-sm text-white font-medium capitalize">{profile.role || "Client"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/15">
                  <Calendar className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Member Since</p>
                  <p className="text-sm text-white font-medium">{format(new Date(profile.createdAt), "MMM yyyy")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15">
                  <Wifi className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">ISP</p>
                  <p className="text-sm text-white font-medium">{profile.member?.businessName || profile.member?.name || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/15">
                  <Signal className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Status</p>
                  <p className="text-sm text-white font-medium capitalize">{profile.status || "Active"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Personal Information */}
      <motion.div variants={staggerItem}>
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/15">
                <User className="w-4 h-4 text-emerald-500" />
              </div>
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-[#0b1220] border-[#1e293b] text-white rounded-xl"
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Email</Label>
              <div className="relative">
                <Input
                  type="email"
                  value={profile.email || ""}
                  disabled
                  className="bg-[#0b1220] border-[#1e293b] text-slate-500 rounded-xl pr-10"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              </div>
              <p className="text-[10px] text-slate-600">Email cannot be changed. Contact support if needed.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Phone Number</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-[#0b1220] border-[#1e293b] text-white rounded-xl"
                placeholder="+254XXXXXXXXX"
              />
            </div>
            <Button
              onClick={handleSave}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-10"
              disabled={saving}
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />Save Changes</>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Change Password */}
      <motion.div variants={staggerItem}>
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/15">
                <Lock className="w-4 h-4 text-emerald-500" />
              </div>
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Current Password</Label>
              <Input
                type="password"
                value={passwords.current}
                onChange={(e) => { setPasswords({ ...passwords, current: e.target.value }); setPasswordErrors({}) }}
                className={`bg-[#0b1220] border-[#1e293b] text-white rounded-xl ${passwordErrors.current ? "border-red-500/50" : ""}`}
                placeholder="Enter current password"
              />
              {passwordErrors.current && <p className="text-xs text-red-400">{passwordErrors.current}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs">New Password</Label>
                <Input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => { setPasswords({ ...passwords, newPassword: e.target.value }); setPasswordErrors({}) }}
                  className={`bg-[#0b1220] border-[#1e293b] text-white rounded-xl ${passwordErrors.newPassword ? "border-red-500/50" : ""}`}
                  placeholder="At least 6 characters"
                />
                {passwordErrors.newPassword && <p className="text-xs text-red-400">{passwordErrors.newPassword}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs">Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => { setPasswords({ ...passwords, confirm: e.target.value }); setPasswordErrors({}) }}
                  className={`bg-[#0b1220] border-[#1e293b] text-white rounded-xl ${passwordErrors.confirm ? "border-red-500/50" : ""}`}
                  placeholder="Re-enter new password"
                />
                {passwordErrors.confirm && <p className="text-xs text-red-400">{passwordErrors.confirm}</p>}
              </div>
            </div>
            <Button
              onClick={handlePasswordChange}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-10"
              disabled={changingPassword}
            >
              {changingPassword ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Changing...</>
              ) : (
                <><Lock className="w-4 h-4 mr-2" />Change Password</>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
