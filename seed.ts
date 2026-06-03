import { db } from "./src/lib/db"
import bcrypt from "bcryptjs"

async function seed() {
  console.log("🌱 Seeding database...")

  // Clean up existing data
  await db.notification.deleteMany()
  await db.ticketResponse.deleteMany()
  await db.ticket.deleteMany()
  await db.message.deleteMany()
  await db.transaction.deleteMany()
  await db.apiKey.deleteMany()
  await db.router.deleteMany()
  await db.package.deleteMany()
  await db.account.deleteMany()
  await db.session.deleteMany()
  await db.systemSetting.deleteMany()
  await db.user.deleteMany()

  const hashPassword = async (pw: string) => await bcrypt.hash(pw, 10)

  // Create admin
  const admin = await db.user.create({
    data: {
      email: "admin@ispledger.com",
      name: "System Admin",
      password: await hashPassword("admin123"),
      role: "admin",
      status: "active",
    },
  })

  // Create ISP Member
  const member = await db.user.create({
    data: {
      email: "isp@fastnet.com",
      name: "FastNet ISP",
      password: await hashPassword("member123"),
      phone: "+254712345678",
      role: "member",
      status: "active",
      businessName: "FastNet Internet Services",
      kraPin: "A00123456789",
    },
  })

  // Create clients
  const now = new Date()
  const client1 = await db.user.create({
    data: {
      email: "john@example.com",
      name: "John Kamau",
      password: await hashPassword("client123"),
      phone: "+254723456789",
      role: "client",
      status: "active",
      memberId: member.id,
      okoaBalance: 250,
      okoaLimit: 500,
      okoaUsed: 750,
      connectionStatus: "connected",
      dataUsed: 8500,
      dataLimit: 15000,
      packageExpiry: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
    },
  })

  const client2 = await db.user.create({
    data: {
      email: "mary@example.com",
      name: "Mary Wanjiku",
      password: await hashPassword("client123"),
      phone: "+254734567890",
      role: "client",
      status: "active",
      memberId: member.id,
      okoaBalance: 0,
      okoaLimit: 300,
      okoaUsed: 100,
      connectionStatus: "connected",
      dataUsed: 3200,
      dataLimit: 5000,
      packageExpiry: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  const client3 = await db.user.create({
    data: {
      email: "peter@example.com",
      name: "Peter Ochieng",
      password: await hashPassword("client123"),
      phone: "+254745678901",
      role: "client",
      status: "active",
      memberId: member.id,
      okoaBalance: 100,
      okoaLimit: 500,
      okoaUsed: 300,
      connectionStatus: "connected",
      dataUsed: 0,
      dataLimit: 0,
      packageExpiry: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
    },
  })

  const client4 = await db.user.create({
    data: {
      email: "sarah@example.com",
      name: "Sarah Achieng",
      password: await hashPassword("client123"),
      phone: "+254756789012",
      role: "client",
      status: "active",
      memberId: member.id,
      okoaBalance: 0,
      okoaLimit: 200,
      okoaUsed: 0,
      connectionStatus: "disconnected",
    },
  })

  const client5 = await db.user.create({
    data: {
      email: "david@example.com",
      name: "David Mwangi",
      password: await hashPassword("client123"),
      phone: "+254767890123",
      role: "client",
      status: "inactive",
      memberId: member.id,
      okoaBalance: 450,
      okoaLimit: 500,
      okoaUsed: 900,
      connectionStatus: "disconnected",
    },
  })

  // Create packages
  const pkg1 = await db.package.create({
    data: {
      name: "Basic",
      description: "Basic browsing and email",
      speedDown: 5,
      speedUp: 2,
      dataLimit: 5000,
      price: 500,
      duration: 30,
      isActive: true,
      ispId: member.id,
    },
  })

  const pkg2 = await db.package.create({
    data: {
      name: "Standard",
      description: "Streaming and social media",
      speedDown: 15,
      speedUp: 5,
      dataLimit: 15000,
      price: 1200,
      duration: 30,
      isActive: true,
      ispId: member.id,
    },
  })

  const pkg3 = await db.package.create({
    data: {
      name: "Premium",
      description: "Heavy usage, gaming, 4K streaming",
      speedDown: 50,
      speedUp: 20,
      dataLimit: 0,
      price: 3000,
      duration: 30,
      isActive: true,
      ispId: member.id,
    },
  })

  const pkg4 = await db.package.create({
    data: {
      name: "Daily Pass",
      description: "1-day internet access",
      speedDown: 10,
      speedUp: 3,
      dataLimit: 2000,
      price: 50,
      duration: 1,
      isActive: true,
      ispId: member.id,
    },
  })

  const pkg5 = await db.package.create({
    data: {
      name: "Weekly Plus",
      description: "7-day internet access",
      speedDown: 10,
      speedUp: 4,
      dataLimit: 7000,
      price: 300,
      duration: 7,
      isActive: true,
      ispId: member.id,
    },
  })

  // Update clients with active packages
  await db.user.update({ where: { id: client1.id }, data: { activePackageId: pkg2.id } })
  await db.user.update({ where: { id: client2.id }, data: { activePackageId: pkg1.id } })
  await db.user.update({ where: { id: client3.id }, data: { activePackageId: pkg3.id } })

  // Create transactions
  const transactions = [
    { userId: client1.id, packageId: pkg2.id, type: "purchase", amount: 1200, status: "completed", mpesaRef: "QHK7Y5XBZ2", mpesaPhone: "+254723456789", mpesaReceipt: "QHK7Y5XBZ2", description: "Standard Package - 30 days" },
    { userId: client1.id, packageId: null, type: "okoa", amount: 275, status: "completed", okoaAmount: 250, serviceFee: 25, description: "OKOA Internet Credit" },
    { userId: client2.id, packageId: pkg1.id, type: "purchase", amount: 500, status: "completed", mpesaRef: "RMN8P3QCS1", mpesaPhone: "+254734567890", mpesaReceipt: "RMN8P3QCS1", description: "Basic Package - 30 days" },
    { userId: client2.id, packageId: null, type: "okoa", amount: 110, status: "completed", okoaAmount: 100, serviceFee: 10, description: "OKOA Internet Credit" },
    { userId: client3.id, packageId: pkg3.id, type: "purchase", amount: 3000, status: "completed", mpesaRef: "WPL9T2MDK4", mpesaPhone: "+254745678901", mpesaReceipt: "WPL9T2MDK4", description: "Premium Package - 30 days" },
    { userId: client3.id, packageId: null, type: "okoa", amount: 110, status: "completed", okoaAmount: 100, serviceFee: 10, description: "OKOA Internet Credit" },
    { userId: client3.id, packageId: null, type: "repayment", amount: 200, status: "completed", mpesaRef: "BGT4F6HNJ8", description: "OKOA Repayment" },
    { userId: client5.id, packageId: null, type: "okoa", amount: 495, status: "completed", okoaAmount: 450, serviceFee: 45, description: "OKOA Internet Credit" },
    { userId: client1.id, packageId: null, type: "topup", amount: 500, status: "completed", mpesaRef: "KYT2R8VPL3", mpesaPhone: "+254723456789", description: "Account Top-up" },
    { userId: client4.id, packageId: pkg4.id, type: "purchase", amount: 50, status: "failed", mpesaPhone: "+254756789012", description: "Daily Pass - Payment failed" },
    { userId: client2.id, packageId: null, type: "repayment", amount: 100, status: "completed", mpesaRef: "AJR6W4BKQ9", description: "OKOA Repayment" },
    { userId: client5.id, packageId: null, type: "okoa", amount: 495, status: "pending", okoaAmount: 450, serviceFee: 45, description: "OKOA Internet Credit - Pending" },
  ]

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i]
    await db.transaction.create({
      data: {
        ...t,
        createdAt: new Date(now.getTime() - (transactions.length - i) * 2 * 24 * 60 * 60 * 1000),
      },
    })
  }

  // Create routers
  await db.router.create({
    data: {
      name: "Main Office Router",
      ip: "192.168.1.1",
      username: "admin",
      password: "mikrotik123",
      model: "MikroTik RB750Gr3",
      location: "Main Office Building",
      status: "online",
      connectedClients: 23,
      ownerId: member.id,
      lastSeen: new Date(),
    },
  })

  await db.router.create({
    data: {
      name: "Site A Router",
      ip: "192.168.2.1",
      username: "admin",
      password: "mikrotik456",
      model: "MikroTik hAP ac²",
      location: "Site A - Westlands",
      status: "online",
      connectedClients: 15,
      ownerId: member.id,
      lastSeen: new Date(),
    },
  })

  await db.router.create({
    data: {
      name: "Site B Router",
      ip: "192.168.3.1",
      username: "admin",
      password: "mikrotik789",
      model: "MikroTik RB4011iGS+RM",
      location: "Site B - Kilimani",
      status: "offline",
      connectedClients: 0,
      ownerId: member.id,
      lastSeen: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
  })

  // Create tickets
  const ticket1 = await db.ticket.create({
    data: {
      subject: "Slow internet speed",
      description: "My internet speed has been very slow for the past 3 days. I'm on the Standard package but getting less than 2 Mbps.",
      status: "open",
      priority: "high",
      creatorId: client1.id,
      assigneeId: member.id,
      ispId: member.id,
    },
  })

  const ticket2 = await db.ticket.create({
    data: {
      subject: "Cannot connect to WiFi",
      description: "My device shows connected but no internet access. I've tried restarting my device.",
      status: "in_progress",
      priority: "urgent",
      creatorId: client4.id,
      assigneeId: member.id,
      ispId: member.id,
    },
  })

  const ticket3 = await db.ticket.create({
    data: {
      subject: "Billing question",
      description: "I was charged twice for my last package purchase. Please check.",
      status: "open",
      priority: "medium",
      creatorId: client2.id,
      ispId: member.id,
    },
  })

  await db.ticket.create({
    data: {
      subject: "OKOA repayment issue",
      description: "I topped up but my OKOA balance was not reduced. Please help.",
      status: "resolved",
      priority: "medium",
      creatorId: client3.id,
      assigneeId: member.id,
      ispId: member.id,
    },
  })

  // Create ticket responses
  await db.ticketResponse.create({
    data: {
      ticketId: ticket1.id,
      userId: member.id,
      userName: "FastNet ISP",
      message: "We're looking into this. Can you run a speed test and share the results?",
    },
  })

  await db.ticketResponse.create({
    data: {
      ticketId: ticket1.id,
      userId: client1.id,
      userName: "John Kamau",
      message: "Speed test shows 1.8 Mbps download. This is much lower than expected 15 Mbps.",
    },
  })

  await db.ticketResponse.create({
    data: {
      ticketId: ticket2.id,
      userId: member.id,
      userName: "FastNet ISP",
      message: "We've identified an issue with the router at your location. Our technician will visit tomorrow.",
    },
  })

  // Create messages
  await db.message.create({
    data: {
      senderId: member.id,
      subject: "Service Maintenance Notice",
      content: "Dear customer, we will be performing maintenance on our network tonight from 11 PM to 3 AM. You may experience brief interruptions.",
      type: "sms",
      status: "sent",
      recipient: "all",
      sentAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
  })

  await db.message.create({
    data: {
      senderId: member.id,
      subject: "New Package Available!",
      content: "We've just launched our new Premium Plus package with 100 Mbps speeds! Upgrade today and get 20% off your first month.",
      type: "email",
      status: "sent",
      recipient: "all",
      sentAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  })

  // Create system settings
  await db.systemSetting.create({ data: { key: "defaultOkoaLimit", value: "200" } })
  await db.systemSetting.create({ data: { key: "okoaServiceFeePercent", value: "10" } })
  await db.systemSetting.create({ data: { key: "mpesaPaybill", value: "123456" } })
  await db.systemSetting.create({ data: { key: "mpesaTillNumber", value: "789012" } })

  // Create notifications
  await db.notification.create({
    data: {
      userId: member.id,
      title: "New OKOA Request",
      message: "David Mwangi has requested OKOA credit of KES 450",
      type: "info",
    },
  })

  await db.notification.create({
    data: {
      userId: member.id,
      title: "Ticket Resolved",
      message: "Peter Ochieng's OKOA repayment issue has been resolved",
      type: "success",
    },
  })

  await db.notification.create({
    data: {
      userId: member.id,
      title: "Router Offline",
      message: "Site B Router (Kilimani) has gone offline",
      type: "warning",
    },
  })

  console.log("✅ Seed completed successfully!")
  console.log("")
  console.log("📋 Login Credentials:")
  console.log("  Admin:   admin@ispledger.com / admin123")
  console.log("  Member:  isp@fastnet.com / member123")
  console.log("  Client:  john@example.com / client123")
  console.log("  Client:  mary@example.com / client123")
  console.log("  Client:  peter@example.com / client123")
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect())
