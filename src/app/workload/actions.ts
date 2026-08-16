"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"

export async function setWorkloadAllocation(
  userId: string,
  moduleId: string,
  percentage: number
) {
  const admin = await requireUser()
  if (admin.globalRole !== "ADMIN") throw new Error("FORBIDDEN")

  if (!Number.isInteger(percentage) || percentage < 0 || percentage > 100) {
    throw new Error("INVALID_PERCENTAGE")
  }

  await prisma.workloadAllocation.upsert({
    where: { userId_moduleId: { userId, moduleId } },
    update: { percentage },
    create: { userId, moduleId, percentage },
  })

  revalidatePath("/workload")
}
