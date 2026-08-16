import { prisma } from "@/lib/prisma"

export async function getWorkloadSummary() {
  const users = await prisma.user.findMany({
    where: { staffTier: "EXECUTION" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      ownedProjects: {
        where: { status: { not: "ARCHIVED" } },
        select: { id: true },
      },
      assignedTasks: {
        where: { status: { not: "DONE" } },
        select: {
          id: true,
          title: true,
          status: true,
          health: true,
          dueDate: true,
          phase: {
            select: {
              project: { select: { id: true, name: true } },
            },
          },
        },
      },
      workloadAllocations: {
        select: { moduleId: true, percentage: true },
      },
    },
  })

  return users
    .map((user) => {
      const statusCounts = { TODO: 0, IN_PROGRESS: 0, BLOCKED: 0 }
      for (const task of user.assignedTasks) {
        statusCounts[task.status as keyof typeof statusCounts] += 1
      }
      const allocations: Record<string, number> = {}
      for (const a of user.workloadAllocations) {
        allocations[a.moduleId] = a.percentage
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        ownedProjectCount: user.ownedProjects.length,
        taskCount: user.assignedTasks.length,
        statusCounts,
        allocations,
        tasks: user.assignedTasks
          .map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            health: t.health,
            dueDate: t.dueDate,
            projectId: t.phase.project.id,
            projectName: t.phase.project.name,
          }))
          .sort((a, b) => {
            if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime()
            if (a.dueDate) return -1
            if (b.dueDate) return 1
            return 0
          }),
      }
    })
    .sort((a, b) => b.taskCount - a.taskCount)
}
