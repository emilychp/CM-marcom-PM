import { prisma } from "@/lib/prisma"

export type EffectiveRole = "ADMIN" | "MANAGER" | "MEMBER" | null

/** Resolves what role a user effectively has within a specific project. */
export async function getEffectiveProjectRole(
  userId: string,
  globalRole: "ADMIN" | "MEMBER",
  projectId: string
): Promise<EffectiveRole> {
  if (globalRole === "ADMIN") return "ADMIN"

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })

  if (!membership) return null
  return membership.roleInProject
}

export function canManageProject(role: EffectiveRole): boolean {
  return role === "ADMIN" || role === "MANAGER"
}

export function canEditTask(
  role: EffectiveRole,
  task: { assigneeId: string | null },
  userId: string
): boolean {
  if (role === "ADMIN" || role === "MANAGER") return true
  if (role === "MEMBER") return task.assigneeId === userId
  return false
}
