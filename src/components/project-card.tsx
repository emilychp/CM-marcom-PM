import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  projectStatusLabels,
  projectStatusVariant,
  projectPriorityLabels,
  projectPriorityBadgeClass,
  taskHealthLabels,
} from "@/lib/status-labels"
import { TaskStatusBreakdown } from "@/components/task-status-breakdown"
import { HealthDot } from "@/components/health-dot"

export type ProjectCardData = {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  owner: { id: string; name: string } | null
  dueDate: Date | null
  memberCount: number
  taskCount: number
  progress: number
  statusCounts: Record<string, number>
  health: string | null
  highlightNote: string | null
  previewImage: { id: string; isDirectImage: boolean } | null
}

export function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <Link href={`/projects/${project.id}`} className="block">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        {project.previewImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/attachments/${project.previewImage.id}${project.previewImage.isDirectImage ? "" : "?thumbnail"}`}
            alt=""
            className="h-44 w-full object-cover"
          />
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1">{project.name}</CardTitle>
            <div className="flex shrink-0 items-center gap-1.5">
              <Badge className={projectPriorityBadgeClass[project.priority]}>
                {projectPriorityLabels[project.priority]}
              </Badge>
              <Badge variant={projectStatusVariant[project.status]}>
                {projectStatusLabels[project.status]}
              </Badge>
            </div>
          </div>
          {project.description && (
            <CardDescription className="line-clamp-2">
              {project.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
            <div className="flex items-center gap-2">
              {project.health ? (
                <>
                  <HealthDot health={project.health} size="lg" />
                  <span className="text-sm font-medium">
                    {taskHealthLabels[project.health]}
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">尚無任務</span>
              )}
            </div>
            <span className="text-sm font-medium">{project.progress}%</span>
          </div>

          {project.highlightNote && (
            <p className="line-clamp-2 text-xs text-muted-foreground italic">
              {project.highlightNote}
            </p>
          )}

          <TaskStatusBreakdown counts={project.statusCounts} />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>負責人：{project.owner?.name ?? "—"}</span>
            <span>{project.taskCount} 項任務</span>
          </div>
          {project.dueDate && (
            <div className="text-sm text-muted-foreground">
              截止日期：
              {new Date(project.dueDate).toLocaleDateString("zh-TW")}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
