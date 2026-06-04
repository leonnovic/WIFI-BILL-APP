import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import crypto from "crypto"
import bcrypt from "bcryptjs"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const existingUsers = await db.user.count()
    if (existingUsers > 0) {
      return NextResponse.json({ data: { message: "Demo data already exists. Skipping seed.", existing: true } })
    }

    // Create admin user
    const admin = await db.user.create({
      data: {
        email: "admin@ispledger.com",
        name: "System Admin",
        password: await bcrypt.hash("admin123", 12),
        role: "admin",
        status: "active",
        phone: "+254700000000",
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
      },
    })

    // Create ISP Members
    const memberNames = [
      { name: "John Mwangi", business: "FastNet Solutions", kra: "A123456789" },
      { name: "Sarah Wanjiku", business: "Mombasa Connect", kra: "B234567890" },
      { name: "David Ochieng", business: "Kisumu Digital", kra: "C345678901" },
      { name: "Grace Achieng", business: "Rift Valley ISP", kra: "D456789012" },
      { name: "Peter Kamau", business: "Central WiFi Hub", kra: "E567890123" },
    ]
    const members = []
    for (const m of memberNames) {
      const member = await db.user.create({
        data: {
          email: m.business.toLowerCase().replace(/\s+/g, "") + "@example.com",
          name: m.name,
          password: await bcrypt.hash("member123", 12),
          role: "member",
          status: "active",
          businessName: m.business,
          kraPin: m.kra,
          phone: `+2547${Math.floor(10000000 + Math.random() * 90000000)}`,
          emailVerified: true,
          phoneVerified: true,
          isActive: true,
        },
      })
      members.push(member)
    }

    // Create known demo ISP account
    const demoMember = await db.user.create({
      data: {
        email: "isp@fastnet.com",
        name: "FastNet Demo ISP",
        password: await bcrypt.hash("member123", 12),
        role: "member",
        status: "active",
        businessName: "FastNet Internet",
        kraPin: "F987654321",
        phone: "+254722000000",
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
      },
    })
    members.push(demoMember)

    // Create Packages
    const packageData = [
      { name: "Starter 5Mbps", speed: "5Mbps", speedDown: 5, speedUp: 2, dataLimit: "20GB", dataLimitMB: 20480, price: 1500, duration: 30, durationStr: "30 days", type: "standard" },
      { name: "Home 10Mbps", speed: "10Mbps", speedDown: 10, speedUp: 5, dataLimit: "50GB", dataLimitMB: 51200, price: 2500, duration: 30, durationStr: "30 days", type: "standard" },
      { name: "Home 20Mbps", speed: "20Mbps", speedDown: 20, speedUp: 10, dataLimit: "Unlimited", dataLimitMB: 0, price: 4000, duration: 30, durationStr: "30 days", type: "premium" },
      { name: "Premium 50Mbps", speed: "50Mbps", speedDown: 50, speedUp: 25, dataLimit: "Unlimited", dataLimitMB: 0, price: 7000, duration: 30, durationStr: "30 days", type: "premium" },
      { name: "Business 10Mbps", speed: "10Mbps", speedDown: 10, speedUp: 10, dataLimit: "Unlimited", dataLimitMB: 0, price: 5000, duration: 30, durationStr: "30 days", type: "premium" },
      { name: "Business 50Mbps", speed: "50Mbps", speedDown: 50, speedUp: 50, dataLimit: "Unlimited", dataLimitMB: 0, price: 12000, duration: 30, durationStr: "30 days", type: "premium" },
      { name: "Enterprise 100Mbps", speed: "100Mbps", speedDown: 100, speedUp: 100, dataLimit: "Unlimited", dataLimitMB: 0, price: 25000, duration: 30, durationStr: "30 days", type: "premium" },
      { name: "OKOA 500MB", speed: "2Mbps", speedDown: 2, speedUp: 1, dataLimit: "500MB", dataLimitMB: 500, price: 50, duration: 1, durationStr: "24 hours", type: "okoa" },
      { name: "OKOA 1GB", speed: "5Mbps", speedDown: 5, speedUp: 2, dataLimit: "1GB", dataLimitMB: 1024, price: 100, duration: 1, durationStr: "24 hours", type: "okoa" },
      { name: "Daily Pass", speed: "10Mbps", speedDown: 10, speedUp: 5, dataLimit: "Unlimited", dataLimitMB: 0, price: 200, duration: 1, durationStr: "24 hours", type: "standard" },
    ]
    const packages = []
    for (const pkg of packageData) {
      const created = await db.package.create({
        data: {
          ...pkg,
          ispId: members[Math.floor(Math.random() * members.length)].id,
          createdBy: admin.id,
          isActive: true,
        },
      })
      packages.push(created)
    }

    // Create Clients
    const firstNames = ["Alice", "Bob", "Carol", "Dan", "Eve", "Frank", "Grace", "Helen", "Ivan", "Julia", "Kevin", "Lucy", "Mark", "Nancy", "Oscar", "Patricia", "Quinn", "Rachel", "Steve", "Tina"]
    const lastNames = ["Odongo", "Wambui", "Kipchoge", "Musyoka", "Otieno", "Njeri", "Kariuki", "Auma", "Muthoni", "Odhiambo"]
    const clients = []
    for (let i = 0; i < 20; i++) {
      const member = members[i % members.length]
      const pkg = packages[i % packages.length]
      const firstName = firstNames[i]
      const lastName = lastNames[i % lastNames.length]
      const client = await db.user.create({
        data: {
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
          name: `${firstName} ${lastName}`,
          password: await bcrypt.hash("client123", 12),
          role: "client",
          status: i === 19 ? "inactive" : "active",
          phone: `+2547${Math.floor(10000000 + Math.random() * 90000000)}`,
          memberId: member.id,
          activePackageId: pkg.id,
          packageExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          okoaBalance: Math.random() > 0.7 ? Math.floor(Math.random() * 500) : 0,
          okoaLimit: 500,
          okoaUsed: Math.random() > 0.7 ? Math.floor(Math.random() * 300) : 0,
          emailVerified: true,
          phoneVerified: true,
          isActive: i !== 19,
        },
      })
      clients.push(client)
    }

    // Create demo client john@example.com
    const demoClient = await db.user.create({
      data: {
        email: "john@example.com",
        name: "John Demo",
        password: await bcrypt.hash("client123", 12),
        role: "client",
        status: "active",
        phone: "+254712345678",
        memberId: demoMember.id,
        activePackageId: packages[2].id,
        packageExpiry: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        okoaBalance: 150,
        okoaLimit: 500,
        okoaUsed: 350,
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
      },
    })
    clients.push(demoClient)

    // Create Transactions
    const txTypes = ["purchase", "okoa", "topup", "refund"]
    const txStatuses = ["completed", "completed", "completed", "completed", "pending", "failed"]
    for (let i = 0; i < 50; i++) {
      const user = clients[Math.floor(Math.random() * clients.length)]
      const type = txTypes[Math.floor(Math.random() * txTypes.length)]
      const status = txStatuses[Math.floor(Math.random() * txStatuses.length)]
      const amount = type === "okoa" ? Math.floor(Math.random() * 200 + 50)
        : type === "topup" ? Math.floor(Math.random() * 3000 + 500)
        : type === "refund" ? Math.floor(Math.random() * 1000 + 200)
        : Math.floor(Math.random() * 8000 + 1000)
      const daysAgo = Math.floor(Math.random() * 60)
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - daysAgo)

      await db.transaction.create({
        data: {
          userId: user.id,
          packageId: type === "purchase" ? packages[Math.floor(Math.random() * packages.length)].id : null,
          type,
          amount,
          status,
          mpesaCode: status === "completed" ? `QKH${Math.floor(Math.random() * 9000000000 + 1000000000)}` : null,
          mpesaPhone: user.phone,
          mpesaReceipt: status === "completed" ? `NLK${Math.floor(Math.random() * 900000000 + 100000000)}` : null,
          okoaAmount: type === "okoa" ? amount * 0.9 : 0,
          serviceFee: type === "okoa" ? amount * 0.1 : 0,
          description: `${type} - ${user.name}`,
          createdAt,
        },
      })
    }

    // Create Routers
    const routerModels = ["RB750Gr3", "hAP ac2", "RB4011iGS+", "CCR1009-7G-1C-1S+", "hEX S"]
    const locations = ["Nairobi CBD", "Westlands", "Mombasa Road", "Thika Road", "Kilimani"]
    for (let i = 0; i < 5; i++) {
      await db.router.create({
        data: {
          name: `Router-${String(i + 1).padStart(3, "0")}`,
          ipAddress: `192.168.${i + 1}.1`,
          username: "admin",
          password: "demo123",
          model: routerModels[i],
          location: locations[i],
          status: i === 4 ? "offline" : "online",
          connectedClients: Math.floor(Math.random() * 50 + 10),
          ownerId: members[i].id,
          isActive: true,
          lastSeen: i === 4 ? null : new Date(),
        },
      })
    }

    // Create Tickets
    const ticketSubjects = ["Internet not working", "Slow speeds", "Router configuration issue", "Billing discrepancy", "OKOA credit not applied", "WiFi signal weak", "Account locked", "Package upgrade request", "Payment not reflecting", "Installation request"]
    const priorities = ["low", "medium", "medium", "high", "urgent"]
    const ticketStatuses = ["open", "in_progress", "resolved", "closed"]
    for (let i = 0; i < 10; i++) {
      const clientUser = clients[i % clients.length]
      const memberUser = members[i % members.length]
      await db.ticket.create({
        data: {
          subject: ticketSubjects[i],
          description: `Customer reports: ${ticketSubjects[i].toLowerCase()}. Please investigate and resolve.`,
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          status: ticketStatuses[i % ticketStatuses.length],
          category: ["technical", "billing", "general", "account"][i % 4],
          userId: clientUser.id,
          assignedTo: i < 5 ? members[i % members.length].id : null,
          ispId: memberUser.id,
        },
      })
    }

    // Create System Settings
    const systemSettings: Record<string, string> = {
      site_name: "ISPLedger",
      site_logo: "",
      currency: "KES",
      mpesa_enabled: "true",
      okoa_enabled: "true",
      default_okoa_limit: "500",
      maintenance_mode: "false",
      mpesa_environment: "sandbox",
      mpesa_consumer_key: "demo_consumer_key",
      mpesa_consumer_secret: "demo_consumer_secret",
      mpesa_passkey: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
      mpesa_shortcode: "174379",
      sms_gateway: "africaistalking",
      sms_api_key: "demo_sms_key",
      sms_sender_id: "ISPLedger",
      email_provider: "smtp",
      email_host: "smtp.example.com",
      email_port: "587",
      email_user: "noreply@ispledger.com",
      email_password: "demo_email_password",
      auth_google: JSON.stringify({ enabled: false, clientId: "", clientSecret: "" }),
      auth_phone_otp: JSON.stringify({ enabled: true, length: 6, expiry: "5m" }),
      auth_email_verification: JSON.stringify({ enabled: true, requireOnSignup: false }),
    }
    for (const [key, value] of Object.entries(systemSettings)) {
      await db.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    }

    // Create Messages
    for (let i = 0; i < 8; i++) {
      await db.message.create({
        data: {
          senderId: admin.id,
          recipient: clients[i % clients.length].phone || clients[i % clients.length].email,
          subject: i < 4 ? `ISPLedger Update #${i + 1}` : "SMS Notification",
          content: i < 4
            ? "Dear customer, your internet package has been updated. Thank you for choosing ISPLedger."
            : "Your ISPLedger account has been updated. Dial *123# for more.",
          type: i < 4 ? "email" : "sms",
          status: ["sent", "delivered", "pending", "failed"][i % 4],
          sentAt: new Date(),
        },
      })
    }

    // Create API Keys
    await db.apiKey.create({
      data: {
        name: "Production API Key",
        key: `isl_${crypto.randomBytes(32).toString("hex")}`,
        userId: admin.id,
        permissions: "read,write",
        isActive: true,
        lastUsed: new Date(),
      },
    })
    await db.apiKey.create({
      data: {
        name: "Monitoring Key",
        key: `isl_${crypto.randomBytes(32).toString("hex")}`,
        userId: admin.id,
        permissions: "read",
        isActive: true,
        lastUsed: new Date(Date.now() - 86400000),
      },
    })

    // Create Webhooks
    await db.webhook.create({
      data: {
        name: "Payment Notification",
        url: "https://example.com/webhooks/payments",
        events: JSON.stringify(["transaction.created", "transaction.completed"]),
        secret: "whsec_demo_secret",
        isActive: true,
        userId: admin.id,
      },
    })
    await db.webhook.create({
      data: {
        name: "User Registration",
        url: "https://example.com/webhooks/users",
        events: JSON.stringify(["user.registered"]),
        isActive: true,
        userId: admin.id,
      },
    })

    return NextResponse.json({
      data: {
        message: "Demo data seeded successfully",
        counts: {
          users: 1 + members.length + clients.length,
          packages: packages.length,
          transactions: 50,
          routers: 5,
          tickets: 10,
          messages: 8,
          apiKeys: 2,
          webhooks: 2,
        },
      },
    })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json({ error: "Failed to seed demo data", details: String(error) }, { status: 500 })
  }
}
