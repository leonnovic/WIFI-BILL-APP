import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getNotificationService } from "@/lib/notifications"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userRole = (session.user as any).role
    if (userRole !== "member") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const memberId = (session.user as any).id
    const body = await request.json()
    const { clientId, amount, packageId } = body

    if (!clientId || !amount) {
      return NextResponse.json({ error: "Client ID and amount are required" }, { status: 400 })
    }

    const okoaAmount = parseFloat(amount)
    if (okoaAmount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
    }

    // Ensure client belongs to this member
    const client = await db.user.findFirst({
      where: { id: clientId, memberId, role: "client" },
    })
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Check OKOA limit
    if (client.okoaBalance + okoaAmount > client.okoaLimit) {
      return NextResponse.json({
        error: `OKOA amount exceeds limit. Current balance: KES ${client.okoaBalance}, Limit: KES ${client.okoaLimit}`,
      }, { status: 400 })
    }

    // Calculate service fee (10%)
    const serviceFeePercent = 10
    const serviceFee = Math.round(okoaAmount * serviceFeePercent / 100 * 100) / 100
    const totalDebt = okoaAmount + serviceFee

    // Update client OKOA balance
    await db.user.update({
      where: { id: clientId },
      data: {
        okoaBalance: { increment: totalDebt },
        okoaUsed: { increment: okoaAmount },
      },
    })

    // If package specified, assign it
    if (packageId) {
      const pkg = await db.package.findFirst({
        where: { id: packageId, ispId: memberId },
      })
      if (pkg) {
        const expiry = new Date()
        expiry.setDate(expiry.getDate() + pkg.duration)

        await db.user.update({
          where: { id: clientId },
          data: {
            activePackageId: pkg.id,
            packageExpiry: expiry,
            dataLimit: pkg.dataLimitMB || 0,
            dataUsed: 0,
            connectionStatus: "connected",
          },
        })
      }
    }

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        userId: clientId,
        packageId: packageId || null,
        amount: okoaAmount,
        type: "okoa",
        status: "completed",
        okoaAmount,
        serviceFee,
        description: `OKOA credit: KES ${okoaAmount} (Service fee: KES ${serviceFee})`,
      },
    })

    // Notify client
    getNotificationService().notify({
      userId: clientId,
      title: "OKOA Internet Credit",
      message: `KES ${okoaAmount} credited to your account. Service fee: KES ${serviceFee}. Total OKOA debt: KES ${client.okoaBalance + totalDebt}`,
      type: "warning",
      sendSMS: true,
    }).catch(err => console.error("Notification error:", err))

    return NextResponse.json({
      data: { transaction, newOkoaBalance: client.okoaBalance + totalDebt },
      message: "OKOA credit processed successfully",
    })

  } catch (error) {
    console.error("Member okoa request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
