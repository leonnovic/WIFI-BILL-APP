"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wifi,
  Shield,
  Router,
  Users,
  Mail,
  Lock,
  Phone,
  User,
  Building2,
  MapPin,
  FileText,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const roles = [
  {
    id: "admin",
    title: "Admin",
    description: "System administration & full oversight",
    icon: Shield,
    color: "from-emerald-500/20 to-emerald-600/20",
  },
  {
    id: "member",
    title: "ISP Member",
    description: "Run your ISP business",
    icon: Router,
    color: "from-cyan-500/20 to-cyan-600/20",
  },
  {
    id: "client",
    title: "Client",
    description: "Access internet services",
    icon: Users,
    color: "from-violet-500/20 to-violet-600/20",
  },
]

const steps = [
  { id: 1, title: "Choose Role" },
  { id: 2, title: "Account" },
  { id: 3, title: "Profile" },
  { id: 4, title: "Business" },
  { id: 5, title: "Verified" },
]

export default function SignupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    businessName: "",
    businessRegNo: "",
    businessAddress: "",
    kraPin: "",
  })

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId)
    // Auto-advance after a short delay
    setTimeout(() => setCurrentStep(2), 300)
  }

  const handleAccountSubmit = () => {
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields")
      return
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    setCurrentStep(3)
  }

  const handleProfileSubmit = () => {
    if (!formData.name) {
      toast.error("Please enter your name")
      return
    }
    if (selectedRole === "member") {
      setCurrentStep(4)
    } else {
      // Skip business info for admin/client
      handleSignup()
    }
  }

  const handleBusinessSubmit = () => {
    if (!formData.businessName) {
      toast.error("Please enter your business name")
      return
    }
    handleSignup()
  }

  const handleSignup = async () => {
    setLoading(true)
    setCurrentStep(5) // Show verification step

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          role: selectedRole,
          businessName: formData.businessName || undefined,
          businessRegNo: formData.businessRegNo || undefined,
          businessAddress: formData.businessAddress || undefined,
          kraPin: formData.kraPin || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Signup failed")
        setCurrentStep(selectedRole === "member" ? 4 : 3)
        return
      }

      toast.success("Account created successfully!")

      // Show success animation for a moment, then redirect
      setTimeout(() => {
        router.push("/login")
      }, 2500)
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
      setCurrentStep(selectedRole === "member" ? 4 : 3)
    } finally {
      setLoading(false)
    }
  }

  const canGoBack = currentStep > 1 && currentStep < 5

  return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center px-4 py-12 relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              ISP<span className="text-emerald-400">Ledger</span>
            </span>
          </Link>
        </div>

        <Card className="bg-[#111b2e] border-white/5">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl text-white">Create Account</CardTitle>
            <CardDescription className="text-slate-400">
              Join ISPLedger and get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8 px-2">
              {steps.map((step, i) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                        currentStep >= step.id
                          ? "bg-emerald-500 text-white"
                          : "bg-[#1e293b] text-slate-500"
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 hidden sm:block">
                      {step.title}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`w-8 sm:w-12 h-0.5 mx-1 transition-all duration-300 ${
                        currentStep > step.id ? "bg-emerald-500" : "bg-[#1e293b]"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* Step 1: Choose Role */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-sm text-slate-400 mb-4 text-center">
                    Select how you want to use ISPLedger
                  </p>
                  <div className="space-y-3">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => handleRoleSelect(role.id)}
                        className={`w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-4 ${
                          selectedRole === role.id
                            ? "border-emerald-500/50 bg-emerald-500/10"
                            : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center`}
                        >
                          <role.icon className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{role.title}</div>
                          <div className="text-sm text-slate-400">{role.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Email & Password */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-slate-300 text-sm">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        className="pl-10 bg-[#0b1220] border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-slate-300 text-sm">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Min. 6 characters"
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        className="pl-10 bg-[#0b1220] border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password" className="text-slate-300 text-sm">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="Re-enter your password"
                        value={formData.confirmPassword}
                        onChange={(e) => updateField("confirmPassword", e.target.value)}
                        className="pl-10 bg-[#0b1220] border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    {canGoBack && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="border-white/10 hover:bg-white/5 text-white"
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={handleAccountSubmit}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Personal Info */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-slate-300 text-sm">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        className="pl-10 bg-[#0b1220] border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone" className="text-slate-300 text-sm">
                      Phone Number <span className="text-slate-500">(optional)</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+254 712 345 678"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        className="pl-10 bg-[#0b1220] border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      className="border-white/10 hover:bg-white/5 text-white"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleProfileSubmit}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      {selectedRole === "member" ? "Continue" : "Create Account"}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Business Info (Member only) */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 mb-2">
                    ISP Member Registration — Please provide your business details
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business-name" className="text-slate-300 text-sm">
                      Business Name
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="business-name"
                        type="text"
                        placeholder="Your ISP Company Name"
                        value={formData.businessName}
                        onChange={(e) => updateField("businessName", e.target.value)}
                        className="pl-10 bg-[#0b1220] border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business-reg" className="text-slate-300 text-sm">
                      Business Registration No. <span className="text-slate-500">(optional)</span>
                    </Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="business-reg"
                        type="text"
                        placeholder="e.g. BN-123456"
                        value={formData.businessRegNo}
                        onChange={(e) => updateField("businessRegNo", e.target.value)}
                        className="pl-10 bg-[#0b1220] border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business-address" className="text-slate-300 text-sm">
                      Business Address <span className="text-slate-500">(optional)</span>
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="business-address"
                        type="text"
                        placeholder="Nairobi, Kenya"
                        value={formData.businessAddress}
                        onChange={(e) => updateField("businessAddress", e.target.value)}
                        className="pl-10 bg-[#0b1220] border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kra-pin" className="text-slate-300 text-sm">
                      KRA PIN <span className="text-slate-500">(optional)</span>
                    </Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="kra-pin"
                        type="text"
                        placeholder="e.g. A123456789X"
                        value={formData.kraPin}
                        onChange={(e) => updateField("kraPin", e.target.value)}
                        className="pl-10 bg-[#0b1220] border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(3)}
                      className="border-white/10 hover:bg-white/5 text-white"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleBusinessSubmit}
                      disabled={loading}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Verification (Auto-pass) */}
              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl font-bold text-white mb-2"
                  >
                    Account Created!
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-slate-400 mb-2"
                  >
                    Your email and phone have been verified automatically.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-sm text-slate-500 mb-8"
                  >
                    Redirecting you to the login page...
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <Link href="/login">
                      <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                        Go to Login
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom link */}
            {currentStep < 5 && (
              <p className="text-center text-sm text-slate-400 mt-6">
                Already have an account?{" "}
                <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
