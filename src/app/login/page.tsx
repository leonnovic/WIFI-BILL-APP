"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Wifi, Eye, EyeOff, Loader2, Shield, Building2, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("client")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const roleMap: Record<string, string> = {
    admin: "admin",
    member: "member",
    client: "client",
  }

  const handleLogin = async (e: React.FormEvent) => {
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
      
      // Check if session was created
      const sessionRes = await fetch("/api/auth/session")
      const session = await sessionRes.json()
      
      if (session?.user) {
        toast.success("Login successful!")
        const userRole = (session.user as any)?.role || activeTab
        const redirectMap: Record<string, string> = {
          admin: "/admin/dashboard",
          member: "/member/dashboard",
          client: "/client/dashboard",
        }
        // Use window.location for hard redirect to ensure middleware picks up the session
        window.location.href = redirectMap[userRole] || redirectMap[activeTab] || "/client/dashboard"
        return
      }
      
      // If no session, check for error
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.error("Invalid credentials. Please try again.")
      }
    } catch (err) {
      toast.error("An error occurred during login")
    }
    setIsLoading(false)
  }

  const handleGoogleLogin = async () => {
    signIn("google", { callbackUrl: "/client/dashboard" })
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
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-500/20 mx-auto mb-4">
            <Wifi className="w-7 h-7 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">ISPLedger</h1>
          <p className="text-gray-400 mt-2">WiFi Billing & ISP Management</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-[#111827] border border-[#1e293b] mb-4">
            <TabsTrigger value="admin" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-gray-400">
              <Shield className="w-4 h-4 mr-1" /> Admin
            </TabsTrigger>
            <TabsTrigger value="member" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-gray-400">
              <Building2 className="w-4 h-4 mr-1" /> ISP
            </TabsTrigger>
            <TabsTrigger value="client" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-gray-400">
              <User className="w-4 h-4 mr-1" /> Client
            </TabsTrigger>
          </TabsList>

          {["admin", "member", "client"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <Card className="bg-[#111827] border-[#1e293b]">
                <CardHeader>
                  <CardTitle className="text-xl text-white text-center">
                    {tab === "admin" ? "Admin Login" : tab === "member" ? "ISP Member Login" : "Client Login"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Email</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-[#0b1220] border-[#1e293b] text-white"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Password</Label>
                        <button type="button" className="text-xs text-emerald-500 hover:text-emerald-400">
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-[#0b1220] border-[#1e293b] text-white pr-10"
                          placeholder="Enter your password"
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Sign In
                    </Button>
                  </form>

                  {/* Google OAuth */}
                  <div className="mt-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-[#1e293b]" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#111827] px-2 text-gray-500">Or continue with</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4 border-[#1e293b] text-gray-300 hover:text-white hover:bg-[#1e293b]"
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
                  </div>

                  {/* Demo Quick Login */}
                  <div className="mt-6 pt-6 border-t border-[#1e293b]">
                    <p className="text-xs text-gray-500 mb-3 text-center">Quick Demo Login</p>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#1e293b] text-gray-300 hover:text-white hover:bg-[#1e293b] text-xs"
                        onClick={() => quickLogin("admin")}
                      >
                        Admin
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#1e293b] text-gray-300 hover:text-white hover:bg-[#1e293b] text-xs"
                        onClick={() => quickLogin("member")}
                      >
                        ISP
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#1e293b] text-gray-300 hover:text-white hover:bg-[#1e293b] text-xs"
                        onClick={() => quickLogin("client")}
                      >
                        Client
                      </Button>
                    </div>
                  </div>

                  {/* Sign Up Link */}
                  <p className="mt-4 text-center text-sm text-gray-400">
                    Don&apos;t have an account?{" "}
                    <a href="/signup" className="text-emerald-500 hover:text-emerald-400 font-medium">
                      Sign up
                    </a>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
