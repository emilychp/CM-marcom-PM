import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const password = await bcrypt.hash("password123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin 主管",
      email: "admin@example.com",
      passwordHash: password,
      globalRole: "ADMIN",
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      name: "Manager 專案經理",
      email: "manager@example.com",
      passwordHash: password,
      globalRole: "MEMBER",
    },
  })

  const member = await prisma.user.upsert({
    where: { email: "member@example.com" },
    update: {},
    create: {
      name: "Member 團隊成員",
      email: "member@example.com",
      passwordHash: password,
      globalRole: "MEMBER",
    },
  })

  const project = await prisma.project.upsert({
    where: { id: "seed-project-1" },
    update: {},
    create: {
      id: "seed-project-1",
      name: "官網改版專案",
      description: "公司官方網站全新改版，含 SEO 優化與新品牌識別",
      status: "IN_PROGRESS",
      ownerId: admin.id,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
      members: {
        create: [
          { userId: manager.id, roleInProject: "MANAGER" },
          { userId: member.id, roleInProject: "MEMBER" },
        ],
      },
      phases: {
        create: [
          {
            name: "需求訪談與規劃",
            order: 0,
            status: "DONE",
            tasks: {
              create: [
                {
                  title: "與各部門訪談需求",
                  assigneeId: member.id,
                  status: "DONE",
                  progress: 100,
                  order: 0,
                },
                {
                  title: "彙整需求文件",
                  assigneeId: manager.id,
                  status: "DONE",
                  progress: 100,
                  order: 1,
                },
              ],
            },
          },
          {
            name: "視覺設計",
            order: 1,
            status: "IN_PROGRESS",
            tasks: {
              create: [
                {
                  title: "首頁視覺稿",
                  assigneeId: member.id,
                  status: "IN_PROGRESS",
                  progress: 60,
                  order: 0,
                },
                {
                  title: "內頁元件設計",
                  assigneeId: member.id,
                  status: "TODO",
                  progress: 0,
                  order: 1,
                },
              ],
            },
          },
          {
            name: "前端開發",
            order: 2,
            status: "NOT_STARTED",
            tasks: {
              create: [
                {
                  title: "切版與元件實作",
                  status: "TODO",
                  progress: 0,
                  order: 0,
                },
              ],
            },
          },
        ],
      },
      fieldDefs: {
        create: [
          {
            scope: "PROJECT",
            key: "budget",
            label: "預算 (NT$)",
            fieldType: "NUMBER",
            order: 0,
          },
        ],
      },
    },
  })

  console.log({ admin: admin.email, manager: manager.email, member: member.email, project: project.name })
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
