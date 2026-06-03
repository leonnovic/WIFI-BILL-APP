"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { CreditCard, Info, CheckCircle, AlertTriangle, Clock, Shield, HelpCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { toast } from "sonner"

interface OkoaHistory {
  id: string
  type: string
  amount: number
  okoaAmount: number
  serviceFee: number
  status: string
  description: string | null
  createdAt: string
}

const fadeIn = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }

export default function ClientOkoaPage() {
  const [okoaBalance, setOkoaBalance] = useState(0)
  const [okoaLimit, setOkoaLimit] = useState(500)
  const [okoaUsed, setOkoaUsed] = useState(0)
  const [availableCredit, setAvailableCredit] = useState(500)
  const [history, setHistory] = useState<OkoaHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [requestAmount, setRequestAmount] = useState("")
  const [requestDialog, setRequestDialog] = useState(false)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    async function fetchOkoa() {
      try {
        const res = await fetch("/api/client/okoa")
        if (res.ok) {
          const json = await res.json()
          setOkoaBalance(json.okoaBalance || 0)
          setOkoaLimit(json.okoaLimit || 500)
          setOkoaUsed(json.okoaUsed || 0)
          setAvailableCredit(json.availableCredit || 0)
          setHistory(Array.isArray(json.history) ? json.history : [])
        }
      } catch { toast.error("Failed to load OKOA data") }
      finally { setLoading(false) }
    }
    fetchOkoa()
  }, [])

  async function handleRequest() {
    const amount = parseFloat(requestAmount)
    if (amount <= 0 || amount > availableCredit) {
      toast.error("Invalid amount")
      return
    }
    setRequesting(true)
    try {
      const res = await fetch("/api/client/okoa/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      })
      if (res.ok) {
        toast.success(`KES ${amount} OKOA credit added to your account`)
        setRequestDialog(false)
        setRequestAmount("")
        // Refresh data
        const refreshRes = await fetch("/api/client/okoa")
        if (refreshRes.ok) {
          const json = await refreshRes.json()
          setOkoaBalance(json.okoaBalance || 0)
          setOkoaLimit(json.okoaLimit || 500)
          setAvailableCredit(json.availableCredit || 0)
          setHistory(Array.isArray(json.history) ? json.history : [])
        }
      } else {
        const json = await res.json()
        toast.error(json.error || "Failed to request OKOA credit")
      }
    } catch {
      toast.error("Failed to request OKOA credit")
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#1e293b] rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <Card key={i} className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-4"><div className="h-20 bg-[#1e293b] rounded" /></CardContent></Card>)}</div>
        <Card className="bg-[#111827] border-[#1e293b] animate-pulse"><CardContent className="p-6"><div className="h-40 bg-[#1e293b] rounded" /></CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold text-white">OKOA Internet</h1>
        <p className="text-slate-400 mt-1">Credit-based internet access</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
          <Card className="bg-[#111827] border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><CreditCard className="w-4 h-4 text-amber-400" /><p className="text-xs text-slate-400">Current OKOA Balance</p></div>
              <p className="text-2xl font-bold text-amber-400">KES {okoaBalance.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">Will be repaid from next top-up</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
          <Card className="bg-[#111827] border-emerald-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><Shield className="w-4 h-4 text-emerald-400" /><p className="text-xs text-slate-400">Credit Limit</p></div>
              <p className="text-2xl font-bold text-emerald-400">KES {okoaLimit.toLocaleString()}</p>
              <div className="mt-2"><Progress value={okoaLimit > 0 ? (okoaBalance / okoaLimit) * 100 : 0} className="h-2 bg-[#1e293b]" /></div>
              <p className="text-xs text-slate-500 mt-1">KES {availableCredit.toLocaleString()} available</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader className="pb-2"><CardTitle className="text-base text-white flex items-center gap-2"><CreditCard className="w-4 h-4 text-emerald-500" />Request OKOA Credit</CardTitle></CardHeader>
          <CardContent>
            <div className="bg-[#0b1220] rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2"><Info className="w-4 h-4 text-blue-400" /><p className="text-sm text-slate-300">How it works</p></div>
              <ol className="text-xs text-slate-400 space-y-1 ml-6 list-decimal">
                <li>Request credit when you need internet</li>
                <li>Get instant access (up to your limit)</li>
                <li>Pay back when you top up</li>
                <li>10% service fee applies</li>
              </ol>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-slate-300">Amount (KES)</Label>
                <Input type="number" value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} className="bg-[#0b1220] border-[#1e293b] text-white" placeholder={`Max KES ${availableCredit}`} />
              </div>
              {requestAmount && parseFloat(requestAmount) > 0 && (
                <div className="bg-[#0b1220] rounded-lg p-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Credit Amount</span><span className="text-white">KES {requestAmount}</span></div>
                  <div className="flex justify-between mt-1"><span className="text-slate-400">Service Fee (10%)</span><span className="text-amber-400">KES {(parseFloat(requestAmount) * 0.1).toFixed(0)}</span></div>
                  <div className="flex justify-between mt-1 pt-1 border-t border-[#1e293b]"><span className="text-slate-400">Total Debt</span><span className="text-white font-medium">KES {(parseFloat(requestAmount) * 1.1).toFixed(0)}</span></div>
                </div>
              )}
              <Button onClick={() => setRequestDialog(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white" disabled={!requestAmount || parseFloat(requestAmount) <= 0 || parseFloat(requestAmount) > availableCredit}>
                <CreditCard className="w-4 h-4 mr-2" />Request OKOA
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader className="pb-2"><CardTitle className="text-base text-white flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-500" />OKOA History</CardTitle></CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No OKOA history yet</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-[#1e293b]/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === "okoa" ? "bg-amber-500/15" : "bg-emerald-500/15"}`}>
                        {item.type === "okoa" ? <CreditCard className="w-4 h-4 text-amber-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <div>
                        <p className="text-sm text-white">{item.type === "okoa" ? "OKOA Credit" : "Repayment"}</p>
                        <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}{item.serviceFee ? ` • Fee: KES ${item.serviceFee}` : ""}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${item.type === "okoa" ? "text-amber-400" : "text-emerald-400"}`}>{item.type === "okoa" ? "+" : "-"}KES {item.amount.toLocaleString()}</p>
                      <Badge variant="secondary" className={`text-xs border-0 ${item.status === "completed" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>{item.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div {...fadeIn} transition={{ delay: 0.25 }}>
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader className="pb-2"><CardTitle className="text-base text-white flex items-center gap-2"><HelpCircle className="w-4 h-4 text-emerald-500" />FAQ</CardTitle></CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="1" className="border-[#1e293b]"><AccordionTrigger className="text-sm text-white hover:text-emerald-400">What is OKOA Internet?</AccordionTrigger><AccordionContent className="text-sm text-slate-400">OKOA Internet allows you to access internet on credit when you don&apos;t have an active package. You borrow credit and repay when you next top up.</AccordionContent></AccordionItem>
              <AccordionItem value="2" className="border-[#1e293b]"><AccordionTrigger className="text-sm text-white hover:text-emerald-400">What is the service fee?</AccordionTrigger><AccordionContent className="text-sm text-slate-400">A 10% service fee is added to your OKOA credit. For example, if you borrow KES 100, your total debt will be KES 110.</AccordionContent></AccordionItem>
              <AccordionItem value="3" className="border-[#1e293b]"><AccordionTrigger className="text-sm text-white hover:text-emerald-400">How do I repay?</AccordionTrigger><AccordionContent className="text-sm text-slate-400">OKOA debt is automatically deducted when you purchase a new package. The repayment is taken from your payment before the package is activated.</AccordionContent></AccordionItem>
              <AccordionItem value="4" className="border-[#1e293b]"><AccordionTrigger className="text-sm text-white hover:text-emerald-400">Can I increase my limit?</AccordionTrigger><AccordionContent className="text-sm text-slate-400">Your credit limit is set by your ISP based on your payment history. Contact support to request a limit increase.</AccordionContent></AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={requestDialog} onOpenChange={setRequestDialog}>
        <DialogContent className="bg-[#111827] border-[#1e293b] text-white">
          <DialogHeader><DialogTitle>Confirm OKOA Request</DialogTitle><DialogDescription className="text-slate-400">Review your OKOA credit request</DialogDescription></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-[#0b1220] rounded-lg p-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Credit Amount</span><span className="text-white">KES {requestAmount}</span></div>
              <div className="flex justify-between mt-2"><span className="text-slate-400">Service Fee (10%)</span><span className="text-amber-400">KES {(parseFloat(requestAmount || "0") * 0.1).toFixed(0)}</span></div>
              <div className="flex justify-between mt-2 pt-2 border-t border-[#1e293b]"><span className="text-slate-400 font-medium">Total Debt</span><span className="text-white font-bold">KES {(parseFloat(requestAmount || "0") * 1.1).toFixed(0)}</span></div>
            </div>
            <div className="bg-amber-500/10 rounded-lg p-3 flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" /><p className="text-xs text-amber-200">This amount will be deducted from your next package purchase.</p></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialog(false)} className="border-[#1e293b] text-slate-300">Cancel</Button>
            <Button onClick={handleRequest} disabled={requesting} className="bg-amber-500 hover:bg-amber-600 text-white">{requesting ? "Processing..." : "Confirm Request"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
