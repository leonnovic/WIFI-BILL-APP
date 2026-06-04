import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Create default admin user
  const hashedPassword = await bcrypt.hash("admin123", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@ispledger.com" },
    update: {},
    create: {
      email: "admin@ispledger.com",
      name: "System Admin",
      password: hashedPassword,
      role: "admin",
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
    }
  })
  console.log(`Admin user: ${admin.email}`)

  // Create a demo member/ISP user
  const memberPassword = await bcrypt.hash("member123", 12)
  const member = await prisma.user.upsert({
    where: { email: "member@ispledger.com" },
    update: {},
    create: {
      email: "member@ispledger.com",
      name: "FastNet ISP",
      password: memberPassword,
      role: "member",
      phone: "+254712345678",
      businessName: "FastNet Internet Services",
      businessAddress: "Nairobi, Kenya",
      kraPin: "A123456789X",
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
    }
  })
  console.log(`Member user: ${member.email}`)

  // Create demo client user
  const clientPassword = await bcrypt.hash("client123", 12)
  const client = await prisma.user.upsert({
    where: { email: "client@ispledger.com" },
    update: {
      memberId: member.id,
      okoaLimit: 500,
      okoaBalance: 150,
      okoaUsed: 350,
      connectionStatus: "connected",
    },
    create: {
      email: "client@ispledger.com",
      name: "John Kamau",
      password: clientPassword,
      role: "client",
      phone: "+254798765432",
      memberId: member.id,
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      okoaLimit: 500,
      okoaBalance: 150,
      okoaUsed: 350,
      connectionStatus: "connected",
    }
  })
  console.log(`Client user: ${client.email}`)

  // Create packages for the ISP
  const packages = await Promise.all([
    prisma.package.upsert({
      where: { id: "pkg-basic" },
      update: {},
      create: {
        id: "pkg-basic",
        name: "Basic",
        description: "Essential browsing and email access",
        speedDown: 5,
        speedUp: 2,
        speed: "5Mbps",
        dataLimitMB: 5000,
        dataLimit: "5GB",
        price: 500,
        duration: 30,
        durationStr: "30d",
        type: "standard",
        isActive: true,
        ispId: member.id,
        createdBy: member.id,
      }
    }),
    prisma.package.upsert({
      where: { id: "pkg-standard" },
      update: {},
      create: {
        id: "pkg-standard",
        name: "Standard",
        description: "Streaming and social media - most popular",
        speedDown: 15,
        speedUp: 5,
        speed: "15Mbps",
        dataLimitMB: 15000,
        dataLimit: "15GB",
        price: 1200,
        duration: 30,
        durationStr: "30d",
        type: "standard",
        isActive: true,
        ispId: member.id,
        createdBy: member.id,
      }
    }),
    prisma.package.upsert({
      where: { id: "pkg-premium" },
      update: {},
      create: {
        id: "pkg-premium",
        name: "Premium",
        description: "Heavy usage, gaming and 4K streaming",
        speedDown: 50,
        speedUp: 20,
        speed: "50Mbps",
        dataLimitMB: 0,
        dataLimit: "Unlimited",
        price: 3000,
        duration: 30,
        durationStr: "30d",
        type: "premium",
        isActive: true,
        ispId: member.id,
        createdBy: member.id,
      }
    }),
    prisma.package.upsert({
      where: { id: "pkg-daily" },
      update: {},
      create: {
        id: "pkg-daily",
        name: "Daily Pass",
        description: "1-day quick internet access",
        speedDown: 10,
        speedUp: 3,
        speed: "10Mbps",
        dataLimitMB: 2000,
        dataLimit: "2GB",
        price: 50,
        duration: 1,
        durationStr: "24h",
        type: "standard",
        isActive: true,
        ispId: member.id,
        createdBy: member.id,
      }
    }),
    prisma.package.upsert({
      where: { id: "pkg-weekly" },
      update: {},
      create: {
        id: "pkg-weekly",
        name: "Weekly Plus",
        description: "7-day internet with generous data",
        speedDown: 10,
        speedUp: 4,
        speed: "10Mbps",
        dataLimitMB: 7000,
        dataLimit: "7GB",
        price: 300,
        duration: 7,
        durationStr: "7d",
        type: "standard",
        isActive: true,
        ispId: member.id,
        createdBy: member.id,
      }
    }),
  ])
  console.log(`Created ${packages.length} packages`)

  // Activate Standard package for client
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + 18)
  await prisma.user.update({
    where: { id: client.id },
    data: {
      activePackageId: "pkg-standard",
      packageExpiry: expiry,
      dataUsed: 8300, // 8.3 GB in MB
      dataLimit: 15000, // 15 GB in MB
    }
  })

  // Create demo transactions
  const now = new Date()
  const txData = [
    { type: "purchase", amount: 1200, status: "completed", description: "Standard Package - 30 days", packageId: "pkg-standard", daysAgo: 12, mpesaReceipt: "QHK7Y5XBZ2", okoaAmount: 0, serviceFee: 0 },
    { type: "okoa", amount: 275, status: "completed", description: "OKOA Internet Credit", packageId: null, daysAgo: 14, mpesaReceipt: null, okoaAmount: 250, serviceFee: 25 },
    { type: "topup", amount: 500, status: "completed", description: "Account Top-up via M-Pesa", packageId: null, daysAgo: 18, mpesaReceipt: "KYT2R8VPL3", okoaAmount: 0, serviceFee: 0 },
    { type: "repayment", amount: 100, status: "completed", description: "OKOA Repayment (auto-deducted)", packageId: null, daysAgo: 25, mpesaReceipt: "AJR6W4BKQ9", okoaAmount: 0, serviceFee: 0 },
    { type: "purchase", amount: 500, status: "completed", description: "Basic Package - 30 days", packageId: "pkg-basic", daysAgo: 42, mpesaReceipt: "LPM3T9NKR5", okoaAmount: 0, serviceFee: 0 },
    { type: "okoa", amount: 110, status: "completed", description: "OKOA Internet Credit", packageId: null, daysAgo: 45, mpesaReceipt: null, okoaAmount: 100, serviceFee: 10 },
    { type: "purchase", amount: 300, status: "completed", description: "Weekly Plus - 7 days", packageId: "pkg-weekly", daysAgo: 55, mpesaReceipt: "WQR8J2MXN7", okoaAmount: 0, serviceFee: 0 },
  ]

  // Clear old transactions for this client
  await prisma.transaction.deleteMany({ where: { userId: client.id } })

  for (const tx of txData) {
    const createdAt = new Date(now)
    createdAt.setDate(createdAt.getDate() - tx.daysAgo)
    await prisma.transaction.create({
      data: {
        userId: client.id,
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        description: tx.description,
        packageId: tx.packageId,
        mpesaCode: `TXN${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        mpesaPhone: client.phone,
        mpesaReceipt: tx.mpesaReceipt,
        okoaAmount: tx.okoaAmount,
        serviceFee: tx.serviceFee,
        createdAt,
      }
    })
  }
  console.log("Created demo transactions")

  // Create demo tickets
  await prisma.ticket.deleteMany({ where: { userId: client.id } })

  const ticket1 = await prisma.ticket.create({
    data: {
      subject: "Slow internet speed",
      description: "Getting less than 2 Mbps on Standard package. Speed tests consistently show poor performance during peak hours.",
      status: "open",
      priority: "high",
      category: "connectivity",
      userId: client.id,
      assignedTo: member.id,
      ispId: member.id,
    }
  })

  await prisma.ticketResponse.createMany({
    data: [
      { ticketId: ticket1.id, userId: member.id, userName: "FastNet Support", message: "We're looking into this. Can you run a speed test and share the results? Also, what time of day are you experiencing the slowdown?", createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
      { ticketId: ticket1.id, userId: client.id, userName: "John Kamau", message: "Speed test shows 1.8 Mbps download. It's worst between 7-10 PM but also slow in the morning.", createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
      { ticketId: ticket1.id, userId: member.id, userName: "FastNet Support", message: "Thank you for the details. We've identified a capacity issue on your access point. Our team will be upgrading the equipment tomorrow. We'll update you once it's done.", createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000) },
    ]
  })

  const ticket2 = await prisma.ticket.create({
    data: {
      subject: "Billing question - double charge",
      description: "I was charged twice for my last package purchase. M-Pesa shows two deductions of KES 1,200.",
      status: "in_progress",
      priority: "medium",
      category: "billing",
      userId: client.id,
      ispId: member.id,
    }
  })

  await prisma.ticketResponse.create({
    data: {
      ticketId: ticket2.id,
      userId: member.id,
      userName: "FastNet Support",
      message: "We're reviewing your payment records. Can you share the M-Pesa receipt numbers for both transactions?",
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    }
  })

  const ticket3 = await prisma.ticket.create({
    data: {
      subject: "Request to increase OKOA limit",
      description: "I've been a loyal customer for 6 months and always repay on time. Can my OKOA limit be increased to KES 1,000?",
      status: "resolved",
      priority: "low",
      category: "account",
      userId: client.id,
      ispId: member.id,
    }
  })

  await prisma.ticketResponse.createMany({
    data: [
      { ticketId: ticket3.id, userId: member.id, userName: "FastNet Support", message: "We've reviewed your payment history and approved the increase. Your new OKOA limit will be updated within 24 hours.", createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      { ticketId: ticket3.id, userId: client.id, userName: "John Kamau", message: "Thank you! Really appreciate it.", createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) },
    ]
  })

  console.log("Created demo tickets")

  // Create system settings
  const settings = [
    { key: "site_name", value: "ISPLedger" },
    { key: "currency", value: "KES" },
    { key: "mpesa_enabled", value: "true" },
    { key: "okoa_enabled", value: "true" },
    { key: "default_okoa_limit", value: "500" },
    { key: "okoa_service_fee", value: "10" },
    { key: "maintenance_mode", value: "false" },
  ]

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    })
  }
  console.log("System settings seeded")
  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
