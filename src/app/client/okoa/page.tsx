"use client"

import { useState, useEffect } from "react"
import { CreditCard, Info, CheckCircle, AlertTriangle, Clock, Shield, HelpCircle, Loader2, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { format } from "date-fns"

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
}

export default function ClientOkoaPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [requestAmount, setRequestAmount] = useState("")
  const [requestDialog, setRequestDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/client/okoa")
        if (res.ok) {
          const json = await res.json()
          setData(json.data)
        } else {
          toast.error("Failed to load OKOA data")
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
      const res = await fetch("/api/client/okoa")
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
      }
    } catch {
      // silent
    }
  }

  const handleRequest = async () => {
    const amount = parseFloat(requestAmount)
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    const available = (data?.okoaLimit || 0) - (data?.okoaBalance || 0)
    if (amount > available) {
      toast.error(`Amount exceeds your available credit of KES ${available}`)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/client/okoa/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      })

      const json = await res.json()

      if (res.ok) {
        toast.success(`KES ${amount} OKOA credit requested successfully!`)
        setRequestDialog(false)
        setRequestAmount("")
        await refreshData()
      } else {
        toast.error(json.error || "Failed to request OKOA credit")
      }
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
      <div className="grid grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse">
            <CardContent className="p-4"><div className="h-24 bg-[#1e293b] rounded" /></CardContent>
          </Card>
        ))}
      </div>
      {[...Array(2)].map((_, i) => (
        <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse">
          <CardContent className="p-6"><div className="h-32 bg-[#1e293b] rounded" /></CardContent>
        </Card>
      ))}
    </div>
  )

  if (!data) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">Unable to load OKOA data</p>
        <Button variant="ghost" className="mt-2 text-emerald-400" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    </div>
  )

  const okoaBalance = data.okoaBalance || 0
  const okoaLimit = data.okoaLimit || 500
  const availableCredit = okoaLimit - okoaBalance
  const creditUsagePercent = (okoaBalance / okoaLimit) * 100
  const parsedAmount = parseFloat(requestAmount) || 0
  const serviceFee = parsedAmount * 0.1
  const totalDebt = parsedAmount + serviceFee

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl font-bold text-white">OKOA Internet</h1>
        <p className="text-slate-400 mt-1">Credit-based internet access when you need it</p>
      </motion.div>

      {/* Balance cards */}
      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-4">
        <Card className="bg-[#111827] border-amber-500/20 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-400" />
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-amber-500/15">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-xs text-slate-500">Current OKOA Balance</p>
            </div>
            <p className="text-2xl font-bold text-amber-400">KES {okoaBalance.toLocaleString()}</p>
            <p className="text-[10px] text-slate-600 mt-1">Will be repaid from next top-up</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-emerald-500/20 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/15">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-500">Credit Limit</p>
            </div>
            <p className="text-2xl font-bold text-emerald-400">KES {okoaLimit.toLocaleString()}</p>
            <div className="mt-2">
              <Progress value={creditUsagePercent} className="h-1.5 bg-[#1e293b]" />
            </div>
            <p className="text-[10px] text-slate-600 mt-1">KES {availableCredit.toLocaleString()} available</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Request credit */}
      <motion.div variants={staggerItem}>
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/15">
                <CreditCard className="w-4 h-4 text-emerald-500" />
              </div>
              Request OKOA Credit
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* How it works */}
            <div className="bg-[#0b1220] rounded-xl p-4 mb-4 border border-[#1e293b]">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-sky-400" />
                <p className="text-sm font-medium text-slate-300">How it works</p>
              </div>
              <ol className="text-xs text-slate-500 space-y-1.5 ml-6 list-decimal">
                <li>Request credit when you need internet</li>
                <li>Get instant access (up to your limit)</li>
                <li>Pay back automatically when you top up</li>
                <li>10% service fee applies on each request</li>
              </ol>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs">Amount (KES)</Label>
                <Input
                  type="number"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  className="bg-[#0b1220] border-[#1e293b] text-white text-lg font-semibold h-12"
                  placeholder={`Max KES ${availableCredit.toLocaleString()}`}
                  min={0}
                  max={availableCredit}
                />
              </div>

              {/* Real-time fee breakdown */}
              {parsedAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-[#0b1220] rounded-xl p-4 border border-[#1e293b]"
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Credit Amount</span>
                      <span className="text-white">KES {parsedAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Service Fee (10%)</span>
                      <span className="text-amber-400">KES {serviceFee.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#1e293b]">
                      <span className="text-slate-400 font-medium">Total Debt</span>
                      <span className="text-white font-bold">KES {totalDebt.toFixed(0)}</span>
                    </div>
                    {okoaBalance + totalDebt > okoaLimit && (
                      <p className="text-xs text-red-400 flex items-center gap-1 pt-1">
                        <AlertTriangle className="w-3 h-3" />
                        Total debt would exceed your credit limit
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              <Button
                onClick={() => setRequestDialog(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-11"
                disabled={!requestAmount || parsedAmount <= 0 || parsedAmount > availableCredit}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Request OKOA
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* History */}
      <motion.div variants={staggerItem}>
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/15">
                <Clock className="w-4 h-4 text-emerald-500" />
              </div>
              OKOA History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.history?.length > 0 ? (
              <div className="space-y-1">
                {data.history.map((item: any, i: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        item.type === "okoa" ? "bg-amber-500/15" : "bg-emerald-500/15"
                      }`}>
                        {item.type === "okoa"
                          ? <CreditCard className="w-4 h-4 text-amber-400" />
                          : <CheckCircle className="w-4 h-4 text-emerald-400" />
                        }
                      </div>
                      <div>
                        <p className="text-sm text-white">
                          {item.type === "okoa" ? "OKOA Credit" : "Repayment"}
                        </p>
                        <p className="text-xs text-slate-600">
                          {format(new Date(item.createdAt), "MMM d, yyyy")}
                          {item.serviceFee ? ` • Fee: KES ${item.serviceFee}` : ""}
                        </p>
                      </div>
                    </div>
                    <p className={`text-sm font-semibold ${
                      item.type === "okoa" ? "text-amber-400" : "text-emerald-400"
                    }`}>
                      {item.type === "okoa" ? "+" : "-"}KES {(item.okoaAmount || item.amount).toLocaleString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No OKOA history yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* FAQ */}
      <motion.div variants={staggerItem}>
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/15">
                <HelpCircle className="w-4 h-4 text-emerald-500" />
              </div>
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="1" className="border-[#1e293b]">
                <AccordionTrigger className="text-sm text-white hover:text-emerald-400 hover:no-underline">What is OKOA Internet?</AccordionTrigger>
                <AccordionContent className="text-sm text-slate-500">OKOA Internet allows you to access internet on credit when you don&apos;t have an active package. You borrow credit and repay when you next top up.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="2" className="border-[#1e293b]">
                <AccordionTrigger className="text-sm text-white hover:text-emerald-400 hover:no-underline">What is the service fee?</AccordionTrigger>
                <AccordionContent className="text-sm text-slate-500">A 10% service fee is added to your OKOA credit. For example, if you borrow KES 100, your total debt will be KES 110.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="3" className="border-[#1e293b]">
                <AccordionTrigger className="text-sm text-white hover:text-emerald-400 hover:no-underline">How do I repay?</AccordionTrigger>
                <AccordionContent className="text-sm text-slate-500">OKOA debt is automatically deducted when you purchase a new package. The repayment is taken from your payment before the package is activated.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="4" className="border-[#1e293b]">
                <AccordionTrigger className="text-sm text-white hover:text-emerald-400 hover:no-underline">Can I increase my limit?</AccordionTrigger>
                <AccordionContent className="text-sm text-slate-500">Your credit limit is set by your ISP based on your payment history. Contact support to request a limit increase.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="5" className="border-[#1e293b]">
                <AccordionTrigger className="text-sm text-white hover:text-emerald-400 hover:no-underline">What happens if I don&apos;t repay?</AccordionTrigger>
                <AccordionContent className="text-sm text-slate-500">Your OKOA balance will accumulate and be automatically deducted from your next package purchase. If your balance reaches your credit limit, you won&apos;t be able to request more OKOA credit until you repay.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirmation Dialog */}
      <Dialog open={requestDialog} onOpenChange={setRequestDialog}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm OKOA Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-[#0b1220] rounded-xl p-4 text-sm border border-[#1e293b]">
              <div className="flex justify-between">
                <span className="text-slate-500">Credit Amount</span>
                <span className="text-white">KES {parsedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-slate-500">Service Fee (10%)</span>
                <span className="text-amber-400">KES {serviceFee.toFixed(0)}</span>
              </div>
              <div className="flex justify-between mt-3 pt-3 border-t border-[#1e293b]">
                <span className="text-slate-400 font-medium">Total Debt</span>
                <span className="text-white font-bold text-lg">KES {totalDebt.toFixed(0)}</span>
              </div>
            </div>

            <div className="bg-amber-500/10 rounded-xl p-3 flex items-start gap-2 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-200/80">This amount will be automatically deducted from your next package purchase.</p>
            </div>

            <Button
              onClick={handleRequest}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-11"
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
              ) : (
                <>Confirm Request</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
