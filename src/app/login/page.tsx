"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  Wifi,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

type LoginMode = "email" | "phone"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || ""
  const errorParam = searchParams.get("error")

  const [activeTab, setActiveTab] = useState("client")
  const [loginMode, setLoginMode] = useState<LoginMode>("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)

  // Show NextAuth error from URL
  useEffect(() => {
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        CredentialsSignin: "Invalid email or password. Please try again.",
        OAuthSignin: "Error signing in with OAuth provider.",
        OAuthCallback: "Error during OAuth callback.",
        OAuthCreateAccount: "Could not create OAuth account.",
        EmailCreateAccount: "Could not create email account.",
        Callback: "Error during authentication callback.",
        OAuthAccountNotLinked: "This account is not linked. Please sign in with your original provider.",
        Default: "An error occurred during sign in. Please try again.",
      }
      toast.error(errorMessages[errorParam] || errorMessages.Default || "Authentication failed.")
    }
  }, [errorParam])

  const roleMap: Record<string, string> = {
    admin: "admin",
    member: "member",
    client: "client",
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Please enter email and password")
      return
    }
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        role: roleMap[activeTab],
        redirect: false,
      })

      // Wait for session to be established
      await new Promise(resolve => setTimeout(resolve, 800))

      const sessionRes = await fetch("/api/auth/session")
      const session = await sessionRes.json()

      if (session?.user) {
        toast.success("Login successful! Redirecting...")
        const userRole = (session.user as Record<string, unknown>)?.role || activeTab
        const redirectMap: Record<string, string> = {
          admin: "/admin/dashboard",
          member: "/member/dashboard",
          client: "/client/dashboard",
        }
        const destination = callbackUrl || redirectMap[userRole as string] || redirectMap[activeTab] || "/client/dashboard"
        window.location.href = destination
        return
      }

      if (result?.error) {
        toast.error(result.error === "CredentialsSignin" ? "Invalid email or password" : result.error)
      } else {
        toast.error("Invalid credentials. Please try again.")
      }
    } catch {
      toast.error("An error occurred during login")
    }
    setIsLoading(false)
  }

  const handleSendOtp = async () => {
    if (!phone) {
      toast.error("Please enter your phone number")
      return
    }
    // Validate phone format
    const phoneRegex = /^\+?254\d{9}$/
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      toast.error("Please enter a valid Kenyan phone number (+254...)")
      return
    }
    setOtpLoading(true)
    try {
      const res = await fetch("/api/auth/phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, role: roleMap[activeTab] }),
      })
      const data = await res.json()
      if (res.ok) {
        setOtpSent(true)
        toast.success("OTP sent to your phone!")
      } else {
        toast.error(data.error || "Failed to send OTP")
      }
    } catch {
      toast.error("Failed to send OTP. Please try again.")
    }
    setOtpLoading(false)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp) {
      toast.error("Please enter the OTP")
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, role: roleMap[activeTab] }),
      })
      const data = await res.json()
      if (res.ok && data.token) {
        // Sign in with the phone credentials
        const result = await signIn("credentials", {
          phone,
          otp,
          role: roleMap[activeTab],
          redirect: false,
        })
        await new Promise(resolve => setTimeout(resolve, 500))
        const sessionRes = await fetch("/api/auth/session")
        const session = await sessionRes.json()
        if (session?.user) {
          toast.success("Login successful!")
          const userRole = (session.user as Record<string, unknown>)?.role || activeTab
          const redirectMap: Record<string, string> = {
            admin: "/admin/dashboard",
            member: "/member/dashboard",
            client: "/client/dashboard",
          }
          window.location.href = redirectMap[userRole as string] || "/client/dashboard"
          return
        }
      }
      toast.error(data.error || "Invalid OTP. Please try again.")
    } catch {
      toast.error("Verification failed. Please try again.")
    }
    setIsLoading(false)
  }

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: callbackUrl || "/client/dashboard" })
  }

  const quickLogin = (role: string) => {
    const accounts: Record<string, { email: string; password: string }> = {
      admin: { email: "admin@ispledger.com", password: "admin123" },
      member: { email: "isp@fastnet.com", password: "member123" },
      client: { email: "john@example.com", password: "client123" },
    }
    const account = accounts[role]
    if (account) {
      setEmail(account.email)
      setPassword(account.password)
      setActiveTab(role)
      setLoginMode("email")
    }
  }

  const tabConfig = [
    { value: "admin", label: "Admin", icon: Shield },
    { value: "member", label: "ISP", icon: Building2 },
    { value: "client", label: "Client", icon: User },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220] p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute inset-0 noise-overlay" />
      <motion.div
        className="absolute top-1/4 -left-32 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px]"
        animate={{ scale: [1, 1.1, 1], x: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px]"
        animate={{ scale: [1, 1.15, 1], x: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              ISP<span className="text-emerald-400">Ledger</span>
            </span>
          </Link>
          <p className="text-slate-500 mt-2 text-sm">WiFi Billing & ISP Management</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-[#111827] border border-[#1e293b] mb-6 h-11">
              {tabConfig.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-emerald-500/20 text-slate-400 text-sm transition-all"
                >
                  <tab.icon className="w-4 h-4 mr-1.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabConfig.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                <Card className="bg-[#111827]/90 backdrop-blur-xl border-[#1e293b] shadow-2xl shadow-black/20">
                  <CardHeader className="text-center pb-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                      className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3"
                    >
                      <tab.icon className="w-7 h-7 text-emerald-400" />
                    </motion.div>
                    <CardTitle className="text-xl text-white">
                      {tab.value === "admin" ? "Admin Login" : tab.value === "member" ? "ISP Member Login" : "Client Login"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Login Mode Toggle */}
                    <div className="flex mb-5 bg-[#0b1220] rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setLoginMode("email")}
                        className={`flex-1 text-sm py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                          loginMode === "email"
                            ? "bg-[#1e293b] text-emerald-400 shadow-sm"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Email
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginMode("phone")}
                        className={`flex-1 text-sm py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                          loginMode === "phone"
                            ? "bg-[#1e293b] text-emerald-400 shadow-sm"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Phone
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      {loginMode === "email" ? (
                        <motion.form
                          key="email-form"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.2 }}
                          onSubmit={handleEmailLogin}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="login-email" className="text-slate-300 text-sm">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <Input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 bg-[#0b1220] border-[#1e293b] text-white focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                placeholder="Enter your email"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="login-password" className="text-slate-300 text-sm">Password</Label>
                              <Link href="#" className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">
                                Forgot password?
                              </Link>
                            </div>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <Input
                                id="login-password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 pr-10 bg-[#0b1220] border-[#1e293b] text-white focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                placeholder="Enter your password"
                                required
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Remember Me */}
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="remember"
                              checked={rememberMe}
                              onCheckedChange={(checked) => setRememberMe(checked === true)}
                              className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                            />
                            <Label htmlFor="remember" className="text-sm text-slate-400 cursor-pointer">
                              Remember me for 30 days
                            </Label>
                          </div>

                          <Button
                            type="submit"
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold h-11 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</>
                            ) : (
                              <>Sign In <ArrowRight className="ml-1.5 w-4 h-4" /></>
                            )}
                          </Button>
                        </motion.form>
                      ) : (
                        <motion.form
                          key="phone-form"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          onSubmit={otpSent ? handleVerifyOtp : (e) => { e.preventDefault(); handleSendOtp() }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="login-phone" className="text-slate-300 text-sm">Phone Number</Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <Input
                                id="login-phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="pl-10 bg-[#0b1220] border-[#1e293b] text-white focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                placeholder="+254 712 345 678"
                                disabled={otpSent}
                                required
                              />
                            </div>
                          </div>

                          {otpSent && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="space-y-2"
                            >
                              <Label htmlFor="login-otp" className="text-slate-300 text-sm">Verification Code</Label>
                              <Input
                                id="login-otp"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="bg-[#0b1220] border-[#1e293b] text-white text-center text-lg tracking-widest focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                placeholder="Enter OTP"
                                maxLength={6}
                                required
                              />
                            </motion.div>
                          )}

                          <Button
                            type="submit"
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold h-11 shadow-lg shadow-emerald-500/20"
                            disabled={isLoading || otpLoading}
                          >
                            {otpLoading ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP...</>
                            ) : isLoading ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                            ) : otpSent ? (
                              <>Verify & Sign In <ArrowRight className="ml-1.5 w-4 h-4" /></>
                            ) : (
                              <>Send OTP <ArrowRight className="ml-1.5 w-4 h-4" /></>
                            )}
                          </Button>

                          {otpSent && (
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              className="w-full text-sm text-emerald-500 hover:text-emerald-400 transition-colors text-center"
                            >
                              Didn&apos;t receive the code? Resend
                            </button>
                          )}
                        </motion.form>
                      )}
                    </AnimatePresence>

                    {/* Divider */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-[#1e293b]" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#111827] px-3 text-slate-600">Or continue with</span>
                      </div>
                    </div>

                    {/* Google OAuth */}
                    <Button
                      variant="outline"
                      className="w-full border-[#1e293b] text-slate-300 hover:text-white hover:bg-[#1e293b]/50 h-11 transition-all"
                      onClick={handleGoogleLogin}
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign in with Google
                    </Button>

                    {/* Demo Quick Login */}
                    <div className="mt-6 pt-6 border-t border-[#1e293b]">
                      <p className="text-xs text-slate-600 mb-3 text-center flex items-center justify-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Quick Demo Login
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { role: "admin", label: "Admin", color: "text-emerald-400" },
                          { role: "member", label: "ISP", color: "text-cyan-400" },
                          { role: "client", label: "Client", color: "text-violet-400" },
                        ].map((demo) => (
                          <Button
                            key={demo.role}
                            variant="outline"
                            size="sm"
                            className="border-[#1e293b] hover:border-emerald-500/20 hover:bg-emerald-500/5 text-xs h-9 transition-all"
                            onClick={() => quickLogin(demo.role)}
                          >
                            <span className={demo.color}>{demo.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Sign Up Link */}
                    <p className="mt-5 text-center text-sm text-slate-500">
                      Don&apos;t have an account?{" "}
                      <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                        Sign up
                      </Link>
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0b1220]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
