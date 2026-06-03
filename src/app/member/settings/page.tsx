"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Building, Phone, Lock, Bell, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export default function MemberSettingsPage() {
  const [business, setBusiness] = useState({ name: "", email: "", phone: "", kraPin: "", address: "" })
  const [notifications, setNotifications] = useState({ email: true, sms: false, newClient: true, payment: true, ticket: true, okoa: true })
  const [passwords, setPasswords] = useState({ current: "", newPassword: "", confirm: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/member/settings")
        if (res.ok) {
          const json = await res.json()
          if (json.user) {
            setBusiness({
              name: json.user.businessName || json.user.name || "",
              email: json.user.email || "",
              phone: json.user.phone || "",
              kraPin: json.user.kraPin || "",
              address: "",
            })
          }
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  async function handleSave(section: string) {
    setSaving(true)
    try {
      const res = await fetch("/api/member/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: business.name,
          phone: business.phone,
          kraPin: business.kraPin,
        }),
      })
      if (res.ok) { toast.success(`${section} settings saved`) }
      else { toast.error("Failed to save settings") }
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordChange() {
    if (passwords.newPassword !== passwords.confirm) { toast.error("Passwords don't match"); return }
    if (!passwords.current) { toast.error("Enter current password"); return }
    if (passwords.newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/member/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPassword }),
      })
      if (res.ok) { toast.success("Password changed"); setPasswords({ current: "", newPassword: "", confirm: "" }) }
      else { const json = await res.json(); toast.error(json.error || "Failed to change password") }
    } catch {
      toast.error("Failed to change password")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
        <Card className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-6"><div className="h-64 bg-[#1e293b] rounded" /></CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your ISP account settings</p>
      </motion.div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="bg-[#111827] border border-[#1e293b]">
          <TabsTrigger value="business" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Business</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Notifications</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <Card className="bg-[#111827] border-[#1e293b]">
            <CardHeader><CardTitle className="text-lg text-white flex items-center gap-2"><Building className="w-5 h-5 text-emerald-500" />Business Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-slate-300">Business Name</Label><Input value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
                <div className="space-y-2"><Label className="text-slate-300">Email</Label><Input value={business.email} onChange={(e) => setBusiness({ ...business, email: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
                <div className="space-y-2"><Label className="text-slate-300">Phone</Label><Input value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
                <div className="space-y-2"><Label className="text-slate-300">KRA PIN</Label><Input value={business.kraPin} onChange={(e) => setBusiness({ ...business, kraPin: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
              </div>
              <Button onClick={() => handleSave("Business")} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white"><Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Changes"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="bg-[#111827] border-[#1e293b]">
            <CardHeader><CardTitle className="text-lg text-white flex items-center gap-2"><Bell className="w-5 h-5 text-emerald-500" />Notification Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "email", label: "Email Notifications", desc: "Receive notifications via email" },
                { key: "sms", label: "SMS Notifications", desc: "Receive notifications via SMS" },
                { key: "newClient", label: "New Client Signup", desc: "Notify when a new client registers" },
                { key: "payment", label: "Payment Received", desc: "Notify when a payment is received" },
                { key: "ticket", label: "New Support Ticket", desc: "Notify when a ticket is created" },
                { key: "okoa", label: "OKOA Requests", desc: "Notify when a client requests OKOA credit" },
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

        <TabsContent value="security">
          <Card className="bg-[#111827] border-[#1e293b]">
            <CardHeader><CardTitle className="text-lg text-white flex items-center gap-2"><Lock className="w-5 h-5 text-emerald-500" />Change Password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label className="text-slate-300">Current Password</Label><Input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-slate-300">New Password</Label><Input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
                <div className="space-y-2"><Label className="text-slate-300">Confirm New Password</Label><Input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
              </div>
              <Button onClick={handlePasswordChange} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white"><Lock className="w-4 h-4 mr-2" />{saving ? "Changing..." : "Change Password"}</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
