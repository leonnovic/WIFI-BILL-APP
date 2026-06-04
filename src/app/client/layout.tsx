"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, Package, CreditCard, Receipt,
  MessageSquare, User, Wifi, LogOut, ChevronDown,
  Bell, Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

const navItems = [
  { name: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard, shortName: "Home" },
  { name: "Packages", href: "/client/packages", icon: Package, shortName: "Packages" },
  { name: "OKOA", href: "/client/okoa", icon: CreditCard, shortName: "OKOA" },
  { name: "Transactions", href: "/client/transactions", icon: Receipt, shortName: "History" },
  { name: "Support", href: "/client/support", icon: MessageSquare, shortName: "Support" },
]

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string; okoaBalance: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/client/dashboard")
        if (res.ok) {
          const json = await res.json()
          setUser({
            name: json.data?.name || "User",
            email: json.data?.email || "",
            okoaBalance: json.data?.okoaBalance || 0,
          })
        }
      } catch {
        // silently fail - user just won't see name
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" })
      router.push("/login")
      toast.success("Logged out successfully")
    } catch {
      toast.error("Failed to logout")
    }
  }

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U"

  return (
    <div className="min-h-screen flex flex-col bg-[#0b1220]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-[#0b1220]/90 backdrop-blur-xl border-b border-[#1e293b]/80">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/client/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
              <Wifi className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">ISPLedger</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-emerald-400"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-emerald-500/10 rounded-lg border border-emerald-500/20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* OKOA balance badge */}
            {!loading && user && user.okoaBalance > 0 && (
              <Link href="/client/okoa" className="hidden sm:flex">
                <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 cursor-pointer transition-colors">
                  <CreditCard className="w-3 h-3 mr-1" />
                  KES {user.okoaBalance}
                </Badge>
              </Link>
            )}

            {/* User avatar dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-white/5">
                  <Avatar className="w-7 h-7 bg-emerald-500/20 border border-emerald-500/30">
                    <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm text-slate-300 max-w-[100px] truncate">
                    {user?.name?.split(" ")[0] || "User"}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#111827] border-[#1e293b]">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-white">{user?.name || "User"}</p>
                  <p className="text-xs text-slate-500">{user?.email || ""}</p>
                </div>
                <DropdownMenuSeparator className="bg-[#1e293b]" />
                <DropdownMenuItem asChild className="text-slate-300 focus:text-white focus:bg-white/5 cursor-pointer">
                  <Link href="/client/profile"><User className="w-4 h-4 mr-2" />Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#1e293b]" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-slate-400 hover:text-white">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#0b1220] border-[#1e293b] w-72 p-0">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="p-4 border-b border-[#1e293b]">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30">
                        <AvatarFallback className="bg-emerald-500/20 text-emerald-400 font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white">{user?.name || "User"}</p>
                        <p className="text-xs text-slate-500">{user?.email || ""}</p>
                      </div>
                    </div>
                  </div>

                  {/* Nav */}
                  <nav className="flex-1 p-3 space-y-1">
                    {navItems.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            isActive
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                              : "text-slate-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          {item.name}
                        </Link>
                      )
                    })}
                    <Link
                      href="/client/profile"
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        pathname === "/client/profile"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <User className="w-5 h-5" />
                      Profile
                    </Link>
                  </nav>

                  {/* Logout */}
                  <div className="p-3 border-t border-[#1e293b]">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors w-full"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 pb-24 md:pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0b1220]/95 backdrop-blur-xl border-t border-[#1e293b]/80 pb-safe">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 ${
                  isActive ? "text-emerald-400" : "text-slate-500"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileNav"
                    className="absolute -top-1 w-8 h-1 rounded-full bg-emerald-500"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.shortName}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
