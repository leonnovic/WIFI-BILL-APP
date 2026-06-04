"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
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
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const roles = [
  {
    id: "admin",
    title: "Admin",
    description: "System administration & full oversight",
    icon: Shield,
    gradient: "from-emerald-500/20 to-emerald-600/10",
    iconColor: "text-emerald-400",
  },
  {
    id: "member",
    title: "ISP Member",
    description: "Run your ISP business efficiently",
    icon: Router,
    gradient: "from-cyan-500/20 to-cyan-600/10",
    iconColor: "text-cyan-400",
  },
  {
    id: "client",
    title: "Client",
    description: "Access internet services & manage account",
    icon: Users,
    gradient: "from-violet-500/20 to-violet-600/10",
    iconColor: "text-violet-400",
  },
]

const steps = [
  { id: 1, title: "Choose Role" },
  { id: 2, title: "Account" },
  { id: 3, title: "Profile" },
  { id: 4, title: "Business" },
  { id: 5, title: "Verified" },
]

/* ─────── Password Strength ─────── */
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const levels: Record<number, { label: string; color: string }> = {
    0: { label: "", color: "" },
    1: { label: "Very Weak", color: "bg-red-500" },
    2: { label: "Weak", color: "bg-orange-500" },
    3: { label: "Fair", color: "bg-yellow-500" },
    4: { label: "Strong", color: "bg-emerald-500" },
    5: { label: "Very Strong", color: "bg-emerald-400" },
  }
  return { score, ...levels[score] }
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */
export default function SignupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [emailChecking, setEmailChecking] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
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

  // Debounced email availability check
  useEffect(() => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setEmailAvailable(null)
      return
    }
    const timer = setTimeout(async () => {
      setEmailChecking(true)
      try {
        const res = await fetch(`/api/auth/signup?checkEmail=${encodeURIComponent(formData.email)}`)
        const data = await res.json()
        setEmailAvailable(data.available)
      } catch {
        setEmailAvailable(null)
      }
      setEmailChecking(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [formData.email])

  const passwordStrength = getPasswordStrength(formData.password)

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId)
    setTimeout(() => setCurrentStep(2), 300)
  }

  const handleAccountSubmit = () => {
    if (!formData.email) {
      toast.error("Please enter your email")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address")
      return
    }
    if (emailAvailable === false) {
      toast.error("This email is already registered. Please use a different email or sign in.")
      return
    }
    if (!formData.password) {
      toast.error("Please enter a password")
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
    if (!termsAccepted) {
      toast.error("Please accept the Terms & Conditions")
      return
    }
    setCurrentStep(3)
  }

  const handleProfileSubmit = () => {
    if (!formData.name) {
      toast.error("Please enter your name")
      return
    }
    // Phone validation if provided
    if (formData.phone) {
      const phoneClean = formData.phone.replace(/\s/g, "")
      if (!/^\+?254\d{9}$/.test(phoneClean) && !/^07\d{8}$/.test(phoneClean)) {
        toast.error("Please enter a valid Kenyan phone number (e.g., +254 712 345 678)")
        return
      }
    }
    if (selectedRole === "member") {
      setCurrentStep(4)
    } else {
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
    setCurrentStep(5)

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

      // Auto-login after signup
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        role: selectedRole,
        redirect: false,
      })

      await new Promise(resolve => setTimeout(resolve, 800))

      if (result?.ok) {
        const redirectMap: Record<string, string> = {
          admin: "/admin/dashboard",
          member: "/member/dashboard",
          client: "/client/dashboard",
        }
        window.location.href = redirectMap[selectedRole] || "/client/dashboard"
      } else {
        // Fallback to login page
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
      setCurrentStep(selectedRole === "member" ? 4 : 3)
    } finally {
      setLoading(false)
    }
  }

  const canGoBack = currentStep > 1 && currentStep < 5

  const stepVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  }

  return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute inset-0 noise-overlay" />
      <motion.div
        className="absolute top-1/3 -right-32 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px]"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/3 -left-32 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px]"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              ISP<span className="text-emerald-400">Ledger</span>
            </span>
          </Link>
        </motion.div>

        <Card className="bg-[#111827]/90 backdrop-blur-xl border-white/5 shadow-2xl shadow-black/20">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl text-white">Create Account</CardTitle>
            <CardDescription className="text-slate-400">
              Join ISPLedger and get started in minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8 px-1">
              {steps.map((step, i) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={{
                        scale: currentStep === step.id ? 1.1 : 1,
                        backgroundColor: currentStep >= step.id ? "#10b981" : "#1e293b",
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                    >
                      {currentStep > step.id ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <span className={currentStep >= step.id ? "text-white" : "text-slate-500"}>
                          {step.id}
                        </span>
                      )}
                    </motion.div>
                    <span className="text-[10px] text-slate-500 mt-1.5 hidden sm:block">
                      {step.title}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <motion.div
                      animate={{
                        backgroundColor: currentStep > step.id ? "#10b981" : "#1e293b",
                      }}
                      className="w-6 sm:w-12 h-0.5 mx-1.5"
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
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-sm text-slate-400 mb-4 text-center">
                    Select how you want to use ISPLedger
                  </p>
                  <div className="space-y-3">
                    {roles.map((role) => (
                      <motion.button
                        key={role.id}
                        onClick={() => handleRoleSelect(role.id)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-4 ${
                          selectedRole === role.id
                            ? "border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/5"
                            : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center`}>
                          <role.icon className={`w-6 h-6 ${role.iconColor}`} />
                        </div>
                        <div>
                          <div className="font-medium text-white">{role.title}</div>
                          <div className="text-sm text-slate-400">{role.description}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 ml-auto" />
                      </motion.button>
                    ))}
                  </div>

                  {/* Google Sign Up */}
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/5" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-[#111827] px-3 text-slate-600">Or sign up with</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-white/10 text-slate-300 hover:text-white hover:bg-white/5 h-11"
                    onClick={() => signIn("google", { callbackUrl: "/client/dashboard" })}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign up with Google
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Email & Password */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Email with availability check */}
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
                        className="pl-10 pr-10 bg-[#0b1220] border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      />
                      {emailChecking && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 animate-spin" />
                      )}
                      {!emailChecking && emailAvailable === true && formData.email && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                      )}
                      {!emailChecking && emailAvailable === false && formData.email && (
                        <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                      )}
                    </div>
                    {!emailChecking && emailAvailable === false && formData.email && (
                      <p className="text-xs text-red-400">This email is already registered</p>
                    )}
                    {!emailChecking && emailAvailable === true && formData.email && (
                      <p className="text-xs text-emerald-400">Email is available</p>
                    )}
                  </div>

                  {/* Password with strength indicator */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-slate-300 text-sm">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        className="pl-10 pr-10 bg-[#0b1220] border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Password strength bar */}
                    {formData.password && (
                      <div className="space-y-1.5">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                                passwordStrength.score >= level ? passwordStrength.color : "bg-slate-700"
                              }`}
                            />
                          ))}
                        </div>
                        {passwordStrength.label && (
                          <p className={`text-xs ${
                            passwordStrength.score >= 4 ? "text-emerald-400" :
                            passwordStrength.score >= 3 ? "text-yellow-400" :
                            "text-red-400"
                          }`}>
                            {passwordStrength.label}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password" className="text-slate-300 text-sm">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your password"
                        value={formData.confirmPassword}
                        onChange={(e) => updateField("confirmPassword", e.target.value)}
                        className="pl-10 pr-10 bg-[#0b1220] border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="text-xs text-red-400">Passwords do not match</p>
                    )}
                    {formData.confirmPassword && formData.password === formData.confirmPassword && (
                      <p className="text-xs text-emerald-400">Passwords match</p>
                    )}
                  </div>

                  {/* Terms & Conditions */}
                  <div className="flex items-start gap-2 pt-1">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                      className="mt-0.5 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    />
                    <Label htmlFor="terms" className="text-sm text-slate-400 cursor-pointer leading-snug">
                      I agree to the{" "}
                      <a href="#" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Terms of Service</a>
                      {" "}and{" "}
                      <a href="#" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Privacy Policy</a>
                    </Label>
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
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
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
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
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
                    <p className="text-xs text-slate-600">Format: +254 7XX XXX XXX</p>
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
                      disabled={loading}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Account...</>
                      ) : (
                        <>
                          {selectedRole === "member" ? "Continue" : "Create Account"}
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Business Info (Member only) */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
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
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Account...</>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Verification / Success */}
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
                    Your account has been created successfully.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-sm text-slate-500 mb-8"
                  >
                    Signing you in and redirecting...
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-4" />
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
              <p className="text-center text-sm text-slate-500 mt-6">
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
