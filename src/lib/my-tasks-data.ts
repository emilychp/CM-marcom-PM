import { prisma } from "@/lib/prisma"
import { TASK_HEALTH_SEVERITY } from "@/lib/status-labels"

export async function getMyAssignedTasks(userId: string) {
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      status: { not: "DONE" },
    },
    include: {
      phase: {
        select: {
          id: true,
          name: true,
          project: { select: { id: true, name: true } },
        },
      },
    },
  })

  return tasks.sort((a, b) => {
    const severityDiff =
      TASK_HEALTH_SEVERITY.indexOf(a.health as (typeof TASK_HEALTH_SEVERITY)[number]) -
      TASK_HEALTH_SEVERITY.indexOf(b.health as (typeof TASK_HEALTH_SEVERITY)[number])
    if (severityDiff !== 0) return severityDiff

    if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime()
    if (a.dueDate) return -1
    if (b.dueDate) return 1
    return 0
  })
}
