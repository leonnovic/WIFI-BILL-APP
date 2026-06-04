"use client"

import { useState, useEffect } from "react"
import { Package, Check, ArrowDown, ArrowUp, Database, Clock, Zap, Star, Loader2, AlertCircle, Wifi } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { toast } from "sonner"

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
}

export default function ClientPackagesPage() {
  const [packages, setPackages] = useState<any[]>([])
  const [activePackageId, setActivePackageId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [buyDialog, setBuyDialog] = useState<string | null>(null)
  const [paymentStep, setPaymentStep] = useState<"confirm" | "paying" | "success">("confirm")
  const [mpesaPhone, setMpesaPhone] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/client/packages")
        if (res.ok) {
          const json = await res.json()
          setPackages(json.data || [])
          setActivePackageId(json.activePackageId || null)
        } else {
          toast.error("Failed to load packages")
        }
      } catch {
        toast.error("Network error. Please check your connection.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const refreshData = async () => {
    try {
      const res = await fetch("/api/client/packages")
      if (res.ok) {
        const json = await res.json()
        setPackages(json.data || [])
        setActivePackageId(json.activePackageId || null)
      }
    } catch {
      // silent
    }
  }

  const handleBuy = async () => {
    if (!buyDialog) return
    setPaymentStep("paying")
    setProcessing(true)

    try {
      const res = await fetch("/api/client/packages/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: buyDialog, phone: mpesaPhone || undefined }),
      })

      const json = await res.json()

      if (res.ok) {
        // Simulate M-Pesa processing delay
        await new Promise(resolve => setTimeout(resolve, 1500))
        setPaymentStep("success")
        toast.success("Package purchased successfully!")
        await refreshData()
      } else {
        toast.error(json.error || "Failed to purchase package")
        setPaymentStep("confirm")
      }
    } catch {
      toast.error("Network error. Please try again.")
      setPaymentStep("confirm")
    } finally {
      setProcessing(false)
    }
  }

  const handleClose = () => {
    setBuyDialog(null)
    setPaymentStep("confirm")
    setMpesaPhone("")
  }

  const selectedPkg = packages.find(p => p.id === buyDialog)

  const getDurationLabel = (duration: number, durationStr?: string) => {
    if (durationStr) return durationStr === "24h" ? "/day" : durationStr === "7d" ? "/week" : "/month"
    if (duration === 1) return "/day"
    if (duration === 7) return "/week"
    return "/month"
  }

  const formatData = (mb: number) => {
    if (mb === 0) return "Unlimited"
    if (mb >= 1000) return `${(mb / 1000).toFixed(0)} GB`
    return `${mb} MB`
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse">
            <CardContent className="p-5"><div className="h-48 bg-[#1e293b] rounded" /></CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl font-bold text-white">Buy Package</h1>
        <p className="text-slate-400 mt-1">Choose a package that fits your needs</p>
      </motion.div>

      {/* Packages grid */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg, index) => {
          const isActive = pkg.id === activePackageId
          const isPopular = pkg.name === "Standard" || pkg.name === "Premium"

          return (
            <motion.div
              key={pkg.id}
              variants={staggerItem}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={`bg-[#111827] transition-all duration-200 overflow-hidden ${
                isActive
                  ? "border-emerald-500/50 ring-1 ring-emerald-500/20"
                  : "border-[#1e293b] hover:border-emerald-500/20"
              }`}>
                {isActive && <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />}
                {!isActive && isPopular && <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-400" />}
                {!isActive && !isPopular && <div className="h-1 bg-gradient-to-r from-[#1e293b] to-[#2d3a4d]" />}

                <CardContent className="p-5">
                  {/* Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    {isActive && (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-xs">
                        <Check className="w-3 h-3 mr-1" />Current Plan
                      </Badge>
                    )}
                    {isPopular && !isActive && (
                      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-xs">
                        <Star className="w-3 h-3 mr-1" />Popular
                      </Badge>
                    )}
                  </div>

                  {/* Name & description */}
                  <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{pkg.description}</p>

                  {/* Price */}
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-emerald-400">KES {pkg.price.toLocaleString()}</span>
                    <span className="text-sm text-slate-500">{getDurationLabel(pkg.duration, pkg.durationStr)}</span>
                  </div>

                  {/* Features */}
                  <div className="space-y-2.5 mt-5">
                    <div className="flex items-center gap-2.5 text-sm text-slate-300">
                      <div className="p-1 rounded bg-emerald-500/10"><ArrowDown className="w-3.5 h-3.5 text-emerald-500" /></div>
                      {pkg.speedDown} Mbps Download
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-slate-300">
                      <div className="p-1 rounded bg-sky-500/10"><ArrowUp className="w-3.5 h-3.5 text-sky-500" /></div>
                      {pkg.speedUp} Mbps Upload
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-slate-300">
                      <div className="p-1 rounded bg-amber-500/10"><Database className="w-3.5 h-3.5 text-amber-500" /></div>
                      {formatData(pkg.dataLimitMB)} Data
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-slate-300">
                      <div className="p-1 rounded bg-purple-500/10"><Clock className="w-3.5 h-3.5 text-purple-500" /></div>
                      {pkg.duration} {pkg.duration === 1 ? "Day" : "Days"}
                    </div>
                  </div>

                  {/* Buy button */}
                  <Button
                    onClick={() => { setBuyDialog(pkg.id); setPaymentStep("confirm") }}
                    className={`w-full mt-5 rounded-xl transition-all ${
                      isActive
                        ? "bg-[#1e293b] text-slate-500 cursor-default"
                        : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                    }`}
                    disabled={isActive}
                  >
                    {isActive ? "Current Plan" : <><Zap className="w-4 h-4 mr-2" />Buy Now</>}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {packages.length === 0 && (
        <div className="text-center py-16">
          <Wifi className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400">No packages available yet</p>
          <p className="text-sm text-slate-600 mt-1">Please check back later or contact support</p>
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={!!buyDialog} onOpenChange={handleClose}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white sm:max-w-md">
          {paymentStep === "confirm" && selectedPkg && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">Confirm Purchase</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="bg-[#0b1220] rounded-xl p-4 border border-[#1e293b]">
                  <h3 className="text-lg font-bold text-white">{selectedPkg.name} Package</h3>
                  <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                    <div className="text-slate-500">Speed</div>
                    <div className="text-white">{selectedPkg.speedDown}/{selectedPkg.speedUp} Mbps</div>
                    <div className="text-slate-500">Data</div>
                    <div className="text-white">{formatData(selectedPkg.dataLimitMB)}</div>
                    <div className="text-slate-500">Duration</div>
                    <div className="text-white">{selectedPkg.duration} days</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">M-Pesa Phone Number (Optional)</Label>
                  <Input
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    className="bg-[#0b1220] border-[#1e293b] text-white"
                    placeholder="+2547XXXXXXXX"
                  />
                  <p className="text-[10px] text-slate-600">Leave empty to use your registered phone number</p>
                </div>

                <div className="flex justify-between items-center py-3 border-t border-[#1e293b]">
                  <span className="text-slate-400">Total</span>
                  <span className="text-2xl font-bold text-emerald-400">KES {selectedPkg.price.toLocaleString()}</span>
                </div>
                <Button
                  onClick={handleBuy}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-11"
                >
                  <Zap className="w-4 h-4 mr-2" />Pay with M-Pesa
                </Button>
              </div>
            </>
          )}

          {paymentStep === "paying" && (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
              <p className="text-white font-semibold text-lg">Processing Payment...</p>
              <p className="text-sm text-slate-500 mt-2">
                {mpesaPhone
                  ? `An M-Pesa prompt has been sent to ${mpesaPhone}`
                  : "Please wait while we confirm your M-Pesa payment"
                }
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          {paymentStep === "success" && (
            <div className="text-center py-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-5"
              >
                <Check className="w-8 h-8 text-emerald-400" />
              </motion.div>
              <p className="text-white font-semibold text-lg">Payment Successful!</p>
              <p className="text-sm text-slate-500 mt-2">Your package has been activated. Enjoy your internet!</p>
              <Button
                onClick={handleClose}
                className="mt-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-8"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
