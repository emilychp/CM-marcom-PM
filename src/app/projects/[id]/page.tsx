import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getEffectiveProjectRole, canManageProject } from "@/lib/permissions"
import { getAllUsers } from "@/lib/users-data"
import { computeProjectProgress } from "@/lib/projects-data"
import { NavBar } from "@/components/nav-bar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  projectStatusLabels,
  projectStatusVariant,
} from "@/lib/status-labels"
import { ProjectStatusSelect } from "@/components/project-status-select"
import { PhaseList } from "@/components/phase-list"
import { AddPhaseForm } from "@/components/add-phase-form"
import { MembersPanel } from "@/components/members-panel"
import { CustomFieldsPanel } from "@/components/custom-fields-panel"
import { ActivityTimeline } from "@/components/activity-timeline"
import { AttachmentsPanel } from "@/components/attachments-panel"

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return null

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      phases: {
        orderBy: { order: "asc" },
        include: {
          tasks: {
            orderBy: { order: "asc" },
            include: { assignee: { select: { id: true, name: true } } },
          },
        },
      },
      fieldDefs: {
        where: { scope: "PROJECT" },
        orderBy: { order: "asc" },
        include: { values: { where: { entityId: id } } },
      },
      attachments: {
        orderBy: { createdAt: "desc" },
        include: { uploader: { select: { id: true, name: true } } },
      },
    },
  })

  if (!project) notFound()

  const role = await getEffectiveProjectRole(
    session.user.id,
    session.user.globalRole,
    project.id
  )
  if (!role) notFound()

  const manageable = canManageProject(role)
  const progress = computeProjectProgress(project.phases)
  const allUsers = await getAllUsers()

  const taskIds = project.phases.flatMap((phase) => phase.tasks.map((t) => t.id))
  const activity = await prisma.activityLog.findMany({
    where: {
      OR: [
        { entityType: "PROJECT", entityId: project.id },
        { entityType: "TASK", entityId: { in: taskIds } },
      ],
    },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  })

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <NavBar />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8">
        <div className="rounded-lg border bg-background p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{project.name}</h1>
                <Badge variant={projectStatusVariant[project.status]}>
                  {projectStatusLabels[project.status]}
                </Badge>
              </div>
              {project.description && (
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {project.description}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                負責人：{project.owner.name}
                {project.dueDate &&
                  ` ・ 截止日期：${new Date(project.dueDate).toLocaleDateString("zh-TW")}`}
              </p>
            </div>
            {manageable && (
              <ProjectStatusSelect
                projectId={project.id}
                currentStatus={project.status}
              />
            )}
          </div>
          <div className="mt-4 space-y-1">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>總進度</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </div>

        <div className="rounded-lg border bg-background p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">專案流程</h2>
            {manageable && <AddPhaseForm projectId={project.id} />}
          </div>
          <PhaseList
            projectId={project.id}
            phases={project.phases}
            role={role}
            currentUserId={session.user.id}
            manageable={manageable}
            allUsers={allUsers}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CustomFieldsPanel
            projectId={project.id}
            entityType="PROJECT"
            entityId={project.id}
            fieldDefs={project.fieldDefs}
            manageable={manageable}
          />
          <MembersPanel
            projectId={project.id}
            members={project.members}
            allUsers={allUsers}
            manageable={manageable}
          />
        </div>

        <AttachmentsPanel
          projectId={project.id}
          attachments={project.attachments}
          currentUserId={session.user.id}
          manageable={manageable}
        />

        <ActivityTimeline activity={activity} />
      </main>
    </div>
  )
}
