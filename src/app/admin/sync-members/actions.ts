"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"

async function requireAdmin() {
  const user = await requireUser()
  if (user.globalRole !== "ADMIN") throw new Error("FORBIDDEN")
  return user
}

async function findMissingMemberships() {
  const tasks = await prisma.task.findMany({
    where: { assigneeId: { not: null } },
    select: {
      assigneeId: true,
      assignee: { select: { name: true } },
      phase: { select: { projectId: true, project: { select: { name: true } } } },
    },
  })

  const existingMemberships = await prisma.projectMember.findMany({
    select: { projectId: true, userId: true },
  })
  const membershipKeys = new Set(existingMemberships.map((m) => `${m.projectId}:${m.userId}`))

  const missing = new Map<
    string,
    { projectId: string; projectName: string; userId: string; userName: string }
  >()
  for (const task of tasks) {
    if (!task.assigneeId) continue
    const projectId = task.phase.projectId
    const key = `${projectId}:${task.assigneeId}`
    if (membershipKeys.has(key) || missing.has(key)) continue
    missing.set(key, {
      projectId,
      projectName: task.phase.project.name,
      userId: task.assigneeId,
      userName: task.assignee?.name ?? "（未知使用者）",
    })
  }

  return Array.from(missing.values())
}

export async function previewMissingMemberships() {
  await requireAdmin()
  return findMissingMemberships()
}

export async function applyMissingMemberships() {
  await requireAdmin()
  const missing = await findMissingMemberships()

  await prisma.projectMember.createMany({
    data: missing.map((m) => ({
      projectId: m.projectId,
      userId: m.userId,
      roleInProject: "MEMBER" as const,
    })),
    skipDuplicates: true,
  })

  revalidatePath("/dashboard")
  revalidatePath("/my-projects")
  return { appliedCount: missing.length }
}
