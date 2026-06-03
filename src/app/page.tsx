"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import {
  Wifi,
  Shield,
  Zap,
  BarChart3,
  Users,
  CreditCard,
  HeadphonesIcon,
  ChevronRight,
  Globe,
  CheckCircle2,
  ArrowRight,
  Router,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b1220] text-white overflow-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 glass"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Wifi className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                ISP<span className="text-emerald-400">Ledger</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                Features
              </a>
              <a href="#portals" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                Portals
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-8">
              <Zap className="w-4 h-4" />
              <span>Professional ISP Management Platform</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            WiFi Billing
            <br />
            <span className="gradient-text">Made Simple</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10"
          >
            The complete ISP management solution. Manage clients, packages, routers,
            payments, and support tickets — all in one powerful platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/signup">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 h-12 text-base">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="border-white/10 hover:bg-white/5 px-8 h-12 text-base">
                See Features
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-3xl mx-auto"
          >
            {[
              { value: "10K+", label: "Active Users" },
              { value: "500+", label: "ISP Providers" },
              { value: "99.9%", label: "Uptime" },
              { value: "24/7", label: "Support" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-emerald-400">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Three Portal Cards */}
      <section id="portals" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your <span className="gradient-text">Portal</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-slate-400 max-w-xl mx-auto">
              Three powerful interfaces tailored for every role in your ISP ecosystem
            </motion.p>
          </motion.div>

          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-3 gap-6">
            {/* Admin */}
            <motion.div variants={fadeInUp}>
              <Card className="bg-[#111b2e] border-white/5 hover:border-emerald-500/30 transition-all duration-300 group h-full">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 transition-colors">
                    <Shield className="w-6 h-6 text-emerald-400" />
                  </div>
                  <CardTitle className="text-xl text-white">Admin Portal</CardTitle>
                  <CardDescription className="text-slate-400">Complete system control and oversight</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {["User management & roles", "System configuration", "Revenue analytics", "Global settings & oversight", "API key management", "Webhook integrations"].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/login">
                    <Button className="w-full mt-6 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20">
                      Admin Login <ChevronRight className="ml-1 w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* ISP Member */}
            <motion.div variants={fadeInUp}>
              <Card className="bg-[#111b2e] border-emerald-500/30 transition-all duration-300 group h-full animate-pulse-glow relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 rounded-full text-xs font-semibold text-white">
                  Most Popular
                </div>
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 transition-colors">
                    <Router className="w-6 h-6 text-emerald-400" />
                  </div>
                  <CardTitle className="text-xl text-white">ISP Member Portal</CardTitle>
                  <CardDescription className="text-slate-400">Run your ISP business efficiently</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {["Client management", "Package & pricing setup", "MikroTik router management", "M-Pesa payment integration", "Support ticket system", "Business analytics"].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/login">
                    <Button className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 text-white">
                      Member Login <ChevronRight className="ml-1 w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Client */}
            <motion.div variants={fadeInUp}>
              <Card className="bg-[#111b2e] border-white/5 hover:border-emerald-500/30 transition-all duration-300 group h-full">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 transition-colors">
                    <Users className="w-6 h-6 text-emerald-400" />
                  </div>
                  <CardTitle className="text-xl text-white">Client Portal</CardTitle>
                  <CardDescription className="text-slate-400">Self-service for internet users</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {["View & purchase packages", "M-Pesa instant payments", "Okoa Internet - buy now pay later", "Usage tracking", "Support ticket submission", "Account management"].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/login">
                    <Button className="w-full mt-6 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20">
                      Client Login <ChevronRight className="ml-1 w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to <span className="gradient-text">Succeed</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-slate-400 max-w-xl mx-auto">
              Powerful features designed specifically for ISP businesses
            </motion.p>
          </motion.div>

          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: CreditCard, title: "M-Pesa Integration", description: "Seamless payment processing with M-Pesa STK push, C2B, and paybill integration." },
              { icon: Router, title: "MikroTik Management", description: "Direct router API integration for hotspot, PPPoE, and bandwidth management." },
              { icon: Zap, title: "Okoa Internet", description: "Built-in credit system allowing clients to access internet now and pay later." },
              { icon: BarChart3, title: "Real-time Analytics", description: "Comprehensive dashboards with revenue, usage, and growth metrics." },
              { icon: HeadphonesIcon, title: "Support System", description: "Full ticketing system with priority management and assignment tracking." },
              { icon: Globe, title: "API & Webhooks", description: "RESTful API and webhook support for custom integrations and automations." },
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className="bg-[#111b2e] border-white/5 hover:border-emerald-500/20 transition-all duration-300 h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2">
                      <feature.icon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <CardTitle className="text-lg text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-400">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20" />
            <div className="absolute inset-0 bg-[#111b2e]/80" />
            <div className="relative px-8 py-16 text-center border border-white/5 rounded-2xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to <span className="gradient-text">Transform</span> Your ISP?
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto mb-8">
                Join hundreds of ISP providers who trust ISPLedger to manage their business.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 h-12 text-base">
                    Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white/10 hover:bg-white/5 px-8 h-12 text-base">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">ISP<span className="text-emerald-400">Ledger</span></span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
          <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} ISPLedger. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
