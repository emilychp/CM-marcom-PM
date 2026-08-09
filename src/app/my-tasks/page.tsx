import Link from "next/link"
import { auth } from "@/auth"
import { NavBar } from "@/components/nav-bar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { HealthDot } from "@/components/health-dot"
import { getMyAssignedTasks } from "@/lib/my-tasks-data"
import { taskStatusLabels, taskStatusVariant, taskHealthLabels } from "@/lib/status-labels"

export default async function MyTasksPage() {
  const session = await auth()
  if (!session?.user) return null

  const tasks = await getMyAssignedTasks(session.user.id)

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <NavBar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">我的任務</h1>
          <p className="text-sm text-muted-foreground">
            共 {tasks.length} 項尚未完成、指派給你的任務
          </p>
        </div>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center text-muted-foreground">
            <p>目前沒有指派給你的待辦任務</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/projects/${task.phase.project.id}`}
                className="flex flex-wrap items-center gap-3 rounded-lg border bg-background px-4 py-3 hover:border-foreground/30"
              >
                <HealthDot health={task.health} size="lg" />
                <div className="min-w-40 flex-1">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.phase.project.name} ・ {task.phase.name}
                    {task.dueDate &&
                      ` ・ 截止 ${new Date(task.dueDate).toLocaleDateString("zh-TW")}`}
                  </p>
                </div>
                <Badge variant={taskStatusVariant[task.status]}>
                  {taskStatusLabels[task.status]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {taskHealthLabels[task.health]}
                </span>
                <div className="w-24">
                  <Progress value={task.progress} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
