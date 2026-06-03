"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Package, CreditCard, Receipt, MessageSquare, User, Menu, X, Wifi, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

const navItems = [
  { name: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard },
  { name: "Buy Package", href: "/client/packages", icon: Package },
  { name: "OKOA Internet", href: "/client/okoa", icon: CreditCard },
  { name: "Transactions", href: "/client/transactions", icon: Receipt },
  { name: "Support", href: "/client/support", icon: MessageSquare },
  { name: "Profile", href: "/client/profile", icon: User },
]

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await fetch("/api/auth/signout", { method: "POST" })
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b1220]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-[#0b1220]/95 backdrop-blur-sm border-b border-[#1e293b]">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20">
              <Wifi className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-lg font-bold text-white">ISPLedger</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "text-gray-400 hover:text-white hover:bg-[#1e293b]"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>

            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-gray-400 hover:text-white">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#0b1220] border-[#1e293b] w-64">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20">
                      <Wifi className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="text-lg font-bold text-white">ISPLedger</span>
                  </div>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "text-gray-400 hover:text-white hover:bg-[#1e293b]"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.name}
                      </Link>
                    )
                  })}
                </nav>
                <div className="mt-8 pt-4 border-t border-[#1e293b]">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-[#1e293b] transition-colors w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden sticky bottom-0 bg-[#0b1220]/95 backdrop-blur-sm border-t border-[#1e293b] px-2 py-1">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                  isActive ? "text-emerald-400" : "text-gray-500"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name.split(" ")[0]}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
