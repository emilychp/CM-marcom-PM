"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"

async function requireAdmin() {
  const user = await requireUser()
  if (user.globalRole !== "ADMIN") throw new Error("FORBIDDEN")
  return user
}

// Keywords that suggest a 溝通管理 item is actually a digital channel
// (website, social, newsletter, intranet) that belongs under 傳播事務
// instead — matches the examples named in the OCS restructuring discussion.
const DIGITAL_KEYWORDS = ["官網", "社群", "電子報", "EIP", "內網", "網站"]

export async function previewDigitalCommsSplit() {
  await requireAdmin()

  const digitalCategory = await prisma.category.findUnique({
    where: { name: "數位傳播" },
  })
  if (!digitalCategory) throw new Error("DIGITAL_CATEGORY_MISSING")

  const commProjects = await prisma.project.findMany({
    where: { categories: { some: { category: { name: "溝通管理" } } } },
    select: {
      id: true,
      name: true,
      categories: { select: { categoryId: true } },
    },
    orderBy: { name: "asc" },
  })

  return commProjects.map((p) => ({
    id: p.id,
    name: p.name,
    alreadyTagged: p.categories.some((c) => c.categoryId === digitalCategory.id),
    suggested: DIGITAL_KEYWORDS.some((kw) => p.name.includes(kw)),
  }))
}

export async function applyDigitalCommsSplit(projectIds: string[]) {
  await requireAdmin()

  const digitalCategory = await prisma.category.findUnique({
    where: { name: "數位傳播" },
  })
  if (!digitalCategory) throw new Error("DIGITAL_CATEGORY_MISSING")

  await prisma.projectCategory.createMany({
    data: projectIds.map((projectId) => ({
      projectId,
      categoryId: digitalCategory.id,
    })),
    skipDuplicates: true,
  })

  revalidatePath("/dashboard")
  revalidatePath("/my-projects")
  return { appliedCount: projectIds.length }
}
