"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "ISP Members", href: "/admin/members", icon: Building2 },
  { name: "Clients", href: "/admin/clients", icon: UserCircle },
  { name: "Packages", href: "/admin/packages", icon: Package },
  { name: "Transactions", href: "/admin/transactions", icon: ArrowLeftRight },
  { name: "Routers", href: "/admin/routers", icon: Router },
  { name: "Tickets", href: "/admin/tickets", icon: Ticket },
  { name: "Messages", href: "/admin/messages", icon: MessageSquare },
  { name: "API Keys", href: "/admin/api-keys", icon: Key },
  { name: "Webhooks", href: "/admin/webhooks", icon: Webhook },
  { name: "Settings", href: "/admin/settings", icon: Settings },
  { name: "Auth Providers", href: "/admin/auth-providers", icon: Shield },
]

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-4 border-b border-[#1e293b]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500">
          <Wifi className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-white">ISPLedger</span>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-400 hover:bg-[#1e293b] hover:text-slate-200 border border-transparent"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-emerald-400")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-[#1e293b] p-4">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="h-9 w-9 border-2 border-emerald-500/30">
            <AvatarFallback className="bg-emerald-500/10 text-emerald-400 text-sm font-semibold">AD</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-slate-400 truncate">admin@ispledger.com</p>
            </div>
          )}
          {!collapsed && (
            <form action="/api/auth/signout" method="POST">
              <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-[#1e293b]">
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
      <aside className={cn("hidden md:flex flex-col border-r border-[#1e293b] bg-[#0a0f1a] transition-all duration-300", collapsed ? "w-16" : "w-64")}>
        <SidebarContent collapsed={collapsed} />
        <div className="border-t border-[#1e293b] p-2">
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="w-full h-8 text-slate-400 hover:text-white hover:bg-[#1e293b]">
            <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
        </div>
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-[#0a0f1a] border-[#1e293b]">
          <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex h-14 items-center gap-4 border-b border-[#1e293b] px-4 bg-[#0a0f1a]">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-[#0a0f1a] border-[#1e293b]">
              <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500">
              <Wifi className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">ISPLedger</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
