"use server"

import { revalidatePath } from "next/cache"
import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"
import { getEffectiveProjectRole, canManageProject, canEditTask } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import { saveAttachmentFile, deleteAttachmentFile } from "@/lib/attachment-storage"
import { extractPptxThumbnail } from "@/lib/attachment-thumbnail"
import { Prisma } from "@/generated/prisma/client"
import type {
  ProjectStatus,
  ProjectPriority,
  PhaseStatus,
  TaskStatus,
  TaskHealth,
  FieldType,
  FieldScope,
  RecurrenceFrequency,
} from "@/generated/prisma/enums"

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
])

// ---------- Project ----------

export async function createProject(data: {
  name: string
  description?: string
  dueDate?: string
  categoryIds?: string[]
}) {
  const user = await requireUser()

  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      ownerId: user.id,
      members: {
        create: [{ userId: user.id, roleInProject: "MANAGER" }],
      },
      categories: data.categoryIds?.length
        ? { create: data.categoryIds.map((categoryId) => ({ categoryId })) }
        : undefined,
    },
  })

  await logActivity({
    entityType: "PROJECT",
    entityId: project.id,
    userId: user.id,
    action: "CREATED",
  })

  revalidatePath("/dashboard")
  return project
}

export async function setProjectCategories(projectId: string, categoryIds: string[]) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!role) throw new Error("FORBIDDEN")

  await prisma.$transaction([
    prisma.projectCategory.deleteMany({ where: { projectId } }),
    prisma.projectCategory.createMany({
      data: categoryIds.map((categoryId) => ({ projectId, categoryId })),
      skipDuplicates: true,
    }),
  ])

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "CATEGORIES_CHANGED",
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/dashboard")
  revalidatePath("/my-projects")
}

export async function reorderProjects(orderedIds: string[]) {
  await requireUser()

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.project.update({ where: { id }, data: { dashboardOrder: index } })
    )
  )

  revalidatePath("/dashboard")
  revalidatePath("/my-projects")
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  const before = await prisma.project.findUniqueOrThrow({ where: { id: projectId } })
  const project = await prisma.project.update({
    where: { id: projectId },
    data: { status },
  })

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "STATUS_CHANGED",
    field: "status",
    oldValue: before.status,
    newValue: status,
  })

  revalidatePath("/dashboard")
  revalidatePath(`/projects/${projectId}`)
  return project
}

export async function updateProjectPriority(
  projectId: string,
  priority: ProjectPriority
) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  const before = await prisma.project.findUniqueOrThrow({ where: { id: projectId } })
  const project = await prisma.project.update({
    where: { id: projectId },
    data: { priority },
  })

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "PRIORITY_CHANGED",
    field: "priority",
    oldValue: before.priority,
    newValue: priority,
  })

  revalidatePath("/dashboard")
  revalidatePath(`/projects/${projectId}`)
  return project
}

export async function updateProjectName(projectId: string, name: string) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  const trimmed = name.trim()
  if (!trimmed) throw new Error("INVALID_NAME")

  const before = await prisma.project.findUniqueOrThrow({ where: { id: projectId } })
  const project = await prisma.project.update({
    where: { id: projectId },
    data: { name: trimmed },
  })

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "NAME_CHANGED",
    field: "name",
    oldValue: before.name,
    newValue: trimmed,
  })

  revalidatePath("/dashboard")
  revalidatePath(`/projects/${projectId}`)
  return project
}

export async function updateProjectDescription(projectId: string, description: string) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { description: description.trim() || null },
  })

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "DESCRIPTION_CHANGED",
  })

  revalidatePath("/dashboard")
  revalidatePath(`/projects/${projectId}`)
  return project
}

export async function updateProjectDates(
  projectId: string,
  data: { startDate: string | null; dueDate: string | null }
) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  })

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "UPDATED",
    field: "project_dates",
  })

  revalidatePath("/dashboard")
  revalidatePath(`/projects/${projectId}`)
  return project
}

export async function updateProjectOwner(projectId: string, ownerId: string) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  const newOwner = await prisma.user.findUniqueOrThrow({ where: { id: ownerId } })
  const before = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { owner: { select: { name: true } } },
  })

  const [project] = await prisma.$transaction([
    prisma.project.update({
      where: { id: projectId },
      data: { ownerId },
    }),
    prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: ownerId } },
      create: { projectId, userId: ownerId, roleInProject: "MANAGER" },
      update: { roleInProject: "MANAGER" },
    }),
  ])

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "OWNER_CHANGED",
    field: "owner",
    oldValue: before.owner?.name ?? null,
    newValue: newOwner.name,
  })

  revalidatePath("/dashboard")
  revalidatePath(`/projects/${projectId}`)
  return project
}

export async function deleteProject(projectId: string) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  // Clean up externally-stored attachment files before the DB cascade
  // removes their rows — Prisma's cascade only deletes the Attachment
  // records, not the underlying files in local storage / Vercel Blob.
  const attachments = await prisma.attachment.findMany({ where: { projectId } })
  await Promise.all(attachments.map((a) => deleteAttachmentFile(a.storageKey)))

  // ActivityLog rows reference their subject via a polymorphic
  // (entityType, entityId) pair rather than a real foreign key, so they
  // don't cascade automatically — clean up both the project's own log
  // and its tasks' logs explicitly to avoid leaving orphaned rows.
  const taskIds = (
    await prisma.task.findMany({
      where: { phase: { projectId } },
      select: { id: true },
    })
  ).map((t) => t.id)

  await prisma.activityLog.deleteMany({
    where: {
      OR: [
        { entityType: "PROJECT", entityId: projectId },
        { entityType: "TASK", entityId: { in: taskIds } },
      ],
    },
  })

  await prisma.project.delete({ where: { id: projectId } })

  revalidatePath("/dashboard")
}

export async function addProjectMember(
  projectId: string,
  userId: string,
  roleInProject: "MANAGER" | "MEMBER"
) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  const member = await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId } },
    update: { roleInProject },
    create: { projectId, userId, roleInProject },
  })

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "MEMBER_ADDED",
    field: "member",
    newValue: userId,
  })

  revalidatePath(`/projects/${projectId}`)
  return member
}

export async function removeProjectMember(projectId: string, userId: string) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  })

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "MEMBER_REMOVED",
    field: "member",
    oldValue: userId,
  })

  revalidatePath(`/projects/${projectId}`)
}

// ---------- Phase ----------

export async function createPhase(projectId: string, name: string) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  const count = await prisma.phase.count({ where: { projectId } })
  const phase = await prisma.phase.create({
    data: { projectId, name, order: count },
  })

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "UPDATED",
    field: "phase_added",
    newValue: name,
  })

  revalidatePath(`/projects/${projectId}`)
  return phase
}

export async function updatePhaseStatus(
  phaseId: string,
  projectId: string,
  status: PhaseStatus
) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  const phase = await prisma.phase.update({
    where: { id: phaseId },
    data: { status },
  })

  revalidatePath(`/projects/${projectId}`)
  return phase
}

export async function updatePhase(
  phaseId: string,
  projectId: string,
  data: { name: string }
) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  const before = await prisma.phase.findUniqueOrThrow({ where: { id: phaseId } })
  const phase = await prisma.phase.update({
    where: { id: phaseId },
    data: { name: data.name },
  })

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "UPDATED",
    field: "phase_renamed",
    oldValue: before.name,
    newValue: data.name,
  })

  revalidatePath(`/projects/${projectId}`)
  return phase
}

export async function updatePhaseSchedule(
  phaseId: string,
  projectId: string,
  data: {
    startDate: string | null
    dueDate: string | null
    isRecurring: boolean
    recurrenceFrequency: RecurrenceFrequency | null
  }
) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  const phase = await prisma.phase.update({
    where: { id: phaseId },
    data: {
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      isRecurring: data.isRecurring,
      recurrenceFrequency: data.isRecurring ? data.recurrenceFrequency : null,
    },
  })

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "UPDATED",
    field: "phase_schedule",
  })

  revalidatePath(`/projects/${projectId}`)
  return phase
}

export async function deletePhase(phaseId: string, projectId: string) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  const phase = await prisma.phase.delete({ where: { id: phaseId } })

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "UPDATED",
    field: "phase_removed",
    oldValue: phase.name,
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/dashboard")
}

// ---------- Task ----------

export async function createTask(
  phaseId: string,
  projectId: string,
  data: { title: string; assigneeId?: string | null; dueDate?: string }
) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  const count = await prisma.task.count({ where: { phaseId } })
  const task = await prisma.task.create({
    data: {
      phaseId,
      title: data.title,
      assigneeId: data.assigneeId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      order: count,
    },
  })

  await logActivity({
    entityType: "TASK",
    entityId: task.id,
    userId: user.id,
    action: "CREATED",
  })

  revalidatePath(`/projects/${projectId}`)
  return task
}

export async function updateTaskProgress(
  taskId: string,
  projectId: string,
  progress: number,
  status: TaskStatus
) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } })

  if (!canEditTask(role, task, user.id)) throw new Error("FORBIDDEN")

  const clampedProgress = Math.min(100, Math.max(0, progress))

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { progress: clampedProgress, status },
  })

  await logActivity({
    entityType: "TASK",
    entityId: taskId,
    userId: user.id,
    action: "PROGRESS_UPDATED",
    field: "progress",
    oldValue: String(task.progress),
    newValue: String(clampedProgress),
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/dashboard")
  return updated
}

export async function updateTaskHealth(
  taskId: string,
  projectId: string,
  health: TaskHealth
) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } })

  if (!canEditTask(role, task, user.id)) throw new Error("FORBIDDEN")

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { health },
  })

  await logActivity({
    entityType: "TASK",
    entityId: taskId,
    userId: user.id,
    action: "HEALTH_CHANGED",
    field: "health",
    oldValue: task.health,
    newValue: health,
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/dashboard")
  return updated
}

// Lets whoever can work on the task (assignee, manager, or admin) keep
// its free-form progress note up to date, without needing manager-only
// access to restructure the task (title/assignee/due date).
export async function updateTaskNote(
  taskId: string,
  projectId: string,
  description: string
) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } })

  if (!canEditTask(role, task, user.id)) throw new Error("FORBIDDEN")

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { description: description || null },
  })

  await logActivity({
    entityType: "TASK",
    entityId: taskId,
    userId: user.id,
    action: "NOTE_UPDATED",
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/dashboard")
  return updated
}

export async function updateTask(
  taskId: string,
  projectId: string,
  data: {
    title: string
    description?: string
    assigneeId?: string | null
    dueDate?: string | null
  }
) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  const dueDate = data.dueDate ? new Date(data.dueDate) : null

  if (dueDate) {
    const phase = await prisma.phase.findFirstOrThrow({
      where: { tasks: { some: { id: taskId } } },
      select: { startDate: true, dueDate: true },
    })
    if (phase.startDate && dueDate < phase.startDate) {
      return { ok: false as const, error: "TASK_DUE_DATE_BEFORE_PHASE_START" as const }
    }
    if (phase.dueDate && dueDate > phase.dueDate) {
      return { ok: false as const, error: "TASK_DUE_DATE_AFTER_PHASE_DUE" as const }
    }
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: data.title,
      description: data.description || null,
      assigneeId: data.assigneeId || null,
      dueDate,
    },
  })

  await logActivity({
    entityType: "TASK",
    entityId: taskId,
    userId: user.id,
    action: "UPDATED",
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/dashboard")
  return { ok: true as const, task }
}

export async function deleteTask(taskId: string, projectId: string) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  const task = await prisma.task.delete({ where: { id: taskId } })

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "UPDATED",
    field: "task_removed",
    oldValue: task.title,
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/dashboard")
}

// ---------- Attachments ----------

// A thumbnail either comes pre-rendered from the client (PDFs, rendered via
// pdf.js since there's no serverless-safe way to rasterize a PDF here) or
// gets extracted server-side from a .pptx's embedded preview image. Neither
// is guaranteed, so callers fall back to a generic file-type icon.
async function resolveThumbnailStorageKey(
  uploadKeyBase: string,
  formData: FormData,
  file: File,
  buffer: Buffer
): Promise<string | null> {
  const clientThumbnail = formData.get("thumbnail")
  if (clientThumbnail instanceof File && clientThumbnail.size > 0) {
    const thumbBuffer = Buffer.from(await clientThumbnail.arrayBuffer())
    return saveAttachmentFile(`${uploadKeyBase}-thumb.png`, thumbBuffer)
  }

  const extracted = await extractPptxThumbnail(buffer, file.type)
  if (!extracted) return null
  const ext = extracted.mimeType === "image/png" ? "png" : "jpg"
  return saveAttachmentFile(`${uploadKeyBase}-thumb.${ext}`, extracted.buffer)
}

export async function uploadAttachment(projectId: string, formData: FormData) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!role) throw new Error("FORBIDDEN")

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("NO_FILE")
  }
  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error("FILE_TOO_LARGE")
  }
  if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
    throw new Error("UNSUPPORTED_TYPE")
  }

  const safeName = file.name.replace(/[^\w.\-一-鿿]+/g, "_")
  const uploadKeyBase = `${projectId}/${randomUUID()}-${safeName}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const storageKey = await saveAttachmentFile(uploadKeyBase, buffer)
  const thumbnailStorageKey = await resolveThumbnailStorageKey(
    uploadKeyBase,
    formData,
    file,
    buffer
  )

  const attachment = await prisma.attachment.create({
    data: {
      projectId,
      uploaderId: user.id,
      filename: file.name,
      storageKey,
      thumbnailStorageKey,
      mimeType: file.type,
      size: file.size,
    },
  })

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "ATTACHMENT_ADDED",
    field: "attachment",
    newValue: file.name,
  })

  revalidatePath(`/projects/${projectId}`)
  return attachment
}

export async function uploadTaskAttachment(
  taskId: string,
  projectId: string,
  formData: FormData
) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } })
  if (!canEditTask(role, task, user.id)) throw new Error("FORBIDDEN")

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("NO_FILE")
  }
  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error("FILE_TOO_LARGE")
  }
  if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
    throw new Error("UNSUPPORTED_TYPE")
  }

  const safeName = file.name.replace(/[^\w.\-一-鿿]+/g, "_")
  const uploadKeyBase = `${projectId}/tasks/${taskId}/${randomUUID()}-${safeName}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const storageKey = await saveAttachmentFile(uploadKeyBase, buffer)
  const thumbnailStorageKey = await resolveThumbnailStorageKey(
    uploadKeyBase,
    formData,
    file,
    buffer
  )

  const attachment = await prisma.attachment.create({
    data: {
      projectId,
      taskId,
      uploaderId: user.id,
      filename: file.name,
      storageKey,
      thumbnailStorageKey,
      mimeType: file.type,
      size: file.size,
    },
  })

  await logActivity({
    entityType: "TASK",
    entityId: taskId,
    userId: user.id,
    action: "ATTACHMENT_ADDED",
    field: "attachment",
    newValue: file.name,
  })

  revalidatePath(`/projects/${projectId}`)
  return attachment
}

export async function deleteTaskAttachment(attachmentId: string, projectId: string) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!role) throw new Error("FORBIDDEN")

  const attachment = await prisma.attachment.findUniqueOrThrow({
    where: { id: attachmentId },
  })

  const canDelete = canManageProject(role) || attachment.uploaderId === user.id
  if (!canDelete) throw new Error("FORBIDDEN")

  await prisma.attachment.delete({ where: { id: attachmentId } })
  await deleteAttachmentFile(attachment.storageKey)
  if (attachment.thumbnailStorageKey) {
    await deleteAttachmentFile(attachment.thumbnailStorageKey)
  }

  if (attachment.taskId) {
    await logActivity({
      entityType: "TASK",
      entityId: attachment.taskId,
      userId: user.id,
      action: "ATTACHMENT_REMOVED",
      field: "attachment",
      oldValue: attachment.filename,
    })
  }

  revalidatePath(`/projects/${projectId}`)
}

export async function deleteAttachment(attachmentId: string, projectId: string) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!role) throw new Error("FORBIDDEN")

  const attachment = await prisma.attachment.findUniqueOrThrow({
    where: { id: attachmentId },
  })

  const canDelete = canManageProject(role) || attachment.uploaderId === user.id
  if (!canDelete) throw new Error("FORBIDDEN")

  await prisma.attachment.delete({ where: { id: attachmentId } })
  await deleteAttachmentFile(attachment.storageKey)
  if (attachment.thumbnailStorageKey) {
    await deleteAttachmentFile(attachment.thumbnailStorageKey)
  }

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "ATTACHMENT_REMOVED",
    field: "attachment",
    oldValue: attachment.filename,
  })

  revalidatePath(`/projects/${projectId}`)
}

export async function setProjectCoverAttachment(
  projectId: string,
  attachmentId: string | null
) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  if (attachmentId) {
    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } })
    if (!attachment || attachment.projectId !== projectId) throw new Error("NOT_FOUND")
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { coverAttachmentId: attachmentId },
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/dashboard")
  revalidatePath("/my-projects")
}

// ---------- Custom fields ----------

export async function upsertFieldDefinition(
  projectId: string,
  data: {
    scope: FieldScope
    key: string
    label: string
    fieldType: FieldType
    options?: { label: string; color?: string }[]
  }
) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  const count = await prisma.fieldDefinition.count({ where: { projectId } })

  const fieldDef = await prisma.fieldDefinition.upsert({
    where: {
      projectId_scope_key: { projectId, scope: data.scope, key: data.key },
    },
    update: {
      label: data.label,
      fieldType: data.fieldType,
      options: data.options ?? undefined,
    },
    create: {
      projectId,
      scope: data.scope,
      key: data.key,
      label: data.label,
      fieldType: data.fieldType,
      options: data.options ?? undefined,
      order: count,
    },
  })

  revalidatePath(`/projects/${projectId}`)
  return fieldDef
}

export async function setFieldValue(
  entityType: "PROJECT" | "TASK",
  entityId: string,
  projectId: string,
  fieldDefinitionId: string,
  value: string | number
) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  // Any project member may fill in custom field values (they're project
  // content, same as task progress) — only the field schema itself
  // (upsert/update/delete FieldDefinition) is manager-restricted.
  if (!role) throw new Error("FORBIDDEN")

  const fieldValue = await prisma.fieldValue.upsert({
    where: {
      entityType_entityId_fieldDefinitionId: {
        entityType,
        entityId,
        fieldDefinitionId,
      },
    },
    update: { value },
    create: { entityType, entityId, fieldDefinitionId, value },
  })

  await logActivity({
    entityType,
    entityId,
    userId: user.id,
    action: "FIELD_VALUE_CHANGED",
    field: fieldDefinitionId,
    newValue: String(value),
  })

  revalidatePath(`/projects/${projectId}`)
  return fieldValue
}

export async function updateFieldDefinition(
  fieldDefinitionId: string,
  projectId: string,
  data: {
    label: string
    fieldType: FieldType
    options?: { label: string; color?: string }[]
  }
) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  const fieldDef = await prisma.fieldDefinition.update({
    where: { id: fieldDefinitionId },
    data: {
      label: data.label,
      fieldType: data.fieldType,
      options: data.options ?? Prisma.JsonNull,
    },
  })

  revalidatePath(`/projects/${projectId}`)
  return fieldDef
}

export async function deleteFieldDefinition(
  fieldDefinitionId: string,
  projectId: string
) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!canManageProject(role)) throw new Error("FORBIDDEN")

  await prisma.fieldDefinition.delete({ where: { id: fieldDefinitionId } })

  revalidatePath(`/projects/${projectId}`)
}

// ---------- Comments ----------

export async function addComment(projectId: string, content: string) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!role) throw new Error("FORBIDDEN")

  const trimmed = content.trim()
  if (!trimmed) throw new Error("EMPTY_COMMENT")

  const comment = await prisma.comment.create({
    data: { projectId, authorId: user.id, content: trimmed },
  })

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "COMMENT_ADDED",
  })

  revalidatePath(`/projects/${projectId}`)
  return comment
}

export async function deleteComment(commentId: string, projectId: string) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!role) throw new Error("FORBIDDEN")

  const comment = await prisma.comment.findUniqueOrThrow({ where: { id: commentId } })
  const canDelete = canManageProject(role) || comment.authorId === user.id
  if (!canDelete) throw new Error("FORBIDDEN")

  await prisma.comment.delete({ where: { id: commentId } })

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "COMMENT_REMOVED",
  })

  revalidatePath(`/projects/${projectId}`)
}

// ---------- Meeting notes ----------

export async function createMeetingNote(
  projectId: string,
  data: { title: string; content?: string }
) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!role) throw new Error("FORBIDDEN")

  const title = data.title.trim()
  if (!title) throw new Error("EMPTY_TITLE")

  const note = await prisma.meetingNote.create({
    data: {
      projectId,
      authorId: user.id,
      title,
      content: data.content?.trim() || null,
    },
  })

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "MEETING_NOTE_ADDED",
    field: "meeting_note",
    newValue: title,
  })

  revalidatePath(`/projects/${projectId}`)
  return note
}

export async function updateMeetingNote(
  meetingNoteId: string,
  projectId: string,
  data: { title: string; content?: string }
) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  const note = await prisma.meetingNote.findUniqueOrThrow({ where: { id: meetingNoteId } })
  const canEdit = canManageProject(role) || note.authorId === user.id
  if (!canEdit) throw new Error("FORBIDDEN")

  const title = data.title.trim()
  if (!title) throw new Error("EMPTY_TITLE")

  const updated = await prisma.meetingNote.update({
    where: { id: meetingNoteId },
    data: { title, content: data.content?.trim() || null },
  })

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "MEETING_NOTE_UPDATED",
    field: "meeting_note",
    newValue: title,
  })

  revalidatePath(`/projects/${projectId}`)
  return updated
}

export async function deleteMeetingNote(meetingNoteId: string, projectId: string) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  const note = await prisma.meetingNote.findUniqueOrThrow({
    where: { id: meetingNoteId },
    include: { attachments: true },
  })
  const canDelete = canManageProject(role) || note.authorId === user.id
  if (!canDelete) throw new Error("FORBIDDEN")

  await Promise.all(
    note.attachments.map(async (a) => {
      await deleteAttachmentFile(a.storageKey)
      if (a.thumbnailStorageKey) await deleteAttachmentFile(a.thumbnailStorageKey)
    })
  )

  await prisma.meetingNote.delete({ where: { id: meetingNoteId } })

  await logActivity({
    entityType: "PROJECT",
    entityId: projectId,
    userId: user.id,
    action: "MEETING_NOTE_REMOVED",
    field: "meeting_note",
    oldValue: note.title,
  })

  revalidatePath(`/projects/${projectId}`)
}

export async function uploadMeetingNoteAttachment(
  meetingNoteId: string,
  projectId: string,
  formData: FormData
) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!role) throw new Error("FORBIDDEN")

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("NO_FILE")
  }
  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error("FILE_TOO_LARGE")
  }
  if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
    throw new Error("UNSUPPORTED_TYPE")
  }

  const safeName = file.name.replace(/[^\w.\-一-鿿]+/g, "_")
  const uploadKeyBase = `${projectId}/meeting-notes/${meetingNoteId}/${randomUUID()}-${safeName}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const storageKey = await saveAttachmentFile(uploadKeyBase, buffer)
  const thumbnailStorageKey = await resolveThumbnailStorageKey(
    uploadKeyBase,
    formData,
    file,
    buffer
  )

  const attachment = await prisma.attachment.create({
    data: {
      projectId,
      meetingNoteId,
      uploaderId: user.id,
      filename: file.name,
      storageKey,
      thumbnailStorageKey,
      mimeType: file.type,
      size: file.size,
    },
  })

  revalidatePath(`/projects/${projectId}`)
  return attachment
}

export async function deleteMeetingNoteAttachment(attachmentId: string, projectId: string) {
  const user = await requireUser()
  const role = await getEffectiveProjectRole(user.id, user.globalRole, projectId)
  if (!role) throw new Error("FORBIDDEN")

  const attachment = await prisma.attachment.findUniqueOrThrow({
    where: { id: attachmentId },
  })

  const canDelete = canManageProject(role) || attachment.uploaderId === user.id
  if (!canDelete) throw new Error("FORBIDDEN")

  await prisma.attachment.delete({ where: { id: attachmentId } })
  await deleteAttachmentFile(attachment.storageKey)
  if (attachment.thumbnailStorageKey) {
    await deleteAttachmentFile(attachment.thumbnailStorageKey)
  }

  revalidatePath(`/projects/${projectId}`)
}
