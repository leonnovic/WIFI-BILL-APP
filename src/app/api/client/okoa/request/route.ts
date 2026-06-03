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
    if (userRole !== "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const clientId = (session.user as any).id
    const body = await request.json()
    const { amount, packageId } = body

    if (!amount) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 })
    }

    const okoaAmount = parseFloat(amount)
    if (okoaAmount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
    }

    // Get client info
    const client = await db.user.findUnique({ where: { id: clientId } })
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Check if client has an ISP member
    if (!client.memberId) {
      return NextResponse.json({ error: "You must be assigned to an ISP to use OKOA" }, { status: 400 })
    }

    // Check OKOA limit
    const availableCredit = client.okoaLimit - client.okoaBalance
    if (okoaAmount > availableCredit) {
      return NextResponse.json({
        error: `OKOA amount exceeds available credit. Available: KES ${availableCredit}`,
      }, { status: 400 })
    }

    // Calculate service fee (10%)
    const serviceFee = Math.round(okoaAmount * 10 / 100 * 100) / 100
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
      const pkg = await db.package.findUnique({ where: { id: packageId } })
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
      title: "OKOA Credit Approved",
      message: `KES ${okoaAmount} credited. Service fee: KES ${serviceFee}. Your OKOA debt is now KES ${client.okoaBalance + totalDebt}.`,
      type: "warning",
      sendSMS: true,
    }).catch(err => console.error("Notification error:", err))

    // Notify ISP member
    getNotificationService().notify({
      userId: client.memberId,
      title: "Client OKOA Request",
      message: `${client.name} has used OKOA for KES ${okoaAmount}. Total OKOA debt: KES ${client.okoaBalance + totalDebt}`,
      type: "info",
    }).catch(err => console.error("Notification error:", err))

    return NextResponse.json({
      data: {
        transaction,
        okoaBalance: client.okoaBalance + totalDebt,
        okoaLimit: client.okoaLimit,
      },
      message: "OKOA credit approved successfully",
    })

  } catch (error) {
    console.error("Client okoa request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
