import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth-helpers"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userRole = (session.user as any).role
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Seed demo data

    // 1. Create admin user (if not exists)
    const adminExists = await db.user.findUnique({ where: { email: "admin@ispledger.com" } })
    if (!adminExists) {
      await db.user.create({
        data: {
          email: "admin@ispledger.com",
          password: await hashPassword("Admin@123"),
          name: "System Admin",
          role: "admin",
          isActive: true,
          status: "active",
          emailVerified: true,
          phoneVerified: true,
        },
      })
    }

    // 2. Create member users
    const memberEmails = ["member1@ispledger.com", "member2@ispledger.com", "member3@ispledger.com"]
    const memberNames = ["John Mwangi", "Sarah Wanjiku", "Peter Ochieng"]
    const businessNames = ["NairobiNet ISP", "Mombasa Connect", "Kisumu Broadband"]
    const memberIds: string[] = []

    for (let i = 0; i < memberEmails.length; i++) {
      const existing = await db.user.findUnique({ where: { email: memberEmails[i] } })
      if (!existing) {
        const member = await db.user.create({
          data: {
            email: memberEmails[i],
            password: await hashPassword("Member@123"),
            name: memberNames[i],
            role: "member",
            isActive: true,
            status: "active",
            emailVerified: true,
            phoneVerified: true,
            businessName: businessNames[i],
            businessRegNo: `REG${1000 + i}`,
            businessAddress: `${memberNames[i].split(" ")[1]} Street, Kenya`,
            kraPin: `A00${1000000 + i}B`,
          },
        })
        memberIds.push(member.id)
      } else {
        memberIds.push(existing.id)
      }
    }

    // 3. Create client users (assign to members)
    const clientData = [
      { email: "client1@test.com", name: "Alice Kamau", memberIdIdx: 0 },
      { email: "client2@test.com", name: "Bob Odhiambo", memberIdIdx: 0 },
      { email: "client3@test.com", name: "Carol Akinyi", memberIdIdx: 1 },
      { email: "client4@test.com", name: "David Mutua", memberIdIdx: 1 },
      { email: "client5@test.com", name: "Eve Njeri", memberIdIdx: 2 },
      { email: "client6@test.com", name: "Frank Kiprop", memberIdIdx: 2 },
      { email: "client7@test.com", name: "Grace Auma", memberIdIdx: 0 },
      { email: "client8@test.com", name: "Henry Musyoka", memberIdIdx: 1 },
    ]

    const clientIds: string[] = []
    for (const c of clientData) {
      const existing = await db.user.findUnique({ where: { email: c.email } })
      if (!existing) {
        const client = await db.user.create({
          data: {
            email: c.email,
            password: await hashPassword("Client@123"),
            name: c.name,
            phone: `2547${Math.floor(10000000 + Math.random() * 90000000)}`,
            role: "client",
            isActive: true,
            status: "active",
            emailVerified: true,
            phoneVerified: true,
            memberId: memberIds[c.memberIdIdx],
            okoaLimit: 500,
            connectionStatus: Math.random() > 0.3 ? "connected" : "disconnected",
          },
        })
        clientIds.push(client.id)
      } else {
        clientIds.push(existing.id)
      }
    }

    // 4. Create packages
    const packageData = [
      { name: "Basic 5Mbps", speedDown: 5, speedUp: 2, speed: "5Mbps", price: 500, duration: 30, durationStr: "30d", type: "standard", ispIdx: 0 },
      { name: "Standard 10Mbps", speedDown: 10, speedUp: 5, speed: "10Mbps", price: 1000, duration: 30, durationStr: "30d", type: "standard", ispIdx: 0 },
      { name: "Premium 20Mbps", speedDown: 20, speedUp: 10, speed: "20Mbps", price: 2000, duration: 30, durationStr: "30d", type: "premium", ispIdx: 0 },
      { name: "Daily Pass", speedDown: 5, speedUp: 2, speed: "5Mbps", price: 50, duration: 1, durationStr: "24h", type: "standard", ispIdx: 1 },
      { name: "Weekly Lite", speedDown: 8, speedUp: 3, speed: "8Mbps", price: 250, duration: 7, durationStr: "7d", type: "standard", ispIdx: 1 },
      { name: "Weekly Premium", speedDown: 15, speedUp: 8, speed: "15Mbps", price: 500, duration: 7, durationStr: "7d", type: "premium", ispIdx: 1 },
      { name: "OKOA Basic", speedDown: 3, speedUp: 1, speed: "3Mbps", price: 100, duration: 3, durationStr: "3d", type: "okoa", ispIdx: 2 },
      { name: "OKOA Standard", speedDown: 5, speedUp: 2, speed: "5Mbps", price: 200, duration: 5, durationStr: "5d", type: "okoa", ispIdx: 2 },
    ]

    const packageIds: string[] = []
    for (const p of packageData) {
      const existing = await db.package.findFirst({ where: { name: p.name } })
      if (!existing) {
        const pkg = await db.package.create({
          data: {
            name: p.name,
            speedDown: p.speedDown,
            speedUp: p.speedUp,
            speed: p.speed,
            dataLimitMB: 0,
            dataLimit: "Unlimited",
            price: p.price,
            duration: p.duration,
            durationStr: p.durationStr,
            type: p.type,
            ispId: memberIds[p.ispIdx],
          },
        })
        packageIds.push(pkg.id)
      } else {
        packageIds.push(existing.id)
      }
    }

    // 5. Assign packages to some clients and create transactions
    for (let i = 0; i < clientIds.length && i < packageIds.length; i++) {
      const pkgIdx = Math.min(i, packageIds.length - 1)
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + packageData[pkgIdx].duration)

      await db.user.update({
        where: { id: clientIds[i] },
        data: {
          activePackageId: packageIds[pkgIdx],
          packageExpiry: expiryDate,
          dataLimit: packageData[pkgIdx].dataLimitMB || 0,
        },
      })

      // Create transaction for this purchase
      const txDate = new Date()
      txDate.setDate(txDate.getDate() - Math.floor(Math.random() * 30))

      await db.transaction.create({
        data: {
          userId: clientIds[i],
          packageId: packageIds[pkgIdx],
          amount: packageData[pkgIdx].price,
          type: "purchase",
          status: "completed",
          mpesaCode: `QJK${Math.floor(100000000 + Math.random() * 900000000)}`,
          mpesaPhone: `2547${Math.floor(10000000 + Math.random() * 90000000)}`,
          description: `Purchase of ${packageData[pkgIdx].name}`,
          createdAt: txDate,
        },
      })
    }

    // 6. Create routers
    const routerData = [
      { name: "Nairobi Router 1", ip: "192.168.1.1", ownerIdx: 0, location: "Nairobi CBD" },
      { name: "Nairobi Router 2", ip: "192.168.1.2", ownerIdx: 0, location: "Westlands" },
      { name: "Mombasa Router 1", ip: "192.168.2.1", ownerIdx: 1, location: "Mombasa Town" },
      { name: "Kisumu Router 1", ip: "192.168.3.1", ownerIdx: 2, location: "Kisumu CBD" },
    ]

    for (const r of routerData) {
      const existing = await db.router.findFirst({ where: { name: r.name } })
      if (!existing) {
        await db.router.create({
          data: {
            name: r.name,
            ipAddress: r.ip,
            username: "admin",
            password: "admin",
            location: r.location,
            status: Math.random() > 0.3 ? "online" : "offline",
            connectedClients: Math.floor(Math.random() * 50) + 5,
            ownerId: memberIds[r.ownerIdx],
            lastSeen: new Date(),
          },
        })
      }
    }

    // 7. Create tickets
    const ticketData = [
      { subject: "No internet connection", desc: "I have been unable to connect for the past 2 hours", clientIdx: 0, status: "open", priority: "high" },
      { subject: "Slow speeds", desc: "My internet is very slow, getting less than 1Mbps", clientIdx: 1, status: "in_progress", priority: "medium" },
      { subject: "Billing issue", desc: "I was charged twice for my last package purchase", clientIdx: 2, status: "open", priority: "high" },
      { subject: "Request for package upgrade", desc: "I would like to upgrade to a faster package", clientIdx: 3, status: "resolved", priority: "low" },
      { subject: "Router not working", desc: "The router in my area seems to be down", clientIdx: 4, status: "open", priority: "urgent" },
    ]

    for (const t of ticketData) {
      const existing = await db.ticket.findFirst({ where: { subject: t.subject } })
      if (!existing && clientIds[t.clientIdx]) {
        await db.ticket.create({
          data: {
            subject: t.subject,
            description: t.desc,
            userId: clientIds[t.clientIdx],
            status: t.status,
            priority: t.priority,
            category: "technical",
            ispId: memberIds[Math.floor(Math.random() * memberIds.length)],
          },
        })
      }
    }

    // 8. Create system settings
    const defaultSettings: Record<string, string> = {
      site_name: "ISPLedger",
      site_description: "WiFi Billing & ISP Management System",
      default_currency: "KES",
      okoa_service_fee_percent: "10",
      okoa_default_limit: "500",
      mpesa_environment: "sandbox",
      sms_environment: "sandbox",
      email_from_name: "ISPLedger",
      auth_google_enabled: "false",
      auth_apple_enabled: "false",
    }

    for (const [key, value] of Object.entries(defaultSettings)) {
      await db.systemSetting.upsert({
        where: { key },
        update: {},
        create: { key, value },
      })
    }

    return NextResponse.json({
      message: "Demo data seeded successfully",
      data: {
        members: memberIds.length,
        clients: clientIds.length,
        packages: packageIds.length,
      },
    })

  } catch (error) {
    console.error("Seed demo error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
