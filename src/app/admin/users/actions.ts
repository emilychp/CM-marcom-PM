"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"
import type { GlobalRole, StaffTier } from "@/generated/prisma/enums"

async function requireAdmin() {
  const user = await requireUser()
  if (user.globalRole !== "ADMIN") throw new Error("FORBIDDEN")
  return user
}

export async function createUser(data: {
  name: string
  email: string
  password: string
  globalRole: GlobalRole
}) {
  await requireAdmin()

  if (data.password.length < 8) {
    throw new Error("PASSWORD_TOO_SHORT")
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) {
    throw new Error("EMAIL_TAKEN")
  }

  const passwordHash = await bcrypt.hash(data.password, 10)

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      globalRole: data.globalRole,
    },
  })

  revalidatePath("/admin/users")
  return { id: user.id, name: user.name, email: user.email }
}

export async function updateUserGlobalRole(userId: string, globalRole: GlobalRole) {
  const admin = await requireAdmin()
  if (admin.id === userId && globalRole !== "ADMIN") {
    throw new Error("CANNOT_DEMOTE_SELF")
  }

  await prisma.user.update({
    where: { id: userId },
    data: { globalRole },
  })

  revalidatePath("/admin/users")
}

export async function updateUserStaffTier(userId: string, staffTier: StaffTier) {
  await requireAdmin()

  await prisma.user.update({
    where: { id: userId },
    data: { staffTier },
  })

  revalidatePath("/admin/users")
  revalidatePath("/workload")
}

export async function deleteUser(userId: string) {
  const admin = await requireAdmin()
  if (admin.id === userId) {
    throw new Error("CANNOT_DELETE_SELF")
  }

  try {
    await prisma.user.delete({ where: { id: userId } })
  } catch {
    throw new Error("HAS_RELATED_RECORDS")
  }

  revalidatePath("/admin/users")
}
