"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { User, Lock, Phone, Mail, Wifi, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface ProfileData {
  id: string
  name: string | null
  email: string
  phone: string | null
  status: string
  okoaBalance: number
  okoaLimit: number
  createdAt: string
  member: { name: string | null; businessName: string | null } | null
}

const fadeIn = { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 } }

export default function ClientProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "" })
  const [passwords, setPasswords] = useState({ current: "", newPassword: "", confirm: "" })
  const [notifications, setNotifications] = useState({ email: true, sms: true, payment: true, packageExpiry: true, okoa: true })

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/client/profile")
        if (res.ok) {
          const json = await res.json()
          setProfile(json)
          setForm({ name: json.name || "", email: json.email || "", phone: json.phone || "" })
        }
      } catch { toast.error("Failed to load profile") }
      finally { setLoading(false) }
    }
    fetchProfile()
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/client/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, phone: form.phone }),
      })
      if (res.ok) { toast.success("Profile updated"); setProfile(prev => prev ? { ...prev, name: form.name, phone: form.phone } : null) }
      else { toast.error("Failed to update profile") }
    } catch { toast.error("Failed to update profile") }
    finally { setSaving(false) }
  }

  async function handlePasswordChange() {
    if (passwords.newPassword !== passwords.confirm) { toast.error("Passwords don't match"); return }
    if (!passwords.current) { toast.error("Enter current password"); return }
    if (passwords.newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/client/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPassword }),
      })
      if (res.ok) { toast.success("Password changed"); setPasswords({ current: "", newPassword: "", confirm: "" }) }
      else { const json = await res.json(); toast.error(json.error || "Failed to change password") }
    } catch { toast.error("Failed to change password") }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
        <Card className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-4"><div className="h-16 bg-[#1e293b] rounded" /></CardContent></Card>
        <Card className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-6"><div className="h-48 bg-[#1e293b] rounded" /></CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-slate-400 mt-1">Manage your account settings</p>
      </motion.div>

      {profile?.member && (
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center"><Wifi className="w-5 h-5 text-emerald-400" /></div>
              <div>
                <p className="text-sm text-slate-400">Connected ISP</p>
                <p className="text-sm font-medium text-white">{profile.member.businessName || profile.member.name || "Unknown ISP"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="bg-[#111827] border border-[#1e293b]">
          <TabsTrigger value="personal" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Personal Info</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Security</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card className="bg-[#111827] border-[#1e293b]">
            <CardHeader><CardTitle className="text-lg text-white flex items-center gap-2"><User className="w-5 h-5 text-emerald-500" />Personal Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label className="text-slate-300">Full Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Email</Label><Input type="email" value={form.email} disabled className="bg-[#0b1220] border-[#1e293b] text-white opacity-60" /></div>
              <div className="space-y-2"><Label className="text-slate-300">Phone Number</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
              {profile && <div className="flex items-center gap-2 text-sm"><span className="text-slate-400">Account Status:</span><Badge variant="secondary" className={`text-xs border-0 ${profile.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>{profile.status}</Badge></div>}
              <Button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white"><Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Changes"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="bg-[#111827] border-[#1e293b]">
            <CardHeader><CardTitle className="text-lg text-white flex items-center gap-2"><Lock className="w-5 h-5 text-emerald-500" />Change Password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label className="text-slate-300">Current Password</Label><Input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-slate-300">New Password</Label><Input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
                <div className="space-y-2"><Label className="text-slate-300">Confirm Password</Label><Input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
              </div>
              <Button onClick={handlePasswordChange} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white"><Lock className="w-4 h-4 mr-2" />{saving ? "Changing..." : "Change Password"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="bg-[#111827] border-[#1e293b]">
            <CardHeader><CardTitle className="text-lg text-white flex items-center gap-2"><Mail className="w-5 h-5 text-emerald-500" />Notification Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "email", label: "Email Notifications", desc: "Receive notifications via email" },
                { key: "sms", label: "SMS Notifications", desc: "Receive notifications via SMS" },
                { key: "payment", label: "Payment Confirmations", desc: "Notify when payment is received" },
                { key: "packageExpiry", label: "Package Expiry", desc: "Notify before package expires" },
                { key: "okoa", label: "OKOA Updates", desc: "Notify about OKOA credit changes" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div><p className="text-sm text-white">{item.label}</p><p className="text-xs text-slate-400">{item.desc}</p></div>
                  <Switch checked={notifications[item.key as keyof typeof notifications]} onCheckedChange={(v) => setNotifications({ ...notifications, [item.key]: v })} />
                </div>
              ))}
              <Button onClick={() => toast.success("Notification settings saved")} className="bg-emerald-500 hover:bg-emerald-600 text-white"><Save className="w-4 h-4 mr-2" />Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
