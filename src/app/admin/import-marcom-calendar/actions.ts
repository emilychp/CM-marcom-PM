"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"
import { logActivity } from "@/lib/activity-log"
import { MARCOM_CALENDAR_ROWS, type MarcomCalendarRow } from "./data"
import type { ProjectStatus, ProjectPriority } from "@/generated/prisma/enums"

async function requireAdmin() {
  const user = await requireUser()
  if (user.globalRole !== "ADMIN") throw new Error("FORBIDDEN")
  return user
}

const STATUS_MAP: Record<MarcomCalendarRow["notionStatus"], ProjectStatus> = {
  Planning: "PLANNING",
  Scheduled: "PLANNING",
  "In Progress": "IN_PROGRESS",
  Completed: "COMPLETED",
}

function mapPriority(priority: MarcomCalendarRow["notionPriority"]): ProjectPriority {
  if (priority === "High") return "HIGH"
  if (priority === "Low") return "LOW"
  return "MEDIUM"
}

function buildCustomFields(row: MarcomCalendarRow) {
  const fields: { key: string; label: string; value: string }[] = []
  if (row.notionType) fields.push({ key: "marcom_type", label: "類型", value: row.notionType })
  if (row.targetAudience) {
    fields.push({ key: "marcom_audience", label: "目標受眾", value: row.targetAudience })
  }
  if (row.channel) fields.push({ key: "marcom_channel", label: "宣傳管道", value: row.channel })
  return fields
}

function buildDescription(row: MarcomCalendarRow) {
  const base = "從 Marcom Calendar（Notion）匯入"
  // "Scheduled" has no exact ProjectStatus equivalent (mapped to PLANNING),
  // so the original label is kept here for anyone checking against Notion.
  return row.notionStatus === "Scheduled" ? `${base}，原始狀態：Scheduled` : base
}

export async function previewMarcomCalendarImport() {
  await requireAdmin()

  const existingProjects = await prisma.project.findMany({ select: { name: true } })
  const existingNames = new Set(existingProjects.map((p) => p.name.trim().toLowerCase()))

  return MARCOM_CALENDAR_ROWS.map((row) => ({
    name: row.name,
    status: STATUS_MAP[row.notionStatus],
    priority: mapPriority(row.notionPriority),
    startDate: row.startDate,
    dueDate: row.endDate,
    description: buildDescription(row),
    customFields: buildCustomFields(row),
    alreadyExists: existingNames.has(row.name.trim().toLowerCase()),
  }))
}

export async function applyMarcomCalendarImport(names: string[], ownerId: string) {
  const admin = await requireAdmin()

  const owner = await prisma.user.findUnique({ where: { id: ownerId } })
  if (!owner) throw new Error("OWNER_NOT_FOUND")

  const selected = new Set(names)
  const rows = MARCOM_CALENDAR_ROWS.filter((row) => selected.has(row.name))

  let createdCount = 0
  for (const row of rows) {
    const project = await prisma.project.create({
      data: {
        name: row.name,
        description: buildDescription(row),
        status: STATUS_MAP[row.notionStatus],
        priority: mapPriority(row.notionPriority),
        startDate: row.startDate ? new Date(row.startDate) : null,
        dueDate: row.endDate ? new Date(row.endDate) : null,
        ownerId,
        members: {
          create: [{ userId: ownerId, roleInProject: "MANAGER" }],
        },
      },
    })

    const customFields = buildCustomFields(row)
    for (let i = 0; i < customFields.length; i++) {
      const field = customFields[i]
      const fieldDef = await prisma.fieldDefinition.create({
        data: {
          projectId: project.id,
          scope: "PROJECT",
          key: field.key,
          label: field.label,
          fieldType: "TEXT",
          order: i,
        },
      })
      await prisma.fieldValue.create({
        data: {
          entityType: "PROJECT",
          entityId: project.id,
          fieldDefinitionId: fieldDef.id,
          value: field.value,
        },
      })
    }

    await logActivity({
      entityType: "PROJECT",
      entityId: project.id,
      userId: admin.id,
      action: "CREATED",
    })

    createdCount++
  }

  revalidatePath("/dashboard")
  revalidatePath("/my-projects")
  return { createdCount }
}
