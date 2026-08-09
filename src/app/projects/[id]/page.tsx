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
  projectPriorityLabels,
  projectPriorityBadgeClass,
} from "@/lib/status-labels"
import { ProjectStatusSelect } from "@/components/project-status-select"
import { ProjectPrioritySelect } from "@/components/project-priority-select"
import { ProjectNameEditor } from "@/components/project-name-editor"
import { ProjectOwnerSelect } from "@/components/project-owner-select"
import { ProjectDescriptionEditor } from "@/components/project-description-editor"
import { ProjectDatesDialog } from "@/components/project-dates-dialog"
import { PhaseSection } from "@/components/phase-section"
import { MembersPanel } from "@/components/members-panel"
import { CustomFieldsPanel } from "@/components/custom-fields-panel"
import { ActivityTimeline } from "@/components/activity-timeline"
import { AttachmentsPanel } from "@/components/attachments-panel"
import { MeetingNotesPanel } from "@/components/meeting-notes-panel"
import { CommentsPanel } from "@/components/comments-panel"
import { DeleteProjectDialog } from "@/components/delete-project-dialog"

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
            include: {
              assignee: { select: { id: true, name: true } },
              attachments: {
                orderBy: { createdAt: "desc" },
                include: { uploader: { select: { id: true, name: true } } },
              },
            },
          },
        },
      },
      fieldDefs: {
        where: { scope: "PROJECT" },
        orderBy: { order: "asc" },
        include: { values: { where: { entityId: id } } },
      },
      attachments: {
        where: { taskId: null, meetingNoteId: null },
        orderBy: { createdAt: "desc" },
        include: { uploader: { select: { id: true, name: true } } },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true } } },
      },
      meetingNotes: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true } },
          attachments: {
            orderBy: { createdAt: "desc" },
            include: { uploader: { select: { id: true, name: true } } },
          },
        },
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
    <div className="flex min-h-screen flex-col bg-canvas">
      <NavBar />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8">
        <div className="rounded-lg border bg-background p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ProjectNameEditor
                  projectId={project.id}
                  name={project.name}
                  manageable={manageable}
                />
                <Badge variant={projectStatusVariant[project.status]}>
                  {projectStatusLabels[project.status]}
                </Badge>
                <Badge className={projectPriorityBadgeClass[project.priority]}>
                  {projectPriorityLabels[project.priority]}
                </Badge>
              </div>
              <ProjectDescriptionEditor
                projectId={project.id}
                description={project.description}
                manageable={manageable}
              />
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <span>負責人：</span>
                {manageable ? (
                  <ProjectOwnerSelect
                    projectId={project.id}
                    ownerId={project.owner.id}
                    allUsers={allUsers}
                  />
                ) : (
                  <span>{project.owner.name}</span>
                )}
                <span>・</span>
                <ProjectDatesDialog
                  projectId={project.id}
                  startDate={project.startDate}
                  dueDate={project.dueDate}
                  manageable={manageable}
                />
              </div>
            </div>
            {manageable && (
              <div className="flex items-center gap-2">
                <ProjectPrioritySelect
                  projectId={project.id}
                  currentPriority={project.priority}
                />
                <ProjectStatusSelect
                  projectId={project.id}
                  currentStatus={project.status}
                />
              </div>
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

        <PhaseSection
          projectId={project.id}
          phases={project.phases}
          role={role}
          currentUserId={session.user.id}
          manageable={manageable}
          allUsers={allUsers}
          projectStartDate={project.startDate}
          projectDueDate={project.dueDate}
        />

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
          coverAttachmentId={project.coverAttachmentId}
        />

        <MeetingNotesPanel
          projectId={project.id}
          notes={project.meetingNotes}
          currentUserId={session.user.id}
          manageable={manageable}
        />

        <CommentsPanel
          projectId={project.id}
          comments={project.comments}
          currentUserId={session.user.id}
          manageable={manageable}
        />

        <ActivityTimeline activity={activity} />

        {manageable && (
          <div className="rounded-lg border border-destructive/30 bg-background p-6">
            <h2 className="text-lg font-semibold text-destructive">危險區域</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              刪除專案會一併移除所有階段、任務、附件與自訂欄位資料，且無法復原，請謹慎操作。
            </p>
            <div className="mt-4">
              <DeleteProjectDialog projectId={project.id} projectName={project.name} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
