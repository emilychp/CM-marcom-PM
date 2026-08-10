"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"

export async function changeOwnPassword(currentPassword: string, newPassword: string) {
  const user = await requireUser()

  if (newPassword.length < 8) {
    throw new Error("PASSWORD_TOO_SHORT")
  }

  const fullUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
  const valid = await bcrypt.compare(currentPassword, fullUser.passwordHash)
  if (!valid) {
    throw new Error("CURRENT_PASSWORD_INCORRECT")
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
}
