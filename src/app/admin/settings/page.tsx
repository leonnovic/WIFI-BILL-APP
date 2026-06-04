"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Settings as SettingsIcon, CreditCard, MessageSquare, Mail, Globe, Shield, Save } from "lucide-react"
import { motion } from "framer-motion"

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/settings")
      if (res.ok) {
        const json = await res.json()
        setSettings(json.data || {})
      }
    } catch (error) { console.error("Failed to fetch settings:", error) }
    finally { setLoading(false) }
  }

  async function saveSection(keys: string[]) {
    setSaving(true)
    const sectionSettings: Record<string, string> = {}
    keys.forEach(k => { if (settings[k] !== undefined) sectionSettings[k] = settings[k] })
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: sectionSettings }),
      })
      if (res.ok) { toast.success("Settings saved successfully") }
      else { toast.error("Failed to save settings") }
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  function updateSetting(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-[#111827] border-[#1e293b]"><CardContent className="p-6"><Skeleton className="h-40 bg-[#1e293b]" /></CardContent></Card>
        ))}
      </div>
    )
  }

  const generalKeys = ["site_name", "site_logo", "currency", "okoa_enabled", "default_okoa_limit", "maintenance_mode"]
  const mpesaKeys = ["mpesa_environment", "mpesa_consumer_key", "mpesa_consumer_secret", "mpesa_shortcode", "mpesa_passkey", "mpesa_initiator_name", "mpesa_initiator_password"]
  const smsKeys = ["sms_gateway", "sms_sender_id", "sms_api_key"]
  const emailKeys = ["email_host", "email_port", "email_user", "email_password", "email_from"]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-slate-400" /> Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">Platform configuration and integrations</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-[#111827] border border-[#1e293b] h-auto p-1">
          <TabsTrigger value="general" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg px-4 py-2">
            <Globe className="w-4 h-4 mr-2" /> General
          </TabsTrigger>
          <TabsTrigger value="mpesa" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg px-4 py-2">
            <CreditCard className="w-4 h-4 mr-2" /> M-Pesa
          </TabsTrigger>
          <TabsTrigger value="sms" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg px-4 py-2">
            <MessageSquare className="w-4 h-4 mr-2" /> SMS
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg px-4 py-2">
            <Mail className="w-4 h-4 mr-2" /> Email
          </TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-[#111827] border-[#1e293b]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2"><Globe className="w-5 h-5 text-emerald-400" /> General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Site Name</label>
                    <Input value={settings.site_name || ""} onChange={(e) => updateSetting("site_name", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white focus:border-emerald-500/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Logo URL</label>
                    <Input value={settings.site_logo || ""} onChange={(e) => updateSetting("site_logo", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white focus:border-emerald-500/50" placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Currency</label>
                    <Input value={settings.currency || ""} onChange={(e) => updateSetting("currency", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white focus:border-emerald-500/50" placeholder="KES" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Default OKOA Limit</label>
                    <Input value={settings.default_okoa_limit || ""} onChange={(e) => updateSetting("default_okoa_limit", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white focus:border-emerald-500/50" placeholder="500" />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0b1220] border border-[#1e293b]">
                  <Switch checked={settings.maintenance_mode === "true"} onCheckedChange={(v) => updateSetting("maintenance_mode", v ? "true" : "false")} />
                  <div><p className="text-sm font-medium text-white">Maintenance Mode</p><p className="text-xs text-slate-400">Disable platform access for non-admin users</p></div>
                </div>
                <Button onClick={() => saveSection(generalKeys)} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  <Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save General Settings"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* M-Pesa */}
        <TabsContent value="mpesa">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-[#111827] border-[#1e293b]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-emerald-400" /> M-Pesa Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0b1220] border border-[#1e293b]">
                  <Switch checked={settings.mpesa_environment === "production"} onCheckedChange={(v) => updateSetting("mpesa_environment", v ? "production" : "sandbox")} />
                  <div className="flex-1"><p className="text-sm font-medium text-white">Production Mode</p><p className="text-xs text-slate-400">Toggle between sandbox and production</p></div>
                  <Badge variant="outline" className={settings.mpesa_environment === "production" ? "border-emerald-500/30 text-emerald-400" : "border-amber-500/30 text-amber-400"}>
                    {settings.mpesa_environment === "production" ? "Production" : "Sandbox"}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Consumer Key</label><Input value={settings.mpesa_consumer_key || ""} onChange={(e) => updateSetting("mpesa_consumer_key", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white font-mono text-sm" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Consumer Secret</label><Input value={settings.mpesa_consumer_secret || ""} onChange={(e) => updateSetting("mpesa_consumer_secret", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white font-mono text-sm" type="password" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Shortcode</label><Input value={settings.mpesa_shortcode || ""} onChange={(e) => updateSetting("mpesa_shortcode", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white font-mono" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Passkey</label><Input value={settings.mpesa_passkey || ""} onChange={(e) => updateSetting("mpesa_passkey", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white font-mono text-xs" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Initiator Name</label><Input value={settings.mpesa_initiator_name || ""} onChange={(e) => updateSetting("mpesa_initiator_name", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Initiator Password</label><Input value={settings.mpesa_initiator_password || ""} onChange={(e) => updateSetting("mpesa_initiator_password", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" type="password" /></div>
                </div>
                <Button onClick={() => saveSection(mpesaKeys)} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white"><Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save M-Pesa Settings"}</Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* SMS */}
        <TabsContent value="sms">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-[#111827] border-[#1e293b]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2"><MessageSquare className="w-5 h-5 text-emerald-400" /> SMS Gateway Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Gateway Provider</label><Input value={settings.sms_gateway || ""} onChange={(e) => updateSetting("sms_gateway", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Sender ID</label><Input value={settings.sms_sender_id || ""} onChange={(e) => updateSetting("sms_sender_id", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
                  <div className="space-y-2 sm:col-span-2"><label className="text-sm font-medium text-slate-300">API Key</label><Input value={settings.sms_api_key || ""} onChange={(e) => updateSetting("sms_api_key", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white font-mono" type="password" /></div>
                </div>
                <Button onClick={() => saveSection(smsKeys)} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white"><Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save SMS Settings"}</Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Email */}
        <TabsContent value="email">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-[#111827] border-[#1e293b]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2"><Mail className="w-5 h-5 text-emerald-400" /> Email Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-sm font-medium text-slate-300">SMTP Host</label><Input value={settings.email_host || ""} onChange={(e) => updateSetting("email_host", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium text-slate-300">SMTP Port</label><Input value={settings.email_port || ""} onChange={(e) => updateSetting("email_port", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Username</label><Input value={settings.email_user || ""} onChange={(e) => updateSetting("email_user", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Password</label><Input value={settings.email_password || ""} onChange={(e) => updateSetting("email_password", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" type="password" /></div>
                  <div className="space-y-2 sm:col-span-2"><label className="text-sm font-medium text-slate-300">From Address</label><Input value={settings.email_from || ""} onChange={(e) => updateSetting("email_from", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" /></div>
                </div>
                <Button onClick={() => saveSection(emailKeys)} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white"><Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Email Settings"}</Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
