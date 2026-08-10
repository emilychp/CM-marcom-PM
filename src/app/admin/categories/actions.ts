"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"

async function requireAdmin() {
  const user = await requireUser()
  if (user.globalRole !== "ADMIN") throw new Error("FORBIDDEN")
  return user
}

// Maps the original category label used in the Marcom import (原始類別)
// to the simplified dashboard tag label (專案總覽旁的分類標籤).
const CATEGORY_MAPPING: Record<string, string> = {
  內外部溝通: "溝通管理",
  內外部活動: "內外活動",
  禮贈品: "禮贈品",
  集團永續相關: "永續相關",
  業務管理: "業務管理",
  智財權與無形資產管理: "智財與無形資產管理",
}

export async function getProjectFieldDefinitionsWithSamples() {
  await requireAdmin()

  const fieldDefs = await prisma.fieldDefinition.findMany({
    where: { scope: "PROJECT" },
    include: { values: { select: { entityId: true, value: true } } },
    orderBy: { order: "asc" },
  })

  return fieldDefs.map((fd) => {
    const distinctValues = new Set<string>()
    for (const v of fd.values) {
      if (typeof v.value === "string") distinctValues.add(v.value)
    }
    return {
      id: fd.id,
      label: fd.label,
      key: fd.key,
      fieldType: fd.fieldType,
      valueCount: fd.values.length,
      distinctValues: Array.from(distinctValues).slice(0, 30),
    }
  })
}

async function computeBackfillMatches(fieldDefinitionId: string) {
  const [fieldValues, categories] = await Promise.all([
    prisma.fieldValue.findMany({
      where: { fieldDefinitionId, entityType: "PROJECT" },
      select: { entityId: true, value: true },
    }),
    prisma.category.findMany(),
  ])
  const categoryByName = new Map(categories.map((c) => [c.name, c.id]))

  const matched: { projectId: string; oldValue: string; categoryId: string; categoryName: string }[] = []
  const unmatchedValues = new Set<string>()

  for (const fv of fieldValues) {
    const raw = typeof fv.value === "string" ? fv.value.trim() : null
    if (!raw) continue
    const newName = CATEGORY_MAPPING[raw]
    const categoryId = newName ? categoryByName.get(newName) : undefined
    if (newName && categoryId) {
      matched.push({ projectId: fv.entityId, oldValue: raw, categoryId, categoryName: newName })
    } else {
      unmatchedValues.add(raw)
    }
  }

  return { matched, unmatchedValues: Array.from(unmatchedValues) }
}

export async function previewCategoryBackfill(fieldDefinitionId: string) {
  await requireAdmin()
  const { matched, unmatchedValues } = await computeBackfillMatches(fieldDefinitionId)
  return {
    matchedCount: matched.length,
    unmatchedValues,
    preview: matched.slice(0, 10),
  }
}

export async function applyCategoryBackfill(fieldDefinitionId: string) {
  await requireAdmin()
  const { matched } = await computeBackfillMatches(fieldDefinitionId)

  await prisma.projectCategory.createMany({
    data: matched.map((m) => ({ projectId: m.projectId, categoryId: m.categoryId })),
    skipDuplicates: true,
  })

  revalidatePath("/dashboard")
  revalidatePath("/my-projects")
  return { appliedCount: matched.length }
}
