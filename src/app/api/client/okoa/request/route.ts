import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getNotificationService } from "@/lib/notifications"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "client") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const userId = (session.user as any).id
    const { amount } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount. Must be greater than 0." }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Check OKOA is enabled system-wide
    const okoaEnabled = await db.systemSetting.findUnique({ where: { key: "okoa_enabled" } })
    if (okoaEnabled && okoaEnabled.value === "false") {
      return NextResponse.json({ error: "OKOA service is currently disabled" }, { status: 400 })
    }

    // Check available credit
    const availableCredit = user.okoaLimit - user.okoaBalance
    if (amount > availableCredit) {
      return NextResponse.json(
        { error: `Exceeds available credit. You can request up to KES ${availableCredit}` },
        { status: 400 }
      )
    }

    // 10% service fee
    const serviceFee = amount * 0.1
    const totalDebt = amount + serviceFee

    // Check if total debt exceeds limit
    if (user.okoaBalance + totalDebt > user.okoaLimit) {
      return NextResponse.json(
        { error: "Total debt including service fee would exceed your credit limit" },
        { status: 400 }
      )
    }

    // Update user OKOA balance
    await db.user.update({
      where: { id: userId },
      data: {
        okoaBalance: user.okoaBalance + amount,
        okoaUsed: user.okoaUsed + amount,
      },
    })

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        userId,
        type: "okoa",
        amount: totalDebt,
        status: "completed",
        okoaAmount: amount,
        serviceFee,
        description: "OKOA Internet Credit",
      },
    })

    // Notify the member/ISP about the OKOA request
    if (user.memberId) {
      try {
        await getNotificationService().notify({
          userId: user.memberId,
          title: "New OKOA Request",
          message: `Client ${user.name || user.email} has requested OKOA credit of KES ${amount}. Service fee: KES ${serviceFee}`,
          type: "info",
        })
      } catch (e) {
        console.error("Failed to notify ISP:", e)
      }
    }

    return NextResponse.json({
      data: {
        success: true,
        amount,
        serviceFee,
        totalDebt,
        newBalance: user.okoaBalance + amount,
        transactionId: transaction.id,
      },
    })
  } catch (error) {
    console.error("Client okoa request error:", error)
    return NextResponse.json({ error: "Failed to request OKOA credit" }, { status: 500 })
  }
}
