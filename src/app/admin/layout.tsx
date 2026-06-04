"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCircle,
  Package,
  ArrowLeftRight,
  Router,
  Ticket,
  MessageSquare,
  Key,
  Webhook,
  Settings,
  Shield,
  ChevronLeft,
  Menu,
  LogOut,
  Wifi,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, color: "text-blue-400" },
  { name: "Users", href: "/admin/users", icon: Users, color: "text-rose-400" },
  { name: "ISP Members", href: "/admin/members", icon: Building2, color: "text-amber-400" },
  { name: "Clients", href: "/admin/clients", icon: UserCircle, color: "text-purple-400" },
  { name: "Packages", href: "/admin/packages", icon: Package, color: "text-cyan-400" },
  { name: "Transactions", href: "/admin/transactions", icon: ArrowLeftRight, color: "text-emerald-400" },
  { name: "Routers", href: "/admin/routers", icon: Router, color: "text-orange-400" },
  { name: "Tickets", href: "/admin/tickets", icon: Ticket, color: "text-pink-400" },
  { name: "Messages", href: "/admin/messages", icon: MessageSquare, color: "text-teal-400" },
  { name: "API Keys", href: "/admin/api-keys", icon: Key, color: "text-yellow-400" },
  { name: "Webhooks", href: "/admin/webhooks", icon: Webhook, color: "text-lime-400" },
  { name: "Settings", href: "/admin/settings", icon: Settings, color: "text-slate-400" },
  { name: "Auth Providers", href: "/admin/auth-providers", icon: Shield, color: "text-red-400" },
]

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userName = session?.user?.name || "Admin User"
  const userEmail = session?.user?.email || "admin@ispledger.com"
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex h-full flex-col bg-[#0a0f1a]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-[#1e293b]">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
          <Wifi className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                ISPLedger
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <TooltipProvider key={item.name} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "text-slate-400 hover:bg-[#1e293b]/50 hover:text-slate-200"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-emerald-400"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <item.icon
                      className={cn(
                        "w-5 h-5 shrink-0 transition-colors",
                        isActive ? item.color : "group-hover:text-slate-200"
                      )}
                    />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="truncate"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="bg-[#1e293b] text-white border-[#334155]">
                    {item.name}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-[#1e293b] p-3">
        <div className={cn("flex items-center gap-3 rounded-xl p-2 hover:bg-[#1e293b]/50 transition-colors", collapsed && "justify-center")}>
          <Avatar className="h-9 w-9 border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <AvatarFallback className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400 text-sm font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-semibold text-white truncate">{userName}</p>
                <p className="text-xs text-slate-500 truncate">{userEmail}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <form action="/api/auth/signout" method="POST">
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b1220]">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-[#1e293b] transition-all duration-300 relative",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        <SidebarContent collapsed={collapsed} />
        <div className="border-t border-[#1e293b] p-2 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full h-8 text-slate-500 hover:text-white hover:bg-[#1e293b]/50 transition-colors"
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform duration-300", collapsed && "rotate-180")} />
          </Button>
        </div>
      </aside>

      {/* Mobile Header + Sheet */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex h-14 items-center gap-3 border-b border-[#1e293b] px-4 bg-[#0a0f1a]">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white shrink-0">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-[#0a0f1a] border-[#1e293b]">
              <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
              <Wifi className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              ISPLedger
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
