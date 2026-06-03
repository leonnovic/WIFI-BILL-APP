import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@ispledger.com" }
  })

  if (existingAdmin) {
    console.log("Admin user already exists, skipping...")
    return
  }

  // Create default admin user
  const hashedPassword = await bcrypt.hash("admin123", 12)

  const admin = await prisma.user.create({
    data: {
      email: "admin@ispledger.com",
      name: "System Admin",
      password: hashedPassword,
      role: "admin",
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
    }
  })

  console.log(`Admin user created: ${admin.email}`)

  // Create a demo member/ISP user
  const existingMember = await prisma.user.findUnique({
    where: { email: "member@ispledger.com" }
  })

  if (!existingMember) {
    const memberPassword = await bcrypt.hash("member123", 12)
    const member = await prisma.user.create({
      data: {
        email: "member@ispledger.com",
        name: "Demo ISP Provider",
        password: memberPassword,
        role: "member",
        phone: "+254712345678",
        businessName: "Demo Internet Services",
        businessAddress: "Nairobi, Kenya",
        kraPin: "A123456789X",
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
      }
    })
    console.log(`Member user created: ${member.email}`)
  }

  // Create a demo client user
  const existingClient = await prisma.user.findUnique({
    where: { email: "client@ispledger.com" }
  })

  if (!existingClient) {
    const clientPassword = await bcrypt.hash("client123", 12)
    const client = await prisma.user.create({
      data: {
        email: "client@ispledger.com",
        name: "Demo Client",
        password: clientPassword,
        role: "client",
        phone: "+254798765432",
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        okoaLimit: 500,
      }
    })
    console.log(`Client user created: ${client.email}`)
  }

  // Create system settings
  const settings = [
    { key: "site_name", value: "ISPLedger" },
    { key: "currency", value: "KES" },
    { key: "mpesa_enabled", value: "true" },
    { key: "okoa_enabled", value: "true" },
    { key: "default_okoa_limit", value: "500" },
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
