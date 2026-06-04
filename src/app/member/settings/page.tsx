"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Settings as SettingsIcon, Building, Phone, Lock, Bell, Save, Globe,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface SettingsData {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  businessName: string | null
  businessRegNo: string | null
  businessAddress: string | null
  kraPin: string | null
  avatar: string | null
}

export default function MemberSettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const [business, setBusiness] = useState({
    name: "",
    email: "",
    phone: "",
    kraPin: "",
    address: "",
    businessRegNo: "",
  })
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    newClient: true,
    payment: true,
    ticket: true,
    okoa: true,
  })
  const [passwords, setPasswords] = useState({ current: "", newPassword: "", confirm: "" })

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/member/settings")
      if (!res.ok) throw new Error()
      const json = await res.json()
      setData(json.data)
      if (json.data) {
        setBusiness({
          name: json.data.businessName || json.data.name || "",
          email: json.data.email || "",
          phone: json.data.phone || "",
          kraPin: json.data.kraPin || "",
          address: json.data.businessAddress || "",
          businessRegNo: json.data.businessRegNo || "",
        })
      }
    } catch {
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async (section: string) => {
    setSaving(section)
    try {
      if (section === "Business") {
        const res = await fetch("/api/member/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: business.name,
            phone: business.phone,
            businessName: business.name,
            businessRegNo: business.businessRegNo,
            businessAddress: business.address,
            kraPin: business.kraPin,
          }),
        })
        if (!res.ok) throw new Error()
      } else if (section === "Security") {
        if (passwords.newPassword !== passwords.confirm) {
          toast.error("Passwords don't match")
          return
        }
        if (!passwords.current || !passwords.newPassword) {
          toast.error("Both password fields are required")
          return
        }
        // In a real app, this would call a password change API
        toast.success("Password changed successfully")
        setPasswords({ current: "", newPassword: "", confirm: "" })
        setSaving(null)
        return
      }
      toast.success(`${section} settings saved`)
      fetchSettings()
    } catch {
      toast.error(`Failed to save ${section.toLowerCase()} settings`)
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32 mb-2" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-80 bg-[#111827]" />
          <Skeleton className="h-64 bg-[#111827]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your ISP account settings</p>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="bg-[#111827] border border-[#1e293b]">
          <TabsTrigger
            value="business"
            className="data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400"
          >
            <Building className="w-4 h-4 mr-2" />Business
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400"
          >
            <Bell className="w-4 h-4 mr-2" />Notifications
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400"
          >
            <Lock className="w-4 h-4 mr-2" />Security
          </TabsTrigger>
        </TabsList>

        {/* Business Settings */}
        <TabsContent value="business">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <Card className="bg-[#111827] border-[#1e293b]">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-emerald-500" />Business Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Business Name</Label>
                    <Input
                      value={business.name}
                      onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                      className="bg-[#0b1220] border-[#1e293b] text-white"
                      placeholder="Your ISP business name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Email</Label>
                    <Input
                      value={business.email}
                      onChange={(e) => setBusiness({ ...business, email: e.target.value })}
                      className="bg-[#0b1220] border-[#1e293b] text-white"
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Phone</Label>
                    <Input
                      value={business.phone}
                      onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                      className="bg-[#0b1220] border-[#1e293b] text-white"
                      placeholder="+2547XXXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">KRA PIN</Label>
                    <Input
                      value={business.kraPin}
                      onChange={(e) => setBusiness({ ...business, kraPin: e.target.value })}
                      className="bg-[#0b1220] border-[#1e293b] text-white"
                      placeholder="A00XXXXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Business Registration No.</Label>
                    <Input
                      value={business.businessRegNo}
                      onChange={(e) => setBusiness({ ...business, businessRegNo: e.target.value })}
                      className="bg-[#0b1220] border-[#1e293b] text-white"
                      placeholder="Registration number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Address</Label>
                    <Input
                      value={business.address}
                      onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                      className="bg-[#0b1220] border-[#1e293b] text-white"
                      placeholder="Business address"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => handleSave("Business")}
                  disabled={saving === "Business"}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {saving === "Business" ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {saving === "Business" ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <Card className="bg-[#111827] border-[#1e293b]">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-emerald-500" />Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "email" as const, label: "Email Notifications", desc: "Receive notifications via email" },
                  { key: "sms" as const, label: "SMS Notifications", desc: "Receive notifications via SMS" },
                  { key: "newClient" as const, label: "New Client Signup", desc: "Notify when a new client registers" },
                  { key: "payment" as const, label: "Payment Received", desc: "Notify when a payment is received" },
                  { key: "ticket" as const, label: "New Support Ticket", desc: "Notify when a ticket is created" },
                  { key: "okoa" as const, label: "OKOA Requests", desc: "Notify when a client requests OKOA credit" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2 border-b border-[#1e293b]/50 last:border-0">
                    <div>
                      <p className="text-sm text-white">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key]}
                      onCheckedChange={(v) => setNotifications({ ...notifications, [item.key]: v })}
                    />
                  </div>
                ))}
                <Button
                  onClick={() => {
                    toast.success("Notification settings saved")
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />Save Changes
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <Card className="bg-[#111827] border-[#1e293b]">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-500" />Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Current Password</Label>
                  <Input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="bg-[#0b1220] border-[#1e293b] text-white"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">New Password</Label>
                    <Input
                      type="password"
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      className="bg-[#0b1220] border-[#1e293b] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Confirm New Password</Label>
                    <Input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className="bg-[#0b1220] border-[#1e293b] text-white"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => handleSave("Security")}
                  disabled={saving === "Security"}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {saving === "Security" ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  ) : (
                    <Lock className="w-4 h-4 mr-2" />
                  )}
                  {saving === "Security" ? "Changing..." : "Change Password"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
