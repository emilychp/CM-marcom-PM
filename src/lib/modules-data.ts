import { prisma } from "@/lib/prisma"

export async function getModules() {
  return prisma.module.findMany({
    orderBy: { order: "asc" },
    include: { categories: { orderBy: { order: "asc" } } },
  })
}
