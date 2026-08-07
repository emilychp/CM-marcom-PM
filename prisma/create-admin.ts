// One-time script to create a real ADMIN account in production.
// Usage (run locally with production DATABASE_URL set):
//   ADMIN_NAME="Your Name" ADMIN_EMAIL="you@company.com" ADMIN_PASSWORD="a-strong-password" npx tsx prisma/create-admin.ts
import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const name = process.env.ADMIN_NAME
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!name || !email || !password) {
    console.error(
      "Missing required env vars. Usage:\n" +
        '  ADMIN_NAME="Your Name" ADMIN_EMAIL="you@company.com" ADMIN_PASSWORD="a-strong-password" npx tsx prisma/create-admin.ts'
    )
    process.exit(1)
  }
  if (password.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.")
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, globalRole: "ADMIN" },
    create: { name, email, passwordHash, globalRole: "ADMIN" },
  })

  console.log(`Admin account ready: ${user.email} (${user.id})`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
