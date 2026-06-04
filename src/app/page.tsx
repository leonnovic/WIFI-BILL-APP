"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, useInView, useScroll, useTransform } from "framer-motion"
import {
  Wifi,
  Shield,
  Zap,
  BarChart3,
  Users,
  CreditCard,
  ChevronRight,
  Globe,
  CheckCircle2,
  ArrowRight,
  Router,
  Sparkles,
  Phone,
  TrendingUp,
  Building2,
  Menu,
  X,
  Twitter,
  Github,
  Linkedin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/* ─────────── Animation Variants ─────────── */
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
}

/* ─────────── Animated Counter Hook ─────────── */
function useCounter(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (startOnView && !isInView) return
    let startTime: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setCount(Math.floor(eased * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [end, duration, isInView, startOnView])

  return { count, ref }
}

/* ─────────── Animated Stats ─────────── */
function AnimatedStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { count, ref } = useCounter(value)
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-emerald-400 tabular-nums">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  )
}

/* ─────────── WiFi Signal SVG ─────────── */
function WifiSignalGraphic() {
  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96 mx-auto">
      {/* Outer rotating ring */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <circle cx="200" cy="200" r="180" fill="none" stroke="url(#grad1)" strokeWidth="0.5" strokeDasharray="8 12" opacity="0.4" />
          <circle cx="200" cy="200" r="150" fill="none" stroke="url(#grad1)" strokeWidth="0.5" strokeDasharray="6 10" opacity="0.3" />
          <circle cx="200" cy="200" r="120" fill="none" stroke="url(#grad1)" strokeWidth="0.5" strokeDasharray="4 8" opacity="0.2" />
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Pulsing center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500/40 flex items-center justify-center">
            <Wifi className="w-5 h-5 text-emerald-400" />
          </div>
        </motion.div>
      </div>

      {/* WiFi arcs */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="280" height="280" viewBox="0 0 280 280" className="opacity-30">
            <path d="M80 170 Q140 100 200 170" fill="none" stroke="#10b981" strokeWidth="2" />
            <path d="M55 200 Q140 70 225 200" fill="none" stroke="#10b981" strokeWidth="1.5" />
            <path d="M30 230 Q140 40 250 230" fill="none" stroke="#10b981" strokeWidth="1" />
          </svg>
        </motion.div>
      </div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400/60"
          style={{
            left: `${30 + Math.random() * 40}%`,
            top: `${30 + Math.random() * 40}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  )
}

/* ─────────── Features Data ─────────── */
const features = [
  {
    icon: Users,
    title: "Client Management",
    description: "Track and manage all your clients in one place with detailed profiles, subscription history, and real-time status monitoring.",
    color: "from-emerald-500/20 to-emerald-600/10",
  },
  {
    icon: CreditCard,
    title: "Package Management",
    description: "Create and sell internet packages with flexible pricing, bandwidth limits, and duration options tailored to your market.",
    color: "from-cyan-500/20 to-cyan-600/10",
  },
  {
    icon: Phone,
    title: "M-Pesa Payments",
    description: "Automated payment processing via M-Pesa STK Push, C2B, and paybill integration. Instant activation on payment.",
    color: "from-violet-500/20 to-violet-600/10",
  },
  {
    icon: Router,
    title: "MikroTik Integration",
    description: "Real-time router management and monitoring with direct API integration for hotspot, PPPoE, and bandwidth control.",
    color: "from-amber-500/20 to-amber-600/10",
  },
  {
    icon: Zap,
    title: "OKOA Internet",
    description: "Credit-based internet access for your clients. Buy now, pay later with automated repayment collection via M-Pesa.",
    color: "from-rose-500/20 to-rose-600/10",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Revenue tracking, growth metrics, and business insights with comprehensive dashboards and exportable reports.",
    color: "from-teal-500/20 to-teal-600/10",
  },
]

/* ─────────── Portals Data ─────────── */
const portals = [
  {
    icon: Shield,
    title: "Admin Portal",
    subtitle: "Full platform oversight",
    description: "Complete system control with user management, global configuration, revenue analytics, and API management.",
    features: ["User management & roles", "System configuration", "Revenue analytics", "Global settings & oversight", "API key management", "Webhook integrations"],
    cta: "Admin Login",
    popular: false,
    color: "emerald",
  },
  {
    icon: Building2,
    title: "ISP/Member Portal",
    subtitle: "Business management tools",
    description: "Run your ISP business efficiently with client management, MikroTik integration, and M-Pesa payments.",
    features: ["Client management", "Package & pricing setup", "MikroTik router management", "M-Pesa payment integration", "Support ticket system", "Business analytics"],
    cta: "Member Login",
    popular: true,
    color: "cyan",
  },
  {
    icon: Users,
    title: "Client Portal",
    subtitle: "Self-service internet access",
    description: "Empower your clients with self-service package purchases, payments, OKOA credit, and support.",
    features: ["View & purchase packages", "M-Pesa instant payments", "Okoa Internet - buy now pay later", "Usage tracking", "Support ticket submission", "Account management"],
    cta: "Client Login",
    popular: false,
    color: "violet",
  },
]

/* ─────────── Pricing Data ─────────── */
const pricing = [
  {
    tier: "Starter",
    price: "2,999",
    period: "/mo",
    description: "Perfect for small ISPs just getting started",
    features: ["Up to 100 clients", "1 MikroTik router", "M-Pesa integration", "Basic analytics", "Email support"],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    tier: "Business",
    price: "9,999",
    period: "/mo",
    description: "For growing ISPs that need more power",
    features: ["Up to 1,000 clients", "10 MikroTik routers", "M-Pesa + OKOA Internet", "Advanced analytics", "Priority support", "Custom branding", "API access"],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    tier: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large ISPs with custom requirements",
    features: ["Unlimited clients", "Unlimited routers", "Full feature suite", "Dedicated account manager", "SLA guarantee", "Custom integrations", "White-label options"],
    cta: "Contact Sales",
    popular: false,
  },
]

/* ═══════════════ MAIN COMPONENT ═══════════════ */
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <div className="min-h-screen bg-[#0b1220] text-white overflow-x-hidden">
      {/* ──────── Navigation ──────── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 glass"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Wifi className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                ISP<span className="text-emerald-400">Ledger</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Features</a>
              <a href="#portals" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Portals</a>
              <a href="#pricing" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Pricing</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-slate-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/5"
          >
            <div className="px-4 py-4 space-y-3">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-slate-400 hover:text-emerald-400 py-2">Features</a>
              <a href="#portals" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-slate-400 hover:text-emerald-400 py-2">Portals</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-slate-400 hover:text-emerald-400 py-2">Pricing</a>
              <div className="pt-2 space-y-2">
                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full border-white/10 text-slate-300">Sign In</Button>
                </Link>
                <Link href="/signup" className="block">
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">Get Started</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* ──────── Hero Section ──────── */}
      <section ref={heroRef} className="relative pt-28 sm:pt-36 pb-20 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute inset-0 noise-overlay" />

        {/* Animated gradient orbs */}
        <motion.div
          style={{ y: heroY }}
          className="absolute top-1/4 left-[10%] w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.1, 1], x: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          style={{ y: heroY }}
          className="absolute bottom-1/4 right-[10%] w-[400px] h-[400px] bg-cyan-500/6 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.15, 1], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/3 rounded-full blur-[150px]"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div style={{ opacity: heroOpacity }} className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Content */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-8">
                  <Sparkles className="w-4 h-4" />
                  <span>Professional ISP Management Platform</span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight"
              >
                WiFi Billing &<br />
                ISP Management,{" "}
                <span className="gradient-text">Simplified</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg sm:text-xl text-slate-400 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed"
              >
                The all-in-one platform for ISPs to manage clients, packages, payments, and routers. Powered by M-Pesa and MikroTik.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <Link href="/signup">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 h-13 text-base font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 group">
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white/10 hover:bg-white/5 px-8 h-13 text-base group">
                    Login
                    <ChevronRight className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Right - WiFi Signal Graphic */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="hidden lg:block"
            >
              <WifiSignalGraphic />
            </motion.div>
          </div>

          {/* Animated Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-3xl mx-auto"
          >
            <AnimatedStat value={500} suffix="+" label="ISPs" />
            <AnimatedStat value={50} suffix="K+" label="Clients" />
            <AnimatedStat value={1} suffix="M+" label="Transactions" />
            <AnimatedStat value={99} suffix=".9%" label="Uptime" />
          </motion.div>
        </motion.div>
      </section>

      {/* ──────── Trusted By Bar (decorative) ──────── */}
      <section className="py-12 px-4 border-y border-white/5">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
          className="max-w-7xl mx-auto text-center"
        >
          <motion.p variants={fadeInUp} className="text-sm text-slate-600 mb-6 uppercase tracking-widest">Trusted by ISPs across Africa</motion.p>
          <div className="flex items-center justify-center gap-8 md:gap-16 text-slate-700">
            {["FastNet", "SafariConnect", "MikroLink", "NetWave", "AfiConnect"].map((name) => (
              <span key={name} className="text-lg font-semibold tracking-wider">{name}</span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ──────── Features Grid ──────── */}
      <section id="features" className="py-24 px-4 relative">
        <div className="absolute inset-0 mesh-gradient opacity-50" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs mb-4">
              <Zap className="w-3 h-3" />
              Features
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              Everything You Need to{" "}
              <span className="gradient-text">Succeed</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-slate-400 max-w-xl mx-auto text-lg">
              Powerful features designed specifically for ISP businesses in Africa and beyond
            </motion.p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className="bg-[#111827]/80 border-white/5 hover:border-emerald-500/20 transition-all duration-500 h-full group hover:shadow-lg hover:shadow-emerald-500/5 backdrop-blur-sm">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <CardTitle className="text-lg text-white group-hover:text-emerald-300 transition-colors">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ──────── Three Portals Section ──────── */}
      <section id="portals" className="py-24 px-4 relative">
        <div className="absolute inset-0 noise-overlay" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs mb-4">
              <Globe className="w-3 h-3" />
              Portals
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              Choose Your <span className="gradient-text">Portal</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-slate-400 max-w-xl mx-auto text-lg">
              Three powerful interfaces tailored for every role in your ISP ecosystem
            </motion.p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6 lg:gap-8"
          >
            {portals.map((portal, i) => (
              <motion.div key={i} variants={fadeInUp} className="relative">
                {portal.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="px-4 py-1.5 bg-emerald-500 rounded-full text-xs font-bold text-white shadow-lg shadow-emerald-500/30">
                      Most Popular
                    </div>
                  </div>
                )}
                <Card className={`bg-[#111827]/80 backdrop-blur-sm transition-all duration-500 h-full group ${
                  portal.popular
                    ? "border-emerald-500/30 shadow-lg shadow-emerald-500/10 animate-pulse-glow"
                    : "border-white/5 hover:border-emerald-500/20"
                }`}>
                  <CardHeader className="pb-4">
                    <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 transition-colors">
                      <portal.icon className="w-7 h-7 text-emerald-400" />
                    </div>
                    <CardTitle className="text-xl text-white">{portal.title}</CardTitle>
                    <CardDescription className="text-slate-400">{portal.subtitle}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-400 mb-5 leading-relaxed">{portal.description}</p>
                    <ul className="space-y-2.5 mb-6">
                      {portal.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-2.5 text-sm text-slate-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link href="/login">
                      <Button className={`w-full ${
                        portal.popular
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                      }`}>
                        {portal.cta}
                        <ChevronRight className="ml-1 w-4 h-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ──────── Pricing Section ──────── */}
      <section id="pricing" className="py-24 px-4 relative">
        <div className="absolute inset-0 mesh-gradient opacity-30" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs mb-4">
              <TrendingUp className="w-3 h-3" />
              Pricing
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              Simple, Transparent <span className="gradient-text">Pricing</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-slate-400 max-w-xl mx-auto text-lg">
              Start free and scale as your ISP grows. No hidden fees, cancel anytime.
            </motion.p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto"
          >
            {pricing.map((plan, i) => (
              <motion.div key={i} variants={fadeInUp} className="relative">
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="px-4 py-1.5 bg-emerald-500 rounded-full text-xs font-bold text-white shadow-lg shadow-emerald-500/30">
                      Most Popular
                    </div>
                  </div>
                )}
                <Card className={`bg-[#111827]/80 backdrop-blur-sm transition-all duration-500 h-full ${
                  plan.popular
                    ? "border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                    : "border-white/5 hover:border-emerald-500/20"
                }`}>
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg text-slate-300">{plan.tier}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-white">KES {plan.price}</span>
                      <span className="text-slate-500">{plan.period}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">{plan.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-2.5 text-sm text-slate-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link href="/signup">
                      <Button className={`w-full ${
                        plan.popular
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                      }`}>
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ──────── CTA Section ──────── */}
      <section className="py-24 px-4 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-3xl overflow-hidden"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-emerald-500/5" />
            <div className="absolute inset-0 bg-[#111827]/80" />
            <div className="absolute inset-0 grid-bg opacity-30" />

            <div className="relative px-8 py-20 text-center border border-white/5 rounded-3xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"
              >
                <Sparkles className="w-8 h-8 text-emerald-400" />
              </motion.div>

              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
                Ready to{" "}
                <span className="gradient-text">Transform</span>{" "}
                Your ISP?
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto mb-8 text-lg">
                Join hundreds of ISP providers who trust ISPLedger to manage their business. Get started in minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 h-13 text-base font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 group">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white/10 hover:bg-white/5 px-10 h-13 text-base">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ──────── Footer ──────── */}
      <footer className="border-t border-white/5 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="inline-flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">ISP<span className="text-emerald-400">Ledger</span></span>
              </Link>
              <p className="text-sm text-slate-500 leading-relaxed">
                The complete ISP management platform for modern internet service providers.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Product</h4>
              <ul className="space-y-2.5">
                {["Features", "Pricing", "Portals", "API Docs"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-slate-500 hover:text-emerald-400 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Company</h4>
              <ul className="space-y-2.5">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-slate-500 hover:text-emerald-400 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Legal</h4>
              <ul className="space-y-2.5">
                {["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-slate-500 hover:text-emerald-400 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              &copy; {new Date().getFullYear()} ISPLedger. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-600 hover:text-emerald-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-600 hover:text-emerald-400 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-600 hover:text-emerald-400 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
