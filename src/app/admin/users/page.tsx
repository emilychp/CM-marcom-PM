import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NavBar } from "@/components/nav-bar"
import { NewUserDialog } from "@/components/new-user-dialog"
import { UserRow } from "@/components/user-row"

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session?.user) return null
  if (session.user.globalRole !== "ADMIN") notFound()

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      globalRole: true,
      staffTier: true,
      createdAt: true,
    },
  })

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <NavBar />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">成員管理</h1>
            <p className="text-sm text-muted-foreground">共 {users.length} 位成員</p>
          </div>
          <NewUserDialog />
        </div>

        <div className="space-y-2">
          {users.map((user) => (
            <UserRow key={user.id} user={user} isSelf={user.id === session.user.id} />
          ))}
        </div>
      </main>
    </div>
  )
}
