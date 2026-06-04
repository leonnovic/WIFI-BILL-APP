"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, Users, Package, Receipt, Router, Ticket,
  CreditCard, MessageSquare, Settings, LogOut, Menu, X, Wifi,
  Bell, ChevronDown, ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"

const navigation = [
  { name: "Dashboard", href: "/member/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/member/clients", icon: Users },
  { name: "Packages", href: "/member/packages", icon: Package },
  { name: "Transactions", href: "/member/transactions", icon: Receipt },
  { name: "Routers", href: "/member/routers", icon: Router },
  { name: "Tickets", href: "/member/tickets", icon: Ticket },
  { name: "OKOA Internet", href: "/member/okoa", icon: CreditCard },
  { name: "Messages", href: "/member/messages", icon: MessageSquare },
  { name: "Settings", href: "/member/settings", icon: Settings },
]

interface UserInfo {
  name?: string | null
  email?: string | null
  businessName?: string | null
  role?: string
}

function SidebarContent({
  pathname,
  onNavigate,
  user,
  userLoading,
  ticketCount,
  onLogout,
  collapsed,
}: {
  pathname: string
  onNavigate: () => void
  user: UserInfo | null
  userLoading: boolean
  ticketCount: number
  onLogout: () => void
  collapsed: boolean
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 border-b border-[#1e293b] ${collapsed ? "px-4 py-4 justify-center" : "px-6 py-5"}`}>
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/20 shrink-0">
          <Wifi className="w-5 h-5 text-emerald-500" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="text-lg font-bold text-white">ISPLedger</h1>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-0">
                ISP Portal
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  collapsed ? "px-3 py-2.5 justify-center" : "px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "text-gray-400 hover:text-white hover:bg-[#1e293b]"
                }`}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-emerald-400" : ""}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.name === "Tickets" && ticketCount > 0 && !collapsed && (
                  <Badge className="ml-auto text-[10px] px-1.5 py-0 bg-red-500/20 text-red-400 border-0">
                    {ticketCount}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User Info */}
      <div className="border-t border-[#1e293b] p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`flex items-center w-full rounded-lg hover:bg-[#1e293b] transition-colors ${
                collapsed ? "justify-center px-2 py-2" : "gap-3 px-2 py-2"
              }`}
            >
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs">
                  {user?.businessName?.[0] || user?.name?.[0] || "I"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    {userLoading ? (
                      <>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-white truncate">
                          {user?.businessName || user?.name || "ISP Account"}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{user?.email || ""}</p>
                      </>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-[#111827] border-[#1e293b]">
            <DropdownMenuItem
              onClick={() => {}}
              className="text-gray-300 focus:text-white focus:bg-[#1e293b] cursor-pointer"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onLogout}
              className="text-red-400 focus:text-red-300 focus:bg-[#1e293b] cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [ticketCount, setTicketCount] = useState(0)

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(data => {
        if (data?.user) {
          setUser(data.user as UserInfo)
        }
      })
      .catch(() => {})
      .finally(() => setUserLoading(false))

    // Fetch ticket count for badge
    fetch("/api/member/tickets")
      .then(r => r.json())
      .then(data => {
        const tickets = data?.data || []
        const open = tickets.filter(
          (t: { status: string }) => t.status === "open" || t.status === "in_progress"
        ).length
        setTicketCount(open)
      })
      .catch(() => {})
  }, [pathname])

  const handleLogout = async () => {
    await fetch("/api/auth/signout", { method: "POST" })
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex bg-[#0b1220]">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-[#1e293b] bg-[#0b1220] transition-all duration-300 shrink-0 ${
          collapsed ? "w-[68px]" : "w-64"
        }`}
      >
        <SidebarContent
          pathname={pathname}
          onNavigate={() => {}}
          user={user}
          userLoading={userLoading}
          ticketCount={ticketCount}
          onLogout={handleLogout}
          collapsed={collapsed}
        />
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-20 -right-3 z-10 w-6 h-6 bg-[#111827] border border-[#1e293b] rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-emerald-500/50 transition-colors hidden lg:flex"
          style={{ left: collapsed ? "calc(68px - 3px)" : "calc(256px - 3px)" }}
        >
          <ChevronLeft className={`w-3 h-3 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-[#0b1220] border-[#1e293b]">
          <SidebarContent
            pathname={pathname}
            onNavigate={() => setSidebarOpen(false)}
            user={user}
            userLoading={userLoading}
            ticketCount={ticketCount}
            onLogout={handleLogout}
            collapsed={false}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-[#0b1220]/80 backdrop-blur-md border-b border-[#1e293b]">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-gray-400 hover:text-white">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
          </Sheet>

          <div className="flex items-center gap-3 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-gray-400 hover:text-white hover:bg-[#1e293b]"
            >
              <Bell className="w-5 h-5" />
              {ticketCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
              )}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
