import { prisma } from "@/lib/prisma"
import type { ActivityAction, EntityType } from "@/generated/prisma/enums"

export async function logActivity(params: {
  entityType: EntityType
  entityId: string
  userId: string
  action: ActivityAction
  field?: string
  oldValue?: string | null
  newValue?: string | null
}) {
  await prisma.activityLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      userId: params.userId,
      action: params.action,
      field: params.field,
      oldValue: params.oldValue ?? null,
      newValue: params.newValue ?? null,
    },
  })
}
