"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Settings as SettingsIcon, CreditCard, MessageSquare, Mail, Globe } from "lucide-react"

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/settings")
      if (res.ok) {
        const json = await res.json()
        setSettings(json.settings)
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings(updatedSettings: Record<string, string>) {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: updatedSettings }),
      })
      if (res.ok) {
        toast.success("Settings saved")
        setSettings(updatedSettings)
      } else {
        toast.error("Failed to save settings")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  function updateSetting(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse">
            <CardContent className="p-6"><div className="h-40 bg-[#1e293b] rounded" /></CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm">Platform configuration and integrations</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-[#111827] border border-[#1e293b]">
          <TabsTrigger value="general" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <Globe className="w-4 h-4 mr-2" /> General
          </TabsTrigger>
          <TabsTrigger value="mpesa" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <CreditCard className="w-4 h-4 mr-2" /> M-Pesa
          </TabsTrigger>
          <TabsTrigger value="sms" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <MessageSquare className="w-4 h-4 mr-2" /> SMS
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <Mail className="w-4 h-4 mr-2" /> Email
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="bg-[#111827] border-[#1e293b]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" /> General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Site Name</label>
                  <Input value={settings.site_name || ""} onChange={(e) => updateSetting("site_name", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Logo URL</label>
                  <Input value={settings.site_logo || ""} onChange={(e) => updateSetting("site_logo", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="https://..." />
                </div>
              </div>
              <Button onClick={() => saveSettings(settings)} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                {saving ? "Saving..." : "Save General Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* M-Pesa Settings */}
        <TabsContent value="mpesa">
          <Card className="bg-[#111827] border-[#1e293b]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" /> M-Pesa Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0b1220] border border-[#1e293b]">
                <Switch
                  checked={settings.mpesa_environment === "production"}
                  onCheckedChange={(v) => updateSetting("mpesa_environment", v ? "production" : "sandbox")}
                />
                <div>
                  <p className="text-sm font-medium text-white">Production Mode</p>
                  <p className="text-xs text-slate-400">Toggle between sandbox and production</p>
                </div>
                <Badge variant="outline" className={settings.mpesa_environment === "production" ? "border-emerald-500/30 text-emerald-400 ml-auto" : "border-amber-500/30 text-amber-400 ml-auto"}>
                  {settings.mpesa_environment === "production" ? "Production" : "Sandbox"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Consumer Key</label>
                  <Input value={settings.mpesa_consumer_key || ""} onChange={(e) => updateSetting("mpesa_consumer_key", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Consumer Secret</label>
                  <Input value={settings.mpesa_consumer_secret || ""} onChange={(e) => updateSetting("mpesa_consumer_secret", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white font-mono" type="password" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Shortcode</label>
                  <Input value={settings.mpesa_shortcode || ""} onChange={(e) => updateSetting("mpesa_shortcode", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Passkey</label>
                  <Input value={settings.mpesa_passkey || ""} onChange={(e) => updateSetting("mpesa_passkey", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white font-mono text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Initiator Name</label>
                  <Input value={settings.mpesa_initiator_name || ""} onChange={(e) => updateSetting("mpesa_initiator_name", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Initiator Password</label>
                  <Input value={settings.mpesa_initiator_password || ""} onChange={(e) => updateSetting("mpesa_initiator_password", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" type="password" />
                </div>
              </div>
              <Button onClick={() => saveSettings(settings)} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                {saving ? "Saving..." : "Save M-Pesa Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Settings */}
        <TabsContent value="sms">
          <Card className="bg-[#111827] border-[#1e293b]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" /> SMS Gateway Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Gateway Provider</label>
                  <Input value={settings.sms_gateway || ""} onChange={(e) => updateSetting("sms_gateway", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Sender ID</label>
                  <Input value={settings.sms_sender_id || ""} onChange={(e) => updateSetting("sms_sender_id", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-300">API Key</label>
                  <Input value={settings.sms_api_key || ""} onChange={(e) => updateSetting("sms_api_key", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white font-mono" type="password" />
                </div>
              </div>
              <Button onClick={() => saveSettings(settings)} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                {saving ? "Saving..." : "Save SMS Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card className="bg-[#111827] border-[#1e293b]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-400" /> Email Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">SMTP Host</label>
                  <Input value={settings.email_host || ""} onChange={(e) => updateSetting("email_host", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">SMTP Port</label>
                  <Input value={settings.email_port || ""} onChange={(e) => updateSetting("email_port", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Username</label>
                  <Input value={settings.email_user || ""} onChange={(e) => updateSetting("email_user", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <Input value={settings.email_password || ""} onChange={(e) => updateSetting("email_password", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" type="password" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-300">From Address</label>
                  <Input value={settings.email_from || ""} onChange={(e) => updateSetting("email_from", e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" />
                </div>
              </div>
              <Button onClick={() => saveSettings(settings)} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                {saving ? "Saving..." : "Save Email Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
