import { prisma } from "@/lib/prisma"
import { TASK_HEALTH_SEVERITY, PROJECT_PRIORITY_ORDER } from "@/lib/status-labels"

const NOTE_SNIPPET_LENGTH = 60

function pickWorstHealth(tasks: { health: string }[]): string | null {
  if (tasks.length === 0) return null
  for (const level of TASK_HEALTH_SEVERITY) {
    if (tasks.some((task) => task.health === level)) return level
  }
  return "ON_TRACK"
}

function pickHighlightNote(
  phases: {
    name: string
    tasks: { description: string | null; updatedAt: Date }[]
  }[]
): string | null {
  const candidates = phases
    .flatMap((phase) =>
      phase.tasks
        .filter((task) => task.description?.trim())
        .map((task) => ({ phaseName: phase.name, task }))
    )
    .sort((a, b) => b.task.updatedAt.getTime() - a.task.updatedAt.getTime())

  const top = candidates[0]
  if (!top) return null

  const note = top.task.description!.trim().replace(/\s+/g, " ")
  const snippet =
    note.length > NOTE_SNIPPET_LENGTH
      ? `${note.slice(0, NOTE_SNIPPET_LENGTH)}…`
      : note

  return `${top.phaseName}：${snippet}`
}

export async function getProjectsForUser(user: {
  id: string
  globalRole: "ADMIN" | "MEMBER"
}) {
  const projects = await prisma.project.findMany({
    where:
      user.globalRole === "ADMIN"
        ? {}
        : { members: { some: { userId: user.id } } },
    include: {
      owner: { select: { id: true, name: true } },
      members: { select: { userId: true } },
      phases: {
        include: {
          tasks: {
            select: {
              progress: true,
              status: true,
              health: true,
              description: true,
              updatedAt: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return projects.map((project) => {
    const allTasks = project.phases.flatMap((phase) => phase.tasks)
    const progress =
      allTasks.length === 0
        ? 0
        : Math.round(
            allTasks.reduce((sum, task) => sum + task.progress, 0) /
              allTasks.length
          )

    const statusCounts = {
      TODO: 0,
      IN_PROGRESS: 0,
      BLOCKED: 0,
      DONE: 0,
    }
    for (const task of allTasks) {
      statusCounts[task.status as keyof typeof statusCounts] += 1
    }

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      owner: project.owner,
      dueDate: project.dueDate,
      updatedAt: project.updatedAt,
      memberCount: project.members.length,
      taskCount: allTasks.length,
      progress,
      statusCounts,
      health: pickWorstHealth(allTasks),
      highlightNote: pickHighlightNote(project.phases),
    }
  }).sort((a, b) => {
    const priorityDiff =
      PROJECT_PRIORITY_ORDER.indexOf(a.priority as (typeof PROJECT_PRIORITY_ORDER)[number]) -
      PROJECT_PRIORITY_ORDER.indexOf(b.priority as (typeof PROJECT_PRIORITY_ORDER)[number])
    if (priorityDiff !== 0) return priorityDiff
    return b.updatedAt.getTime() - a.updatedAt.getTime()
  })
}

export function computeProjectProgress(
  phases: { tasks: { progress: number }[] }[]
) {
  const allTasks = phases.flatMap((phase) => phase.tasks)
  if (allTasks.length === 0) return 0
  return Math.round(
    allTasks.reduce((sum, task) => sum + task.progress, 0) / allTasks.length
  )
}
