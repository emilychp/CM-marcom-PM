import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendWeeklyReminderEmail } from "@/lib/email"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

  const projects = await prisma.project.findMany({
    where: { status: { not: "ARCHIVED" } },
    select: {
      id: true,
      name: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  })

  const byOwner = new Map<
    string,
    { name: string; email: string; projects: { id: string; name: string }[] }
  >()

  for (const project of projects) {
    const existing = byOwner.get(project.owner.id)
    if (existing) {
      existing.projects.push({ id: project.id, name: project.name })
    } else {
      byOwner.set(project.owner.id, {
        name: project.owner.name,
        email: project.owner.email,
        projects: [{ id: project.id, name: project.name }],
      })
    }
  }

  const results: { email: string; ok: boolean; error?: string }[] = []

  for (const owner of byOwner.values()) {
    try {
      await sendWeeklyReminderEmail({
        to: owner.email,
        ownerName: owner.name,
        appUrl,
        projects: owner.projects,
      })
      results.push({ email: owner.email, ok: true })
    } catch (error) {
      results.push({
        email: owner.email,
        ok: false,
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      })
    }
  }

  return NextResponse.json({ sent: results.filter((r) => r.ok).length, results })
}
