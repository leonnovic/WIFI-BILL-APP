"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Package, Check, ArrowDown, ArrowUp, Database, Clock, Zap, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

interface Pkg {
  id: string
  name: string
  description: string | null
  speed: string
  speedDown: number
  speedUp: number
  dataLimit: string | null
  dataLimitMB: number
  price: number
  duration: number
  durationStr: string
  type: string
  isActive: boolean
}

const fadeIn = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }

export default function ClientPackagesPage() {
  const [packages, setPackages] = useState<Pkg[]>([])
  const [activePackageId, setActivePackageId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [buyDialog, setBuyDialog] = useState<string | null>(null)
  const [paymentStep, setPaymentStep] = useState<"confirm" | "paying" | "success">("confirm")

  useEffect(() => {
    async function fetchPackages() {
      try {
        const res = await fetch("/api/client/packages")
        if (res.ok) { const json = await res.json(); setPackages(Array.isArray(json) ? json : []) }
      } catch { toast.error("Failed to load packages") }
      finally { setLoading(false) }
    }

    async function fetchActivePackage() {
      try {
        const res = await fetch("/api/client/dashboard")
        if (res.ok) {
          const json = await res.json()
          setActivePackageId(json.user?.activePackageId || null)
        }
      } catch {}
    }

    Promise.all([fetchPackages(), fetchActivePackage()])
  }, [])

  const handleBuy = async () => {
    setPaymentStep("paying")
    try {
      const res = await fetch("/api/client/packages/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: buyDialog }),
      })
      if (res.ok) {
        setPaymentStep("success")
        setActivePackageId(buyDialog)
      } else {
        const json = await res.json()
        toast.error(json.error || "Payment failed")
        setPaymentStep("confirm")
      }
    } catch {
      toast.error("Payment failed")
      setPaymentStep("confirm")
    }
  }

  const handleClose = () => {
    setBuyDialog(null)
    setPaymentStep("confirm")
  }

  const selectedPkg = packages.find(p => p.id === buyDialog)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-5"><div className="h-40 bg-[#1e293b] rounded" /></CardContent></Card>)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold text-white">Buy Package</h1>
        <p className="text-slate-400 mt-1">Choose a package that fits your needs</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No packages available from your ISP</p>
          </div>
        ) : packages.map((pkg) => {
          const isCurrentPlan = pkg.id === activePackageId
          return (
            <motion.div key={pkg.id} {...fadeIn}>
              <Card className={`bg-[#111827] border-[#1e293b] transition-all ${isCurrentPlan ? "border-emerald-500/50 ring-1 ring-emerald-500/20" : "hover:border-emerald-500/30"}`}>
                <CardContent className="p-5">
                  {isCurrentPlan && <Badge className="bg-emerald-500/15 text-emerald-400 border-0 mb-3"><Check className="w-3 h-3 mr-1" />Current Plan</Badge>}
                  <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                  {pkg.description && <p className="text-sm text-slate-400 mt-1">{pkg.description}</p>}
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-emerald-400">KES {pkg.price.toLocaleString()}</span>
                    <span className="text-sm text-slate-400">/{pkg.duration === 1 ? "day" : pkg.duration === 7 ? "week" : "month"}</span>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-300"><ArrowDown className="w-4 h-4 text-emerald-500" />{pkg.speedDown} Mbps Download</div>
                    <div className="flex items-center gap-2 text-sm text-slate-300"><ArrowUp className="w-4 h-4 text-blue-500" />{pkg.speedUp} Mbps Upload</div>
                    <div className="flex items-center gap-2 text-sm text-slate-300"><Database className="w-4 h-4 text-amber-500" />{pkg.dataLimitMB === 0 ? "Unlimited" : pkg.dataLimit || `${(pkg.dataLimitMB / 1024).toFixed(0)} GB`} Data</div>
                    <div className="flex items-center gap-2 text-sm text-slate-300"><Clock className="w-4 h-4 text-purple-500" />{pkg.durationStr || `${pkg.duration} days`}</div>
                  </div>
                  <Button
                    onClick={() => { setBuyDialog(pkg.id); setPaymentStep("confirm") }}
                    className={`w-full mt-4 ${isCurrentPlan ? "bg-[#1e293b] text-slate-400 cursor-default" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? "Current Plan" : "Buy Now"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <Dialog open={!!buyDialog} onOpenChange={handleClose}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          {paymentStep === "confirm" && selectedPkg && (
            <>
              <DialogHeader><DialogTitle>Confirm Purchase</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="bg-[#0b1220] rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white">{selectedPkg.name} Package</h3>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div className="text-slate-400">Speed</div><div className="text-white">{selectedPkg.speedDown}/{selectedPkg.speedUp} Mbps</div>
                    <div className="text-slate-400">Data</div><div className="text-white">{selectedPkg.dataLimitMB === 0 ? "Unlimited" : selectedPkg.dataLimit || `${(selectedPkg.dataLimitMB / 1024).toFixed(0)} GB`}</div>
                    <div className="text-slate-400">Duration</div><div className="text-white">{selectedPkg.durationStr || `${selectedPkg.duration} days`}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-[#1e293b]">
                  <span className="text-slate-400">Total</span>
                  <span className="text-2xl font-bold text-emerald-400">KES {selectedPkg.price.toLocaleString()}</span>
                </div>
                <Button onClick={handleBuy} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"><Zap className="w-4 h-4 mr-2" />Pay with M-Pesa</Button>
              </div>
            </>
          )}
          {paymentStep === "paying" && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white font-medium">Processing Payment...</p>
              <p className="text-sm text-slate-400 mt-1">Please wait while we confirm your M-Pesa payment</p>
            </div>
          )}
          {paymentStep === "success" && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4"><Check className="w-6 h-6 text-emerald-400" /></div>
              <p className="text-white font-medium">Payment Successful!</p>
              <p className="text-sm text-slate-400 mt-1">Your package has been activated</p>
              <Button onClick={handleClose} className="mt-6 bg-emerald-500 hover:bg-emerald-600 text-white">Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
