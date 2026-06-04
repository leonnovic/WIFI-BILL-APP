"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Shield, Smartphone, Mail, Apple, Save } from "lucide-react"
import { motion } from "framer-motion"

interface ProviderConfig {
  enabled: boolean
  [key: string]: any
}

export default function AuthProvidersPage() {
  const [providers, setProviders] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [google, setGoogle] = useState<ProviderConfig>({ enabled: false, clientId: "", clientSecret: "" })
  const [apple, setApple] = useState<ProviderConfig>({ enabled: false, serviceId: "", teamId: "", keyId: "", privateKey: "" })
  const [phoneOtp, setPhoneOtp] = useState<ProviderConfig>({ enabled: true, length: 6, expiry: "5m" })
  const [emailVerify, setEmailVerify] = useState<ProviderConfig>({ enabled: true, requireOnSignup: true })

  useEffect(() => { fetchProviders() }, [])

  async function fetchProviders() {
    try {
      const res = await fetch("/api/admin/auth-providers")
      if (res.ok) {
        const json = await res.json()
        const data = json.data || {}
        setProviders(data)
        if (data.auth_google) { try { setGoogle(JSON.parse(data.auth_google)) } catch {} }
        if (data.auth_apple) { try { setApple(JSON.parse(data.auth_apple)) } catch {} }
        if (data.auth_phone_otp) { try { setPhoneOtp(JSON.parse(data.auth_phone_otp)) } catch {} }
        if (data.auth_email_verification) { try { setEmailVerify(JSON.parse(data.auth_email_verification)) } catch {} }
      }
    } catch (error) { console.error("Failed to fetch providers:", error) }
    finally { setLoading(false) }
  }

  async function saveProviders() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/auth-providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providers: {
            auth_google: JSON.stringify(google),
            auth_apple: JSON.stringify(apple),
            auth_phone_otp: JSON.stringify(phoneOtp),
            auth_email_verification: JSON.stringify(emailVerify),
          },
        }),
      })
      if (res.ok) { toast.success("Auth providers saved successfully") }
      else { toast.error("Failed to save auth providers") }
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Auth Providers</h1>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-[#111827] border-[#1e293b]"><CardContent className="p-6"><Skeleton className="h-40 bg-[#1e293b]" /></CardContent></Card>
        ))}
      </div>
    )
  }

  const providerCards = [
    {
      title: "Google OAuth",
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>,
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      state: google,
      setState: setGoogle,
      fields: [
        { key: "clientId", label: "Client ID", placeholder: "your-client-id.apps.googleusercontent.com" },
        { key: "clientSecret", label: "Client Secret", placeholder: "GOCSPX-...", type: "password" },
      ],
    },
    {
      title: "Apple Sign In",
      icon: <Apple className="w-5 h-5 text-slate-300" />,
      bgColor: "bg-slate-500/10",
      borderColor: "border-slate-500/20",
      state: apple,
      setState: setApple,
      fields: [
        { key: "serviceId", label: "Service ID" },
        { key: "teamId", label: "Team ID" },
        { key: "keyId", label: "Key ID" },
        { key: "privateKey", label: "Private Key", type: "password" },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-400" /> Auth Providers
          </h1>
          <p className="text-slate-400 text-sm mt-1">Configure authentication methods and OAuth providers</p>
        </div>
        <Button onClick={saveProviders} disabled={saving} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20">
          <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>

      {/* OAuth Providers */}
      {providerCards.map((provider, index) => (
        <motion.div key={provider.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
          <Card className="bg-[#111827] border-[#1e293b]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${provider.bgColor} flex items-center justify-center border ${provider.borderColor}`}>
                    {provider.icon}
                  </div>
                  {provider.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Switch checked={provider.state.enabled} onCheckedChange={(v) => provider.setState({ ...provider.state, enabled: v })} />
                  <Badge variant="outline" className={provider.state.enabled ? "border-emerald-500/30 text-emerald-400" : "border-slate-500/30 text-slate-400"}>
                    {provider.state.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {provider.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">{field.label}</label>
                    <Input
                      value={provider.state[field.key] || ""}
                      onChange={(e) => provider.setState({ ...provider.state, [field.key]: e.target.value })}
                      className="bg-[#0b1220] border-[#1e293b] text-white focus:border-emerald-500/50"
                      placeholder={(field as any).placeholder || ""}
                      type={field.type || "text"}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Phone OTP */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                </div>
                Phone OTP
              </CardTitle>
              <div className="flex items-center gap-2">
                <Switch checked={phoneOtp.enabled} onCheckedChange={(v) => setPhoneOtp({ ...phoneOtp, enabled: v })} />
                <Badge variant="outline" className={phoneOtp.enabled ? "border-emerald-500/30 text-emerald-400" : "border-slate-500/30 text-slate-400"}>
                  {phoneOtp.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium text-slate-300">OTP Length</label><Input value={phoneOtp.length} onChange={(e) => setPhoneOtp({ ...phoneOtp, length: parseInt(e.target.value) || 6 })} className="bg-[#0b1220] border-[#1e293b] text-white" type="number" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Expiry Time</label><Input value={phoneOtp.expiry} onChange={(e) => setPhoneOtp({ ...phoneOtp, expiry: e.target.value })} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder="5m" /></div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Email Verification */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                Email Verification
              </CardTitle>
              <div className="flex items-center gap-2">
                <Switch checked={emailVerify.enabled} onCheckedChange={(v) => setEmailVerify({ ...emailVerify, enabled: v })} />
                <Badge variant="outline" className={emailVerify.enabled ? "border-emerald-500/30 text-emerald-400" : "border-slate-500/30 text-slate-400"}>
                  {emailVerify.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0b1220] border border-[#1e293b]">
              <Switch checked={emailVerify.requireOnSignup} onCheckedChange={(v) => setEmailVerify({ ...emailVerify, requireOnSignup: v })} />
              <div>
                <p className="text-sm font-medium text-white">Require on Signup</p>
                <p className="text-xs text-slate-400">Users must verify their email before accessing the platform</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save All Button at bottom */}
      <div className="flex justify-end">
        <Button onClick={saveProviders} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </div>
  )
}
