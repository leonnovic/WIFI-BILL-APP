"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, Users, Package, Receipt, Router, Ticket,
  CreditCard, MessageSquare, Settings, LogOut, Menu, X, Wifi, Bell, ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

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

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await fetch("/api/auth/signout", { method: "POST" })
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex bg-[#0b1220]">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0b1220] border-r border-[#1e293b] transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[#1e293b]">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/20"><Wifi className="w-5 h-5 text-emerald-500" /></div>
            <div>
              <h1 className="text-lg font-bold text-white">ISPLedger</h1>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-0">ISP Portal</Badge>
            </div>
            <button className="ml-auto lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
          </div>
          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-1 px-3">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                return (
                  <Link key={item.name} href={item.href} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-emerald-500/15 text-emerald-400" : "text-gray-400 hover:text-white hover:bg-[#1e293b]"}`}>
                    <item.icon className={`w-5 h-5 ${isActive ? "text-emerald-400" : ""}`} />
                    {item.name}
                    {item.name === "Tickets" && <Badge className="ml-auto text-[10px] px-1.5 py-0 bg-red-500/20 text-red-400 border-0">3</Badge>}
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>
          <div className="border-t border-[#1e293b] p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-[#1e293b] transition-colors">
                  <Avatar className="w-8 h-8"><AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs">FN</AvatarFallback></Avatar>
                  <div className="flex-1 text-left"><p className="text-sm font-medium text-white">FastNet ISP</p><p className="text-xs text-gray-400">isp@fastnet.com</p></div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#111827] border-[#1e293b]">
                <DropdownMenuItem onClick={() => router.push("/member/settings")} className="text-gray-300 focus:text-white focus:bg-[#1e293b]"><Settings className="w-4 h-4 mr-2" />Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-300 focus:bg-[#1e293b]"><LogOut className="w-4 h-4 mr-2" />Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-[#0b1220]/80 backdrop-blur-sm border-b border-[#1e293b]">
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}><Menu className="w-6 h-6" /></button>
          <div className="flex items-center gap-4 ml-auto">
            <button className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#1e293b] transition-colors">
              <Bell className="w-5 h-5" /><span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
