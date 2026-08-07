"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { addProjectMember, removeProjectMember } from "@/app/projects/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"

type Member = {
  user: { id: string; name: string; email: string }
  roleInProject: string
}

export function MembersPanel({
  projectId,
  members,
  allUsers,
  manageable,
}: {
  projectId: string
  members: Member[]
  allUsers: { id: string; name: string }[]
  manageable: boolean
}) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const memberIds = new Set(members.map((m) => m.user.id))
  const candidates = allUsers.filter((u) => !memberIds.has(u.id))

  function handleAdd() {
    if (!selectedUser) return
    startTransition(async () => {
      try {
        await addProjectMember(projectId, selectedUser, "MEMBER")
        toast.success("已加入成員")
        setSelectedUser(null)
      } catch {
        toast.error("加入失敗")
      }
    })
  }

  function handleRemove(userId: string) {
    startTransition(async () => {
      try {
        await removeProjectMember(projectId, userId)
        toast.success("已移除成員")
      } catch {
        toast.error("移除失敗")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>專案成員</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {members.map((m) => (
            <li
              key={m.user.id}
              className="flex items-center justify-between text-sm"
            >
              <span>
                {m.user.name}
                <span className="ml-2 text-xs text-muted-foreground">
                  {m.user.email}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <Badge variant={m.roleInProject === "MANAGER" ? "default" : "outline"}>
                  {m.roleInProject === "MANAGER" ? "管理者" : "成員"}
                </Badge>
                {manageable && (
                  <button
                    type="button"
                    onClick={() => handleRemove(m.user.id)}
                    disabled={isPending}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {manageable && candidates.length > 0 && (
          <div className="flex items-center gap-2 pt-2">
            <Select value={selectedUser ?? undefined} onValueChange={setSelectedUser}>
              <SelectTrigger size="sm" className="flex-1">
                <SelectValue placeholder="選擇要加入的成員">
                  {(value: string | null) =>
                    candidates.find((u) => u.id === value)?.name ?? "選擇要加入的成員"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {candidates.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAdd} disabled={isPending || !selectedUser}>
              加入
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
